import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/item.dart';
import '../../providers/item_provider.dart';
import '../../providers/unit_provider.dart';
import '../../providers/party_provider.dart';
import '../../providers/purchase_party_provider.dart';
import '../../providers/item_category_provider.dart';
import 'add_edit_item_screen.dart';
import 'view_item_screen.dart';

class ItemsScreen extends StatefulWidget {
  const ItemsScreen({Key? key}) : super(key: key);

  @override
  State<ItemsScreen> createState() => _ItemsScreenState();
}

class _ItemsScreenState extends State<ItemsScreen> with SingleTickerProviderStateMixin {
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
    final itemProvider = Provider.of<ItemProvider>(context, listen: false);
    final unitProvider = Provider.of<UnitProvider>(context, listen: false);
    final partyProvider = Provider.of<PartyProvider>(context, listen: false);
    final purchasePartyProvider = Provider.of<PurchasePartyProvider>(context, listen: false);
    final categoryProvider = Provider.of<ItemCategoryProvider>(context, listen: false);

    await Future.wait([
      itemProvider.fetchItems(),
      itemProvider.fetchDeletedItems(),
      unitProvider.fetchUnits(),
      partyProvider.fetchParties(),
      purchasePartyProvider.fetchPurchaseParties(),
      categoryProvider.fetchCategories(),
    ]);
  }

  List<Item> _getFilteredItems(List<Item> items) {
    return items.where((item) {
      final matchesSearch = item.name.toLowerCase().contains(_searchQuery.toLowerCase());
      final matchesDeletedFilter = _showDeleted ? (item.deletedAt != null) : (item.deletedAt == null);
      return matchesSearch && matchesDeletedFilter;
    }).toList();
  }

  Future<void> _showAddEditDialog({Item? item}) async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddEditItemScreen(item: item),
      ),
    );
    _loadData();
  }

  Future<void> _deleteItem(int id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: const Text('Delete Item'),
        content: const Text('Are you sure you want to delete this item?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final itemProvider = Provider.of<ItemProvider>(context, listen: false);
      final success = await itemProvider.deleteItem(id);

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            success ? 'Item deleted successfully' : 'Failed to delete item',
          ),
          backgroundColor: success ? Colors.green : Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _restoreItem(int id) async {
    final itemProvider = Provider.of<ItemProvider>(context, listen: false);
    final success = await itemProvider.restoreItem(id);

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success ? 'Item restored successfully' : 'Failed to restore item',
        ),
        backgroundColor: success ? Colors.green : Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  String _getPcsRate(Item item, double rate) {
    if (item.unit == null) return '';

    final unitName = item.unit!.name.toUpperCase();
    if (unitName == 'DOZ') {
      // Convert DOZ to PCS (DOZ / 12)
      final pcsRate = rate / 12;
      return '₹${pcsRate.toStringAsFixed(2)}/PCS';
    } else if (unitName == 'PCS') {
      // Already PCS, return as is
      return '₹${rate.toStringAsFixed(2)}/PCS';
    }
    return '';
  }

  String _getDozRate(Item item, double rate) {
    if (item.unit == null) return '';

    final unitName = item.unit!.name.toUpperCase();
    if (unitName == 'DOZ') {
      // Already DOZ, return as is
      return '₹${rate.toStringAsFixed(2)}/DOZ';
    } else if (unitName == 'PCS') {
      // Convert PCS to DOZ (PCS * 12)
      final dozRate = rate * 12;
      return '₹${dozRate.toStringAsFixed(2)}/DOZ';
    }
    return '';
  }

  @override
  Widget build(BuildContext context) {
    final itemProvider = Provider.of<ItemProvider>(context);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDarkTheme = theme.brightness == Brightness.dark;

    final items = _showDeleted ? itemProvider.deletedItems : itemProvider.items;
    final filteredItems = _getFilteredItems(items);

    return Column(
        children: [
          TabBar(
            controller: _tabController,
            tabs: const [
              Tab(text: 'Active'),
              Tab(text: 'Deleted'),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search items...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: isDarkTheme
                        ? Colors.white.withOpacity(0.2)
                        : Colors.grey.shade300,
                    width: 1,
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: isDarkTheme
                        ? Colors.white.withOpacity(0.2)
                        : Colors.grey.shade300,
                    width: 1,
                  ),
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
            child: itemProvider.isLoading
                ? const Center(child: CircularProgressIndicator())
                : filteredItems.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              _showDeleted ? Icons.delete_outlined : Icons.inventory_2_outlined,
                              size: 64,
                              color: Colors.grey,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              _showDeleted ? 'No deleted items' : 'No items yet',
                              style: const TextStyle(
                                fontSize: 18,
                                color: Colors.grey,
                              ),
                            ),
                            if (!_showDeleted) ...[
                              const SizedBox(height: 8),
                              TextButton.icon(
                                onPressed: () => _showAddEditDialog(),
                                icon: const Icon(Icons.add),
                                label: const Text('Add your first item'),
                              ),
                            ],
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadData,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: filteredItems.length,
                          itemBuilder: (context, index) {
                            final item = filteredItems[index];
                            return Dismissible(
                              key: Key('item-${item.id}'),
                              direction: _showDeleted ? DismissDirection.none : DismissDirection.horizontal,
                              background: Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                alignment: Alignment.centerLeft,
                                padding: const EdgeInsets.only(left: 20),
                                decoration: BoxDecoration(
                                  color: Colors.blue,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: const Icon(Icons.edit, color: Colors.white),
                              ),
                              secondaryBackground: Container(
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
                                if (direction == DismissDirection.startToEnd) {
                                  // Edit action - no confirmation needed
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => AddEditItemScreen(item: item),
                                    ),
                                  ).then((_) => _loadData());
                                  return false; // Don't dismiss
                                } else {
                                  // Delete action - show confirmation
                                  return await showDialog<bool>(
                                    context: context,
                                    builder: (context) => AlertDialog(
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      title: const Text('Delete Item'),
                                      content: const Text('Are you sure you want to delete this item?'),
                                      actions: [
                                        TextButton(
                                          onPressed: () => Navigator.pop(context, false),
                                          child: const Text('Cancel'),
                                        ),
                                        FilledButton(
                                          onPressed: () => Navigator.pop(context, true),
                                          style: FilledButton.styleFrom(
                                            backgroundColor: Colors.red,
                                          ),
                                          child: const Text('Delete'),
                                        ),
                                      ],
                                    ),
                                  );
                                }
                              },
                              onDismissed: (direction) async {
                                if (direction == DismissDirection.endToStart) {
                                  await itemProvider.deleteItem(item.id!);
                                }
                              },
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                decoration: BoxDecoration(
                                  color: theme.cardColor,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: isDarkTheme
                                        ? Colors.white.withOpacity(0.1)
                                        : Colors.grey.shade200,
                                    width: 1,
                                  ),
                                ),
                                child: InkWell(
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => ViewItemScreen(item: item),
                                      ),
                                    ).then((_) => _loadData());
                                  },
                                  borderRadius: BorderRadius.circular(16),
                                  child: Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Row(
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                item.name,
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w600,
                                                  fontSize: 16,
                                                ),
                                              ),
                                              const SizedBox(height: 8),
                                              Row(
                                                children: [
                                                  Text(
                                                    'Rate: ',
                                                    style: TextStyle(
                                                      color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                                                      fontSize: 14,
                                                    ),
                                                  ),
                                                  if (item.unit != null && (item.unit!.name.toUpperCase() == 'DOZ' || item.unit!.name.toUpperCase() == 'PCS')) ...[
                                                    // Always show PCS first
                                                    Text(
                                                      _getPcsRate(item, item.defaultRate),
                                                      style: TextStyle(
                                                        color: colorScheme.primary,
                                                        fontSize: 14,
                                                        fontWeight: FontWeight.w600,
                                                      ),
                                                    ),
                                                    Text(
                                                      ' • ',
                                                      style: TextStyle(
                                                        color: theme.textTheme.bodySmall?.color?.withOpacity(0.5),
                                                        fontSize: 14,
                                                      ),
                                                    ),
                                                    // Always show DOZ second
                                                    Text(
                                                      _getDozRate(item, item.defaultRate),
                                                      style: TextStyle(
                                                        color: colorScheme.primary,
                                                        fontSize: 14,
                                                      ),
                                                    ),
                                                  ] else ...[
                                                    Text(
                                                      '₹${item.defaultRate.toStringAsFixed(2)}${item.unit != null ? '/${item.unit!.name}' : ''}',
                                                      style: TextStyle(
                                                        color: colorScheme.primary,
                                                        fontSize: 14,
                                                        fontWeight: FontWeight.w600,
                                                      ),
                                                    ),
                                                  ],
                                                ],
                                              ),
                                              const SizedBox(height: 4),
                                              Row(
                                                children: [
                                                  Text(
                                                    'Purchase: ',
                                                    style: TextStyle(
                                                      color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                                                      fontSize: 14,
                                                    ),
                                                  ),
                                                  if (item.purchaseRate != null) ...[
                                                    if (item.unit != null && (item.unit!.name.toUpperCase() == 'DOZ' || item.unit!.name.toUpperCase() == 'PCS')) ...[
                                                      // Always show PCS first
                                                      Text(
                                                        _getPcsRate(item, item.purchaseRate!),
                                                        style: TextStyle(
                                                          color: theme.textTheme.bodyLarge?.color,
                                                          fontSize: 14,
                                                          fontWeight: FontWeight.w600,
                                                        ),
                                                      ),
                                                      Text(
                                                        ' • ',
                                                        style: TextStyle(
                                                          color: theme.textTheme.bodySmall?.color?.withOpacity(0.5),
                                                          fontSize: 14,
                                                        ),
                                                      ),
                                                      // Always show DOZ second
                                                      Text(
                                                        _getDozRate(item, item.purchaseRate!),
                                                        style: TextStyle(
                                                          color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                                                          fontSize: 14,
                                                        ),
                                                      ),
                                                    ] else ...[
                                                      Text(
                                                        '₹${item.purchaseRate!.toStringAsFixed(2)}${item.unit != null ? '/${item.unit!.name}' : ''}',
                                                        style: TextStyle(
                                                          color: theme.textTheme.bodyLarge?.color,
                                                          fontSize: 14,
                                                          fontWeight: FontWeight.w600,
                                                        ),
                                                      ),
                                                    ],
                                                  ] else ...[
                                                    Text(
                                                      'Not set',
                                                      style: TextStyle(
                                                        color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                                                        fontSize: 14,
                                                      ),
                                                    ),
                                                  ],
                                                ],
                                              ),
                                            ],
                                          ),
                                        ),
                                        if (_showDeleted)
                                          IconButton(
                                            icon: const Icon(Icons.restore, color: Colors.green, size: 22),
                                            onPressed: () => _restoreItem(item.id!),
                                            tooltip: 'Restore',
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
