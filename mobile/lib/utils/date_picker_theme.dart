import 'package:flutter/material.dart';

/// Reusable date picker theme for consistent styling across the app
/// Usage: Wrap the showDatePicker with this theme builder
class DatePickerTheme {
  static Widget buildTheme(BuildContext context, Widget? child) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    final dividerColor = isDark ? Colors.white24 : Colors.grey.shade200;

    return Theme(
      data: theme.copyWith(
        colorScheme: colorScheme.copyWith(
          primary: colorScheme.primary,
          onPrimary: colorScheme.onPrimary,
          surface: theme.cardColor,
          onSurface: colorScheme.onSurface,
        ),
        dialogBackgroundColor: theme.cardColor,
        dialogTheme: theme.dialogTheme.copyWith(
          backgroundColor: theme.cardColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: colorScheme.primary,
          ),
        ),
        dividerTheme: DividerThemeData(
          color: dividerColor,
          thickness: 1,
          space: 1,
        ),
      ),
      child: child ?? const SizedBox.shrink(),
    );
  }
}

/// Helper function to show date picker with consistent theme
Future<DateTime?> showAppDatePicker({
  required BuildContext context,
  required DateTime initialDate,
  DateTime? firstDate,
  DateTime? lastDate,
}) {
  return showDatePicker(
    context: context,
    initialDate: initialDate,
    firstDate: firstDate ?? DateTime(2020),
    lastDate: lastDate ?? DateTime(2100),
    builder: DatePickerTheme.buildTheme,
  );
}
