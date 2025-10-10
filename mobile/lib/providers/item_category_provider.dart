import 'package:flutter/foundation.dart';
import '../models/item_category.dart';
import '../services/item_category_service.dart';

class ItemCategoryProvider with ChangeNotifier {
  final ItemCategoryService _categoryService = ItemCategoryService();

  List<ItemCategory> _categories = [];
  List<ItemCategory> _deletedCategories = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<ItemCategory> get categories => _categories;
  List<ItemCategory> get deletedCategories => _deletedCategories;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Fetch active categories
  Future<void> fetchCategories() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _categories = await _categoryService.fetchCategories();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  // Fetch deleted categories
  Future<void> fetchDeletedCategories() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _deletedCategories = await _categoryService.fetchCategories(includeDeleted: true);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  // Create a new category
  Future<void> createCategory(String name, {String? description}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _categoryService.createCategory(name, description: description);
      await fetchCategories();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  // Update an existing category
  Future<void> updateCategory(int id, String name, {String? description}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _categoryService.updateCategory(id, name, description: description);
      await fetchCategories();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  // Soft delete a category
  Future<void> deleteCategory(int id) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _categoryService.deleteCategory(id);
      await fetchCategories();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  // Restore a deleted category
  Future<void> restoreCategory(int id) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _categoryService.restoreCategory(id);
      await fetchDeletedCategories();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  // Permanently delete a category
  Future<void> permanentlyDeleteCategory(int id) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _categoryService.permanentlyDeleteCategory(id);
      await fetchDeletedCategories();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  // Check if category name exists
  Future<bool> categoryNameExists(String name, {int? excludeId}) async {
    try {
      return await _categoryService.categoryNameExists(name, excludeId: excludeId);
    } catch (e) {
      return false;
    }
  }

  // Check if category is in use
  Future<bool> isCategoryInUse(int categoryId) async {
    try {
      return await _categoryService.isCategoryInUse(categoryId);
    } catch (e) {
      return false;
    }
  }
}
