import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/supabase_config.dart';
import '../models/invoice.dart';
import '../models/invoice_item.dart';

class InvoiceProvider with ChangeNotifier {
  List<Invoice> _invoices = [];
  List<Invoice> _deletedInvoices = [];
  bool _isLoading = false;
  String? _errorMessage;

  // Filter state
  DateTime? _filterStartDate;
  DateTime? _filterEndDate;
  List<String> _filterStatuses = [];

  List<Invoice> get invoices => _invoices;
  List<Invoice> get deletedInvoices => _deletedInvoices;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Filter getters
  DateTime? get filterStartDate => _filterStartDate;
  DateTime? get filterEndDate => _filterEndDate;
  List<String> get filterStatuses => _filterStatuses;

  // Check if any filters are active
  bool get hasActiveFilters =>
    _filterStartDate != null ||
    _filterEndDate != null ||
    _filterStatuses.isNotEmpty;

  // Count of active filters
  int get activeFilterCount {
    int count = 0;
    if (_filterStartDate != null || _filterEndDate != null) count++;
    if (_filterStatuses.isNotEmpty) count++;
    return count;
  }

  final _supabase = SupabaseConfig.client;

  Future<bool> fetchInvoices() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _supabase
          .from('invoices')
          .select('''
            *,
            parties!inner(name),
            invoice_items(*),
            payments(amount)
          ''')
          .isFilter('deleted_at', null)
          .order('invoice_number', ascending: false);

