import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../models/invoice.dart';
import '../../models/invoice_item.dart';
import '../../models/payment.dart';
import '../../providers/invoice_provider.dart';
import '../../services/payment_service.dart';
import '../../services/pdf_service.dart';
import 'create_invoice_screen.dart';
import 'add_payment_dialog.dart';

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
    final grandTotal = _calculatedSubTotal + (_invoice?.bundleCharge ?? 0);
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
    final colorScheme = Theme.of(context).colorScheme;

    return PopScope(
      canPop: false,
      onPopInvoked: (didPop) {
        if (!didPop) {
          Navigator.pop(context, _hasChanges);
        }
      },
      child: Scaffold(
        backgroundColor: Colors.white,
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
                  break;
                case 'delete':
                  _deleteInvoice();
                  break;
              }
            },
            color: Colors.white,
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: Colors.grey.shade200, width: 1),
            ),
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'edit',
                child: Row(
                  children: [
                    Icon(Icons.edit_outlined, size: 20, color: Colors.grey.shade700),
                    const SizedBox(width: 12),
                    const Text('Edit', style: TextStyle(fontSize: 15)),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete_outline, size: 20, color: Colors.red),
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
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey.shade200),
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
                                        color: Colors.grey.shade700,
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
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Icon(Icons.calendar_today, size: 16, color: Colors.grey.shade600),
                                const SizedBox(width: 8),
                                Text(
                                  _formatDate(_invoice!.invoiceDate),
                                  style: TextStyle(
                                    color: Colors.grey.shade600,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                            if (_invoice!.createdAt != null) ...[
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Icon(Icons.access_time, size: 16, color: Colors.grey.shade600),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Created: ${DateFormat('dd MMM yyyy, hh:mm a').format(_invoice!.createdAt!)}',
                                    style: TextStyle(
                                      color: Colors.grey.shade600,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Items Card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey.shade200),
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
                                          color: Colors.grey.shade700,
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
                                                color: Colors.grey.shade600,
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

                      // Payment History Card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey.shade200),
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
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Theme.of(context).colorScheme.primary,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
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
                                      color: Colors.grey.shade600,
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
                                            backgroundColor: Colors.white,
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
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: Colors.grey.shade200),
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
                                                    color: Colors.grey.shade600,
                                                  ),
                                                ),
                                                InkWell(
                                                  onTap: () => _showAddPaymentDialog(paymentToEdit: payment),
                                                  child: Padding(
                                                    padding: const EdgeInsets.all(4),
                                                    child: Icon(Icons.edit_outlined, size: 16, color: Colors.grey.shade600),
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
                                                  color: Colors.grey.shade600,
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
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Column(
                          children: [
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
                            _buildSummaryRow(
                              'Grand Total',
                              '₹${_formatNumber(_calculatedSubTotal + _invoice!.bundleCharge)}',
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
                      const SizedBox(height: 24),

                      // Action Buttons
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () async {
                                if (_invoice == null) return;
                                await _pdfService.sharePdf(
                                  invoice: _invoice!,
                                  items: _items,
                                );
                              },
                              icon: const Icon(Icons.share),
                              label: const Text('Share', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                side: BorderSide(color: Theme.of(context).colorScheme.primary),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () async {
                                if (_invoice == null) return;
                                await _pdfService.previewPdf(
                                  invoice: _invoice!,
                                  items: _items,
                                );
                              },
                              icon: const Icon(Icons.picture_as_pdf),
                              label: const Text('PDF', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Theme.of(context).colorScheme.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
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
  }

  Widget _buildSummaryRow(String label, String value, bool isTotal) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isTotal ? 16 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            color: isTotal ? Colors.black : Colors.grey.shade700,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isTotal ? 18 : 14,
            fontWeight: FontWeight.bold,
            color: isTotal ? Theme.of(context).colorScheme.primary : Colors.black87,
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
        backgroundColor: Colors.white,
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
