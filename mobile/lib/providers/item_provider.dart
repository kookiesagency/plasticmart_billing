import 'package:flutter/foundation.dart';
import '../models/item.dart';
import '../models/item_party_price.dart';
import '../services/item_service.dart';
import '../config/supabase_config.dart';

class ItemProvider with ChangeNotifier {
  final ItemService _itemService = ItemService();

  List<Item> _items = [];
  List<Item> _deletedItems = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<Item> get items => _items;
  List<Item> get deletedItems => _deletedItems;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Fetch active items
  Future<void> fetchItems() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    // Log authentication and connection status
    final session = SupabaseConfig.client.auth.currentSession;
    debugPrint('=== ItemProvider: fetchItems called ===');
    debugPrint('ItemProvider: User authenticated: ${session != null}');
    debugPrint('ItemProvider: User email: ${session?.user?.email}');
    debugPrint('ItemProvider: Supabase URL: ${SupabaseConfig.supabaseUrl}');

    try {
      _items = await _itemService.fetchItems(includeDeleted: false);
      _errorMessage = null;
      debugPrint('ItemProvider: Successfully fetched ${_items.length} items');
    } catch (e) {
      debugPrint('ItemProvider ERROR: Failed to fetch items: $e');
      // Extract error message from Exception or use the raw message
      final errorStr = e.toString();
      _errorMessage = errorStr.startsWith('Exception: ')
          ? errorStr.substring('Exception: '.length)
          : errorStr;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Fetch deleted items
  Future<void> fetchDeletedItems() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _deletedItems = await _itemService.fetchItems(includeDeleted: true);
      _errorMessage = null;
    } catch (e) {
      debugPrint('Error fetching deleted items: $e');
      // Extract error message from Exception or use the raw message
      final errorStr = e.toString();
      _errorMessage = errorStr.startsWith('Exception: ')
          ? errorStr.substring('Exception: '.length)
          : errorStr;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Fetch party prices for an item
  Future<List<ItemPartyPrice>> fetchItemPartyPrices(int itemId) async {
    try {
      return await _itemService.fetchItemPartyPrices(itemId);
    } catch (e) {
      debugPrint('Error fetching item party prices: $e');
      return [];
    }
  }

  // Create a new item
  Future<bool> createItem(Item item, {List<ItemPartyPrice>? partyPrices}) async {
    try {
      final itemId = await _itemService.createItem(item);

      if (itemId != null && partyPrices != null && partyPrices.isNotEmpty) {
        await _itemService.saveItemPartyPrices(itemId, partyPrices);
      }

      await fetchItems();
      return true;
    } catch (e) {
      debugPrint('Error creating item: $e');
      return false;
    }
  }

  // Update an existing item
  Future<bool> updateItem(int id, Item item, {List<ItemPartyPrice>? partyPrices}) async {
    try {
      await _itemService.updateItem(id, item);

      if (partyPrices != null) {
        await _itemService.saveItemPartyPrices(id, partyPrices);
      }

      await fetchItems();
      return true;
    } catch (e) {
      debugPrint('Error updating item: $e');
      return false;
    }
  }

  // Soft delete an item
  Future<bool> deleteItem(int id) async {
    try {
      await _itemService.deleteItem(id);
      await fetchItems();
      await fetchDeletedItems();
      return true;
    } catch (e) {
      debugPrint('Error deleting item: $e');
      return false;
    }
  }

  // Restore a deleted item
  Future<bool> restoreItem(int id) async {
    try {
      await _itemService.restoreItem(id);
      await fetchItems();
      await fetchDeletedItems();
      return true;
    } catch (e) {
      debugPrint('Error restoring item: $e');
      return false;
    }
  }

  // Permanently delete an item
  Future<bool> permanentlyDeleteItem(int id) async {
    try {
      await _itemService.permanentlyDeleteItem(id);
      await fetchDeletedItems();
      return true;
    } catch (e) {
      debugPrint('Error permanently deleting item: $e');
      return false;
    }
  }

  // Bulk soft delete items
  Future<bool> bulkDeleteItems(List<int> ids) async {
    try {
      await _itemService.bulkDeleteItems(ids);
      await fetchItems();
      await fetchDeletedItems();
      return true;
    } catch (e) {
      debugPrint('Error bulk deleting items: $e');
      return false;
    }
  }

  // Bulk restore items
  Future<bool> bulkRestoreItems(List<int> ids) async {
    try {
      await _itemService.bulkRestoreItems(ids);
      await fetchItems();
      await fetchDeletedItems();
      return true;
    } catch (e) {
      debugPrint('Error bulk restoring items: $e');
      return false;
    }
  }

  // Bulk permanently delete items
  Future<bool> bulkPermanentlyDeleteItems(List<int> ids) async {
    try {
      await _itemService.bulkPermanentlyDeleteItems(ids);
      await fetchDeletedItems();
      return true;
    } catch (e) {
      debugPrint('Error bulk permanently deleting items: $e');
      return false;
    }
  }

  // Check if item name exists
  Future<bool> itemNameExists(String name, {int? excludeId}) async {
    try {
      return await _itemService.itemNameExists(name, excludeId: excludeId);
    } catch (e) {
      debugPrint('Error checking item name: $e');
      return false;
    }
  }

  // Clear error message
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
