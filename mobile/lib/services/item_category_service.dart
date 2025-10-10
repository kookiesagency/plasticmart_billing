import '../config/supabase_config.dart';
import '../models/item_category.dart';

class ItemCategoryService {
  final _supabase = SupabaseConfig.client;

  // Fetch all categories (excluding deleted ones by default)
  Future<List<ItemCategory>> fetchCategories({bool includeDeleted = false}) async {
    try {
      final query = _supabase.from('item_categories').select();

      final response = includeDeleted
          ? await query.not('deleted_at', 'is', null).order('deleted_at', ascending: false)
          : await query.isFilter('deleted_at', null).order('name', ascending: true);

      return (response as List)
          .map((json) => ItemCategory.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch categories: $e');
    }
  }

  // Create a new category
  Future<ItemCategory> createCategory(String name, {String? description}) async {
    try {
      final data = {
        'name': name,
        if (description != null && description.isNotEmpty) 'description': description,
      };

      final response = await _supabase
          .from('item_categories')
          .insert(data)
          .select()
          .single();

      return ItemCategory.fromJson(response);
    } catch (e) {
      throw Exception('Failed to create category: $e');
    }
  }

  // Update an existing category
  Future<ItemCategory> updateCategory(int id, String name, {String? description}) async {
    try {
      final data = {
        'name': name,
        'description': description,
      };

      final response = await _supabase
          .from('item_categories')
          .update(data)
          .eq('id', id)
          .select()
          .single();

      return ItemCategory.fromJson(response);
    } catch (e) {
      throw Exception('Failed to update category: $e');
    }
  }

  // Soft delete a category (set deleted_at to current time)
  Future<void> deleteCategory(int id) async {
    try {
      await _supabase
          .from('item_categories')
          .update({'deleted_at': DateTime.now().toIso8601String()})
          .eq('id', id);
    } catch (e) {
      throw Exception('Failed to delete category: $e');
    }
  }

  // Restore a deleted category (set deleted_at to null)
  Future<void> restoreCategory(int id) async {
    try {
      await _supabase
          .from('item_categories')
          .update({'deleted_at': null})
          .eq('id', id);
    } catch (e) {
      throw Exception('Failed to restore category: $e');
    }
  }

  // Permanently delete a category
  Future<void> permanentlyDeleteCategory(int id) async {
    try {
      await _supabase
          .from('item_categories')
          .delete()
          .eq('id', id);
    } catch (e) {
      throw Exception('Failed to permanently delete category: $e');
    }
  }

  // Get a single category by ID
  Future<ItemCategory?> getCategoryById(int id) async {
    try {
      final response = await _supabase
          .from('item_categories')
          .select()
          .eq('id', id)
          .maybeSingle();

      if (response == null) return null;
      return ItemCategory.fromJson(response);
    } catch (e) {
      throw Exception('Failed to get category: $e');
    }
  }

  // Check if category name already exists
  Future<bool> categoryNameExists(String name, {int? excludeId}) async {
    try {
      var query = _supabase
          .from('item_categories')
          .select('id')
          .eq('name', name)
          .isFilter('deleted_at', null);

      if (excludeId != null) {
        query = query.neq('id', excludeId);
      }

      final response = await query;
      return (response as List).isNotEmpty;
    } catch (e) {
      throw Exception('Failed to check category name: $e');
    }
  }

  // Check if category is in use by any items
  Future<bool> isCategoryInUse(int categoryId) async {
    try {
      final response = await _supabase
          .from('items')
          .select('id')
          .eq('category_id', categoryId);

      return (response as List).isNotEmpty;
    } catch (e) {
      throw Exception('Failed to check category usage: $e');
    }
  }
}
