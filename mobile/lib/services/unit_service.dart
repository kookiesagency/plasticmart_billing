import '../config/supabase_config.dart';
import '../models/unit.dart';

class UnitService {
  final _supabase = SupabaseConfig.client;

  // Fetch all units (excluding deleted ones by default)
  Future<List<Unit>> fetchUnits({bool includeDeleted = false}) async {
    try {
      final query = _supabase.from('units').select();

      final response = includeDeleted
          ? await query.not('deleted_at', 'is', null).order('deleted_at', ascending: false)
          : await query.isFilter('deleted_at', null).order('created_at', ascending: false);

      return (response as List)
          .map((json) => Unit.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch units: $e');
    }
  }

  // Create a new unit
  Future<Unit> createUnit(String name) async {
    try {
      final response = await _supabase
          .from('units')
          .insert({'name': name})
          .select()
          .single();

      return Unit.fromJson(response);
    } catch (e) {
      throw Exception('Failed to create unit: $e');
    }
  }

  // Update an existing unit
  Future<Unit> updateUnit(int id, String name) async {
    try {
      final response = await _supabase
          .from('units')
          .update({'name': name})
          .eq('id', id)
          .select()
          .single();

      return Unit.fromJson(response);
    } catch (e) {
      throw Exception('Failed to update unit: $e');
    }
  }

  // Soft delete a unit (set deleted_at to current time)
  Future<void> deleteUnit(int id) async {
    try {
      await _supabase
          .from('units')
          .update({'deleted_at': DateTime.now().toIso8601String()})
          .eq('id', id);
    } catch (e) {
      throw Exception('Failed to delete unit: $e');
    }
  }

  // Restore a deleted unit (set deleted_at to null)
  Future<void> restoreUnit(int id) async {
    try {
      await _supabase
          .from('units')
          .update({'deleted_at': null})
          .eq('id', id);
    } catch (e) {
      throw Exception('Failed to restore unit: $e');
    }
  }

  // Permanently delete a unit
  Future<void> permanentlyDeleteUnit(int id) async {
    try {
      await _supabase
          .from('units')
          .delete()
          .eq('id', id);
    } catch (e) {
      throw Exception('Failed to permanently delete unit: $e');
    }
  }

  // Get a single unit by ID
  Future<Unit?> getUnitById(int id) async {
    try {
      final response = await _supabase
          .from('units')
          .select()
          .eq('id', id)
          .maybeSingle();

      if (response == null) return null;
      return Unit.fromJson(response);
    } catch (e) {
      throw Exception('Failed to get unit: $e');
    }
  }

  // Check if unit name already exists
  Future<bool> unitNameExists(String name, {int? excludeId}) async {
    try {
      var query = _supabase
          .from('units')
          .select('id')
          .eq('name', name)
          .isFilter('deleted_at', null);

      if (excludeId != null) {
        query = query.neq('id', excludeId);
      }

      final response = await query;
      return (response as List).isNotEmpty;
    } catch (e) {
      throw Exception('Failed to check unit name: $e');
    }
  }
}
