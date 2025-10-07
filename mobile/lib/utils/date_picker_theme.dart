import 'package:flutter/material.dart';

/// Reusable date picker theme for consistent styling across the app
/// Usage: Wrap the showDatePicker with this theme builder
class DatePickerTheme {
  static Widget buildTheme(BuildContext context, Widget? child) {
    return Theme(
      data: Theme.of(context).copyWith(
        colorScheme: ColorScheme.light(
          primary: Theme.of(context).colorScheme.primary,
          onPrimary: Colors.white,
          surface: Colors.white,
          onSurface: Colors.black,
        ),
        dialogBackgroundColor: Colors.white,
        dialogTheme: const DialogTheme(
          backgroundColor: Colors.white,
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(8)),
          ),
        ),
        dividerColor: Colors.grey,
        dividerTheme: const DividerThemeData(
          color: Colors.grey,
          thickness: 1,
        ),
      ),
      child: child!,
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
