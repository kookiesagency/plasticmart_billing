import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/theme_provider.dart';
import '../../providers/basic_mode_provider.dart';
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load bundle rate: $e'),
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
              const Text(
                'Default Bundle Rate',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _bundleRateController,
                decoration: InputDecoration(
                  labelText: 'Bundle Rate',
                  labelStyle: theme.textTheme.bodySmall?.copyWith(
                    color: isDarkTheme
                        ? Colors.grey.shade400
                        : Colors.grey.shade600,
                  ),
                  hintText: 'Enter default bundle rate',
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
                    child: const Text(
                      'Cancel',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  FilledButton(
                    onPressed: () => _saveBundleRate(),
                    child: const Text(
                      'Save',
                      style: TextStyle(
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
    final rateText = _bundleRateController.text.trim();
    if (rateText.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a valid rate'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final rate = double.tryParse(rateText);
    if (rate == null || rate < 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a valid positive number'),
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
        const SnackBar(
          content: Text('Bundle rate saved successfully'),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to save bundle rate: $e'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;
    final isDarkTheme = theme.brightness == Brightness.dark;
    final themeProvider = context.watch<ThemeProvider>();
    final basicModeProvider = context.watch<BasicModeProvider>();

    return Container(
      color: theme.scaffoldBackgroundColor,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Appearance',
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
            title: 'Dark Mode',
            subtitle: themeProvider.isDarkMode
                ? 'Dark theme enabled'
                : 'Light theme enabled',
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
            title: 'Basic Mode',
            subtitle: basicModeProvider.isBasicMode
                ? 'Simple mode - Manage items & parties only'
                : 'Full mode - All features enabled',
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
          const SizedBox(height: 24),
          Text(
            'General Settings',
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
            title: 'Default Bundle Rate',
            subtitle: _loading
                ? 'Loading...'
                : '₹${_currentBundleRate.toStringAsFixed(2)}',
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: _showBundleRateDialog,
          ),
          const SizedBox(height: 24),
          Text(
            'Master Data',
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
            title: 'Units',
            subtitle: 'Manage measurement units',
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const UnitsScreen()),
              );
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
