import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum AppMode { basic, advanced }

class AppModeProvider with ChangeNotifier {
  AppMode _mode = AppMode.basic;
  static const String _modeKey = 'app_mode';

  AppMode get mode => _mode;
  bool get isBasicMode => _mode == AppMode.basic;
  bool get isAdvancedMode => _mode == AppMode.advanced;

  AppModeProvider() {
    _loadMode();
  }

  Future<void> _loadMode() async {
    final prefs = await SharedPreferences.getInstance();
    final savedMode = prefs.getString(_modeKey);
    if (savedMode != null) {
      _mode = AppMode.values.firstWhere(
        (mode) => mode.toString() == savedMode,
        orElse: () => AppMode.basic,
      );
      notifyListeners();
    }
  }

  Future<void> toggleMode() async {
    _mode = _mode == AppMode.basic ? AppMode.advanced : AppMode.basic;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_modeKey, _mode.toString());
    notifyListeners();
  }

  Future<void> setMode(AppMode mode) async {
    _mode = mode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_modeKey, mode.toString());
    notifyListeners();
  }
}
