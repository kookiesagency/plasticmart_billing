import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LanguageProvider with ChangeNotifier {
  Locale _locale = const Locale('en'); // Default to English
  static const String _languageKey = 'selected_language';

  Locale get locale => _locale;

  LanguageProvider() {
    _loadSavedLanguage();
  }

  // Load saved language from SharedPreferences
  Future<void> _loadSavedLanguage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final languageCode = prefs.getString(_languageKey);

      if (languageCode != null) {
        _locale = Locale(languageCode);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error loading saved language: $e');
    }
  }

  // Set new language and save to SharedPreferences
  Future<void> setLanguage(String languageCode) async {
    if (_locale.languageCode == languageCode) return;

    try {
      _locale = Locale(languageCode);
      notifyListeners();

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_languageKey, languageCode);
    } catch (e) {
      debugPrint('Error saving language: $e');
    }
  }

  // Clear saved language (reset to default)
  Future<void> clearLanguage() async {
    try {
      _locale = const Locale('en');
      notifyListeners();

      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_languageKey);
    } catch (e) {
      debugPrint('Error clearing language: $e');
    }
  }

  // Check if a specific language is currently selected
  bool isLanguageSelected(String languageCode) {
    return _locale.languageCode == languageCode;
  }

  // Get display name for language
  String getLanguageDisplayName(String languageCode) {
    switch (languageCode) {
      case 'en':
        return 'English';
      case 'hi':
        return 'हिन्दी (Hindi)';
      case 'ur':
        return 'اردو (Urdu)';
      default:
        return 'English';
    }
  }
}
