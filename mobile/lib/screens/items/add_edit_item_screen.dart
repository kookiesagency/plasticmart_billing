import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/item.dart';
import '../../models/unit.dart';
import '../../models/party.dart';
import '../../models/item_party_price.dart';
import '../../providers/item_provider.dart';
import '../../providers/unit_provider.dart';
import '../../providers/party_provider.dart';

class AddEditItemScreen extends StatefulWidget {
  final Item? item;

  const AddEditItemScreen({Key? key, this.item}) : super(key: key);

  @override
  State<AddEditItemScreen> createState() => _AddEditItemScreenState();
}

class _PartyPriceEntry {
  final Party party;
  final TextEditingController priceController;

  _PartyPriceEntry({required this.party, double? price})
      : priceController = TextEditingController(text: price != null ? price.toString() : '');

  void dispose() {
    priceController.dispose();
  }
}

class _AddEditItemScreenState extends State<AddEditItemScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _defaultRateController = TextEditingController();
  final _purchaseRateController = TextEditingController();

  Unit? _selectedUnit;
  Party? _selectedPurchaseParty;
  bool _isLoading = false;
  List<_PartyPriceEntry> _partyPrices = [];

  @override
  void initState() {
    super.initState();
    if (widget.item != null) {
      _nameController.text = widget.item!.name;
      _defaultRateController.text = widget.item!.defaultRate.toString();
      _purchaseRateController.text = widget.item!.purchaseRate?.toString() ?? '';

      WidgetsBinding.instance.addPostFrameCallback((_) async {
        final unitProvider = Provider.of<UnitProvider>(context, listen: false);
        final partyProvider = Provider.of<PartyProvider>(context, listen: false);
        final itemProvider = Provider.of<ItemProvider>(context, listen: false);

        setState(() {
          _selectedUnit = unitProvider.units.firstWhere(
            (u) => u.id == widget.item!.unitId,
            orElse: () => unitProvider.units.first,
          );

          if (widget.item!.purchasePartyId != null && partyProvider.parties.isNotEmpty) {
            try {
              _selectedPurchaseParty = partyProvider.parties.firstWhere(
                (p) => p.id == widget.item!.purchasePartyId,
              );
            } catch (e) {
              _selectedPurchaseParty = null;
            }
          }
        });

        // Load party prices
        if (widget.item?.id != null) {
          final partyPrices = await itemProvider.fetchItemPartyPrices(widget.item!.id!);
          setState(() {
            _partyPrices = partyPrices.map((pp) {
              final party = partyProvider.parties.firstWhere(
                (p) => p.id == pp.partyId,
                orElse: () => Party(id: pp.partyId, name: 'Unknown Party'),
              );
              return _PartyPriceEntry(party: party, price: pp.price);
            }).toList();
          });
        }
      });
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _defaultRateController.dispose();
    _purchaseRateController.dispose();
    for (var entry in _partyPrices) {
      entry.dispose();
    }
    super.dispose();
  }

  void _showUnitPicker() {
    final unitProvider = Provider.of<UnitProvider>(context, listen: false);
    String searchQuery = '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          final filteredUnits = unitProvider.units
              .where((u) => u.name.toLowerCase().contains(searchQuery.toLowerCase()))
              .toList();

          return DraggableScrollableSheet(
            initialChildSize: 0.7,
            minChildSize: 0.5,
            maxChildSize: 0.95,
            expand: false,
            builder: (context, scrollController) => Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        decoration: InputDecoration(
                          hintText: 'Search units...',
                          prefixIcon: const Icon(Icons.search),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        ),
                        onChanged: (value) {
                          setModalState(() {
                            searchQuery = value;
                          });
                        },
                        autofocus: true,
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    controller: scrollController,
                    itemCount: filteredUnits.length,
                    itemBuilder: (context, index) {
                      final unit = filteredUnits[index];
                      final isSelected = _selectedUnit?.id == unit.id;

                      return ListTile(
                        title: Text(unit.name),
                        trailing: isSelected
                            ? const Icon(Icons.check_circle, color: Colors.green)
                            : null,
                        selected: isSelected,
                        onTap: () {
                          setState(() {
                            _selectedUnit = unit;
                          });
                          Navigator.pop(context);
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showPartyPicker() {
    final partyProvider = Provider.of<PartyProvider>(context, listen: false);
    String searchQuery = '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          final filteredParties = partyProvider.parties
              .where((p) => p.name.toLowerCase().contains(searchQuery.toLowerCase()))
              .toList();

          return DraggableScrollableSheet(
            initialChildSize: 0.7,
            minChildSize: 0.5,
            maxChildSize: 0.95,
            expand: false,
            builder: (context, scrollController) => Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        decoration: InputDecoration(
                          hintText: 'Search parties...',
                          prefixIcon: const Icon(Icons.search),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        ),
                        onChanged: (value) {
                          setModalState(() {
                            searchQuery = value;
                          });
                        },
                        autofocus: true,
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    controller: scrollController,
                    itemCount: filteredParties.length + 1,
                    itemBuilder: (context, index) {
                      if (index == 0) {
                        return ListTile(
                          title: const Text('None'),
                          trailing: _selectedPurchaseParty == null
                              ? const Icon(Icons.check_circle, color: Colors.green)
                              : null,
                          selected: _selectedPurchaseParty == null,
                          onTap: () {
                            setState(() {
                              _selectedPurchaseParty = null;
                            });
                            Navigator.pop(context);
                          },
                        );
                      }

                      final party = filteredParties[index - 1];
                      final isSelected = _selectedPurchaseParty?.id == party.id;

                      return ListTile(
                        title: Text(party.name),
                        trailing: isSelected
                            ? const Icon(Icons.check_circle, color: Colors.green)
                            : null,
                        selected: isSelected,
                        onTap: () {
                          setState(() {
                            _selectedPurchaseParty = party;
                          });
                          Navigator.pop(context);
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showPartyPricesPicker() {
    final partyProvider = Provider.of<PartyProvider>(context, listen: false);
    String searchQuery = '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          // Filter out parties already in the party prices list
          final selectedPartyIds = _partyPrices.map((pp) => pp.party.id).toSet();
          final filteredParties = partyProvider.parties
              .where((p) =>
                !selectedPartyIds.contains(p.id) &&
                p.name.toLowerCase().contains(searchQuery.toLowerCase()))
              .toList();

          return DraggableScrollableSheet(
            initialChildSize: 0.7,
            minChildSize: 0.5,
            maxChildSize: 0.95,
            expand: false,
            builder: (context, scrollController) => Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        decoration: InputDecoration(
                          hintText: 'Search parties...',
                          prefixIcon: const Icon(Icons.search),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        ),
                        onChanged: (value) {
                          setModalState(() {
                            searchQuery = value;
                          });
                        },
                        autofocus: true,
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: filteredParties.isEmpty
                      ? const Center(
                          child: Text(
                            'All parties have been added',
                            style: TextStyle(color: Colors.grey),
                          ),
                        )
                      : ListView.builder(
                          controller: scrollController,
                          itemCount: filteredParties.length,
                          itemBuilder: (context, index) {
                            final party = filteredParties[index];

                            return ListTile(
                              title: Text(party.name),
                              onTap: () {
                                setState(() {
                                  _partyPrices.add(_PartyPriceEntry(party: party, price: null));
                                });
                                Navigator.pop(context);
                              },
                            );
                          },
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedUnit == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a unit'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    final itemProvider = Provider.of<ItemProvider>(context, listen: false);
    final itemName = _nameController.text.trim();

    // Check for duplicate name
    final nameExists = await itemProvider.itemNameExists(
      itemName,
      excludeId: widget.item?.id,
    );

    if (nameExists) {
      setState(() {
        _isLoading = false;
      });

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('An item with this name already exists'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final item = Item(
      id: widget.item?.id,
      name: itemName,
      defaultRate: double.parse(_defaultRateController.text.trim()),
      purchaseRate: _purchaseRateController.text.trim().isNotEmpty
          ? double.parse(_purchaseRateController.text.trim())
          : null,
      unitId: _selectedUnit!.id!,
      unit: _selectedUnit,
      purchasePartyId: _selectedPurchaseParty?.id,
    );

    // Convert to ItemPartyPrice list
    final partyPrices = _partyPrices.map((entry) {
      return ItemPartyPrice(
        itemId: widget.item?.id ?? 0,
        partyId: entry.party.id!,
        price: double.parse(entry.priceController.text.trim()),
      );
    }).toList();

    bool success;
    if (widget.item == null) {
      success = await itemProvider.createItem(item, partyPrices: partyPrices);
    } else {
      success = await itemProvider.updateItem(widget.item!.id!, item, partyPrices: partyPrices);
    }

    setState(() {
      _isLoading = false;
    });

    if (!mounted) return;

    if (success) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.item == null ? 'Item added successfully' : 'Item updated successfully'),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to save item'),
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
          title: Text(widget.item == null ? 'Add Item' : 'Edit Item'),
        actions: [
          if (_isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 16.0),
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            )
          else
            IconButton(
              onPressed: _save,
              icon: const Icon(Icons.check),
              tooltip: 'Save',
            ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Item Name',
                hintText: 'Enter item name',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.inventory_2),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter item name';
                }
                return null;
              },
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: _showUnitPicker,
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Unit',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.straighten),
                  suffixIcon: Icon(Icons.arrow_drop_down),
                ),
                child: Text(
                  _selectedUnit?.name ?? 'Select unit',
                  style: TextStyle(
                    color: _selectedUnit == null ? Colors.grey : null,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _defaultRateController,
              decoration: const InputDecoration(
                labelText: 'Default Rate',
                hintText: 'Enter default rate',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.currency_rupee),
              ),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter default rate';
                }
                if (double.tryParse(value.trim()) == null) {
                  return 'Please enter a valid number';
                }
                return null;
              },
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _purchaseRateController,
              decoration: const InputDecoration(
                labelText: 'Purchase Rate (Optional)',
                hintText: 'Enter purchase rate',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.shopping_cart),
              ),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              validator: (value) {
                if (value != null && value.trim().isNotEmpty) {
                  if (double.tryParse(value.trim()) == null) {
                    return 'Please enter a valid number';
                  }
                }
                return null;
              },
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: _showPartyPicker,
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Purchase Party (Optional)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.business),
                  suffixIcon: Icon(Icons.arrow_drop_down),
                ),
                child: Text(
                  _selectedPurchaseParty?.name ?? 'Select party',
                  style: TextStyle(
                    color: _selectedPurchaseParty == null ? Colors.grey : null,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Divider(),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Party-Specific Prices',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                TextButton.icon(
                  onPressed: _showPartyPricesPicker,
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Add Party'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (_partyPrices.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.price_change_outlined, size: 48, color: Colors.grey.shade400),
                      const SizedBox(height: 8),
                      Text(
                        'No party-specific prices yet',
                        style: TextStyle(color: Colors.grey.shade600),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Add parties with custom prices',
                        style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              )
            else
              ..._partyPrices.asMap().entries.map((entry) {
                final index = entry.key;
                final partyPrice = entry.value;

                return Dismissible(
                  key: Key('party-price-${partyPrice.party.id}'),
                  direction: DismissDirection.endToStart,
                  background: Container(
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 20),
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.delete, color: Colors.white),
                  ),
                  confirmDismiss: (direction) async {
                    return await showDialog<bool>(
                      context: context,
                      builder: (context) => AlertDialog(
                        backgroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        title: const Text('Remove Party Price'),
                        content: Text('Remove price for ${partyPrice.party.name}?'),
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
                            child: const Text('Remove', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                          ),
                        ],
                      ),
                    );
                  },
                  onDismissed: (direction) {
                    setState(() {
                      _partyPrices[index].dispose();
                      _partyPrices.removeAt(index);
                    });
                  },
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                          child: Text(
                            partyPrice.party.name,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 16,
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                          child: TextFormField(
                            controller: partyPrice.priceController,
                            decoration: const InputDecoration(
                              labelText: 'Price',
                              hintText: '0.00',
                              prefixText: '₹',
                              border: OutlineInputBorder(),
                              contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Please enter a price';
                              }
                              final price = double.tryParse(value.trim());
                              if (price == null || price <= 0) {
                                return 'Price must be a positive number';
                              }
                              return null;
                            },
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            textInputAction: TextInputAction.next,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _save,
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
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Text(
                        widget.item == null ? 'Add Item' : 'Update Item',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                      ),
              ),
            ),
          ],
        ),
        ),
      ),
    );
  }
}
