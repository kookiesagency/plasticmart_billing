import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../../models/party.dart';
import '../../models/invoice.dart';
import '../../providers/party_provider.dart';
import '../../providers/invoice_provider.dart';
import '../../utils/date_picker_theme.dart';
import '../../config/supabase_config.dart';
import '../../theme/theme_helpers.dart';

class AddOfflineBillScreen extends StatefulWidget {
  final int? invoiceId;

  const AddOfflineBillScreen({
    Key? key,
    this.invoiceId,
  }) : super(key: key);

  @override
  State<AddOfflineBillScreen> createState() => _AddOfflineBillScreenState();
}

class _AddOfflineBillScreenState extends State<AddOfflineBillScreen> {
  final _formKey = GlobalKey<FormState>();
  final _totalAmountController = TextEditingController();
  final _amountReceivedController = TextEditingController();
  final _notesController = TextEditingController();

  Party? _selectedParty;
  DateTime _selectedDate = DateTime.now();
  String _paymentStatus = 'Pending';
  bool _isLoading = false;
  bool get _isEditMode => widget.invoiceId != null;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadParties();
      if (_isEditMode) {
        _loadInvoiceData();
      }
    });
  }

  Future<void> _loadInvoiceData() async {
    setState(() => _isLoading = true);

    final invoiceProvider = Provider.of<InvoiceProvider>(context, listen: false);
    final result = await invoiceProvider.getInvoiceWithItems(widget.invoiceId!);

    if (result != null && mounted) {
      final invoice = result['invoice'] as Invoice;

      setState(() {
        _totalAmountController.text = invoice.totalAmount!.toString();
        _selectedDate = DateTime.parse(invoice.invoiceDate);
        // Find and set the party
        final partyProvider = Provider.of<PartyProvider>(context, listen: false);
        _selectedParty = partyProvider.parties.firstWhere(
          (p) => p.id == invoice.partyId,
          orElse: () => Party(id: invoice.partyId, name: invoice.partyName ?? ''),
        );
        _isLoading = false;
      });
    } else {
      setState(() => _isLoading = false);
      if (mounted) {
        final l10n = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(l10n.offlineBillForm_loadFailedError),
            backgroundColor: Colors.red,
          ),
        );
        Navigator.pop(context);
      }
    }
  }

  @override
  void dispose() {
    _totalAmountController.dispose();
    _amountReceivedController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadParties() async {
    final partyProvider = Provider.of<PartyProvider>(context, listen: false);
    await partyProvider.fetchParties();
  }

  Future<void> _showPartySelectionSheet() async {
    final selectedParty = await showModalBottomSheet<Party>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
      ),
      builder: (context) => const PartySelectionBottomSheet(),
    );

    if (selectedParty != null) {
      setState(() {
        _selectedParty = selectedParty;
      });
    }
  }

  Future<void> _showPaymentStatusSheet() async {
    final selectedStatus = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: Theme.of(context).cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
      ),
      builder: (context) => PaymentStatusBottomSheet(currentStatus: _paymentStatus),
    );

    if (selectedStatus != null) {
      setState(() {
        _paymentStatus = selectedStatus;
        // Clear amount received if not partial
        if (_paymentStatus != 'Partial') {
          _amountReceivedController.clear();
        }
      });
    }
  }

  String _getPaymentStatusLabel(BuildContext context, String status) {
    final l10n = AppLocalizations.of(context)!;
    switch (status) {
      case 'Pending':
        return l10n.dashboard_pending;
      case 'Partial':
        return l10n.dashboard_partial;
      case 'Paid':
        return l10n.dashboard_paid;
      default:
        return status;
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedParty == null) {
      final l10n = AppLocalizations.of(context)!;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10n.offlineBillForm_selectPartyError),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final amount = double.tryParse(_totalAmountController.text) ?? 0;
    if (amount <= 0) {
      final l10n = AppLocalizations.of(context)!;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10n.offlineBillForm_totalAmountMustBeGreaterThanZero),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final invoiceProvider = Provider.of<InvoiceProvider>(context, listen: false);

    if (_isEditMode) {
      // Update existing offline invoice (only party, amount, date - payments managed separately)
      try {
        // Update invoice
        await SupabaseConfig.client.from('invoices').update({
          'party_id': _selectedParty!.id!,
          'party_name': _selectedParty!.name,
          'invoice_date': DateFormat('yyyy-MM-dd').format(_selectedDate),
          'total_amount': amount,
        }).eq('id', widget.invoiceId!);

        // Refresh invoices
        await invoiceProvider.fetchInvoices();

        setState(() => _isLoading = false);

        if (!mounted) return;

        final l10n = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(l10n.offlineBillForm_updateSuccess),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
        Navigator.pop(context, true);
      } catch (e) {
        setState(() => _isLoading = false);

        if (!mounted) return;

        final l10n = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${l10n.offlineBillForm_updateFailed}: ${e.toString()}'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } else {
      // Calculate amount received based on payment status
      double amountReceived = 0;
      if (_paymentStatus == 'Paid') {
        amountReceived = amount;
      } else if (_paymentStatus == 'Partial') {
        amountReceived = double.tryParse(_amountReceivedController.text) ?? 0;
        if (amountReceived <= 0 || amountReceived >= amount) {
          setState(() => _isLoading = false);
          final l10n = AppLocalizations.of(context)!;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(l10n.offlineBillForm_partialPaymentValidation),
              backgroundColor: Colors.red,
              behavior: SnackBarBehavior.floating,
            ),
          );
          return;
        }
      }
      // For 'Pending', amountReceived = 0

      // Create new offline invoice
      final result = await invoiceProvider.createQuickInvoice(
        partyId: _selectedParty!.id!,
        partyName: _selectedParty!.name,
        invoiceDate: DateFormat('yyyy-MM-dd').format(_selectedDate),
        totalAmount: amount,
        amountReceived: amountReceived,
        notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
      );

      setState(() => _isLoading = false);

      if (!mounted) return;

      final l10n = AppLocalizations.of(context)!;
      if (result?['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${l10n.offlineBillForm_billText} ${result?['invoice_number'] ?? ''} ${l10n.offlineBillForm_createdSuccessfully}'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
        Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${l10n.offlineBillForm_createFailed}: ${result?['error'] ?? l10n.offlineBillForm_unknownError}'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text(_isEditMode ? l10n.offlineBillForm_editTitle : l10n.offlineBill_title),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Party Selection
                    InkWell(
                      onTap: _showPartySelectionSheet,
                      borderRadius: BorderRadius.circular(12),
                      child: InputDecorator(
                        decoration: InputDecoration(
                          labelText: l10n.invoices_party,
                          hintText: l10n.invoices_selectParty,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                          prefixIcon: const Icon(Icons.person_outline),
                          suffixIcon: const Icon(Icons.arrow_drop_down),
                        ),
                        child: _selectedParty != null
                            ? Text(
                                _selectedParty!.name,
                                style: const TextStyle(fontSize: 16),
                              )
                            : Text(
                                l10n.invoices_selectParty,
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Theme.of(context).hintColor,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Total Amount
                    TextFormField(
                      controller: _totalAmountController,
                      decoration: InputDecoration(
                        labelText: l10n.offlineBill_totalAmount,
                        hintText: l10n.offlineBill_enterTotalAmount,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        prefixIcon: const Icon(Icons.currency_rupee),
                      ),
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d*')),
                      ],
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return l10n.offlineBillForm_totalAmountRequired;
                        }
                        final amount = double.tryParse(value);
                        if (amount == null || amount <= 0) {
                          return l10n.offlineBillForm_amountGreaterThanZero;
                        }
                        return null;
                      },
                      textInputAction: TextInputAction.next,
                    ),
                    const SizedBox(height: 16),

                    // Invoice Date
                    InkWell(
                      onTap: () async {
                        final date = await showAppDatePicker(
                          context: context,
                          initialDate: _selectedDate,
                          firstDate: DateTime(2020),
                          lastDate: DateTime(2030),
                        );
                        if (date != null) {
                          setState(() => _selectedDate = date);
                        }
                      },
                      borderRadius: BorderRadius.circular(12),
                      child: InputDecorator(
                        decoration: InputDecoration(
                          labelText: l10n.offlineBill_invoiceDate,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                          prefixIcon: const Icon(Icons.calendar_today_outlined),
                        ),
                        child: Text(
                          DateFormat('dd/MM/yyyy').format(_selectedDate),
                          style: const TextStyle(fontSize: 16),
                        ),
                      ),
                    ),

                    // Hide payment and notes fields in edit mode
                    if (!_isEditMode) ...[
                      const SizedBox(height: 16),

                      // Payment Status
                      InkWell(
                        onTap: _showPaymentStatusSheet,
                        borderRadius: BorderRadius.circular(12),
                        child: InputDecorator(
                          decoration: InputDecoration(
                            labelText: l10n.offlineBill_paymentStatus,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                            prefixIcon: const Icon(Icons.payment_outlined),
                            suffixIcon: const Icon(Icons.arrow_drop_down),
                          ),
                          child: Text(
                            _getPaymentStatusLabel(context, _paymentStatus),
                            style: const TextStyle(fontSize: 16),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Amount Received (only show for Partial)
                      if (_paymentStatus == 'Partial') ...[
                        TextFormField(
                          controller: _amountReceivedController,
                          decoration: InputDecoration(
                            labelText: l10n.offlineBill_amountReceived,
                            hintText: l10n.offlineBill_enterAmountReceived,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                            prefixIcon: const Icon(Icons.currency_rupee),
                          ),
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          inputFormatters: [
                            FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d*')),
                          ],
                          validator: (value) {
                            if (_paymentStatus == 'Partial') {
                              if (value == null || value.isEmpty) {
                                return l10n.offlineBillForm_amountReceivedRequired;
                              }
                              final received = double.tryParse(value);
                              if (received == null || received <= 0) {
                                return l10n.offlineBillForm_amountMustBeGreaterThanZero;
                              }
                            }
                            return null;
                          },
                          textInputAction: TextInputAction.next,
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Notes (Optional)
                      TextFormField(
                        controller: _notesController,
                        decoration: InputDecoration(
                          labelText: l10n.offlineBillForm_notesOptional,
                          hintText: l10n.offlineBillForm_addNotesHint,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          contentPadding: const EdgeInsets.all(16),
                          alignLabelWithHint: true,
                        ),
                        maxLines: 3,
                        textAlignVertical: TextAlignVertical.top,
                        textCapitalization: TextCapitalization.sentences,
                        textInputAction: TextInputAction.done,
                      ),
                    ],
                  ],
                ),
              ),
            ),

            // Bottom Button
            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : Text(
                          _isEditMode ? l10n.offlineBillForm_updateButton : l10n.offlineBillForm_createButton,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Party Selection Bottom Sheet
class PartySelectionBottomSheet extends StatefulWidget {
  const PartySelectionBottomSheet({Key? key}) : super(key: key);

  @override
  State<PartySelectionBottomSheet> createState() => _PartySelectionBottomSheetState();
}

class _PartySelectionBottomSheetState extends State<PartySelectionBottomSheet> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return StatefulBuilder(
      builder: (context, setBottomSheetState) {
        final partyProvider = Provider.of<PartyProvider>(context);
        final parties = partyProvider.parties;
        final filteredParties = parties.where((party) {
          return party.name.toLowerCase().contains(_searchQuery.toLowerCase());
        }).toList();

        return DraggableScrollableSheet(
          initialChildSize: 0.9,
          minChildSize: 0.5,
          maxChildSize: 0.95,
          expand: false,
          builder: (context, scrollController) {
            return Container(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        l10n.invoices_selectParty,
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Search Field
                  TextField(
                    decoration: InputDecoration(
                      hintText: l10n.offlineBillForm_searchPartiesHint,
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: ThemeHelpers.borderColor(context), width: 1),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: ThemeHelpers.borderColor(context), width: 1),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Theme.of(context).colorScheme.primary, width: 1),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                    onChanged: (value) {
                      setBottomSheetState(() {
                        _searchQuery = value;
                      });
                    },
                  ),
                  const SizedBox(height: 16),

                  // Party List
                  Expanded(
                    child: filteredParties.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.search_off,
                                  size: 64,
                                  color: ThemeHelpers.mutedTextColor(context),
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  l10n.offlineBillForm_noPartiesFound,
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: ThemeHelpers.mutedTextColor(context),
                                  ),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            controller: scrollController,
                            itemCount: filteredParties.length,
                            itemBuilder: (context, index) {
                              final party = filteredParties[index];
                              return Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                decoration: BoxDecoration(
                                  color: Theme.of(context).cardColor,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: ThemeHelpers.borderColor(context)),
                                ),
                                child: InkWell(
                                  onTap: () {
                                    Navigator.pop(context, party);
                                  },
                                  borderRadius: BorderRadius.circular(12),
                                  child: Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          party.name,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w500,
                                            fontSize: 16,
                                          ),
                                        ),
                                        if (party.phone != null) ...[
                                          const SizedBox(height: 4),
                                          Text(
                                            '${l10n.parties_phone}: ${party.phone}',
                                            style: TextStyle(
                                              fontSize: 13,
                                              color: ThemeHelpers.mutedTextColor(context),
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

// Payment Status Bottom Sheet
class PaymentStatusBottomSheet extends StatelessWidget {
  final String currentStatus;

  const PaymentStatusBottomSheet({
    Key? key,
    required this.currentStatus,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final statuses = [
      {'value': 'Pending', 'label': l10n.dashboard_pending, 'color': Colors.red},
      {'value': 'Partial', 'label': l10n.dashboard_partial, 'color': Colors.orange},
      {'value': 'Paid', 'label': l10n.dashboard_paid, 'color': Colors.green},
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                l10n.offlineBill_paymentStatus,
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Status Options
          ...statuses.map((status) {
            final isSelected = status['value'] == currentStatus;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isSelected
                      ? Theme.of(context).colorScheme.primary
                      : ThemeHelpers.borderColor(context),
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: InkWell(
                onTap: () {
                  Navigator.pop(context, status['value']);
                },
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: status['color'] as Color,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        status['label'] as String,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                        ),
                      ),
                      const Spacer(),
                      if (isSelected)
                        Icon(
                          Icons.check_circle_outline,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                    ],
                  ),
                ),
              ),
            );
          }),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
