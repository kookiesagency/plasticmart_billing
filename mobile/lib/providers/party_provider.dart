import 'package:flutter/material.dart';
import '../config/supabase_config.dart';
import '../models/party.dart';

class PartyProvider with ChangeNotifier {
  List<Party> _parties = [];
  List<Party> _deletedParties = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<Party> get parties => _parties;
  List<Party> get deletedParties => _deletedParties;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  final _supabase = SupabaseConfig.client;

  Future<bool> fetchParties() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _supabase
          .from('parties')
          .select('*, invoices!party_id(count)')
          .isFilter('deleted_at', null)
          .order('created_at', ascending: false);

      _parties = (response as List).map((json) {
        // Extract invoice count from nested object
        final invoiceCount = json['invoices'] != null && (json['invoices'] as List).isNotEmpty
            ? (json['invoices'][0]['count'] as int?) ?? 0
            : 0;

        // Remove invoices object and add invoice_count
        final partyData = Map<String, dynamic>.from(json);
        partyData.remove('invoices');
        partyData['invoice_count'] = invoiceCount;

        return Party.fromJson(partyData);
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

  Future<bool> fetchDeletedParties() async {
    try {
      final response = await _supabase
          .from('parties')
          .select('*, invoices!party_id(count)')
          .not('deleted_at', 'is', null)
          .order('deleted_at', ascending: false);

      _deletedParties = (response as List).map((json) {
        // Extract invoice count from nested object
        final invoiceCount = json['invoices'] != null && (json['invoices'] as List).isNotEmpty
            ? (json['invoices'][0]['count'] as int?) ?? 0
            : 0;

        // Remove invoices object and add invoice_count
        final partyData = Map<String, dynamic>.from(json);
        partyData.remove('invoices');
        partyData['invoice_count'] = invoiceCount;

        return Party.fromJson(partyData);
      }).toList();

      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> createParty({
    required String name,
    double? bundleRate,
    double? openingBalance,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // Check for duplicate name
      final existing = await _supabase
          .from('parties')
          .select()
          .ilike('name', name)
          .maybeSingle();

      if (existing != null) {
        if (existing['deleted_at'] != null) {
          _errorMessage = 'A party with this name is currently deleted. Please restore it from the deleted tab.';
        } else {
          _errorMessage = 'A party with this name already exists.';
        }
        _isLoading = false;
        notifyListeners();
        return false;
      }

      await _supabase.from('parties').insert({
        'name': name,
        if (bundleRate != null) 'bundle_rate': bundleRate,
        if (openingBalance != null) 'opening_balance': openingBalance,
      });

      await fetchParties();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateParty({
    required int id,
    required String name,
    double? bundleRate,
    double? openingBalance,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // Check for duplicate name (excluding current party)
      final existing = await _supabase
          .from('parties')
          .select()
          .ilike('name', name)
          .neq('id', id)
          .maybeSingle();

      if (existing != null) {
        if (existing['deleted_at'] != null) {
          _errorMessage = 'A party with this name is currently deleted. Please restore it from the deleted tab.';
        } else {
          _errorMessage = 'A party with this name already exists.';
        }
        _isLoading = false;
        notifyListeners();
        return false;
      }

      await _supabase.from('parties').update({
        'name': name,
        'bundle_rate': bundleRate,
        'opening_balance': openingBalance,
      }).eq('id', id);

      await fetchParties();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteParty(int id) async {
    try {
      await _supabase.from('parties').update({
        'deleted_at': DateTime.now().toIso8601String(),
      }).eq('id', id);

      await fetchParties();
      await fetchDeletedParties();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> restoreParty(int id) async {
    try {
      await _supabase.from('parties').update({
        'deleted_at': null,
      }).eq('id', id);

      await fetchParties();
      await fetchDeletedParties();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> permanentlyDeleteParty(int id) async {
    try {
      // First delete related party prices
      await _supabase.from('item_party_prices').delete().eq('party_id', id);

      // Then delete the party
      await _supabase.from('parties').delete().eq('id', id);

      await fetchDeletedParties();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }
}
