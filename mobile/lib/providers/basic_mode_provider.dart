import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class BasicModeProvider extends ChangeNotifier {
  static const _basicModeKey = 'basicMode';

  bool _isBasicMode = false;
  bool _initialized = false;

  BasicModeProvider() {
    _loadBasicMode();
  }

  bool get isBasicMode => _isBasicMode;

  bool get isInitialized => _initialized;

  Future<void> toggleBasicMode(bool isBasic) async {
    if (_isBasicMode == isBasic) return;

    _isBasicMode = isBasic;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_basicModeKey, isBasic);
  }

  Future<void> _loadBasicMode() async {
    final prefs = await SharedPreferences.getInstance();
    _isBasicMode = prefs.getBool(_basicModeKey) ?? true; // Default to Basic Mode

    _initialized = true;
    notifyListeners();
  }
}
