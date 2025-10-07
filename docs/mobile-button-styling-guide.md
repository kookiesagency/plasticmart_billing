# Mobile App Button Styling Guide

This document provides the standard button styles used throughout the PlasticMart mobile application to ensure consistency across all screens.

## Overview

All buttons in the app follow a consistent design pattern:
- **Border Radius**: 12px
- **Font Size**: 16px
- **Font Weight**: 600 (semi-bold)
- **Vertical Padding**: 16px for full-width buttons, 12px for dialog buttons
- **Horizontal Padding**: 24px for dialog buttons

## Primary Action Button (ElevatedButton)

Use this style for primary actions like "Save", "Create", "Update", etc.

### Full-Width Button

```dart
SizedBox(
  width: double.infinity,
  child: ElevatedButton(
    onPressed: () {
      // Action
    },
    style: ElevatedButton.styleFrom(
      backgroundColor: Theme.of(context).colorScheme.primary,
      foregroundColor: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    ),
    child: const Text(
      'Button Text',
      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
    ),
  ),
)
```

### Full-Width Button with Icon

```dart
SizedBox(
  width: double.infinity,
  child: ElevatedButton.icon(
    onPressed: () {
      // Action
    },
    style: ElevatedButton.styleFrom(
      backgroundColor: Theme.of(context).colorScheme.primary,
      foregroundColor: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    ),
    icon: const Icon(Icons.add),
    label: const Text(
      'Button Text',
      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
    ),
  ),
)
```

### Dialog Button

```dart
ElevatedButton(
  onPressed: () {
    // Action
  },
  style: ElevatedButton.styleFrom(
    backgroundColor: Theme.of(context).colorScheme.primary,
    foregroundColor: Colors.white,
    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
  ),
  child: const Text(
    'Save',
    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
  ),
)
```

### Button with Loading State

```dart
ElevatedButton(
  onPressed: _isLoading ? null : _saveAction,
  style: ElevatedButton.styleFrom(
    backgroundColor: Theme.of(context).colorScheme.primary,
    foregroundColor: Colors.white,
    padding: const EdgeInsets.symmetric(vertical: 16),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
  ),
  child: _isLoading
      ? const SizedBox(
          height: 20,
          width: 20,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
          ),
        )
      : const Text(
          'Create Party',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
)
```

## Destructive Action Button (Red)

Use this style for destructive actions like "Delete", "Remove", etc.

### Dialog Delete Button

```dart
ElevatedButton(
  onPressed: () => Navigator.pop(context, true),
  style: ElevatedButton.styleFrom(
    backgroundColor: Colors.red,
    foregroundColor: Colors.white,
    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
  ),
  child: const Text(
    'Delete',
    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
  ),
)
```

## Secondary Action Button (OutlinedButton)

Use this style for secondary actions like "Back", "Cancel" (when styled as a button), etc.

### Full-Width Outlined Button

```dart
SizedBox(
  width: double.infinity,
  child: OutlinedButton(
    onPressed: () {
      // Action
    },
    style: OutlinedButton.styleFrom(
      padding: const EdgeInsets.symmetric(vertical: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      side: BorderSide(color: Theme.of(context).colorScheme.primary),
    ),
    child: const Text(
      'Back',
      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
    ),
  ),
)
```

### Outlined Button with Icon

```dart
OutlinedButton.icon(
  onPressed: () {
    // Action
  },
  style: OutlinedButton.styleFrom(
    padding: const EdgeInsets.symmetric(vertical: 16),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
    side: BorderSide(color: Theme.of(context).colorScheme.primary),
  ),
  icon: const Icon(Icons.share),
  label: const Text(
    'Share',
    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
  ),
)
```

## Text Button

Use TextButton for cancel actions in dialogs or less prominent actions.

```dart
TextButton(
  onPressed: () => Navigator.pop(context),
  child: const Text('Cancel'),
)
```

## Best Practices

1. **Consistency**: Always use these standard styles to maintain visual consistency
2. **Full Width**: Use `SizedBox(width: double.infinity)` wrapper for full-width buttons
3. **Loading States**: Show CircularProgressIndicator during async operations
4. **Disabled State**: Set `onPressed: null` to disable a button
5. **Color Usage**:
   - Primary color for main actions
   - Red for destructive actions
   - Outlined for secondary actions
6. **Spacing**: Use `const SizedBox(height: 16)` or `const SizedBox(height: 24)` between buttons

## Examples in the Codebase

- **Create Party**: `/mobile/lib/screens/parties/add_edit_party_screen.dart:172`
- **Dialog Save Button**: `/mobile/lib/screens/settings/parties_screen.dart:128`
- **Dialog Delete Button**: `/mobile/lib/screens/settings/parties_screen.dart:218`
- **Full Width with Loading**: `/mobile/lib/screens/items/add_edit_item_screen.dart:764`
- **Outlined Button**: `/mobile/lib/screens/invoices/create_invoice_screen.dart:353`

## Migration from FilledButton

The app previously used `FilledButton` which has been replaced with `ElevatedButton` for better consistency. When updating old code:

**Before:**
```dart
FilledButton(
  onPressed: () {},
  child: const Text('Save'),
)
```

**After:**
```dart
ElevatedButton(
  onPressed: () {},
  style: ElevatedButton.styleFrom(
    backgroundColor: Theme.of(context).colorScheme.primary,
    foregroundColor: Colors.white,
    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
  ),
  child: const Text(
    'Save',
    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
  ),
)
```
