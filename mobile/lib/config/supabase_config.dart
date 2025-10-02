import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseConfig {
  static const String supabaseUrl = 'https://tvcccqwruriegnnhaphi.supabase.co';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Y2NjcXdydXJpZWdubmhhcGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NTM5OTQsImV4cCI6MjA2NjAyOTk5NH0.dFp7DdHahOMezwhzmgJv5jWu-y_9kgyKyp5nW6BpFVM';

  static Future<void> initialize() async {
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    );
  }

  static SupabaseClient get client => Supabase.instance.client;
}
