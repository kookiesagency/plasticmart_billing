import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../config/supabase_config.dart';
import '../../models/party.dart';
import '../../theme/theme_helpers.dart';
import '../../theme/app_button_styles.dart';
import 'party_details_screen.dart';

class PartyWeeklyReportScreen extends StatefulWidget {
  final int partyId;
  final String partyName;

  const PartyWeeklyReportScreen({
    Key? key,
    required this.partyId,
    required this.partyName,
  }) : super(key: key);

  @override
  State<PartyWeeklyReportScreen> createState() => _PartyWeeklyReportScreenState();
}

class _PartyWeeklyReportScreenState extends State<PartyWeeklyReportScreen> {
  final _supabase = SupabaseConfig.client;
  bool _isLoading = true;
  double _previousOutstanding = 0;
  double _weekTotal = 0;
  double _grandTotal = 0;
  List<Map<String, dynamic>> _weeklyInvoices = [];
  DateTime? _weekStart;
  DateTime? _weekEnd;
  Party? _party;

  @override
  void initState() {
    super.initState();
    _loadReportData();
  }

  Future<void> _loadReportData() async {
    setState(() => _isLoading = true);

    try {
      // Calculate current week range (Monday to Sunday)
      DateTime now = DateTime.now();
      DateTime weekStart = _getWeekStart(now);
      DateTime weekEnd = _getWeekEnd(weekStart);

      String weekStartStr = DateFormat('yyyy-MM-dd').format(weekStart);
      String weekEndStr = DateFormat('yyyy-MM-dd').format(weekEnd);

      // Fetch all invoices for this party
      final allInvoicesResponse = await _supabase
          .from('invoices')
          .select('id, invoice_number, invoice_date, total_amount, payments(amount)')
          .eq('party_id', widget.partyId)
          .isFilter('deleted_at', null)
          .order('invoice_date', ascending: true);

      final allInvoices = allInvoicesResponse as List;

      // Get party full details
      final partyData = await _supabase
          .from('parties')
          .select('*')
          .eq('id', widget.partyId)
          .single();

      _party = Party.fromJson(partyData);

      // Check if current week has any invoices
      List<Map<String, dynamic>> weeklyInvoices = allInvoices
          .where((inv) =>
              inv['invoice_date'] != null &&
              inv['invoice_date'].compareTo(weekStartStr) >= 0 &&
              inv['invoice_date'].compareTo(weekEndStr) <= 0)
          .map((inv) => Map<String, dynamic>.from(inv))
          .toList();

      // If no invoices in current week, use last week
      if (weeklyInvoices.isEmpty) {
        now = now.subtract(const Duration(days: 7));
        weekStart = _getWeekStart(now);
        weekEnd = _getWeekEnd(weekStart);
        weekStartStr = DateFormat('yyyy-MM-dd').format(weekStart);
        weekEndStr = DateFormat('yyyy-MM-dd').format(weekEnd);

        weeklyInvoices = allInvoices
            .where((inv) =>
                inv['invoice_date'] != null &&
                inv['invoice_date'].compareTo(weekStartStr) >= 0 &&
                inv['invoice_date'].compareTo(weekEndStr) <= 0)
            .map((inv) => Map<String, dynamic>.from(inv))
            .toList();
      }

      // Separate invoices: before week and during week
      final beforeWeekInvoices = allInvoices
          .where((inv) =>
              inv['invoice_date'] != null &&
              inv['invoice_date'].compareTo(weekStartStr) < 0)
          .toList();

      // Calculate previous outstanding (opening balance + before week invoices - payments)
      double previousOutstanding = (partyData['opening_balance'] as num?)?.toDouble() ?? 0;

      for (var invoice in beforeWeekInvoices) {
        final payments = invoice['payments'] as List? ?? [];
        final totalPaid = payments.fold<double>(
            0, (sum, p) => sum + ((p['amount'] as num?)?.toDouble() ?? 0));
        previousOutstanding += ((invoice['total_amount'] as num?)?.toDouble() ?? 0) - totalPaid;
      }

      // Calculate week total and week payments
      double weekTotal = 0;
      double weekPayments = 0;

      for (var invoice in weeklyInvoices) {
        weekTotal += (invoice['total_amount'] as num?)?.toDouble() ?? 0;
        final payments = invoice['payments'] as List? ?? [];
        weekPayments += payments.fold<double>(
            0, (sum, p) => sum + ((p['amount'] as num?)?.toDouble() ?? 0));
      }

      final grandTotal = previousOutstanding + weekTotal - weekPayments;

      setState(() {
        _previousOutstanding = previousOutstanding;
        _weekTotal = weekTotal;
        _grandTotal = grandTotal;
        _weeklyInvoices = weeklyInvoices;
        _weekStart = weekStart;
        _weekEnd = weekEnd;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load report: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  DateTime _getWeekStart(DateTime date) {
    // Get Monday of the week
    return date.subtract(Duration(days: date.weekday - 1));
  }

  DateTime _getWeekEnd(DateTime weekStart) {
    // Get Sunday of the week
    return weekStart.add(const Duration(days: 6));
  }

  String _formatCurrency(double amount) {
    return '₹${amount.toStringAsFixed(2)}';
  }

  String _formatDate(String dateStr) {
    final date = DateTime.parse(dateStr);
    return DateFormat('d MMM yyyy').format(date);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Weekly Report'),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header Card with Party Name and Week Range
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF3D6B5C) : colorScheme.primary,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.partyName,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Week of ${DateFormat('dd/MM/yyyy').format(_weekStart!)} to ${DateFormat('dd/MM/yyyy').format(_weekEnd!)}',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.white.withOpacity(0.9),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Content Area
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Previous Outstanding Balance
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: ThemeHelpers.cardDecoration(context),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Previous Outstanding Balance',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              Text(
                                _formatCurrency(_previousOutstanding),
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Divider
                        Container(
                          height: 1,
                          color: ThemeHelpers.borderColor(context),
                        ),
                        const SizedBox(height: 20),

                        // Current Week Invoices Header
                        const Text(
                          'Current Week Invoices:',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Invoice List
                        if (_weeklyInvoices.isEmpty)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isDark ? theme.scaffoldBackgroundColor : Colors.grey.shade50,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'No invoices for this week',
                              style: TextStyle(
                                fontSize: 14,
                                color: ThemeHelpers.mutedTextColor(context),
                              ),
                            ),
                          )
                        else
                          Container(
                            decoration: BoxDecoration(
                              color: isDark ? theme.scaffoldBackgroundColor : Colors.grey.shade50,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              children: List.generate(_weeklyInvoices.length, (index) {
                                final invoice = _weeklyInvoices[index];
                                final invoiceNumber = invoice['invoice_number'] ?? 'N/A';
                                final invoiceDate = invoice['invoice_date'] ?? '';
                                final amount = (invoice['total_amount'] as num?)?.toDouble() ?? 0;

                                return Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                  decoration: BoxDecoration(
                                    border: Border(
                                      bottom: index < _weeklyInvoices.length - 1
                                          ? BorderSide(color: ThemeHelpers.borderColor(context))
                                          : BorderSide.none,
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'Invoice $invoiceNumber',
                                              style: const TextStyle(
                                                fontSize: 14,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              DateFormat('dd/MM/yyyy').format(DateTime.parse(invoiceDate)),
                                              style: TextStyle(
                                                fontSize: 12,
                                                color: ThemeHelpers.mutedTextColor(context),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Text(
                                        _formatCurrency(amount),
                                        style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.bold,
                                          color: colorScheme.primary,
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }),
                            ),
                          ),

                        const SizedBox(height: 20),

                        // Divider
                        Container(
                          height: 1,
                          color: ThemeHelpers.borderColor(context),
                        ),
                        const SizedBox(height: 20),

                        // Total This Week
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: ThemeHelpers.cardDecoration(context),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Total This Week',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              Text(
                                _formatCurrency(_weekTotal),
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Total
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: ThemeHelpers.cardDecoration(context),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Total',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              Text(
                                _formatCurrency(_grandTotal),
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),

                        // More Details Button
                        if (_party != null)
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => PartyDetailsScreen(party: _party!),
                                  ),
                                );
                              },
                              style: AppButtonStyles.primaryElevated(context),
                              child: const Text(
                                'More Details',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ),
                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
