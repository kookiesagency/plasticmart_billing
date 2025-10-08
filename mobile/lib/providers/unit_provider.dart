import 'package:flutter/material.dart';
import '../models/unit.dart';
import '../services/unit_service.dart';

class UnitProvider with ChangeNotifier {
  final UnitService _unitService = UnitService();

  List<Unit> _units = [];
  List<Unit> _deletedUnits = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<Unit> get units => _units;
  List<Unit> get deletedUnits => _deletedUnits;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Fetch active units
  Future<void> fetchUnits() async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      _units = await _unitService.fetchUnits(includeDeleted: false);

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  // Fetch deleted units
  Future<void> fetchDeletedUnits() async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      _deletedUnits = await _unitService.fetchUnits(includeDeleted: true);

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  // Create a new unit
  Future<bool> createUnit(String name) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      // Check if name already exists
      final exists = await _unitService.unitNameExists(name);
      if (exists) {
        _errorMessage = 'Unit with this name already exists';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final newUnit = await _unitService.createUnit(name);
      _units.insert(0, newUnit); // Add to beginning of list

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Update an existing unit
  Future<bool> updateUnit(int id, String name) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      // Check if name already exists (excluding current unit)
      final exists = await _unitService.unitNameExists(name, excludeId: id);
      if (exists) {
        _errorMessage = 'Unit with this name already exists';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final updatedUnit = await _unitService.updateUnit(id, name);

      // Update in local list
      final index = _units.indexWhere((unit) => unit.id == id);
      if (index != -1) {
        _units[index] = updatedUnit;
      }

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Delete a unit (soft delete)
  Future<bool> deleteUnit(int id) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      await _unitService.deleteUnit(id);

      // Remove from local list
      _units.removeWhere((unit) => unit.id == id);

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Restore a deleted unit
  Future<bool> restoreUnit(int id) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      await _unitService.restoreUnit(id);

      // Refresh list
      await fetchUnits();

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Clear error message
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