      _invoices = (response as List).map((json) {
        // Extract party name
        final partyName = json['parties'] != null ? json['parties']['name'] as String? : null;

        // Check if this is an offline invoice
        final isOffline = json['is_offline'] == true;

        // Calculate totals from invoice_items (or use database total for offline)
        final items = json['invoice_items'] as List? ?? [];
        final subTotal = items.fold<double>(
          0,
          (sum, item) => sum + ((item['quantity'] as num) * (item['rate'] as num)).toDouble(),
        );

        // For offline invoices, use the total_amount from database
        // For regular invoices, calculate from items
        final totalAmount = isOffline
            ? ((json['total_amount'] as num?)?.toDouble() ?? 0)
            : subTotal + ((json['bundle_charge'] as num?)?.toDouble() ?? 0);

        // Calculate total paid from payments
        final payments = json['payments'] as List? ?? [];
        final totalPaid = payments.fold<double>(
          0,
          (sum, payment) => sum + ((payment['amount'] as num?)?.toDouble() ?? 0),
        );

        // Calculate status from payments (client-side)
        final balanceDue = totalAmount - totalPaid;
        String calculatedStatus;
        if (balanceDue <= 0) {
          calculatedStatus = 'paid';
        } else if (totalPaid > 0 && balanceDue > 0) {
          calculatedStatus = 'partial';
        } else {
          calculatedStatus = 'pending';
        }

        // Create invoice data
        final invoiceData = Map<String, dynamic>.from(json);
        invoiceData.remove('parties');
        invoiceData.remove('invoice_items');
        invoiceData.remove('payments');
        invoiceData['party_name'] = partyName;
        invoiceData['sub_total'] = subTotal;
        invoiceData['total_amount'] = totalAmount;
        invoiceData['total_paid'] = totalPaid;
        invoiceData['status'] = calculatedStatus; // Override with calculated status

        return Invoice.fromJson(invoiceData);
      }).toList();

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> fetchDeletedInvoices() async {
    try {
      final response = await _supabase
          .from('invoices')
          .select('''
            *,
            parties!inner(name),
            invoice_items(*),
            payments(amount)
          ''')
          .not('deleted_at', 'is', null)
          .order('deleted_at', ascending: false);

      _deletedInvoices = (response as List).map((json) {
        final partyName = json['parties'] != null ? json['parties']['name'] as String? : null;

        // Check if this is an offline invoice
        final isOffline = json['is_offline'] == true;

        final items = json['invoice_items'] as List? ?? [];
        final subTotal = items.fold<double>(
          0,
          (sum, item) => sum + ((item['quantity'] as num) * (item['rate'] as num)).toDouble(),
        );

        // For offline invoices, use the total_amount from database
        // For regular invoices, calculate from items
        final totalAmount = isOffline
            ? ((json['total_amount'] as num?)?.toDouble() ?? 0)
            : subTotal + ((json['bundle_charge'] as num?)?.toDouble() ?? 0);

        // Calculate total paid from payments
        final payments = json['payments'] as List? ?? [];
        final totalPaid = payments.fold<double>(
          0,
          (sum, payment) => sum + ((payment['amount'] as num?)?.toDouble() ?? 0),
        );

        // Calculate status from payments (client-side)
        final balanceDue = totalAmount - totalPaid;
        String calculatedStatus;
        if (balanceDue <= 0) {
          calculatedStatus = 'paid';
        } else if (totalPaid > 0 && balanceDue > 0) {
          calculatedStatus = 'partial';
        } else {
          calculatedStatus = 'pending';
        }

        final invoiceData = Map<String, dynamic>.from(json);
        invoiceData.remove('parties');
        invoiceData.remove('invoice_items');
        invoiceData.remove('payments');
        invoiceData['party_name'] = partyName;
        invoiceData['sub_total'] = subTotal;
        invoiceData['total_amount'] = totalAmount;
        invoiceData['total_paid'] = totalPaid;
        invoiceData['status'] = calculatedStatus; // Override with calculated status

        return Invoice.fromJson(invoiceData);
      }).toList();

      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<Map<String, dynamic>?> createInvoice({
    required int partyId,
    required String partyName,
    required String invoiceDate,
    required List<InvoiceItem> items,
    required double bundleCharge,
    double? bundleRate,
    int? bundleQuantity,
    String? invoiceNumber,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // Calculate totals
      final subTotal = items.fold<double>(0, (sum, item) => sum + item.total);
      final totalAmount = subTotal + bundleCharge;

      // Create invoice
      final invoiceData = <String, dynamic>{
        'party_id': partyId,
        'party_name': partyName,
        'invoice_date': invoiceDate,
        'bundle_charge': bundleCharge,
        if (bundleRate != null) 'bundle_rate': bundleRate,
        if (bundleQuantity != null) 'bundle_quantity': bundleQuantity as int,
        if (invoiceNumber != null) 'invoice_number': invoiceNumber,
        'total_amount': totalAmount,
        'status': 'pending',
      };

      print('DEBUG: bundleQuantity type: ${bundleQuantity.runtimeType}, value: $bundleQuantity');
      print('DEBUG: invoiceData bundle_quantity type: ${invoiceData['bundle_quantity'].runtimeType}');
      print('DEBUG: invoiceData: $invoiceData');

      final invoiceResponse = await _supabase
          .from('invoices')
          .insert(invoiceData)
          .select()
          .single();

      final invoiceId = invoiceResponse['id'] as int;

      // Create invoice items
      final itemsData = items.asMap().entries.map((entry) {
        final index = entry.key;
        final item = entry.value;
        return {
          'invoice_id': invoiceId,
          'item_id': item.itemId,
          'item_name': item.itemName,
          'item_unit': item.itemUnit,
          'quantity': item.quantity.toInt(),
          'rate': item.rate,
          'position': index,
        };
      }).toList();

      await _supabase.from('invoice_items').insert(itemsData);

      await fetchInvoices();

      return {
        'success': true,
        'invoice_id': invoiceId,
        'invoice_number': invoiceResponse['invoice_number'],
      };
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<bool> updateInvoice({
    required int id,
    required int partyId,
    required String partyName,
    required String invoiceDate,
    required List<InvoiceItem> items,
    required double bundleCharge,
    double? bundleRate,
    int? bundleQuantity,
    String? invoiceNumber,
    String? status,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // Calculate totals
      final subTotal = items.fold<double>(0, (sum, item) => sum + item.total);
      final totalAmount = subTotal + bundleCharge;

      // Update invoice
      final invoiceData = {
        'party_id': partyId,
        'party_name': partyName,
        'invoice_date': invoiceDate,
        'bundle_charge': bundleCharge,
        'bundle_rate': bundleRate,
        'bundle_quantity': bundleQuantity,
        if (invoiceNumber != null) 'invoice_number': invoiceNumber,
        'total_amount': totalAmount,
        if (status != null) 'status': status,
      };

      await _supabase.from('invoices').update(invoiceData).eq('id', id);

      // Use atomic function to update invoice items (prevents data loss on error)
      final itemsData = items.asMap().entries.map((entry) {
        final index = entry.key;
        final item = entry.value;
        return {
          'item_id': item.itemId,
          'item_name': item.itemName,
          'item_unit': item.itemUnit,
          'quantity': item.quantity.toInt(),
          'rate': item.rate,
          'position': index,
          'original_rate': item.rate, // Add if available
          'original_unit': item.itemUnit, // Add if available
        };
      }).toList();

      await _supabase.rpc('update_invoice_items', params: {
        'p_invoice_id': id,
        'p_items': itemsData,
      });

      await fetchInvoices();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteInvoice(int id) async {
    try {
      await _supabase.from('invoices').update({
        'deleted_at': DateTime.now().toIso8601String(),
      }).eq('id', id);

      await fetchInvoices();
      await fetchDeletedInvoices();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> restoreInvoice(int id) async {
    try {
      await _supabase.from('invoices').update({
        'deleted_at': null,
      }).eq('id', id);

      await fetchInvoices();
      await fetchDeletedInvoices();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> permanentlyDeleteInvoice(int id) async {
    try {
      // Invoice items will be deleted automatically via CASCADE
      await _supabase.from('invoices').delete().eq('id', id);

      await fetchDeletedInvoices();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<List<Invoice>> fetchInvoicesByParty(int partyId) async {
    try {
      final response = await _supabase
          .from('invoices')
          .select('''
            *,
            parties!inner(name),
            invoice_items(*),
            payments(amount)
          ''')
          .eq('party_id', partyId)
          .isFilter('deleted_at', null)
          .order('invoice_date', ascending: false);

      final invoices = (response as List).map((json) {
        final partyName = json['parties'] != null ? json['parties']['name'] as String? : null;

        // Check if this is an offline invoice
        final isOffline = json['is_offline'] == true;

        final items = json['invoice_items'] as List? ?? [];
        final subTotal = items.fold<double>(
          0,
          (sum, item) => sum + ((item['quantity'] as num) * (item['rate'] as num)).toDouble(),
        );

        // For offline invoices, use the total_amount from database
        // For regular invoices, calculate from items
        final totalAmount = isOffline
            ? ((json['total_amount'] as num?)?.toDouble() ?? 0)
            : subTotal + ((json['bundle_charge'] as num?)?.toDouble() ?? 0);

        // Calculate total paid from payments
        final payments = json['payments'] as List? ?? [];
        final totalPaid = payments.fold<double>(
          0,
          (sum, payment) => sum + ((payment['amount'] as num?)?.toDouble() ?? 0),
        );

        // Calculate status from payments (client-side)
        final balanceDue = totalAmount - totalPaid;
        String calculatedStatus;
        if (balanceDue <= 0) {
          calculatedStatus = 'paid';
        } else if (totalPaid > 0 && balanceDue > 0) {
          calculatedStatus = 'partial';
        } else {
          calculatedStatus = 'pending';
        }

        final invoiceData = Map<String, dynamic>.from(json);
        invoiceData.remove('parties');
        invoiceData.remove('invoice_items');
        invoiceData.remove('payments');
        invoiceData['party_name'] = partyName;
        invoiceData['sub_total'] = subTotal;
        invoiceData['total_amount'] = totalAmount;
        invoiceData['total_paid'] = totalPaid;
        invoiceData['status'] = calculatedStatus;

        return Invoice.fromJson(invoiceData);
      }).toList();

      return invoices;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return [];
    }
  }

  Future<Map<String, dynamic>?> getInvoiceWithItems(int id) async {
    try {
      final response = await _supabase
          .from('invoices')
          .select('''
            *,
            parties!inner(name, bundle_rate),
            invoice_items(*,
              items!inner(name,
                units(name)
              )
            )
          ''')
          .eq('id', id)
          .single();

      final partyName = response['parties']['name'] as String;
      final partyBundleRate = response['parties']['bundle_rate'] as num?;

      final items = (response['invoice_items'] as List).map((itemJson) {
        final itemData = Map<String, dynamic>.from(itemJson);
        itemData['item_name'] = itemJson['items']['name'];
        itemData['item_unit'] = itemJson['items']['units']?['name'];
        return InvoiceItem.fromJson(itemData);
      }).toList();

      final invoiceData = Map<String, dynamic>.from(response);
      invoiceData.remove('parties');
      invoiceData.remove('invoice_items');
      invoiceData['party_name'] = partyName;

      return {
        'invoice': Invoice.fromJson(invoiceData),
        'items': items,
        'party_bundle_rate': partyBundleRate?.toDouble(),
      };
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return null;
    }
  }

  /// Create a quick invoice (simplified invoice without line items)
  Future<Map<String, dynamic>?> createQuickInvoice({
    required int partyId,
    required String partyName,
    required String invoiceDate,
    required double totalAmount,
    required double amountReceived,
    String? notes,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // Create invoice with total_amount directly
      final invoiceData = <String, dynamic>{
        'party_id': partyId,
        'party_name': partyName,
        'invoice_date': invoiceDate,
        'total_amount': totalAmount,
        'bundle_charge': 0, // No bundle for offline bill
        'status': 'pending',
        'is_offline': true, // Mark as offline bill
      };

      final invoiceResponse = await _supabase
          .from('invoices')
          .insert(invoiceData)
          .select()
          .single();

      final invoiceId = invoiceResponse['id'] as int;

      // Add payment if amount received > 0
      if (amountReceived > 0) {
        await _supabase.from('payments').insert({
          'invoice_id': invoiceId,
          'amount': amountReceived,
          'payment_date': invoiceDate,
          'remark': notes ?? 'Quick entry payment',
        });
      }

      await fetchInvoices();

      return {
        'success': true,
        'invoice_id': invoiceId,
        'invoice_number': invoiceResponse['invoice_number'],
      };
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return {'success': false, 'error': e.toString()};
    }
  }

  // Filter methods
  Future<void> setFilters({
    DateTime? startDate,
    DateTime? endDate,
    List<String>? statuses,
  }) async {
    _filterStartDate = startDate;
    _filterEndDate = endDate;
    _filterStatuses = statuses ?? [];

    // Save to SharedPreferences
    await _saveFiltersToPrefs();

    notifyListeners();
  }

  Future<void> clearFilters() async {
    _filterStartDate = null;
    _filterEndDate = null;
    _filterStatuses = [];

    // Clear from SharedPreferences
    await _clearFiltersFromPrefs();

    notifyListeners();
  }

  List<Invoice> getFilteredInvoices(List<Invoice> invoices) {
    if (!hasActiveFilters) return invoices;

    return invoices.where((invoice) {
      // Date range filter
      if (_filterStartDate != null || _filterEndDate != null) {
        try {
          final invoiceDate = DateTime.parse(invoice.invoiceDate);

          if (_filterStartDate != null) {
            final startOfDay = DateTime(
              _filterStartDate!.year,
              _filterStartDate!.month,
              _filterStartDate!.day,
            );
            if (invoiceDate.isBefore(startOfDay)) return false;
          }

          if (_filterEndDate != null) {
            final endOfDay = DateTime(
              _filterEndDate!.year,
              _filterEndDate!.month,
              _filterEndDate!.day,
              23, 59, 59,
            );
            if (invoiceDate.isAfter(endOfDay)) return false;
          }
        } catch (e) {
          // If date parsing fails, skip this invoice
          return false;
        }
      }

      // Status filter
      if (_filterStatuses.isNotEmpty) {
        final normalizedStatus = invoice.status.toLowerCase();
        final normalizedFilters = _filterStatuses.map((s) => s.toLowerCase()).toList();

        if (!normalizedFilters.contains(normalizedStatus)) {
          return false;
        }
      }

      return true;
    }).toList();
  }

  // Persistence methods
  Future<void> _saveFiltersToPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      if (_filterStartDate != null) {
        await prefs.setString('filter_start_date', _filterStartDate!.toIso8601String());
      } else {
        await prefs.remove('filter_start_date');
      }

      if (_filterEndDate != null) {
        await prefs.setString('filter_end_date', _filterEndDate!.toIso8601String());
      } else {
        await prefs.remove('filter_end_date');
      }

      if (_filterStatuses.isNotEmpty) {
        await prefs.setStringList('filter_statuses', _filterStatuses);
      } else {
        await prefs.remove('filter_statuses');
      }
    } catch (e) {
      print('Error saving filters: $e');
    }
  }

  Future<void> _clearFiltersFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('filter_start_date');
      await prefs.remove('filter_end_date');
      await prefs.remove('filter_statuses');
    } catch (e) {
      print('Error clearing filters: $e');
    }
  }

  Future<void> loadFiltersFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      final startDateStr = prefs.getString('filter_start_date');
      if (startDateStr != null) {
        _filterStartDate = DateTime.parse(startDateStr);
      }

      final endDateStr = prefs.getString('filter_end_date');
      if (endDateStr != null) {
        _filterEndDate = DateTime.parse(endDateStr);
      }

      final statuses = prefs.getStringList('filter_statuses');
      if (statuses != null) {
        _filterStatuses = statuses;
      }

      notifyListeners();
    } catch (e) {
      print('Error loading filters: $e');
    }
  }
}
