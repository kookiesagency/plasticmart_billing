import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

import '../../providers/theme_provider.dart';
import '../../providers/basic_mode_provider.dart';
import '../../providers/language_provider.dart';
import '../../services/app_settings_service.dart';
import '../../theme/app_button_styles.dart';
import 'units_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _bundleRateController = TextEditingController();
  final _appSettingsService = AppSettingsService();
  bool _loading = false;
  double _currentBundleRate = 150.0;

  @override
  void initState() {
    super.initState();
    _loadBundleRate();
  }

  Future<void> _loadBundleRate() async {
    setState(() => _loading = true);
    try {
      final rate = await _appSettingsService.getDefaultBundleRate();
      setState(() => _currentBundleRate = rate);
    } catch (e) {
      if (mounted) {
        final l10n = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${l10n.settings_bundleRateLoadFailed}: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _bundleRateController.dispose();
    super.dispose();
  }

  void _showBundleRateDialog() {
    _bundleRateController.text = _currentBundleRate.toString();
    final l10n = AppLocalizations.of(context)!;

    showDialog(
      context: context,
      builder: (context) {
        final theme = Theme.of(context);
        final colorScheme = theme.colorScheme;
        final isDarkTheme = theme.brightness == Brightness.dark;

        return Dialog(
          child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.settings_defaultBundleRate,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _bundleRateController,
                decoration: InputDecoration(
                  labelText: l10n.settings_bundleRateLabel,
                  labelStyle: theme.textTheme.bodySmall?.copyWith(
                    color: isDarkTheme
                        ? Colors.grey.shade400
                        : Colors.grey.shade600,
                  ),
                  hintText: l10n.settings_bundleRateHint,
                  hintStyle: theme.textTheme.bodySmall?.copyWith(
                    color: isDarkTheme
                        ? Colors.grey.shade600
                        : Colors.grey.shade400,
                  ),
                  prefixIcon: Icon(
                    Icons.currency_rupee,
                    color: colorScheme.primary,
                    size: 20,
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 16,
                  ),
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                autofocus: true,
                style: theme.textTheme.bodyLarge?.copyWith(fontSize: 16),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    style: TextButton.styleFrom(
                      foregroundColor: isDarkTheme
                          ? Colors.grey.shade300
                          : Colors.grey.shade700,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 12,
                      ),
                    ),
                    child: Text(
                      l10n.common_cancel,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  FilledButton(
                    onPressed: () => _saveBundleRate(),
                    child: Text(
                      l10n.common_save,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        );
      },
    );
  }

  Future<void> _saveBundleRate() async {
    final l10n = AppLocalizations.of(context)!;
    final rateText = _bundleRateController.text.trim();
    if (rateText.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10n.settings_enterValidRate),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final rate = double.tryParse(rateText);
    if (rate == null || rate < 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10n.settings_enterPositiveNumber),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    try {
      await _appSettingsService.setDefaultBundleRate(rate);
      setState(() => _currentBundleRate = rate);

      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10n.settings_bundleRateSaveSuccess),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${l10n.settings_bundleRateSaveFailed}: $e'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _showLanguageSelector(LanguageProvider languageProvider) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    final isDarkTheme = theme.brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      backgroundColor: theme.cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    l10n.settings_selectLanguage,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _buildLanguageOption(
                context: context,
                languageProvider: languageProvider,
                languageCode: 'en',
                title: 'English',
                subtitle: 'English',
                isDarkTheme: isDarkTheme,
              ),
              const SizedBox(height: 12),
              _buildLanguageOption(
                context: context,
                languageProvider: languageProvider,
                languageCode: 'hi',
                title: 'हिन्दी',
                subtitle: 'Hindi',
                isDarkTheme: isDarkTheme,
              ),
              const SizedBox(height: 12),
              _buildLanguageOption(
                context: context,
                languageProvider: languageProvider,
                languageCode: 'ur',
                title: 'اردو',
                subtitle: 'Urdu',
                isDarkTheme: isDarkTheme,
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  Widget _buildLanguageOption({
    required BuildContext context,
    required LanguageProvider languageProvider,
    required String languageCode,
    required String title,
    required String subtitle,
    required bool isDarkTheme,
  }) {
    final theme = Theme.of(context);
    final isSelected = languageProvider.isLanguageSelected(languageCode);

    return InkWell(
      onTap: () async {
        await languageProvider.setLanguage(languageCode);
        if (context.mounted) {
          final l10n = AppLocalizations.of(context)!;
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(l10n.settings_languageChanged(title)),
              backgroundColor: Colors.green,
              behavior: SnackBarBehavior.floating,
              duration: const Duration(seconds: 2),
            ),
          );
        }
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? theme.colorScheme.primary.withOpacity(0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? theme.colorScheme.primary
                : (isDarkTheme ? Colors.white.withOpacity(0.1) : Colors.grey.shade200),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                      color: isSelected ? theme.colorScheme.primary : null,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontSize: 12,
                      color: isDarkTheme
                          ? Colors.grey.shade400
                          : Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(
                Icons.check_circle,
                color: theme.colorScheme.primary,
                size: 24,
              ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;
    final isDarkTheme = theme.brightness == Brightness.dark;
    final themeProvider = context.watch<ThemeProvider>();
    final basicModeProvider = context.watch<BasicModeProvider>();
    final languageProvider = context.watch<LanguageProvider>();

    return Container(
      color: theme.scaffoldBackgroundColor,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            l10n.settings_appearance,
            style: textTheme.labelLarge?.copyWith(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: isDarkTheme ? Colors.grey.shade300 : Colors.grey.shade700,
            ),
          ),
          const SizedBox(height: 12),
          _buildSettingCard(
            icon: Icons.dark_mode_outlined,
            iconColor: const Color(0xFF8B5CF6),
            title: l10n.settings_darkMode,
            subtitle: themeProvider.isDarkMode
                ? l10n.settings_darkModeEnabled
                : l10n.settings_lightModeEnabled,
            trailing: Transform.scale(
              scale: 0.8,
              child: Switch(
                value: themeProvider.isDarkMode,
                onChanged: themeProvider.toggleTheme,
                activeColor: colorScheme.primary,
                activeTrackColor: colorScheme.primary.withOpacity(0.5),
                inactiveThumbColor: Colors.grey.shade400,
                inactiveTrackColor: Colors.grey.shade300,
              ),
            ),
          ),
          const SizedBox(height: 12),
          _buildSettingCard(
            icon: Icons.visibility_outlined,
            iconColor: const Color(0xFF3B82F6),
            title: l10n.settings_basicMode,
            subtitle: basicModeProvider.isBasicMode
                ? l10n.settings_basicModeEnabled
                : l10n.settings_fullModeEnabled,
            trailing: Transform.scale(
              scale: 0.8,
              child: Switch(
                value: basicModeProvider.isBasicMode,
                onChanged: basicModeProvider.toggleBasicMode,
                activeColor: colorScheme.primary,
                activeTrackColor: colorScheme.primary.withOpacity(0.5),
                inactiveThumbColor: Colors.grey.shade400,
                inactiveTrackColor: Colors.grey.shade300,
              ),
            ),
          ),
          const SizedBox(height: 12),
          _buildSettingCard(
            icon: Icons.language_outlined,
            iconColor: const Color(0xFFEF4444),
            title: l10n.settings_language,
            subtitle: languageProvider.getLanguageDisplayName(languageProvider.locale.languageCode),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () => _showLanguageSelector(languageProvider),
          ),
          const SizedBox(height: 24),
          Text(
            l10n.settings_generalSettings,
            style: textTheme.labelLarge?.copyWith(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: isDarkTheme ? Colors.grey.shade300 : Colors.grey.shade700,
            ),
          ),
          const SizedBox(height: 12),
          _buildSettingCard(
            icon: Icons.currency_rupee,
            iconColor: const Color(0xFF10B981),
            title: l10n.settings_defaultBundleRate,
            subtitle: _loading
                ? l10n.common_loading
                : '₹${_currentBundleRate.toStringAsFixed(2)}',
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: _showBundleRateDialog,
          ),
          const SizedBox(height: 24),
          Text(
            l10n.settings_masterData,
            style: textTheme.labelLarge?.copyWith(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: isDarkTheme ? Colors.grey.shade300 : Colors.grey.shade700,
            ),
          ),
          const SizedBox(height: 12),
          _buildSettingCard(
            icon: Icons.straighten_outlined,
            iconColor: const Color(0xFFF59E0B),
            title: l10n.settings_units,
            subtitle: l10n.settings_manageUnits,
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const UnitsScreen()),
              );
            },
          ),
          const SizedBox(height: 12),
          _buildSettingCard(
            icon: Icons.category_outlined,
            iconColor: const Color(0xFF8B5CF6),
            title: l10n.settings_itemCategories,
            subtitle: l10n.settings_manageCategories,
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () {
              Navigator.pushNamed(context, '/categories');
            },
          ),
          const SizedBox(height: 12),
          _buildSettingCard(
            icon: Icons.business_outlined,
            iconColor: const Color(0xFF3B82F6),
            title: l10n.settings_purchaseParties,
            subtitle: l10n.settings_managePurchaseParties,
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () {
              Navigator.pushNamed(context, '/purchase-parties');
            },
          ),
        ],
      ),
    );
  }

  Widget _buildSettingCard({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    Widget? trailing,
    VoidCallback? onTap,
  }) {
    final theme = Theme.of(context);
    final isDarkTheme = theme.brightness == Brightness.dark;
    final cardColor = theme.cardColor;
    final borderColor = isDarkTheme ? Colors.white.withOpacity(0.05) : Colors.grey.shade100;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor),
          boxShadow: [
            if (!isDarkTheme)
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: iconColor.withOpacity(isDarkTheme ? 0.2 : 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                icon,
                color: iconColor,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontSize: 12,
                      color: isDarkTheme
                          ? Colors.grey.shade400
                          : Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            if (trailing != null) ...[
              const SizedBox(width: 8),
              trailing,
            ],
          ],
        ),
      ),
    );
  }
}
