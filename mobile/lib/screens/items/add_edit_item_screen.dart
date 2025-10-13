import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../../models/item.dart';
import '../../models/unit.dart';
import '../../models/party.dart';
import '../../models/purchase_party.dart';
import '../../models/item_category.dart';
import '../../models/item_party_price.dart';
import '../../providers/item_provider.dart';
import '../../providers/unit_provider.dart';
import '../../providers/party_provider.dart';
import '../../providers/purchase_party_provider.dart';
import '../../providers/item_category_provider.dart';
import '../../theme/app_button_styles.dart';

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
  ItemCategory? _selectedCategory;
  PurchaseParty? _selectedPurchaseParty;
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
        final purchasePartyProvider = Provider.of<PurchasePartyProvider>(context, listen: false);
        final categoryProvider = Provider.of<ItemCategoryProvider>(context, listen: false);
        final itemProvider = Provider.of<ItemProvider>(context, listen: false);

        setState(() {
          _selectedUnit = unitProvider.units.firstWhere(
            (u) => u.id == widget.item!.unitId,
            orElse: () => unitProvider.units.first,
          );

          if (widget.item!.categoryId != null && categoryProvider.categories.isNotEmpty) {
            try {
              _selectedCategory = categoryProvider.categories.firstWhere(
                (c) => c.id == widget.item!.categoryId,
              );
            } catch (e) {
              _selectedCategory = null;
            }
          }

          if (widget.item!.purchasePartyId != null && purchasePartyProvider.purchaseParties.isNotEmpty) {
            try {
              _selectedPurchaseParty = purchasePartyProvider.purchaseParties.firstWhere(
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
    final l10n = AppLocalizations.of(context)!;
    String searchQuery = '';
    final theme = Theme.of(context);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: theme.cardColor,
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
            builder: (context, scrollController) => Container(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        l10n.items_selectUnit,
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
                      hintText: l10n.items_searchUnits,
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
                  const SizedBox(height: 16),

                  // Units List
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
                              ? Icon(Icons.check_circle, color: theme.colorScheme.primary)
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
            ),
          );
        },
      ),
    );
  }

  void _showCategoryPicker() {
    final categoryProvider = Provider.of<ItemCategoryProvider>(context, listen: false);
    final l10n = AppLocalizations.of(context)!;
    String searchQuery = '';
    final theme = Theme.of(context);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: theme.cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          final filteredCategories = categoryProvider.categories
              .where((c) => c.name.toLowerCase().contains(searchQuery.toLowerCase()))
              .toList();

          return DraggableScrollableSheet(
            initialChildSize: 0.7,
            minChildSize: 0.5,
            maxChildSize: 0.95,
            expand: false,
            builder: (context, scrollController) => Container(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        l10n.items_selectCategory,
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
                      hintText: l10n.items_searchCategory,
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
                  const SizedBox(height: 16),

                  // Categories List
                  Expanded(
                    child: ListView.builder(
                      controller: scrollController,
                      itemCount: filteredCategories.length + 1,
                      itemBuilder: (context, index) {
                        if (index == 0) {
                          return ListTile(
                            title: Text(l10n.items_none),
                            trailing: _selectedCategory == null
                                ? Icon(Icons.check_circle, color: theme.colorScheme.primary)
                                : null,
                            selected: _selectedCategory == null,
                            onTap: () {
                              setState(() {
                                _selectedCategory = null;
                              });
                              Navigator.pop(context);
                            },
                          );
                        }

                        final category = filteredCategories[index - 1];
                        final isSelected = _selectedCategory?.id == category.id;

                        return ListTile(
                          title: Text(category.name),
                          subtitle: category.description != null && category.description!.isNotEmpty
                              ? Text(category.description!)
                              : null,
                          trailing: isSelected
                              ? Icon(Icons.check_circle, color: theme.colorScheme.primary)
                              : null,
                          selected: isSelected,
                          onTap: () {
                            setState(() {
                              _selectedCategory = category;
                            });
                            Navigator.pop(context);
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _showPurchasePartyPicker() {
    final purchasePartyProvider = Provider.of<PurchasePartyProvider>(context, listen: false);
    final l10n = AppLocalizations.of(context)!;
    String searchQuery = '';
    final theme = Theme.of(context);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: theme.cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          final filteredParties = purchasePartyProvider.purchaseParties
              .where((p) =>
                  p.name.toLowerCase().contains(searchQuery.toLowerCase()) ||
                  p.partyCode.toLowerCase().contains(searchQuery.toLowerCase()))
              .toList();

          return DraggableScrollableSheet(
            initialChildSize: 0.7,
            minChildSize: 0.5,
            maxChildSize: 0.95,
            expand: false,
            builder: (context, scrollController) => Container(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        l10n.items_selectPurchaseParty,
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
                      hintText: l10n.items_searchPurchaseParties,
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
                  const SizedBox(height: 16),

                  // Purchase Parties List
                  Expanded(
                    child: ListView.builder(
                      controller: scrollController,
                      itemCount: filteredParties.length + 1,
                      itemBuilder: (context, index) {
                        if (index == 0) {
                          return ListTile(
                            title: Text(l10n.items_none),
                            trailing: _selectedPurchaseParty == null
                                ? Icon(Icons.check_circle, color: theme.colorScheme.primary)
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
                          leading: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              party.partyCode,
                              style: TextStyle(
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                                color: theme.colorScheme.primary,
                              ),
                            ),
                          ),
                          title: Text(party.name),
                          trailing: isSelected
                              ? Icon(Icons.check_circle, color: theme.colorScheme.primary)
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
            ),
          );
        },
      ),
    );
  }

  void _showPartyPricesPicker() {
    final partyProvider = Provider.of<PartyProvider>(context, listen: false);
    final l10n = AppLocalizations.of(context)!;
    String searchQuery = '';
    final theme = Theme.of(context);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: theme.cardColor,
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
            builder: (context, scrollController) => Container(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        l10n.items_addPartyPrice,
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
                      hintText: l10n.items_searchParty,
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
                  const SizedBox(height: 16),

                  // Parties List
                  Expanded(
                    child: filteredParties.isEmpty
                        ? Center(
                            child: Text(
                              l10n.items_allPartiesAdded,
                              style: const TextStyle(color: Colors.grey),
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
            ),
          );
        },
      ),
    );
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final l10n = AppLocalizations.of(context)!;

    if (_selectedUnit == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10n.items_pleaseSelectUnit),
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
        SnackBar(
          content: Text(l10n.items_nameAlreadyExists),
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
      categoryId: _selectedCategory?.id,
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

    final l10nAfter = AppLocalizations.of(context)!;

    if (success) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.item == null ? l10nAfter.items_addedSuccessfully : l10nAfter.items_updatedSuccessfully),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10nAfter.items_saveFailed),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDarkTheme = theme.brightness == Brightness.dark;

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      behavior: HitTestBehavior.opaque,
      child: Scaffold(
        appBar: AppBar(
          title: Text(widget.item == null ? l10n.items_addItem : l10n.items_editItem),
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
              tooltip: l10n.common_save,
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
              decoration: InputDecoration(
                labelText: l10n.items_itemName,
                hintText: l10n.items_enterItemName,
                border: const OutlineInputBorder(),
                prefixIcon: const Icon(Icons.inventory_2),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return l10n.items_pleaseEnterItemName;
                }
                return null;
              },
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: _showUnitPicker,
              child: InputDecorator(
                decoration: InputDecoration(
                  labelText: l10n.items_unit,
                  border: const OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.straighten),
                  suffixIcon: const Icon(Icons.arrow_drop_down),
                ),
                child: Text(
                  _selectedUnit?.name ?? l10n.items_selectUnit,
                  style: TextStyle(
                    color: _selectedUnit == null ? Colors.grey : null,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: _showCategoryPicker,
              child: InputDecorator(
                decoration: InputDecoration(
                  labelText: l10n.items_categoryOptional,
                  border: const OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.category_outlined),
                  suffixIcon: const Icon(Icons.arrow_drop_down),
                ),
                child: Text(
                  _selectedCategory?.name ?? l10n.items_selectCategory,
                  style: TextStyle(
                    color: _selectedCategory == null ? Colors.grey : null,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: _showPurchasePartyPicker,
              child: InputDecorator(
                decoration: InputDecoration(
                  labelText: l10n.items_purchasePartyOptional,
                  border: const OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.business_outlined),
                  suffixIcon: const Icon(Icons.arrow_drop_down),
                ),
                child: Row(
                  children: [
                    if (_selectedPurchaseParty != null) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          _selectedPurchaseParty!.partyCode,
                          style: TextStyle(
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    Expanded(
                      child: Text(
                        _selectedPurchaseParty?.name ?? l10n.items_selectPurchaseParty,
                        style: TextStyle(
                          color: _selectedPurchaseParty == null ? Colors.grey : null,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _defaultRateController,
              decoration: InputDecoration(
                labelText: l10n.items_defaultRate,
                hintText: l10n.items_enterDefaultRate,
                border: const OutlineInputBorder(),
                prefixIcon: const Icon(Icons.currency_rupee),
              ),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return l10n.items_pleaseEnterDefaultRate;
                }
                if (double.tryParse(value.trim()) == null) {
                  return l10n.items_pleaseEnterValidNumber;
                }
                return null;
              },
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _purchaseRateController,
              decoration: InputDecoration(
                labelText: l10n.items_purchaseRateOptional,
                hintText: l10n.items_enterPurchaseRate,
                border: const OutlineInputBorder(),
                prefixIcon: const Icon(Icons.shopping_cart),
              ),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              validator: (value) {
                if (value != null && value.trim().isNotEmpty) {
                  if (double.tryParse(value.trim()) == null) {
                    return l10n.items_pleaseEnterValidNumber;
                  }
                }
                return null;
              },
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 24),
            const Divider(),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  l10n.items_partySpecificPrices,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                TextButton.icon(
                  onPressed: _showPartyPricesPicker,
                  icon: const Icon(Icons.add, size: 18),
                  label: Text(l10n.items_addParty),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (_partyPrices.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: isDarkTheme ? Colors.white.withOpacity(0.05) : Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isDarkTheme ? Colors.white.withOpacity(0.1) : Colors.grey.shade200),
                ),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.price_change_outlined, size: 48, color: theme.textTheme.bodySmall?.color?.withOpacity(0.5)),
                      const SizedBox(height: 8),
                      Text(
                        l10n.items_noPartyPricesYet,
                        style: TextStyle(color: theme.textTheme.bodySmall?.color?.withOpacity(0.7)),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        l10n.items_addPartiesWithCustomPrices,
                        style: TextStyle(color: theme.textTheme.bodySmall?.color?.withOpacity(0.5), fontSize: 12),
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
                      builder: (dialogContext) {
                        final dialogL10n = AppLocalizations.of(dialogContext)!;
                        return AlertDialog(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          title: Text(dialogL10n.items_removePartyPrice),
                          content: Text(dialogL10n.items_removePartyPriceMessage(partyPrice.party.name)),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(dialogContext, false),
                              child: Text(dialogL10n.common_cancel),
                            ),
                            ElevatedButton(
                              onPressed: () => Navigator.pop(dialogContext, true),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.red,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: Text(dialogL10n.items_remove, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                            ),
                          ],
                        );
                      },
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
                      color: theme.cardColor,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: isDarkTheme ? Colors.white.withOpacity(0.1) : Colors.grey.shade200),
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
                            decoration: InputDecoration(
                              labelText: l10n.items_price,
                              hintText: l10n.items_priceHint,
                              prefixText: '₹',
                              border: const OutlineInputBorder(),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return l10n.items_pleaseEnterPrice;
                              }
                              final price = double.tryParse(value.trim());
                              if (price == null || price <= 0) {
                                return l10n.items_priceMustBePositive;
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
                style: AppButtonStyles.primaryElevated(context),
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
                        widget.item == null ? l10n.items_addItem : l10n.items_updateItem,
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
