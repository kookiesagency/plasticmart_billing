import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../../models/invoice.dart';
import '../../providers/invoice_provider.dart';
import 'create_invoice_screen.dart';
import 'view_invoice_screen.dart';

class InvoicesScreen extends StatefulWidget {
  const InvoicesScreen({Key? key}) : super(key: key);

  @override
  State<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends State<InvoicesScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _searchQuery = '';
  bool _showDeleted = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      setState(() {
        _showDeleted = _tabController.index == 1;
      });
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final invoiceProvider = Provider.of<InvoiceProvider>(context, listen: false);
    await Future.wait([
      invoiceProvider.fetchInvoices(),
      invoiceProvider.fetchDeletedInvoices(),
    ]);
  }

  List<Invoice> _getFilteredInvoices(List<Invoice> invoices) {
    if (_searchQuery.isEmpty) return invoices;

    return invoices.where((invoice) {
      final partyName = invoice.partyName?.toLowerCase() ?? '';
      final invoiceNumber = invoice.invoiceNumber?.toLowerCase() ?? '';
      final query = _searchQuery.toLowerCase();

      return partyName.contains(query) || invoiceNumber.contains(query);
    }).toList();
  }

  String _formatDate(String dateStr) {
    final date = DateTime.parse(dateStr);
    return DateFormat('dd MMM yyyy').format(date);
  }

  String _formatCurrency(double amount) {
    return '₹${amount.toStringAsFixed(2)}';
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

  Future<void> _deleteInvoice(int id) async {
    final invoiceProvider = Provider.of<InvoiceProvider>(context, listen: false);
    final success = await invoiceProvider.deleteInvoice(id);

    if (!mounted) return;

    final l10n = AppLocalizations.of(context)!;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success ? l10n.invoices_deleteSuccess : l10n.invoices_deleteFailed,
        ),
        backgroundColor: success ? Colors.green : Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _restoreInvoice(int id) async {
    final invoiceProvider = Provider.of<InvoiceProvider>(context, listen: false);
    final success = await invoiceProvider.restoreInvoice(id);

    if (!mounted) return;

    final l10n = AppLocalizations.of(context)!;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success ? l10n.invoices_restoreSuccess : l10n.invoices_restoreFailed,
        ),
        backgroundColor: success ? Colors.green : Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _permanentlyDeleteInvoice(int id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        final dialogL10n = AppLocalizations.of(dialogContext)!;
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          title: Text(dialogL10n.invoices_permanentDeleteTitle),
          content: Text(dialogL10n.invoices_permanentDeleteMessage),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: Text(dialogL10n.common_cancel),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(dialogContext, true),
              style: FilledButton.styleFrom(
                backgroundColor: Colors.red,
              ),
              child: Text(dialogL10n.invoices_permanentDeleteButton),
            ),
          ],
        );
      },
    );

    if (confirmed != true || !mounted) return;

    final invoiceProvider = Provider.of<InvoiceProvider>(context, listen: false);
    final success = await invoiceProvider.permanentlyDeleteInvoice(id);

    if (!mounted) return;

    final l10n = AppLocalizations.of(context)!;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success ? l10n.invoices_permanentDeleteSuccess : l10n.invoices_permanentDeleteFailed,
        ),
        backgroundColor: success ? Colors.green : Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final invoiceProvider = Provider.of<InvoiceProvider>(context);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDarkTheme = theme.brightness == Brightness.dark;

    final invoices = _showDeleted ? invoiceProvider.deletedInvoices : invoiceProvider.invoices;
    final filteredInvoices = _getFilteredInvoices(invoices);

    return Column(
      children: [
        TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: l10n.invoices_active),
            Tab(text: l10n.invoices_deleted),
          ],
        ),
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: TextField(
            decoration: InputDecoration(
              hintText: l10n.invoices_searchInvoices,
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: isDarkTheme ? Colors.white.withOpacity(0.2) : Colors.grey.shade300, width: 1),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: isDarkTheme ? Colors.white.withOpacity(0.2) : Colors.grey.shade300, width: 1),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: colorScheme.primary, width: 1),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            onChanged: (value) {
              setState(() {
                _searchQuery = value;
              });
            },
          ),
        ),
        Expanded(
          child: invoiceProvider.isLoading
              ? const Center(child: CircularProgressIndicator())
              : filteredInvoices.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _showDeleted ? Icons.delete_outlined : Icons.receipt_outlined,
                            size: 64,
                            color: Colors.grey,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _showDeleted ? l10n.invoices_noDeletedInvoices : l10n.invoices_noInvoicesYet,
                            style: const TextStyle(
                              fontSize: 18,
                              color: Colors.grey,
                            ),
                          ),
                          if (!_showDeleted) ...[
                            const SizedBox(height: 8),
                            TextButton.icon(
                              onPressed: () async {
                                final result = await Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => const CreateInvoiceScreen(),
                                  ),
                                );
                                if (result == true) _loadData();
                              },
                              icon: const Icon(Icons.add),
                              label: Text(l10n.invoices_createFirstInvoice),
                            ),
                          ],
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadData,
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: filteredInvoices.length,
                        itemBuilder: (context, index) {
                          final invoice = filteredInvoices[index];
                          return Dismissible(
                            key: Key('invoice-${invoice.id}'),
                            direction: _showDeleted ? DismissDirection.none : DismissDirection.endToStart,
                            background: Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              alignment: Alignment.centerRight,
                              padding: const EdgeInsets.only(right: 20),
                              decoration: BoxDecoration(
                                color: Colors.red,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Icon(Icons.delete, color: Colors.white),
                            ),
                            confirmDismiss: (direction) async {
                              return await showDialog<bool>(
                                context: context,
                                builder: (dialogContext) {
                                  final dialogL10n = AppLocalizations.of(dialogContext)!;
                                  return AlertDialog(
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    title: Text(dialogL10n.invoices_deleteInvoice),
                                    content: Text(dialogL10n.common_areYouSure),
                                    actions: [
                                      TextButton(
                                        onPressed: () => Navigator.pop(dialogContext, false),
                                        child: Text(dialogL10n.common_cancel),
                                      ),
                                      FilledButton(
                                        onPressed: () => Navigator.pop(dialogContext, true),
                                        style: FilledButton.styleFrom(
                                          backgroundColor: Colors.red,
                                        ),
                                        child: Text(dialogL10n.common_delete),
                                      ),
                                    ],
                                  );
                                },
                              );
                            },
                            onDismissed: (direction) async {
                              await _deleteInvoice(invoice.id!);
                            },
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              decoration: BoxDecoration(
                                color: theme.cardColor,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: isDarkTheme ? Colors.white.withOpacity(0.1) : Colors.grey.shade200,
                                  width: 1,
                                ),
                              ),
                              child: InkWell(
                                onTap: _showDeleted ? null : () async {
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
                                borderRadius: BorderRadius.circular(16),
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              invoice.partyName ?? 'Unknown Party',
                                              style: const TextStyle(
                                                fontWeight: FontWeight.w600,
                                                fontSize: 16,
                                              ),
                                            ),
                                          ),
                                          if (!_showDeleted) ...[
                                            Row(
                                              children: [
                                                if (invoice.isOffline == true) ...[
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(
                                                      horizontal: 6,
                                                      vertical: 2,
                                                    ),
                                                    decoration: BoxDecoration(
                                                      color: const Color(0xFFFFF7ED), // bg-orange-100
                                                      borderRadius: BorderRadius.circular(4),
                                                    ),
                                                    child: const Text(
                                                      'OFFLINE',
                                                      style: TextStyle(
                                                        color: Color(0xFFC2410C), // text-orange-700
                                                        fontSize: 9,
                                                        fontWeight: FontWeight.bold,
                                                        letterSpacing: 0.5,
                                                      ),
                                                    ),
                                                  ),
                                                  const SizedBox(width: 6),
                                                ],
                                                Container(
                                                  padding: const EdgeInsets.symmetric(
                                                    horizontal: 6,
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
                                                      fontSize: 9,
                                                      fontWeight: FontWeight.bold,
                                                      letterSpacing: 0.5,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                if (invoice.invoiceNumber != null) ...[
                                                  Text(
                                                    '${l10n.invoices_billNumber}${invoice.invoiceNumber}',
                                                    style: TextStyle(
                                                      color: theme.textTheme.bodyLarge?.color,
                                                      fontSize: 13,
                                                    ),
                                                  ),
                                                  const SizedBox(height: 4),
                                                ],
                                                Text(
                                                  _formatDate(invoice.invoiceDate),
                                                  style: TextStyle(
                                                    color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                                                    fontSize: 12,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          if (_showDeleted) ...[
                                            Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                IconButton(
                                                  icon: const Icon(Icons.restore, color: Colors.green, size: 22),
                                                  onPressed: () => _restoreInvoice(invoice.id!),
                                                  tooltip: l10n.invoices_restore,
                                                  padding: EdgeInsets.zero,
                                                  constraints: const BoxConstraints(),
                                                ),
                                                const SizedBox(width: 8),
                                                IconButton(
                                                  icon: const Icon(Icons.delete_forever, color: Colors.red, size: 22),
                                                  onPressed: () => _permanentlyDeleteInvoice(invoice.id!),
                                                  tooltip: l10n.invoices_permanentDeleteTooltip,
                                                  padding: EdgeInsets.zero,
                                                  constraints: const BoxConstraints(),
                                                ),
                                              ],
                                            ),
                                          ] else ...[
                                            Text(
                                              _formatCurrency(invoice.totalAmount ?? 0),
                                              style: TextStyle(
                                                fontSize: 18,
                                                fontWeight: FontWeight.bold,
                                                color: colorScheme.primary,
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
        ),
      ],
    );
  }
}
