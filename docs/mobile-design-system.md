# Mobile App Design System

Complete design system and UI component guidelines for PlasticMart mobile application. Use this as a reference to maintain consistency across all screens.

---

## 🎨 **Design Tokens**

### **Colors**
```dart
// Primary Colors (from theme)
Theme.of(context).colorScheme.primary      // Main brand color
Theme.of(context).colorScheme.secondary    // Accent color

// Semantic Colors
Colors.red                                 // Error/Destructive actions
Colors.green                               // Success/Paid status
Colors.orange                              // Warning/Pending status
Colors.amber                               // Partial payment status

// Background Colors (Theme-aware)
Theme.of(context).scaffoldBackgroundColor  // Screen background
Theme.of(context).cardColor                // Card backgrounds
Theme.of(context).dialogBackgroundColor    // Dialog backgrounds
```

### **Typography**
```dart
// Headings
fontSize: 24, fontWeight: FontWeight.bold     // Page titles
fontSize: 18, fontWeight: FontWeight.w600     // Section headers
fontSize: 16, fontWeight: FontWeight.w600     // Card titles, buttons

// Body Text
fontSize: 16, fontWeight: FontWeight.normal   // Regular text
fontSize: 14, fontWeight: FontWeight.normal   // Secondary text
fontSize: 12, fontWeight: FontWeight.normal   // Captions, timestamps
```

### **Spacing**
```dart
const EdgeInsets.all(4)         // Minimal spacing
const EdgeInsets.all(8)         // Tight spacing
const EdgeInsets.all(12)        // Compact spacing
const EdgeInsets.all(16)        // Standard spacing (most common)
const EdgeInsets.all(24)        // Loose spacing
const EdgeInsets.all(32)        // Extra loose spacing

// Vertical gaps between elements
const SizedBox(height: 8)       // Small gap
const SizedBox(height: 16)      // Standard gap
const SizedBox(height: 24)      // Large gap
```

### **Border Radius**
```dart
BorderRadius.circular(8)        // Small radius (chips, badges)
BorderRadius.circular(12)       // Standard radius (buttons, inputs, cards)
BorderRadius.circular(16)       // Large radius (large cards)
BorderRadius.circular(20)       // Extra large radius (bottom sheets)
```

---

## 🔘 **Buttons**

### **Primary Action Button (ElevatedButton)**
Use for main actions like Save, Create, Update.

**Full-Width Button:**
```dart
SizedBox(
  width: double.infinity,
  child: ElevatedButton(
    onPressed: () {},
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

**Button with Icon:**
```dart
ElevatedButton.icon(
  onPressed: () {},
  style: ElevatedButton.styleFrom(
    backgroundColor: Theme.of(context).colorScheme.primary,
    foregroundColor: Colors.white,
    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
  ),
  icon: const Icon(Icons.add),
  label: const Text(
    'Add Item',
    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
  ),
)
```

**Button with Loading State:**
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
          'Save',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
)
```

### **Destructive Action Button (Red)**
Use for delete, remove actions.

