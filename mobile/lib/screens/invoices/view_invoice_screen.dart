import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../models/invoice.dart';
import '../../models/invoice_item.dart';
import '../../models/payment.dart';
import '../../providers/invoice_provider.dart';
import '../../services/payment_service.dart';
import '../../services/pdf_service.dart';
import '../../theme/theme_helpers.dart';
import '../../theme/app_button_styles.dart';
import 'create_invoice_screen.dart';
import 'add_payment_dialog.dart';
import 'add_offline_bill_screen.dart';

class ViewInvoiceScreen extends StatefulWidget {
  final int invoiceId;

  const ViewInvoiceScreen({
    Key? key,
    required this.invoiceId,
  }) : super(key: key);

  @override
  State<ViewInvoiceScreen> createState() => _ViewInvoiceScreenState();
}

class _ViewInvoiceScreenState extends State<ViewInvoiceScreen> {
  bool _isLoading = true;
  bool _hasChanges = false;
  Invoice? _invoice;
  List<InvoiceItem> _items = [];
  List<Payment> _payments = [];
  final PaymentService _paymentService = PaymentService();
  final PdfService _pdfService = PdfService();

  @override
  void initState() {
    super.initState();
    _loadInvoiceData();
  }

  Future<void> _loadInvoiceData() async {
    setState(() => _isLoading = true);

    final invoiceProvider = Provider.of<InvoiceProvider>(context, listen: false);
    final result = await invoiceProvider.getInvoiceWithItems(widget.invoiceId);

    if (result != null && mounted) {
      // Load payments
      final payments = await _paymentService.getPaymentsByInvoice(widget.invoiceId);

      setState(() {
        _invoice = result['invoice'] as Invoice;
        _items = result['items'] as List<InvoiceItem>;
        _payments = payments;
        _isLoading = false;
      });
    } else {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to load bill details'),
            backgroundColor: Colors.red,
          ),
        );
        Navigator.pop(context);
      }
    }
  }

  String _formatDate(String dateStr) {
    final date = DateTime.parse(dateStr);
    return DateFormat('dd MMM yyyy').format(date);
  }

  String _formatNumber(double number) {
    if (number == number.toInt()) {
      return number.toInt().toString();
    }
    return number.toStringAsFixed(2);
  }

  // Calculate sub-total from items
  double get _calculatedSubTotal {
    return _items.fold(0.0, (sum, item) => sum + item.total);
  }

  // Calculate total amount paid
  double get _totalPaid {
    return _payments.fold(0.0, (sum, payment) => sum + payment.amount);
  }

  // Calculate balance due
  double get _balanceDue {
    // For offline invoices, use the total_amount from database
    // For regular invoices, calculate from items
    final grandTotal = (_invoice?.isOffline == true)
        ? (_invoice?.totalAmount ?? 0)
        : _calculatedSubTotal + (_invoice?.bundleCharge ?? 0);
    return grandTotal - _totalPaid;
  }

  // Calculate payment status
  String get _paymentStatus {
    if (_balanceDue <= 0) return 'paid';
    if (_totalPaid > 0 && _balanceDue > 0) return 'partial';
    return 'pending';
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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return PopScope(
      canPop: false,
      onPopInvoked: (didPop) {
        if (!didPop) {
          Navigator.pop(context, _hasChanges);
        }
      },
      child: Scaffold(
        backgroundColor: theme.scaffoldBackgroundColor,
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.pop(context, _hasChanges),
          ),
          title: Text(_invoice?.invoiceNumber ?? 'Bill Details'),
          actions: [
          PopupMenuButton<String>(
            onSelected: (value) async {
              switch (value) {
                case 'edit':
                  // For offline invoices, navigate to offline bill edit screen
                  if (_invoice?.isOffline == true) {
                    final result = await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => AddOfflineBillScreen(
                          invoiceId: widget.invoiceId,
                        ),
                      ),
                    );
                    if (result == true) {
                      _loadInvoiceData();
                      setState(() => _hasChanges = true);
                    }
                  } else {
                    final result = await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => CreateInvoiceScreen(
                          invoiceId: widget.invoiceId,
                        ),
                      ),
                    );
                    if (result == true) {
                      _loadInvoiceData();
                    }
                  }
                  break;
                case 'delete':
                  _deleteInvoice();
                  break;
              }
            },
            color: theme.cardColor,
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: ThemeHelpers.borderColor(context), width: 1),
            ),
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'edit',
                child: Row(
                  children: [
                    Icon(Icons.edit_outlined, size: 20, color: ThemeHelpers.mutedTextColor(context)),
                    const SizedBox(width: 12),
                    const Text('Edit', style: TextStyle(fontSize: 15)),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete_outlined, size: 20, color: Colors.red),
                    SizedBox(width: 12),
                    Text('Delete', style: TextStyle(color: Colors.red, fontSize: 15)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _invoice == null
              ? const Center(child: Text('Bill not found'))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Party Information Card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: theme.cardColor,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: ThemeHelpers.borderColor(context)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _invoice!.partyName ?? 'Unknown Party',
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    Text(
                                      'Bill #${_invoice!.invoiceNumber ?? 'N/A'}',
                                      style: TextStyle(
                                        color: ThemeHelpers.mutedTextColor(context),
                                        fontSize: 14,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: _getStatusColor(_paymentStatus).withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        _getStatusText(_paymentStatus),
                                        style: TextStyle(
                                          color: _getStatusColor(_paymentStatus),
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    if (_invoice!.isOffline == true) ...[
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 4,
                                        ),
                                        decoration: BoxDecoration(
                                          color: theme.brightness == Brightness.dark
                                              ? Colors.orange.shade900.withOpacity(0.3)
                                              : const Color(0xFFFFF7ED),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          'OFFLINE',
                                          style: TextStyle(
                                            color: theme.brightness == Brightness.dark
                                                ? Colors.orange.shade300
                                                : const Color(0xFFC2410C),
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            letterSpacing: 0.5,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Icon(Icons.calendar_today_outlined, size: 16, color: ThemeHelpers.mutedTextColor(context)),
                                const SizedBox(width: 8),
                                Text(
                                  _formatDate(_invoice!.invoiceDate),
                                  style: TextStyle(
                                    color: ThemeHelpers.mutedTextColor(context),
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                            if (_invoice!.createdAt != null) ...[
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Icon(Icons.access_time_outlined, size: 16, color: ThemeHelpers.mutedTextColor(context)),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Created: ${DateFormat('dd MMM yyyy, hh:mm a').format(_invoice!.createdAt!)}',
                                    style: TextStyle(
                                      color: ThemeHelpers.mutedTextColor(context),
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                      // Hide Items section for offline invoices
                      if (_invoice!.isOffline != true) ...[
                        const SizedBox(height: 16),

                        // Items Card
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: theme.cardColor,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: ThemeHelpers.borderColor(context)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Items',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 16),
                              ..._items.asMap().entries.map((entry) {
                                final index = entry.key;
                                final item = entry.value;
                                return Padding(
                                    padding: const EdgeInsets.only(bottom: 12),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          '${index + 1}. ',
                                          style: TextStyle(
                                            fontWeight: FontWeight.w500,
                                            fontSize: 14,
                                            color: ThemeHelpers.mutedTextColor(context),
                                          ),
                                        ),
                                        Expanded(
                                          flex: 3,
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                item.itemName ?? 'Unknown Item',
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w500,
                                                  fontSize: 14,
                                                ),
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                '${_formatNumber(item.quantity)} ${item.itemUnit ?? ''} × ₹${_formatNumber(item.rate)}',
                                                style: TextStyle(
                                                  color: ThemeHelpers.mutedTextColor(context),
                                                  fontSize: 12,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Expanded(
                                          flex: 1,
                                          child: Text(
                                            '₹${_formatNumber(item.total)}',
                                            textAlign: TextAlign.right,
                                            style: TextStyle(
                                              fontWeight: FontWeight.w600,
                                              fontSize: 14,
                                              color: colorScheme.primary,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                              }),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Add spacing only for offline invoices (regular invoices already have spacing from items section)
                      if (_invoice!.isOffline == true) const SizedBox(height: 16),

                      // Payment History Card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: theme.cardColor,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: ThemeHelpers.borderColor(context)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Payment History',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                ElevatedButton(
                                  onPressed: () => _showAddPaymentDialog(),
                                  style: AppButtonStyles.primaryElevated(
                                    context,
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  ),
                                  child: const Text('Add', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            if (_payments.isEmpty)
                              Center(
                                child: Padding(
                                  padding: const EdgeInsets.all(24),
                                  child: Text(
                                    'No payments recorded',
                                    style: TextStyle(
                                      color: ThemeHelpers.mutedTextColor(context),
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                              )
                            else
                              ..._payments.map((payment) => Dismissible(
                                    key: Key('payment_${payment.id}'),
                                    direction: DismissDirection.endToStart,
                                    background: Container(
                                      margin: const EdgeInsets.only(bottom: 12),
                                      padding: const EdgeInsets.symmetric(horizontal: 20),
                                      decoration: BoxDecoration(
                                        color: Colors.red,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      alignment: Alignment.centerRight,
                                      child: const Icon(
                                        Icons.delete,
                                        color: Colors.white,
                                        size: 24,
                                      ),
                                    ),
                                    confirmDismiss: (direction) async {
                                      return await showDialog(
                                        context: context,
                                        builder: (BuildContext context) {
                                          return AlertDialog(
                                            backgroundColor: theme.cardColor,
                                            title: const Text('Delete Payment'),
                                            content: const Text('Are you sure you want to delete this payment?'),
                                            actions: [
                                              TextButton(
                                                onPressed: () => Navigator.of(context).pop(false),
                                                child: const Text('Cancel'),
                                              ),
                                              TextButton(
                                                onPressed: () => Navigator.of(context).pop(true),
                                                child: const Text('Delete', style: TextStyle(color: Colors.red)),
                                              ),
                                            ],
                                          );
                                        },
                                      );
                                    },
                                    onDismissed: (direction) {
                                      _deletePayment(payment);
                                    },
                                    child: Container(
                                      margin: const EdgeInsets.only(bottom: 8),
                                      decoration: BoxDecoration(
                                        color: theme.cardColor,
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: ThemeHelpers.borderColor(context)),
                                      ),
                                      child: Padding(
                                        padding: const EdgeInsets.all(12),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  _formatDate(payment.paymentDate),
                                                  style: TextStyle(
                                                    fontSize: 12,
                                                    color: ThemeHelpers.mutedTextColor(context),
                                                  ),
                                                ),
                                                InkWell(
                                                  onTap: () => _showAddPaymentDialog(paymentToEdit: payment),
                                                  child: Padding(
                                                    padding: const EdgeInsets.all(4),
                                                    child: Icon(Icons.edit_outlined, size: 16, color: ThemeHelpers.mutedTextColor(context)),
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              '₹${_formatNumber(payment.amount)}',
                                              style: TextStyle(
                                                fontSize: 20,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.green.shade700,
                                              ),
                                            ),
                                            if (payment.remark != null && payment.remark!.isNotEmpty) ...[
                                              const SizedBox(height: 4),
                                              Text(
                                                payment.remark!,
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  color: ThemeHelpers.mutedTextColor(context),
                                                ),
                                              ),
                                            ],
                                          ],
                                        ),
                                      ),
                                    ),
                                  )),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Summary Card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: theme.cardColor,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: ThemeHelpers.borderColor(context)),
                        ),
                        child: Column(
                          children: [
                            // Hide sub-total, bundle details for offline invoices
                            if (_invoice!.isOffline != true) ...[
                              _buildSummaryRow(
                                'Sub Total',
                                '₹${_formatNumber(_calculatedSubTotal)}',
                                false,
                              ),
                              const SizedBox(height: 8),
                              _buildSummaryRow(
                                'Bundle Qty',
                                _formatNumber(_invoice!.bundleQuantity ?? 1),
                                false,
                              ),
                              const SizedBox(height: 8),
                              _buildSummaryRow(
                                'Bundle Charge',
                                '₹${_formatNumber(_invoice!.bundleCharge)}',
                                false,
                              ),
                              const Divider(height: 24),
                            ],
                            _buildSummaryRow(
                              'Grand Total',
                              '₹${_formatNumber((_invoice!.isOffline == true) ? (_invoice!.totalAmount ?? 0) : (_calculatedSubTotal + _invoice!.bundleCharge))}',
                              true,
                            ),
                            const Divider(height: 24),
                            _buildSummaryRowWithColor(
                              'Paid',
                              '₹${_formatNumber(_totalPaid)}',
                              Colors.green,
                            ),
                            const SizedBox(height: 8),
                            _buildSummaryRowWithColor(
                              'Balance Due',
                              '₹${_formatNumber(_balanceDue)}',
                              _balanceDue > 0 ? Colors.red : Colors.green,
                            ),
                          ],
                        ),
                      ),

                      // Hide PDF and Share buttons for offline invoices (they don't have items)
                      if (_invoice!.isOffline != true) ...[
                        const SizedBox(height: 24),

                        // Action Buttons
                        Row(
                          children: [
                            Expanded(
                              child: Builder(
                                builder: (BuildContext buttonContext) {
                                  return OutlinedButton(
                                    onPressed: () async {
                                      if (_invoice == null) return;

                                      try {
                                        // Get button position for iPad share dialog
                                        final box = buttonContext.findRenderObject() as RenderBox?;
                                        final sharePositionOrigin = box != null
                                            ? box.localToGlobal(Offset.zero) & box.size
                                            : null;

                                        await _pdfService.sharePdf(
                                          invoice: _invoice!,
                                          items: _items,
                                          sharePositionOrigin: sharePositionOrigin,
                                        );
                                      } catch (e) {
                                        if (mounted) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(
                                              content: Text('Failed to share PDF: $e'),
                                              backgroundColor: Colors.red,
                                            ),
                                          );
                                        }
                                      }
                                    },
                                    style: AppButtonStyles.primaryOutlined(context),
                                    child: const Text('Share', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                                  );
                                },
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: ElevatedButton(
                                onPressed: () async {
                                  if (_invoice == null) return;

                                  try {
                                    await _pdfService.previewPdf(
                                      invoice: _invoice!,
                                      items: _items,
                                    );
                                  } catch (e) {
                                    if (mounted) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text('Failed to generate PDF: $e'),
                                          backgroundColor: Colors.red,
                                        ),
                                      );
                                    }
                                  }
                                },
                                style: AppButtonStyles.primaryElevated(context),
                                child: const Text('PDF', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, bool isTotal) {
    final theme = Theme.of(context);
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isTotal ? 16 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            color: isTotal ? null : ThemeHelpers.mutedTextColor(context),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isTotal ? 18 : 14,
            fontWeight: FontWeight.bold,
            color: isTotal ? theme.colorScheme.primary : null,
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryRowWithColor(String label, String value, Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.normal,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }

  Future<void> _showAddPaymentDialog({Payment? paymentToEdit}) async {
    showDialog(
      context: context,
      builder: (context) => AddPaymentDialog(
        invoiceId: widget.invoiceId,
        balanceDue: _balanceDue,
        paymentToEdit: paymentToEdit,
        onPaymentSaved: () {
          _hasChanges = true;
          _loadInvoiceData();
        },
      ),
    );
  }

  Future<void> _deletePayment(Payment payment) async {
    final success = await _paymentService.deletePayment(payment.id!);

    if (!mounted) return;

    if (success) {
      _hasChanges = true;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Payment deleted successfully'),
          backgroundColor: Colors.green,
        ),
      );
      _loadInvoiceData();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to delete payment'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _deleteInvoice() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Theme.of(context).cardColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: const Text('Delete Bill'),
        content: const Text('Are you sure you want to delete this bill?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text('Delete', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    final invoiceProvider = Provider.of<InvoiceProvider>(context, listen: false);
    final success = await invoiceProvider.deleteInvoice(widget.invoiceId);

    if (!mounted) return;

    if (success) {
      Navigator.pop(context, true); // Return to list screen
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Bill deleted successfully'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to delete bill'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
