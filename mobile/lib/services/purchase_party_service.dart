import '../config/supabase_config.dart';
import '../models/purchase_party.dart';

class PurchasePartyService {
  final _supabase = SupabaseConfig.client;

  // Fetch all purchase parties (excluding deleted ones by default)
  Future<List<PurchaseParty>> fetchPurchaseParties({bool includeDeleted = false}) async {
    try {
      final query = _supabase
          .from('purchase_parties')
          .select('*, items(id)');

      final response = includeDeleted
          ? await query.not('deleted_at', 'is', null).order('deleted_at', ascending: false)
          : await query.isFilter('deleted_at', null).order('party_code', ascending: true);

      return (response as List).map((json) {
        // Count items for this purchase party
        final itemCount = (json['items'] as List?)?.length ?? 0;
        final partyData = Map<String, dynamic>.from(json);
        partyData['item_count'] = itemCount;
        partyData.remove('items');

        return PurchaseParty.fromJson(partyData);
      }).toList();
    } catch (e) {
      throw Exception('Failed to fetch purchase parties: $e');
    }
  }

  // Create a new purchase party
  Future<PurchaseParty> createPurchaseParty(String partyCode, String name) async {
    try {
      final response = await _supabase
          .from('purchase_parties')
          .insert({
            'party_code': partyCode.toUpperCase(),
            'name': name,
          })
          .select()
          .single();

      return PurchaseParty.fromJson(response);
    } catch (e) {
      throw Exception('Failed to create purchase party: $e');
    }
  }

  // Update an existing purchase party
  Future<PurchaseParty> updatePurchaseParty(int id, String partyCode, String name) async {
    try {
      final response = await _supabase
          .from('purchase_parties')
          .update({
            'party_code': partyCode.toUpperCase(),
            'name': name,
          })
          .eq('id', id)
          .select()
          .single();

      return PurchaseParty.fromJson(response);
    } catch (e) {
      throw Exception('Failed to update purchase party: $e');
    }
  }

  // Soft delete a purchase party (set deleted_at to current time)
  Future<void> deletePurchaseParty(int id) async {
    try {
      await _supabase
          .from('purchase_parties')
          .update({'deleted_at': DateTime.now().toIso8601String()})
          .eq('id', id);
    } catch (e) {
      throw Exception('Failed to delete purchase party: $e');
    }
  }

  // Restore a deleted purchase party (set deleted_at to null)
  Future<void> restorePurchaseParty(int id) async {
    try {
      await _supabase
          .from('purchase_parties')
          .update({'deleted_at': null})
          .eq('id', id);
    } catch (e) {
      throw Exception('Failed to restore purchase party: $e');
    }
  }

  // Permanently delete a purchase party
  Future<void> permanentlyDeletePurchaseParty(int id) async {
    try {
      await _supabase
          .from('purchase_parties')
          .delete()
          .eq('id', id);
    } catch (e) {
      throw Exception('Failed to permanently delete purchase party: $e');
    }
  }

  // Get a single purchase party by ID
  Future<PurchaseParty?> getPurchasePartyById(int id) async {
    try {
      final response = await _supabase
          .from('purchase_parties')
          .select()
          .eq('id', id)
          .maybeSingle();

      if (response == null) return null;
      return PurchaseParty.fromJson(response);
    } catch (e) {
      throw Exception('Failed to get purchase party: $e');
    }
  }

  // Check if party code already exists
  Future<bool> partyCodeExists(String partyCode, {int? excludeId}) async {
    try {
      var query = _supabase
          .from('purchase_parties')
          .select('id')
          .eq('party_code', partyCode.toUpperCase())
          .isFilter('deleted_at', null);

      if (excludeId != null) {
        query = query.neq('id', excludeId);
      }

      final response = await query;
      return (response as List).isNotEmpty;
    } catch (e) {
      throw Exception('Failed to check party code: $e');
    }
  }

  // Check if purchase party is in use by any items
  Future<bool> isPurchasePartyInUse(int purchasePartyId) async {
    try {
      final response = await _supabase
          .from('items')
          .select('id')
          .eq('purchase_party_id', purchasePartyId);

      return (response as List).isNotEmpty;
    } catch (e) {
      throw Exception('Failed to check purchase party usage: $e');
    }
  }

  // Fetch items for a specific purchase party with optional category filter
  Future<List<Map<String, dynamic>>> fetchPurchasePartyItems(
    int purchasePartyId, {
    int? categoryId,
  }) async {
    try {
      var query = _supabase
          .from('items')
          .select('*, units(name), item_categories(id, name)')
          .eq('purchase_party_id', purchasePartyId)
          .isFilter('deleted_at', null)
          .order('name', ascending: true);

      final response = await query;

      // Filter by category if provided
      if (categoryId != null) {
        if (categoryId == -1) {
          // -1 means uncategorized
          return (response as List)
              .where((item) => item['category_id'] == null)
              .cast<Map<String, dynamic>>()
              .toList();
        } else {
          return (response as List)
              .where((item) => item['category_id'] == categoryId)
              .cast<Map<String, dynamic>>()
              .toList();
        }
      }

      return (response as List).cast<Map<String, dynamic>>();
    } catch (e) {
      throw Exception('Failed to fetch purchase party items: $e');
    }
  }
}