```dart
ElevatedButton(
  onPressed: () {},
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

### **Secondary Action Button (OutlinedButton)**
Use for back, cancel, secondary actions.

```dart
OutlinedButton(
  onPressed: () {},
  style: OutlinedButton.styleFrom(
    padding: const EdgeInsets.symmetric(vertical: 16),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
    side: BorderSide(color: Theme.of(context).colorScheme.primary),
  ),
  child: const Text(
    'Cancel',
    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
  ),
)
```

### **Text Button**
Use for less prominent actions in dialogs.

```dart
TextButton(
  onPressed: () => Navigator.pop(context),
  child: const Text('Cancel'),
)
```

---

## 📝 **Form Inputs**

### **Text Input Field (TextFormField)**
Standard text input with consistent styling.

**Basic Input:**
```dart
TextFormField(
  decoration: InputDecoration(
    labelText: 'Party Name',
    hintText: 'Enter party name',
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
    ),
    contentPadding: const EdgeInsets.symmetric(
      horizontal: 16,
      vertical: 16,
    ),
  ),
  validator: (value) {
    if (value == null || value.isEmpty) {
      return 'Please enter party name';
    }
    return null;
  },
)
```

**Input with Prefix Icon:**
```dart
TextFormField(
  decoration: InputDecoration(
    labelText: 'Phone Number',
    hintText: 'Enter phone number',
    prefixIcon: const Icon(Icons.phone_outlined),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
    ),
    contentPadding: const EdgeInsets.symmetric(
      horizontal: 16,
      vertical: 16,
    ),
  ),
  keyboardType: TextInputType.phone,
)
```

**Number Input:**
```dart
TextFormField(
  decoration: InputDecoration(
    labelText: 'Amount',
    hintText: 'Enter amount',
    prefixIcon: const Icon(Icons.currency_rupee),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
    ),
  ),
  keyboardType: TextInputType.number,
  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
)
```

**Multiline Input:**
```dart
TextFormField(
  decoration: InputDecoration(
    labelText: 'Notes',
    hintText: 'Add notes (optional)',
    alignLabelWithHint: true,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
    ),
    contentPadding: const EdgeInsets.all(16),
  ),
  maxLines: 3,
  textAlignVertical: TextAlignVertical.top,
)
```

---

## 📅 **Date Pickers**

### **Date Input Field**
Consistent date picker styling with calendar icon.

```dart
TextFormField(
  controller: _dateController,
  decoration: InputDecoration(
    labelText: 'Invoice Date',
    hintText: 'Select date',
    prefixIcon: const Icon(Icons.calendar_today_outlined),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
    ),
    contentPadding: const EdgeInsets.symmetric(
      horizontal: 16,
      vertical: 16,
    ),
  ),
  readOnly: true,
  onTap: () async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            dialogBackgroundColor: Theme.of(context).cardColor,
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _dateController.text = DateFormat('dd/MM/yyyy').format(picked);
      });
    }
  },
)
```

### **Date Picker Theme**
Consistent theme-aware date picker.

```dart
// Use this helper for consistent date picker styling
Future<DateTime?> showThemedDatePicker(BuildContext context) async {
  final theme = Theme.of(context);

  return await showDatePicker(
    context: context,
    initialDate: DateTime.now(),
    firstDate: DateTime(2020),
    lastDate: DateTime(2030),
    builder: (context, child) {
      return Theme(
        data: theme.copyWith(
          dialogBackgroundColor: theme.cardColor,
        ),
        child: child!,
      );
    },
  );
}
```

---

## 🎴 **Cards**

### **Standard Card**
Consistent card design with theme-aware colors.

```dart
Container(
  decoration: BoxDecoration(
    color: Theme.of(context).cardColor,
    border: Border.all(
      color: Theme.of(context).brightness == Brightness.dark
          ? Colors.grey[700]!
          : Colors.grey[300]!,
    ),
    borderRadius: BorderRadius.circular(16),
  ),
  padding: const EdgeInsets.all(16),
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      // Card content
    ],
  ),
)
```

### **List Card**
Card for list items with tap functionality.

```dart
InkWell(
  onTap: () {
    // Navigate or show details
  },
  borderRadius: BorderRadius.circular(16),
  child: Container(
    decoration: BoxDecoration(
      color: Theme.of(context).cardColor,
      border: Border.all(
        color: Theme.of(context).brightness == Brightness.dark
            ? Colors.grey[700]!
            : Colors.grey[300]!,
      ),
      borderRadius: BorderRadius.circular(16),
    ),
    padding: const EdgeInsets.all(16),
    child: Row(
      children: [
        // Card content
      ],
    ),
  ),
)
```

---

## 💬 **Dialogs**

### **Standard Dialog**
Consistent dialog with theme-aware background.

```dart
showDialog(
  context: context,
  builder: (context) => AlertDialog(
    backgroundColor: Theme.of(context).cardColor,
    title: const Text('Dialog Title'),
    content: const Text('Dialog content goes here'),
    actions: [
      TextButton(
        onPressed: () => Navigator.pop(context),
        child: const Text('Cancel'),
      ),
      ElevatedButton(
        onPressed: () {
          // Action
          Navigator.pop(context);
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
          'Confirm',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
    ],
  ),
);
```

### **Form Dialog**
Dialog with form inputs.

```dart
showDialog(
  context: context,
  builder: (context) => Dialog(
    backgroundColor: Theme.of(context).cardColor,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
    ),
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Add Party',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 16),
          TextFormField(
            decoration: InputDecoration(
              labelText: 'Name',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel'),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'Save',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    ),
  ),
);
```

---

## 📋 **Bottom Sheets**

### **Draggable Bottom Sheet**
Consistent bottom sheet for selections.

```dart
showModalBottomSheet(
  context: context,
  shape: const RoundedRectangleBorder(
    borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
  ),
  backgroundColor: Theme.of(context).cardColor,
  isScrollControlled: true,
  builder: (context) => DraggableScrollableSheet(
    initialChildSize: 0.6,
    minChildSize: 0.4,
    maxChildSize: 0.9,
    expand: false,
    builder: (context, scrollController) => Column(
      children: [
        // Drag handle
        Container(
          width: 40,
          height: 4,
          margin: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: Colors.grey[300],
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        // Content
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'Select Option',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        const SizedBox(height: 16),
        Expanded(
          child: ListView(
            controller: scrollController,
            children: [
              // List items
            ],
          ),
        ),
      ],
    ),
  ),
);
```

---

## 🏷️ **Badges**

### **Status Badges**
Consistent status indicators.

**Paid Status:**
```dart
Container(
  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
  decoration: BoxDecoration(
    color: Colors.green.withOpacity(0.1),
    borderRadius: BorderRadius.circular(8),
  ),
  child: Text(
    'Paid',
    style: TextStyle(
      color: Colors.green[700],
      fontSize: 12,
      fontWeight: FontWeight.w600,
    ),
  ),
)
```

**Pending Status:**
```dart
Container(
  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
  decoration: BoxDecoration(
    color: Colors.red.withOpacity(0.1),
    borderRadius: BorderRadius.circular(8),
  ),
  child: Text(
    'Pending',
    style: TextStyle(
      color: Colors.red[700],
      fontSize: 12,
      fontWeight: FontWeight.w600,
    ),
  ),
)
```

**Partial Status:**
```dart
Container(
  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
  decoration: BoxDecoration(
    color: Colors.orange.withOpacity(0.1),
    borderRadius: BorderRadius.circular(8),
  ),
  child: Text(
    'Partial',
    style: TextStyle(
      color: Colors.orange[700],
      fontSize: 12,
      fontWeight: FontWeight.w600,
    ),
  ),
)
```

**Offline Badge:**
```dart
Container(
  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
  decoration: BoxDecoration(
    color: Theme.of(context).brightness == Brightness.dark
        ? Colors.orange.shade900.withOpacity(0.3)
        : const Color(0xFFFFF7ED),
    borderRadius: BorderRadius.circular(8),
  ),
  child: Text(
    'OFFLINE',
    style: TextStyle(
      color: Theme.of(context).brightness == Brightness.dark
          ? Colors.orange.shade300
          : const Color(0xFFC2410C),
      fontSize: 12,
      fontWeight: FontWeight.w600,
    ),
  ),
)
```

---

## 📐 **Layout Standards**

### **Screen Padding**
```dart
// Standard screen padding
Scaffold(
  body: Padding(
    padding: const EdgeInsets.all(16),
    child: // Screen content
  ),
)
```

### **List Item Spacing**
```dart
ListView.separated(
  itemCount: items.length,
  separatorBuilder: (context, index) => const SizedBox(height: 12),
  itemBuilder: (context, index) => // List item
)
```

### **Section Spacing**
```dart
Column(
  children: [
    // Section 1
    const SizedBox(height: 24),
    // Section 2
    const SizedBox(height: 24),
    // Section 3
  ],
)
```

---

## ✅ **Best Practices**

1. **Always use theme-aware colors** - Use `Theme.of(context)` instead of hardcoded colors
2. **Consistent border radius** - 12px for buttons/inputs, 16px for cards
3. **Proper spacing** - 16px standard padding, 16px vertical gaps between elements
4. **Font weights** - 600 for headings/buttons, normal for body text
5. **Loading states** - Show CircularProgressIndicator during async operations
6. **Icon consistency** - Use outline icons (e.g., `Icons.person_outline` not `Icons.person`)
7. **Form validation** - Always validate inputs before submission
8. **Disabled states** - Set `onPressed: null` to disable buttons
9. **Responsive padding** - Use `EdgeInsets.symmetric` for better responsiveness
10. **Theme support** - Test all components in both light and dark modes

---

## 📖 **Code Examples**

Find these components implemented in:
- **Buttons:** `mobile/lib/screens/parties/add_edit_party_screen.dart`
- **Forms:** `mobile/lib/screens/items/add_edit_item_screen.dart`
- **Dialogs:** `mobile/lib/screens/invoices/add_payment_dialog.dart`
- **Bottom Sheets:** `mobile/lib/screens/invoices/add_offline_bill_screen.dart`
- **Cards:** `mobile/lib/screens/parties/parties_screen.dart`
- **Date Pickers:** `mobile/lib/utils/date_picker_theme.dart`

---

## 🔄 **Migration Notes**

When updating old code:
- Replace `FilledButton` with `ElevatedButton` + styling
- Replace hardcoded colors with theme colors
- Update border radius to 12px (buttons/inputs) or 16px (cards)
- Add proper spacing between elements
- Use outline icons instead of filled icons
