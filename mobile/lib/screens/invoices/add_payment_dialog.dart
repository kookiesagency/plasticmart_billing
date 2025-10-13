import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../../models/payment.dart';
import '../../services/payment_service.dart';
import '../../utils/date_picker_theme.dart';
import '../../theme/app_button_styles.dart';

class AddPaymentDialog extends StatefulWidget {
  final int invoiceId;
  final double balanceDue;
  final Payment? paymentToEdit;
  final VoidCallback onPaymentSaved;

  const AddPaymentDialog({
    Key? key,
    required this.invoiceId,
    required this.balanceDue,
    this.paymentToEdit,
    required this.onPaymentSaved,
  }) : super(key: key);

  @override
  State<AddPaymentDialog> createState() => _AddPaymentDialogState();
}

class _AddPaymentDialogState extends State<AddPaymentDialog> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _remarkController = TextEditingController();
  final PaymentService _paymentService = PaymentService();

  DateTime _selectedDate = DateTime.now();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();

    if (widget.paymentToEdit != null) {
      // Edit mode
      _amountController.text = widget.paymentToEdit!.amount.toString();
      _remarkController.text = widget.paymentToEdit!.remark ?? '';
      _selectedDate = DateTime.parse(widget.paymentToEdit!.paymentDate);
    } else {
      // Add mode - prefill with balance due
      _amountController.text = widget.balanceDue > 0
          ? widget.balanceDue.toStringAsFixed(2)
          : '0';
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    _remarkController.dispose();
    super.dispose();
  }

  String _formatDateForDisplay(DateTime date) {
    return DateFormat('EEE, MMM d').format(date);
  }

  String _formatDateForDatabase(DateTime date) {
    return DateFormat('yyyy-MM-dd').format(date);
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showAppDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );

    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _savePayment() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final payment = Payment(
      id: widget.paymentToEdit?.id,
      invoiceId: widget.invoiceId,
      amount: double.parse(_amountController.text),
      paymentDate: _formatDateForDatabase(_selectedDate),
      remark: _remarkController.text.trim().isEmpty
          ? null
          : _remarkController.text.trim(),
    );

    bool success;
    if (widget.paymentToEdit != null) {
      // Update
      success = await _paymentService.updatePayment(payment);
    } else {
      // Add
      final result = await _paymentService.addPayment(payment);
      success = result != null;
    }

    if (!mounted) return;

    setState(() => _isLoading = false);

    if (success) {
      Navigator.pop(context);
      widget.onPaymentSaved();

      final l10n = AppLocalizations.of(context)!;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            widget.paymentToEdit != null
                ? l10n.paymentForm_paymentUpdatedSuccess
                : l10n.paymentForm_paymentAddedSuccess,
          ),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      final l10n = AppLocalizations.of(context)!;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            widget.paymentToEdit != null
                ? l10n.paymentForm_failedToUpdate
                : l10n.paymentForm_failedToAdd,
          ),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;

    return Dialog(
      backgroundColor: theme.cardColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.paymentToEdit != null ? l10n.paymentForm_editPayment : l10n.paymentForm_addPayment,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 24),

                // Amount field
                TextFormField(
                  controller: _amountController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: InputDecoration(
                    labelText: l10n.paymentForm_amount,
                    hintText: l10n.validation_fieldRequired,
                    prefixText: '₹',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return l10n.validation_fieldRequired;
                    }
                    final amount = double.tryParse(value);
                    if (amount == null || amount <= 0) {
                      return l10n.validation_amountPositive;
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Payment Date
                InkWell(
                  onTap: _selectDate,
                  child: InputDecorator(
                    decoration: InputDecoration(
                      labelText: l10n.paymentForm_paymentDate,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      suffixIcon: const Icon(Icons.calendar_today_outlined),
                    ),
                    child: Text(
                      _formatDateForDisplay(_selectedDate),
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Remark field
                TextFormField(
                  controller: _remarkController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    labelText: l10n.paymentForm_addRemark,
                    hintText: l10n.paymentForm_addRemark,
                    alignLabelWithHint: true,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  maxLength: 500,
                ),
                const SizedBox(height: 24),

                // Action buttons
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: _isLoading ? null : () => Navigator.pop(context),
                      child: Text(l10n.common_cancel),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton(
                      onPressed: _isLoading ? null : _savePayment,
                      style: AppButtonStyles.primaryElevated(
                        context,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation(Colors.white),
                              ),
                            )
                          : Text(l10n.common_save, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
