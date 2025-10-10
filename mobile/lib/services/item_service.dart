import '../config/supabase_config.dart';
import '../models/item.dart';
import '../models/item_party_price.dart';

class ItemService {
  final _supabase = SupabaseConfig.client;

  // Fetch items with optional deleted filter
  Future<List<Item>> fetchItems({bool includeDeleted = false}) async {
    try {
      final query = _supabase
          .from('items')
          .select('''
            *,
            units(id, name),
            item_categories(id, name),
            purchase_parties!purchase_party_id(id, party_code, name),
            item_party_prices(*, parties(name))
          ''');

      final response = includeDeleted
          ? await query.not('deleted_at', 'is', null).order('deleted_at', ascending: false)
          : await query.isFilter('deleted_at', null).order('created_at', ascending: false);

      return (response as List).map((json) => Item.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to fetch items: $e');
    }
  }

  // Fetch party prices for a specific item
  Future<List<ItemPartyPrice>> fetchItemPartyPrices(int itemId) async {
    try {
      final response = await _supabase
          .from('item_party_prices')
          .select('*')
          .eq('item_id', itemId);

      return (response as List).map((json) => ItemPartyPrice.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to fetch item party prices: $e');
    }
  }

  // Create a new item
  Future<int?> createItem(Item item) async {
    try {
      final response = await _supabase
          .from('items')
          .insert(item.toJson())
          .select('id')
          .single();

      return response['id'] as int?;
    } catch (e) {
      throw Exception('Failed to create item: $e');
    }
  }

  // Update an existing item
  Future<void> updateItem(int id, Item item) async {
    try {
      await _supabase
          .from('items')
          .update(item.toJson())
          .eq('id', id);
    } catch (e) {
      throw Exception('Failed to update item: $e');
    }
  }

  // Save party prices for an item (delete old ones and insert new ones)
  Future<void> saveItemPartyPrices(int itemId, List<ItemPartyPrice> partyPrices) async {
    try {
      // Delete old party prices
      await _supabase
          .from('item_party_prices')
          .delete()
          .eq('item_id', itemId);

      // Insert new party prices if any
      if (partyPrices.isNotEmpty) {
        final pricesToInsert = partyPrices.map((pp) => {
          'item_id': itemId,
          'party_id': pp.partyId,
          'price': pp.price,
        }).toList();

        await _supabase
            .from('item_party_prices')
            .insert(pricesToInsert);
      }
    } catch (e) {
      throw Exception('Failed to save item party prices: $e');
    }
  }

  // Soft delete an item
  Future<void> deleteItem(int id) async {
    try {
      await _supabase
          .from('items')
          .update({'deleted_at': DateTime.now().toIso8601String()})
          .eq('id', id);
    } catch (e) {
      throw Exception('Failed to delete item: $e');
    }
  }

  // Restore a deleted item
  Future<void> restoreItem(int id) async {
    try {
      await _supabase
          .from('items')
          .update({'deleted_at': null})
          .eq('id', id);
    } catch (e) {
      throw Exception('Failed to restore item: $e');
    }
  }

  // Permanently delete an item
  Future<void> permanentlyDeleteItem(int id) async {
    try {
      // First delete party prices (no cascading delete rule)
      await _supabase
          .from('item_party_prices')
          .delete()
          .eq('item_id', id);

      // Then delete the item
      await _supabase
          .from('items')
          .delete()
          .eq('id', id);
    } catch (e) {
      throw Exception('Failed to permanently delete item: $e');
    }
  }

  // Bulk soft delete items
  Future<void> bulkDeleteItems(List<int> ids) async {
    try {
      await _supabase
          .from('items')
          .update({'deleted_at': DateTime.now().toIso8601String()})
          .inFilter('id', ids);
    } catch (e) {
      throw Exception('Failed to bulk delete items: $e');
    }
  }

  // Bulk restore items
  Future<void> bulkRestoreItems(List<int> ids) async {
    try {
      await _supabase
          .from('items')
          .update({'deleted_at': null})
          .inFilter('id', ids);
    } catch (e) {
      throw Exception('Failed to bulk restore items: $e');
    }
  }

  // Bulk permanently delete items
  Future<void> bulkPermanentlyDeleteItems(List<int> ids) async {
    try {
      // First delete all party prices
      await _supabase
          .from('item_party_prices')
          .delete()
          .inFilter('item_id', ids);

      // Then delete the items
      await _supabase
          .from('items')
          .delete()
          .inFilter('id', ids);
    } catch (e) {
      throw Exception('Failed to bulk permanently delete items: $e');
    }
  }

  // Check if item name already exists (for duplicate detection)
  Future<bool> itemNameExists(String name, {int? excludeId}) async {
    try {
      final normalizedName = name.toLowerCase().replaceAll(' ', '');

      final query = _supabase
          .from('items')
          .select('id');

      final response = excludeId != null
          ? await query.neq('id', excludeId).maybeSingle()
          : await query.maybeSingle();

      if (response == null) return false;

      // Check normalized name match in client side since we can't do case-insensitive search easily
      final allItems = await fetchItems();
      return allItems.any((item) {
        final itemNormalizedName = item.name.toLowerCase().replaceAll(' ', '');
        return itemNormalizedName == normalizedName && (excludeId == null || item.id != excludeId);
      });
    } catch (e) {
      return false;
    }
  }
}
