import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../models/party.dart';
import '../../models/item.dart';
import '../../models/item_party_price.dart';
import '../../models/invoice_item.dart';
import '../../providers/party_provider.dart';
import '../../providers/item_provider.dart';
import '../../providers/invoice_provider.dart';
import '../../providers/unit_provider.dart';
import '../../utils/unit_conversions.dart';
import '../../services/app_settings_service.dart';
import '../parties/add_edit_party_screen.dart';
import '../items/add_edit_item_screen.dart';

class CreateInvoiceScreen extends StatefulWidget {
  const CreateInvoiceScreen({Key? key}) : super(key: key);

  @override
  State<CreateInvoiceScreen> createState() => _CreateInvoiceScreenState();
}

class _CreateInvoiceScreenState extends State<CreateInvoiceScreen> {
  int _currentStep = 0;
  Party? _selectedParty;
  final List<InvoiceItem> _invoiceItems = [];
  DateTime _selectedDate = DateTime.now();
  double _bundleCharge = 150.0; // Default: 1 * 150
  double _bundleRate = 150.0;
  double _bundleQuantity = 1.0;
  bool _isLoading = false;
  String _partySearchQuery = '';
  final _bundleQtyController = TextEditingController();
  final _bundleRateController = TextEditingController();
  final _appSettingsService = AppSettingsService();

  // Helper to format quantity without unnecessary decimals
  String _formatQuantity(double quantity) {
    if (quantity == quantity.toInt()) {
      return quantity.toInt().toString();
    }
    return quantity.toString();
  }

