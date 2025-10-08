import '../config/supabase_config.dart';
import '../models/app_setting.dart';

class AppSettingsService {
  final _supabase = SupabaseConfig.client;

  // Fetch a setting by key
  Future<String?> getSetting(String key) async {
    try {
      final response = await _supabase
          .from('app_settings')
          .select('value')
          .eq('key', key)
          .maybeSingle();

      if (response == null) return null;
      return response['value'] as String;
    } catch (e) {
      throw Exception('Failed to fetch setting: $e');
    }
  }

  // Save or update a setting
  Future<void> setSetting(String key, String value) async {
    try {
      await _supabase
          .from('app_settings')
          .upsert({'key': key, 'value': value});
    } catch (e) {
      throw Exception('Failed to save setting: $e');
    }
  }

  // Get default bundle rate (with default value of 150)
  Future<double> getDefaultBundleRate() async {
    try {
      final value = await getSetting('default_bundle_rate');
      return value != null ? double.parse(value) : 150.0;
    } catch (e) {
      return 150.0; // Return default if parsing fails
    }
  }

  // Save default bundle rate
  Future<void> setDefaultBundleRate(double rate) async {
    await setSetting('default_bundle_rate', rate.toString());
  }
}
