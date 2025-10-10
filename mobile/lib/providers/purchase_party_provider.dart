import 'package:flutter/foundation.dart';
import '../models/purchase_party.dart';
import '../services/purchase_party_service.dart';

class PurchasePartyProvider with ChangeNotifier {
  final PurchasePartyService _purchasePartyService = PurchasePartyService();

  List<PurchaseParty> _purchaseParties = [];
  List<PurchaseParty> _deletedPurchaseParties = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<PurchaseParty> get purchaseParties => _purchaseParties;
  List<PurchaseParty> get deletedPurchaseParties => _deletedPurchaseParties;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Fetch active purchase parties
  Future<void> fetchPurchaseParties() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _purchaseParties = await _purchasePartyService.fetchPurchaseParties();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  // Fetch deleted purchase parties
  Future<void> fetchDeletedPurchaseParties() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _deletedPurchaseParties = await _purchasePartyService.fetchPurchaseParties(includeDeleted: true);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  // Create a new purchase party
  Future<void> createPurchaseParty(String partyCode, String name) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _purchasePartyService.createPurchaseParty(partyCode, name);
      await fetchPurchaseParties();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  // Update an existing purchase party
  Future<void> updatePurchaseParty(int id, String partyCode, String name) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _purchasePartyService.updatePurchaseParty(id, partyCode, name);
      await fetchPurchaseParties();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  // Soft delete a purchase party
  Future<void> deletePurchaseParty(int id) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _purchasePartyService.deletePurchaseParty(id);
      await fetchPurchaseParties();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  // Restore a deleted purchase party
  Future<void> restorePurchaseParty(int id) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _purchasePartyService.restorePurchaseParty(id);
      await fetchDeletedPurchaseParties();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  // Permanently delete a purchase party
  Future<void> permanentlyDeletePurchaseParty(int id) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _purchasePartyService.permanentlyDeletePurchaseParty(id);
      await fetchDeletedPurchaseParties();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  // Check if party code exists
  Future<bool> partyCodeExists(String partyCode, {int? excludeId}) async {
    try {
      return await _purchasePartyService.partyCodeExists(partyCode, excludeId: excludeId);
    } catch (e) {
      return false;
    }
  }

  // Check if purchase party is in use
  Future<bool> isPurchasePartyInUse(int purchasePartyId) async {
    try {
      return await _purchasePartyService.isPurchasePartyInUse(purchasePartyId);
    } catch (e) {
      return false;
    }
  }

  // Fetch items for a specific purchase party
  Future<List<Map<String, dynamic>>> fetchPurchasePartyItems(
    int purchasePartyId, {
    int? categoryId,
  }) async {
    try {
      return await _purchasePartyService.fetchPurchasePartyItems(
        purchasePartyId,
        categoryId: categoryId,
      );
    } catch (e) {
      _errorMessage = e.toString();
      rethrow;
    }
  }
}
