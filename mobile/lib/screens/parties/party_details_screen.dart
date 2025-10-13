import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../../models/party.dart';
import '../../models/invoice.dart';
import '../../providers/invoice_provider.dart';
import '../../theme/theme_helpers.dart';
import '../invoices/view_invoice_screen.dart';

class PartyDetailsScreen extends StatefulWidget {
  final Party party;

  const PartyDetailsScreen({Key? key, required this.party}) : super(key: key);

  @override
  State<PartyDetailsScreen> createState() => _PartyDetailsScreenState();
}

class _PartyDetailsScreenState extends State<PartyDetailsScreen> {
  bool _isLoading = true;
  List<Invoice> _invoices = [];
  double _totalBilled = 0;
  double _totalReceived = 0;
  double _currentBalance = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    final invoiceProvider = Provider.of<InvoiceProvider>(context, listen: false);
    final invoices = await invoiceProvider.fetchInvoicesByParty(widget.party.id!);

    // Calculate totals
    double totalBilled = 0;
    double totalReceived = 0;

    for (var invoice in invoices) {
      totalBilled += invoice.totalAmount ?? 0;
      // Total received is calculated from invoice status (paid/partial amounts)
      if (invoice.status == 'paid') {
        totalReceived += invoice.totalAmount ?? 0;
      } else if (invoice.status == 'partial') {
        // For partial, we need to calculate from payments
        // For now, we'll estimate based on the fact it's not fully paid
        // This will be more accurate when we add payment tracking per invoice
      }
    }

    final currentBalance = (widget.party.openingBalance ?? 0) + totalBilled - totalReceived;

    setState(() {
      _invoices = invoices;
      _totalBilled = totalBilled;
      _totalReceived = totalReceived;
      _currentBalance = currentBalance;
      _isLoading = false;
    });
  }

  String _formatCurrency(double amount) {
    return '₹${amount.toStringAsFixed(2)}';
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    final date = DateTime.parse(dateStr);
    return DateFormat('dd MMM yyyy').format(date);
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'paid':
        return Colors.green;
      case 'pending':
        return Colors.red;
      case 'partial':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    return status[0].toUpperCase() + status.substring(1);
  }

  Widget _buildSummaryCard({
    required BuildContext context,
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ThemeHelpers.borderColor(context)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: color),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 12,
                    color: ThemeHelpers.mutedTextColor(context),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text(widget.party.name),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Party Information Card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: ThemeHelpers.cardDecoration(context, radius: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.party.name,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    l10n.parties_bundleRate,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: ThemeHelpers.mutedTextColor(context),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    widget.party.bundleRate != null
                                        ? _formatCurrency(widget.party.bundleRate!)
                                        : l10n.parties_notSet,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    l10n.parties_openingBalanceLabel,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: ThemeHelpers.mutedTextColor(context),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    _formatCurrency(widget.party.openingBalance ?? 0),
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Financial Summary Cards
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.5,
                    children: [
                      _buildSummaryCard(
                        context: context,
                        title: l10n.parties_totalBilled,
                        value: _formatCurrency(_totalBilled),
                        icon: Icons.receipt_long_outlined,
                        color: colorScheme.primary,
                      ),
                      _buildSummaryCard(
                        context: context,
                        title: l10n.parties_totalReceived,
                        value: _formatCurrency(_totalReceived),
                        icon: Icons.check_circle_outline,
                        color: Colors.green,
                      ),
                      _buildSummaryCard(
                        context: context,
                        title: l10n.parties_currentBalance,
                        value: _formatCurrency(_currentBalance),
                        icon: Icons.account_balance_wallet_outlined,
                        color: _currentBalance > 0 ? Colors.red : Colors.green,
                      ),
                      _buildSummaryCard(
                        context: context,
                        title: l10n.parties_invoiceCount,
                        value: _invoices.length.toString(),
                        icon: Icons.description_outlined,
                        color: Colors.blue,
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Invoice List Header
                  Text(
                    l10n.parties_invoicesTitle,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Invoice List
                  if (_invoices.isEmpty)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Column(
                          children: [
                            Icon(
                              Icons.receipt_outlined,
                              size: 64,
                              color: ThemeHelpers.mutedTextColor(context),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              l10n.parties_noInvoicesYet,
                              style: TextStyle(
                                fontSize: 16,
                                color: ThemeHelpers.mutedTextColor(context),
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    ...(_invoices.map((invoice) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        decoration: BoxDecoration(
                          color: theme.cardColor,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: ThemeHelpers.borderColor(context)),
                        ),
                        child: InkWell(
                          onTap: () async {
                            final result = await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => ViewInvoiceScreen(
                                  invoiceId: invoice.id!,
                                ),
                              ),
                            );
                            if (result == true) _loadData();
                          },
                          borderRadius: BorderRadius.circular(12),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      if (invoice.invoiceNumber != null) ...[
                                        Text(
                                          '${l10n.parties_billNumber}${invoice.invoiceNumber}',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 14,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                      ],
                                      Text(
                                        _formatDate(invoice.invoiceDate),
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: ThemeHelpers.mutedTextColor(context),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      _formatCurrency(invoice.totalAmount ?? 0),
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: colorScheme.primary,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: _getStatusColor(invoice.status).withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        _getStatusText(invoice.status),
                                        style: TextStyle(
                                          color: _getStatusColor(invoice.status),
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }).toList()),
                ],
              ),
            ),
    );
  }
}
