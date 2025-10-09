import 'package:flutter/material.dart';

class AppButtonStyles {
  static ButtonStyle primaryElevated(
    BuildContext context, {
    EdgeInsetsGeometry? padding,
  }) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    final background = isDark
        ? Color.alphaBlend(
            colorScheme.primary.withOpacity(0.32),
            colorScheme.surface,
          )
        : colorScheme.primary;
    final foreground = isDark ? colorScheme.onSurface : colorScheme.onPrimary;

    return ElevatedButton.styleFrom(
      backgroundColor: background,
      foregroundColor: foreground,
      padding: padding ?? const EdgeInsets.symmetric(vertical: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    ).copyWith(
      overlayColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.pressed)) {
          return colorScheme.primary.withOpacity(isDark ? 0.25 : 0.15);
        }
        if (states.contains(MaterialState.hovered) ||
            states.contains(MaterialState.focused)) {
          return colorScheme.primary.withOpacity(isDark ? 0.2 : 0.1);
        }
        return null;
      }),
    );
  }

  static ButtonStyle primaryOutlined(
    BuildContext context, {
    EdgeInsetsGeometry? padding,
  }) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    // Use the same color as elevated button for border
    final borderColor = isDark
        ? Color.alphaBlend(
            colorScheme.primary.withOpacity(0.32),
            colorScheme.surface,
          )
        : colorScheme.primary;

    final background = isDark
        ? Color.alphaBlend(
            colorScheme.primary.withOpacity(0.08),
            theme.scaffoldBackgroundColor,
          )
        : Colors.transparent;

    return OutlinedButton.styleFrom(
      padding: padding ?? const EdgeInsets.symmetric(vertical: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      side: BorderSide(color: borderColor, width: 1.5),
      backgroundColor: background,
      foregroundColor: isDark ? colorScheme.onSurface : colorScheme.primary,
    ).copyWith(
      overlayColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.pressed) ||
            states.contains(MaterialState.hovered) ||
            states.contains(MaterialState.focused)) {
          return colorScheme.primary.withOpacity(isDark ? 0.25 : 0.12);
        }
        return null;
      }),
    );
  }
}
