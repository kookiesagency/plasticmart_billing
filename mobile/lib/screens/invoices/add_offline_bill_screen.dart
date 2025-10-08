import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../models/party.dart';
import '../../models/invoice.dart';
import '../../providers/party_provider.dart';
import '../../providers/invoice_provider.dart';
import '../../utils/date_picker_theme.dart';
import '../../config/supabase_config.dart';

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
      backgroundColor: Colors.white,
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
      backgroundColor: Colors.white,
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

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedParty == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a party'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final amount = double.tryParse(_totalAmountController.text) ?? 0;
    if (amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Total amount must be greater than 0'),
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

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Offline bill updated successfully'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
        Navigator.pop(context, true);
      } catch (e) {
        setState(() => _isLoading = false);

        if (!mounted) return;

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update bill: ${e.toString()}'),
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
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Partial payment must be greater than 0 and less than total amount'),
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

      if (result?['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Bill ${result?['invoice_number'] ?? ''} created successfully'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
        Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to create bill: ${result?['error'] ?? 'Unknown error'}'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(_isEditMode ? 'Edit Offline Bill' : 'Add Offline Bill'),
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
                          labelText: 'Party',
                          hintText: 'Select party',
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
                                'Select party',
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
                        labelText: 'Total Amount',
                        hintText: 'Enter amount',
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
                          return 'Please enter total amount';
                        }
                        final amount = double.tryParse(value);
                        if (amount == null || amount <= 0) {
                          return 'Amount must be greater than 0';
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
                          labelText: 'Invoice Date',
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
                            labelText: 'Payment Status',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                            prefixIcon: const Icon(Icons.payment_outlined),
                            suffixIcon: const Icon(Icons.arrow_drop_down),
                          ),
                          child: Text(
                            _paymentStatus,
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
                            labelText: 'Amount Received',
                            hintText: 'Enter amount received',
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
                                return 'Please enter amount received';
                              }
                              final received = double.tryParse(value);
                              if (received == null || received <= 0) {
                                return 'Amount must be greater than 0';
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
                          labelText: 'Notes (Optional)',
                          hintText: 'Add any additional notes...',
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
                          _isEditMode ? 'Update Bill' : 'Create Bill',
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
                      const Text(
                        'Select Party',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
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
                      hintText: 'Search parties...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.grey.shade300, width: 1),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.grey.shade300, width: 1),
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
                                  color: Colors.grey.shade400,
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'No parties found',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.grey.shade600,
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
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.grey.shade300),
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
                                            'Phone: ${party.phone}',
                                            style: TextStyle(
                                              fontSize: 13,
                                              color: Colors.grey.shade600,
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
    final statuses = [
      {'label': 'Pending', 'color': Colors.red},
      {'label': 'Partial', 'color': Colors.orange},
      {'label': 'Paid', 'color': Colors.green},
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
              const Text(
                'Payment Status',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
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
            final isSelected = status['label'] == currentStatus;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isSelected
                      ? Theme.of(context).colorScheme.primary
                      : Colors.grey.shade300,
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: InkWell(
                onTap: () {
                  Navigator.pop(context, status['label']);
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
