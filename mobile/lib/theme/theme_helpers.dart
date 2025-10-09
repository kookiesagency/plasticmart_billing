import 'package:flutter/material.dart';

class ThemeHelpers {
  static Color borderColor(BuildContext context) {
    final theme = Theme.of(context);
    final shape = theme.cardTheme.shape;
    if (shape is RoundedRectangleBorder) {
      final color = shape.side.color;
      if (color.alpha != 0) {
        return color;
      }
    }
    return theme.dividerColor;
  }

  static Color mutedTextColor(BuildContext context) {
    final theme = Theme.of(context);
    return theme.brightness == Brightness.dark
        ? Colors.grey.shade400
        : Colors.grey.shade600;
  }

  static BoxDecoration cardDecoration(
    BuildContext context, {
    double radius = 16,
  }) {
    final theme = Theme.of(context);
    return BoxDecoration(
      color: theme.cardColor,
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(
        color: borderColor(context),
        width: 1,
      ),
    );
  }

  static Color tintedSurface(
    BuildContext context,
    Color base, {
    double lightOpacity = 0.08,
    double darkOpacity = 0.18,
  }) {
    final theme = Theme.of(context);
    final opacity =
        theme.brightness == Brightness.dark ? darkOpacity : lightOpacity;
    final surface = theme.cardColor;
    return Color.alphaBlend(base.withOpacity(opacity), surface);
  }
}
