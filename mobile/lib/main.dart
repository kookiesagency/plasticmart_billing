import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'config/supabase_config.dart';
import 'providers/auth_provider.dart';
import 'providers/unit_provider.dart';
import 'providers/party_provider.dart';
import 'providers/item_provider.dart';
import 'providers/invoice_provider.dart';
import 'providers/theme_provider.dart';
import 'providers/basic_mode_provider.dart';
import 'providers/item_category_provider.dart';
import 'providers/purchase_party_provider.dart';
import 'providers/language_provider.dart';
import 'theme/app_theme.dart';
import 'screens/auth/splash_screen.dart';
import 'screens/settings/categories_screen.dart';
import 'screens/purchase_parties/purchase_parties_screen.dart';
import 'screens/purchase_parties/purchase_party_details_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase
  await SupabaseConfig.initialize();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => UnitProvider()),
        ChangeNotifierProvider(create: (_) => PartyProvider()),
        ChangeNotifierProvider(create: (_) => ItemProvider()),
        ChangeNotifierProvider(create: (_) => InvoiceProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => BasicModeProvider()),
        ChangeNotifierProvider(create: (_) => ItemCategoryProvider()),
        ChangeNotifierProvider(create: (_) => PurchasePartyProvider()),
        ChangeNotifierProvider(create: (_) => LanguageProvider()),
      ],
      child: Consumer2<ThemeProvider, LanguageProvider>(
        builder: (context, themeProvider, languageProvider, _) {
          final themeMode = themeProvider.isInitialized
              ? themeProvider.themeMode
              : ThemeMode.light;

          return MaterialApp(
            title: 'PlasticMart Billing',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light(),
            darkTheme: AppTheme.dark(),
            themeMode: themeMode,
            locale: languageProvider.locale,
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [
              Locale('en'), // English
              Locale('hi'), // Hindi
              Locale('ur'), // Urdu
            ],
            home: const SplashScreen(),
            routes: {
              '/categories': (context) => const CategoriesScreen(),
              '/purchase-parties': (context) => const PurchasePartiesScreen(showAppBar: true),
              '/purchase-party-details': (context) => const PurchasePartyDetailsScreen(),
            },
          );
        },
      ),
    );
  }
}