  // Helper to format numbers (rates, totals) without unnecessary decimals
  String _formatNumber(double number) {
    if (number == number.toInt()) {
      return number.toInt().toString();
    }
    // Show 2 decimal places if has decimals
    return number.toStringAsFixed(2);
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  @override
  void dispose() {
    _bundleQtyController.dispose();
    _bundleRateController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final partyProvider = Provider.of<PartyProvider>(context, listen: false);
    final itemProvider = Provider.of<ItemProvider>(context, listen: false);
    final unitProvider = Provider.of<UnitProvider>(context, listen: false);
    await Future.wait([
      partyProvider.fetchParties(),
      itemProvider.fetchItems(),
      unitProvider.fetchUnits(),
    ]);
  }

  Future<void> _loadBundleDefaults() async {
    // Get bundle rate: party-specific > default from settings
    double defaultRate = await _appSettingsService.getDefaultBundleRate();
    double? partyRate = _selectedParty?.bundleRate;
    // Use party rate if it exists and is not 0, otherwise use default
    double bundleRate = (partyRate != null && partyRate > 0) ? partyRate : defaultRate;

    setState(() {
      _bundleRate = bundleRate;
      _bundleQuantity = 1.0;
      _bundleCharge = bundleRate * 1.0;
      _bundleQtyController.text = '1';
      _bundleRateController.text = _formatNumber(bundleRate);
    });
  }

  double get _subTotal {
    return _invoiceItems.fold(0, (sum, item) => sum + item.total);
  }

  double get _grandTotal {
    return _subTotal + _bundleCharge;
  }

  void _calculateBundleCharge() {
    if (_bundleRate != null && _bundleQuantity != null) {
      setState(() {
        _bundleCharge = _bundleRate! * _bundleQuantity!;
      });
    }
  }

  Future<void> _saveInvoice() async {
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

    if (_invoiceItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please add at least one item'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final invoiceProvider = Provider.of<InvoiceProvider>(context, listen: false);
    final result = await invoiceProvider.createInvoice(
      partyId: _selectedParty!.id!,
      partyName: _selectedParty!.name,
      invoiceDate: DateFormat('yyyy-MM-dd').format(_selectedDate),
      items: _invoiceItems,
      bundleCharge: _bundleCharge,
      bundleRate: _bundleRate,
      bundleQuantity: _bundleQuantity?.toInt(),
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

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      behavior: HitTestBehavior.opaque,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Create Bill'),
          backgroundColor: Colors.white,
          elevation: 0,
        ),
        body: Stepper(
        type: StepperType.horizontal,
        currentStep: _currentStep,
        onStepContinue: () async {
          if (_currentStep == 0 && _selectedParty == null) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Please select a party'),
                backgroundColor: Colors.red,
                behavior: SnackBarBehavior.floating,
              ),
            );
            return;
          }
          if (_currentStep == 1 && _invoiceItems.isEmpty) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Please add at least one item'),
                backgroundColor: Colors.red,
                behavior: SnackBarBehavior.floating,
              ),
            );
            return;
          }
          if (_currentStep < 2) {
            // Load bundle defaults when moving from step 1 to step 2
            if (_currentStep == 1) {
              await _loadBundleDefaults();
            }
            setState(() => _currentStep++);
          } else {
            _saveInvoice();
          }
        },
        onStepCancel: () {
          if (_currentStep > 0) {
            setState(() => _currentStep--);
          }
        },
        controlsBuilder: (context, details) {
          // Hide controls for step 0 (we have custom Continue button)
          if (_currentStep == 0) {
            return const SizedBox.shrink();
          }

          final canContinue = () {
            if (_isLoading) return false;
            if (_currentStep == 1 && _invoiceItems.isEmpty) return false;
            return true;
          }();

          return Padding(
            padding: const EdgeInsets.only(top: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                FilledButton(
                  onPressed: canContinue ? details.onStepContinue : null,
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: Text(_currentStep == 2 ? 'Create Bill' : 'Continue'),
                ),
                if (_currentStep > 0) ...[
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: _isLoading ? null : details.onStepCancel,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text('Back'),
                  ),
                ],
              ],
            ),
          );
        },
        steps: [
          Step(
            title: const Text('Details'),
            content: _buildPartyStep(),
            isActive: _currentStep >= 0,
            state: _currentStep > 0 ? StepState.complete : StepState.indexed,
          ),
          Step(
            title: const Text('Items'),
            content: _buildItemsStep(),
            isActive: _currentStep >= 1,
            state: _currentStep > 1 ? StepState.complete : StepState.indexed,
          ),
          Step(
            title: const Text('Bundle'),
            content: _buildReviewStep(),
            isActive: _currentStep >= 2,
          ),
        ],
        ),
      ),
    );
  }

  Widget _buildPartyStep() {
    final partyProvider = Provider.of<PartyProvider>(context);
    final parties = partyProvider.parties;
    final filteredParties = parties.where((party) {
      return party.name.toLowerCase().contains(_partySearchQuery.toLowerCase());
    }).toList();

    return SizedBox(
      height: 600,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Date Selection
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade300),
            ),
            child: InkWell(
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: _selectedDate,
                  firstDate: DateTime(2020),
                  lastDate: DateTime(2030),
                  builder: (context, child) {
                    return Theme(
                      data: Theme.of(context).copyWith(
                        colorScheme: ColorScheme.light(
                          primary: Theme.of(context).colorScheme.primary,
                          onPrimary: Colors.white,
                          surface: Colors.white,
                          onSurface: Colors.black,
                        ),
                        dialogBackgroundColor: Colors.white,
                        dialogTheme: const DialogTheme(
                          backgroundColor: Colors.white,
                          elevation: 2,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.all(Radius.circular(8)),
                          ),
                        ),
                        dividerColor: Colors.grey.shade100,
                        dividerTheme: DividerThemeData(
                          color: Colors.grey.shade100,
                          thickness: 1,
                          space: 1,
                        ),
                      ),
                      child: child!,
                    );
                  },
                );
                if (date != null) {
                  setState(() => _selectedDate = date);
                }
              },
              child: Row(
                children: [
                  Icon(Icons.calendar_today, size: 20, color: Colors.grey.shade600),
                  const SizedBox(width: 12),
                  const Text(
                    'Bill Date:',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                  ),
                  const Spacer(),
                  Text(
                    DateFormat('dd/MM/yyyy').format(_selectedDate),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(Icons.edit, size: 16, color: Colors.grey.shade600),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          const Text(
            'Select Party',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
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
              setState(() {
                _partySearchQuery = value;
              });
            },
          ),
          const SizedBox(height: 16),

          // Party List
          Expanded(
            child: filteredParties.isEmpty
                ? const Center(child: Text('No parties available'))
                : ListView.builder(
                    itemCount: filteredParties.length,
                    itemBuilder: (context, index) {
                      final party = filteredParties[index];
                      final isSelected = _selectedParty?.id == party.id;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? Theme.of(context).colorScheme.primary.withOpacity(0.05)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected
                                ? Theme.of(context).colorScheme.primary
                                : Colors.grey.shade300,
                            width: 1,
                          ),
                        ),
                        child: InkWell(
                          onTap: () {
                            setState(() {
                              _selectedParty = party;
                            });
                          },
                          borderRadius: BorderRadius.circular(12),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        party.name,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.normal,
                                          fontSize: 16,
                                        ),
                                      ),
                                      if (party.bundleRate != null && party.bundleRate! > 0) ...[
                                        const SizedBox(height: 4),
                                        Text(
                                          'Bundle Rate: ₹${_formatNumber(party.bundleRate!)}',
                                          style: TextStyle(
                                            fontSize: 13,
                                            color: Colors.grey.shade600,
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
          const SizedBox(height: 16),

          // Continue Button
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _selectedParty == null ? null : () {
                setState(() => _currentStep = 1);
              },
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text('Continue'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItemsStep() {
    final itemProvider = Provider.of<ItemProvider>(context);
    final items = itemProvider.items;

    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.575,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Sticky Header with Title and Add Button
          const Text(
            'Add Items',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),

          // Add Item Button (Sticky)
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: () => _showAddItemDialog(items),
              icon: const Icon(Icons.add, size: 20),
              label: const Text('Add Item'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Scrollable Invoice Items List
          Expanded(
            child: _invoiceItems.isEmpty
                ? const Text('No items added yet')
                : SingleChildScrollView(
                    child: ReorderableListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      padding: EdgeInsets.zero,
                      itemCount: _invoiceItems.length,
                      proxyDecorator: (child, index, animation) {
                        return Material(
                          elevation: 0,
                          color: Colors.transparent,
                          child: child,
                        );
                      },
                      onReorder: (oldIndex, newIndex) {
                        setState(() {
                          if (newIndex > oldIndex) newIndex--;
                          final item = _invoiceItems.removeAt(oldIndex);
                          _invoiceItems.insert(newIndex, item);
                        });
                      },
                      itemBuilder: (context, index) {
                        final invoiceItem = _invoiceItems[index];
                        return Dismissible(
                          key: Key('invoice-item-${invoiceItem.itemId}-$index'),
                          direction: DismissDirection.endToStart,
                          background: Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            alignment: Alignment.centerRight,
                            padding: const EdgeInsets.only(right: 20),
                            decoration: BoxDecoration(
                              color: Colors.red,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.delete, color: Colors.white),
                          ),
                          confirmDismiss: (direction) async {
                            if (direction == DismissDirection.endToStart) {
                              return true;
                            }
                            return false;
                          },
                          onDismissed: (direction) {
                            setState(() => _invoiceItems.removeAt(index));
                          },
                          child: Container(
                            key: ValueKey('container-${invoiceItem.itemId}-$index'),
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.grey.shade300),
                            ),
                            child: InkWell(
                              onTap: () => _showEditItemDialog(index),
                              borderRadius: BorderRadius.circular(12),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          invoiceItem.itemName ?? 'Item #${invoiceItem.itemId}',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 15,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'Qty: ${_formatQuantity(invoiceItem.quantity)} ${invoiceItem.itemUnit ?? ''} × ₹${_formatNumber(invoiceItem.rate)}',
                                          style: TextStyle(
                                            color: Colors.grey.shade700,
                                            fontSize: 13,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        '₹${_formatNumber(invoiceItem.total)}',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                          color: Theme.of(context).colorScheme.primary,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Icon(Icons.drag_handle, size: 20, color: Colors.grey.shade400),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Bill Details (Date + Party)
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Bill Date',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                DateFormat('dd/MM/yyyy').format(_selectedDate),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Party',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                _selectedParty?.name ?? 'Unknown',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Items Summary
        const Text(
          'Items',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),

        if (_invoiceItems.isEmpty)
          const Text('No items added')
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _invoiceItems.length,
            itemBuilder: (context, index) {
              final invoiceItem = _invoiceItems[index];
              final isLastItem = index == _invoiceItems.length - 1;
              return Container(
                margin: EdgeInsets.only(bottom: isLastItem ? 0 : 12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            invoiceItem.itemName ?? 'Item #${invoiceItem.itemId}',
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 15,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Qty: ${_formatQuantity(invoiceItem.quantity)} ${invoiceItem.itemUnit ?? ''} × ₹${_formatNumber(invoiceItem.rate)}',
                            style: TextStyle(
                              color: Colors.grey.shade700,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      '₹${_formatNumber(invoiceItem.total)}',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        // Totals
        Transform.translate(
          offset: const Offset(0, -12),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
            color: Colors.grey.shade100,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Sub-Total', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  Text(
                    '₹${_formatNumber(_subTotal)}',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              const Divider(height: 24),
              // Bundle Inputs
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Bundle Qty', style: TextStyle(fontSize: 15)),
                  SizedBox(
                    width: 100,
                    child: TextField(
                      controller: _bundleQtyController,
                      keyboardType: TextInputType.number,
                      textAlign: TextAlign.right,
                      decoration: InputDecoration(
                        hintText: '1',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: Colors.grey.shade300, width: 1),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: Colors.grey.shade300, width: 1),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: Theme.of(context).colorScheme.primary, width: 1),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        isDense: true,
                      ),
                      onChanged: (value) {
                        setState(() {
                          _bundleQuantity = double.tryParse(value) ?? 1;
                          _bundleCharge = _bundleRate * _bundleQuantity;
                        });
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Bundle Rate', style: TextStyle(fontSize: 15)),
                  SizedBox(
                    width: 100,
                    child: TextField(
                      controller: _bundleRateController,
                      keyboardType: TextInputType.number,
                      textAlign: TextAlign.right,
                      decoration: InputDecoration(
                        hintText: '150',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: Colors.grey.shade300, width: 1),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: Colors.grey.shade300, width: 1),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: Theme.of(context).colorScheme.primary, width: 1),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        isDense: true,
                      ),
                      onChanged: (value) {
                        setState(() {
                          _bundleRate = double.tryParse(value) ?? 150;
                          _bundleCharge = _bundleRate * _bundleQuantity;
                        });
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Total Bundle Charge', style: TextStyle(fontSize: 15)),
                  Text(
                    '₹${_formatNumber(_bundleCharge)}',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              const Divider(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Grand Total:',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    '₹${_formatNumber(_grandTotal)}',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                ],
              ),
            ],
          ),
          ),
        ),
      ],
    );
  }

  void _showAddItemDialog(List<Item> items) {
    String searchQuery = '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFFF5F5F5),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setBottomSheetState) {
            // Filter out already added items
            final addedItemIds = _invoiceItems.map((e) => e.itemId).toSet();
            final availableItems = items.where((item) {
              return !addedItemIds.contains(item.id);
            }).toList();
            final filteredItems = availableItems.where((item) {
              return item.name.toLowerCase().contains(searchQuery.toLowerCase());
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
                            'Select Item',
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
                          hintText: 'Search items...',
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
                            searchQuery = value;
                          });
                        },
                      ),
                      const SizedBox(height: 16),

                      // Items List
                      Expanded(
                        child: filteredItems.isEmpty
                            ? const Center(child: Text('No items found'))
                            : ListView.builder(
                                controller: scrollController,
                                itemCount: filteredItems.length,
                                itemBuilder: (context, index) {
                                  final item = filteredItems[index];
                                  return Container(
                                    margin: const EdgeInsets.only(bottom: 8),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: Colors.grey.shade300),
                                    ),
                                    child: InkWell(
                                      onTap: () {
                                        Navigator.pop(context);
                                        _showQuantityDialog(item);
                                      },
                                      borderRadius: BorderRadius.circular(12),
                                      child: Padding(
                                        padding: const EdgeInsets.all(16),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              item.name,
                                              style: const TextStyle(
                                                fontWeight: FontWeight.w500,
                                                fontSize: 16,
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              'Rate: ₹${_formatNumber(item.defaultRate)}${item.unit?.name != null ? ' per ${item.unit!.name}' : ''}',
                                              style: TextStyle(
                                                fontSize: 13,
                                                color: Colors.grey.shade600,
                                              ),
                                            ),
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
      },
    );
  }

  void _showQuantityDialog(Item item) {
    final unitProvider = Provider.of<UnitProvider>(context, listen: false);
    final units = unitProvider.units;

    double? quantity;
    double rate = item.defaultRate;
    String? selectedUnit = item.unit?.name;

    // Auto-populate rate with party-specific pricing
    if (_selectedParty != null) {
      final partyPrice = item.itemPartyPrices?.firstWhere(
        (pp) => pp.partyId == _selectedParty!.id,
        orElse: () => ItemPartyPrice(
          itemId: item.id!,
          partyId: _selectedParty!.id!,
          price: item.defaultRate,
        ),
      );
      rate = partyPrice?.price ?? item.defaultRate;
    }

    // Store original values for unit conversion
    final originalRate = rate;
    final originalUnit = selectedUnit;

    final quantityController = TextEditingController();
    final rateController = TextEditingController(text: _formatNumber(rate));

    bool hasError = false;
    String errorMessage = '';

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return Dialog(
              backgroundColor: const Color(0xFFF5F5F5),
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.name,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 24),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        TextField(
                          controller: quantityController,
                          decoration: InputDecoration(
                            labelText: 'Quantity',
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: UnderlineInputBorder(
                              borderSide: BorderSide(
                                color: hasError ? Colors.red : Theme.of(context).colorScheme.primary,
                                width: 2,
                              ),
                            ),
                            contentPadding: const EdgeInsets.symmetric(vertical: 8),
                          ),
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          autofocus: true,
                          onChanged: (value) {
                            quantity = double.tryParse(value);
                            setDialogState(() {});
                          },
                        ),
                        if (hasError) ...[
                          const SizedBox(height: 4),
                          Text(
                            errorMessage,
                            style: const TextStyle(
                              color: Colors.red,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 20),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Unit',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade700,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: units.map((unit) {
                            final isSelected = selectedUnit == unit.name;
                            return GestureDetector(
                              onTap: () {
                                if (originalUnit != null && unit.name != selectedUnit) {
                                  // Convert rate from original unit to new unit
                                  final convertedRate = convertRate(originalRate, originalUnit, unit.name);
                                  rate = convertedRate;
                                  rateController.text = _formatNumber(convertedRate);
                                }
                                setDialogState(() {
                                  selectedUnit = unit.name;
                                });
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                decoration: BoxDecoration(
                                  color: isSelected ? Theme.of(context).colorScheme.primary : Colors.grey.shade100,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: isSelected ? Theme.of(context).colorScheme.primary : Colors.grey.shade300,
                                    width: 1.5,
                                  ),
                                ),
                                child: Text(
                                  unit.name,
                                  style: TextStyle(
                                    color: isSelected ? Colors.white : Colors.grey.shade800,
                                    fontSize: 14,
                                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    TextField(
                      controller: rateController,
                      decoration: InputDecoration(
                        labelText: 'Rate',
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: UnderlineInputBorder(
                          borderSide: BorderSide(color: Theme.of(context).colorScheme.primary, width: 2),
                        ),
                        contentPadding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      onChanged: (value) {
                        final parsed = double.tryParse(value);
                        if (parsed != null) rate = parsed;
                      },
                    ),
                    const SizedBox(height: 32),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text('Cancel'),
                        ),
                        const SizedBox(width: 12),
                        FilledButton(
                          onPressed: () {
                            // Validate quantity
                            if (quantity == null || quantity! <= 0) {
                              setDialogState(() {
                                hasError = true;
                                errorMessage = 'Please enter a valid quantity greater than 0';
                              });
                              return;
                            }

                            setState(() {
                              _invoiceItems.add(InvoiceItem(
                                itemId: item.id!,
                                itemName: item.name,
                                itemUnit: selectedUnit,
                                quantity: quantity!,
                                rate: rate,
                              ));
                            });
                            Navigator.pop(context);
                          },
                          child: const Text('Add'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showEditItemDialog(int index) {
    final invoiceItem = _invoiceItems[index];
    final unitProvider = Provider.of<UnitProvider>(context, listen: false);
    final units = unitProvider.units;

    double quantity = invoiceItem.quantity;
    double rate = invoiceItem.rate;
    String? selectedUnit = invoiceItem.itemUnit;

    // Store original values for unit conversion
    final originalRate = rate;
    final originalUnit = selectedUnit;

    final quantityController = TextEditingController(text: quantity.toString());
    final rateController = TextEditingController(text: _formatNumber(rate));

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return Dialog(
              backgroundColor: const Color(0xFFF5F5F5),
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      invoiceItem.itemName ?? 'Edit Item',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 24),
                    TextField(
                      controller: quantityController,
                      decoration: InputDecoration(
                        labelText: 'Quantity',
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: UnderlineInputBorder(
                          borderSide: BorderSide(color: Theme.of(context).colorScheme.primary, width: 2),
                        ),
                        contentPadding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      autofocus: true,
                      onChanged: (value) {
                        final parsed = double.tryParse(value);
                        if (parsed != null) quantity = parsed;
                      },
                    ),
                    const SizedBox(height: 20),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Unit',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade700,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: units.map((unit) {
                            final isSelected = selectedUnit == unit.name;
                            return GestureDetector(
                              onTap: () {
                                if (originalUnit != null && unit.name != selectedUnit) {
                                  // Convert rate from original unit to new unit
                                  final convertedRate = convertRate(originalRate, originalUnit, unit.name);
                                  rate = convertedRate;
                                  rateController.text = _formatNumber(convertedRate);
                                }
                                setDialogState(() {
                                  selectedUnit = unit.name;
                                });
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                decoration: BoxDecoration(
                                  color: isSelected ? Theme.of(context).colorScheme.primary : Colors.grey.shade100,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: isSelected ? Theme.of(context).colorScheme.primary : Colors.grey.shade300,
                                    width: 1.5,
                                  ),
                                ),
                                child: Text(
                                  unit.name,
                                  style: TextStyle(
                                    color: isSelected ? Colors.white : Colors.grey.shade800,
                                    fontSize: 14,
                                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    TextField(
                      controller: rateController,
                      decoration: InputDecoration(
                        labelText: 'Rate',
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: UnderlineInputBorder(
                          borderSide: BorderSide(color: Theme.of(context).colorScheme.primary, width: 2),
                        ),
                        contentPadding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      onChanged: (value) {
                        final parsed = double.tryParse(value);
                        if (parsed != null) rate = parsed;
                      },
                    ),
                    const SizedBox(height: 32),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text('Cancel'),
                        ),
                        const SizedBox(width: 12),
                        FilledButton(
                          onPressed: () {
                            // Validate quantity
                            if (quantity <= 0) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Please enter a valid quantity greater than 0'),
                                  backgroundColor: Colors.red,
                                  behavior: SnackBarBehavior.floating,
                                ),
                              );
                              return;
                            }

                            setState(() {
                              _invoiceItems[index] = InvoiceItem(
                                itemId: invoiceItem.itemId,
                                itemName: invoiceItem.itemName,
                                itemUnit: selectedUnit,
                                quantity: quantity,
                                rate: rate,
                              );
                            });
                            Navigator.pop(context);
                          },
                          child: const Text('Save'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}
