import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/purchase_party.dart';
import '../../models/item_category.dart';
import '../../providers/purchase_party_provider.dart';
import '../../providers/item_category_provider.dart';

class PurchasePartyDetailsScreen extends StatefulWidget {
  const PurchasePartyDetailsScreen({Key? key}) : super(key: key);

  @override
  State<PurchasePartyDetailsScreen> createState() => _PurchasePartyDetailsScreenState();
}

class _PurchasePartyDetailsScreenState extends State<PurchasePartyDetailsScreen> {
  List<Map<String, dynamic>> _items = [];
  List<ItemCategory> _categories = [];
  int? _selectedCategoryId;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final party = ModalRoute.of(context)!.settings.arguments as PurchaseParty;
    final partyProvider = Provider.of<PurchasePartyProvider>(context, listen: false);
    final categoryProvider = Provider.of<ItemCategoryProvider>(context, listen: false);

    try {
      // Fetch categories and items in parallel
      await Future.wait([
        categoryProvider.fetchCategories(),
        _fetchItems(party.id!, null),
      ]);

      setState(() {
        _categories = categoryProvider.categories;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchItems(int partyId, int? categoryId) async {
    final partyProvider = Provider.of<PurchasePartyProvider>(context, listen: false);

    try {
      final items = await partyProvider.fetchPurchasePartyItems(
        partyId,
        categoryId: categoryId,
      );

      setState(() {
        _items = items;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    }
  }

  void _onCategoryFilterChanged(int? categoryId) {
    final party = ModalRoute.of(context)!.settings.arguments as PurchaseParty;
    setState(() {
      _selectedCategoryId = categoryId;
    });
    _fetchItems(party.id!, categoryId);
  }

  String _getCategoryName(Map<String, dynamic> item) {
    if (item['item_categories'] != null) {
      return item['item_categories']['name'] ?? 'Uncategorized';
    }
    return 'Uncategorized';
  }

  String _getUnitName(Map<String, dynamic> item) {
    if (item['units'] != null) {
      return item['units']['name'] ?? '';
    }
    return '';
  }

  @override
  Widget build(BuildContext context) {
    final party = ModalRoute.of(context)!.settings.arguments as PurchaseParty;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDarkTheme = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              party.name,
              style: const TextStyle(fontSize: 18),
            ),
            Text(
              party.partyCode,
              style: TextStyle(
                fontFamily: 'monospace',
                fontSize: 12,
                color: isDarkTheme ? Colors.white.withOpacity(0.5) : Colors.grey.shade300,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Category Filter
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.cardColor,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                const Icon(Icons.filter_list, size: 20, color: Colors.grey),
                const SizedBox(width: 8),
                const Text(
                  'Filter by Category:',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<int?>(
                    value: _selectedCategoryId,
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: isDarkTheme ? Colors.white.withOpacity(0.2) : Colors.grey.shade300),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: isDarkTheme ? Colors.white.withOpacity(0.2) : Colors.grey.shade300),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: colorScheme.primary),
                      ),
                      isDense: true,
                    ),
                    items: [
                      const DropdownMenuItem<int?>(
                        value: null,
                        child: Text('All Categories'),
                      ),
                      const DropdownMenuItem<int?>(
                        value: -1,
                        child: Text('Uncategorized'),
                      ),
                      ..._categories.map((category) {
                        return DropdownMenuItem<int?>(
                          value: category.id,
                          child: Text(category.name),
                        );
                      }).toList(),
                    ],
                    onChanged: (value) => _onCategoryFilterChanged(value),
                  ),
                ),
              ],
            ),
          ),

          // Items List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _errorMessage != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.error_outline, size: 64, color: Colors.red),
                            const SizedBox(height: 16),
                            Text(
                              'Error: $_errorMessage',
                              style: const TextStyle(color: Colors.red),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: _loadData,
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      )
                    : _items.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(
                                  Icons.inventory_outlined,
                                  size: 64,
                                  color: Colors.grey,
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  _selectedCategoryId != null
                                      ? 'No items in this category'
                                      : 'No items for this purchase party',
                                  style: const TextStyle(
                                    fontSize: 18,
                                    color: Colors.grey,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _loadData,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: _items.length,
                              itemBuilder: (context, index) {
                                final item = _items[index];
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  decoration: BoxDecoration(
                                    color: theme.cardColor,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: isDarkTheme ? Colors.white.withOpacity(0.1) : Colors.grey.shade200,
                                      width: 1,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.05),
                                        blurRadius: 8,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Expanded(
                                              child: Text(
                                                item['name'] ?? '',
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w600,
                                                  fontSize: 16,
                                                ),
                                              ),
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: Colors.purple.shade50,
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Text(
                                                _getCategoryName(item),
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  color: Colors.purple.shade700,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 12),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Row(
                                              children: [
                                                Icon(
                                                  Icons.currency_rupee,
                                                  size: 14,
                                                  color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                                                ),
                                                const SizedBox(width: 2),
                                                Text(
                                                  'Purchase Rate: ',
                                                  style: TextStyle(
                                                    color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                                                    fontSize: 13,
                                                  ),
                                                ),
                                                Text(
                                                  item['purchase_rate'] != null
                                                      ? '₹${(item['purchase_rate'] as num).toStringAsFixed(2)}'
                                                      : 'N/A',
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.w600,
                                                    fontSize: 13,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            Row(
                                              children: [
                                                Icon(
                                                  Icons.straighten,
                                                  size: 14,
                                                  color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                                                ),
                                                const SizedBox(width: 4),
                                                Text(
                                                  _getUnitName(item),
                                                  style: TextStyle(
                                                    color: theme.textTheme.bodyLarge?.color,
                                                    fontSize: 13,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        Row(
                                          children: [
                                            Icon(
                                              Icons.sell,
                                              size: 14,
                                              color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              'Default Rate: ',
                                              style: TextStyle(
                                                color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                                                fontSize: 13,
                                              ),
                                            ),
                                            Text(
                                              '₹${(item['default_rate'] as num).toStringAsFixed(2)}',
                                              style: const TextStyle(
                                                fontWeight: FontWeight.w600,
                                                fontSize: 13,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
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
}
