# PlasticMart Project Context

> **Quick Reference**: This file helps maintain context across terminal sessions

---

## 🎯 Project Overview
- **Name**: PlasticMart - Smart Billing System
- **Tech Stack**:
  - **Web**: Next.js 15, TypeScript, Supabase, Tailwind CSS, Shadcn/UI
  - **Mobile**: Flutter 3.27.1, Dart 3.6.0, Supabase Flutter, Provider
- **Current Status**: Web app functional, Flutter mobile app foundation ready
- **Database**: Supabase PostgreSQL (shared between web & mobile)

---

## 📱 Current Development Focus

### **Web App Status**: ✅ Core features complete
- ✅ Invoice creation with drag-and-drop reordering
- ✅ Item management with inline editing (double-click)
- ✅ Party-specific pricing system
- ✅ Smart item filtering in invoice form
- ✅ Create item directly from invoice workflow

### **Mobile App Status**: ✅ Foundation Complete (Flutter)
- ✅ Flutter SDK 3.27.1 installed globally at ~/development/flutter
- ✅ Separate mobile/ folder with clean Flutter project structure
- ✅ Basic/Advanced Mode toggle with persistent settings
- ✅ Supabase integration with same credentials as web
- ✅ Provider state management configured
- ✅ Home screen with adaptive bottom navigation (3 tabs Basic, 4 tabs Advanced)
- 📋 Ready for next phase: Full CRUD operations and UI implementation

---

## 🔧 Recent Technical Work

### **Invoice Form Enhancements** (`src/app/(app)/invoices/new/invoice-form.tsx`)
- **Smart Item Filtering**: Hide already-added items from dropdown
- **Contextual Messaging**: "Item already added" vs "Create new item"
- **Full CreateItemDialog**: Party-specific pricing within invoice form
- **Fixed Database Error**: Removed non-existent `subTotal` column from save
- **Button Styling**: Black button (`bg-slate-900`) instead of red

### **Items Table** (`src/app/(app)/items/items-columns.tsx`)
- **Inline Editing**: Double-click any field to edit (name, rates)
- **Real-time Updates**: Instant Supabase sync with toast notifications
- **Type Safety**: Proper TypeScript types throughout

### **Git Branches**
- **Current**: `feature/new-features`
- **Main**: Updated with latest changes
- **Recent Commits**: Item filtering, inline editing, mobile planning

---

## 🏗️ Architecture Decisions

### **Current Structure** ✅ (Independent Projects)
```
plasticmart/
├── web/                    # Next.js web application
│   ├── src/
│   │   ├── app/(app)/     # App routes
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities
│   │   └── shared/        # Shared code (moved from packages)
│   └── package.json
├── mobile/                # Flutter mobile application
│   ├── lib/
│   │   ├── config/       # Supabase config
│   │   ├── providers/    # State management (Provider)
│   │   ├── screens/      # App screens
│   │   ├── models/       # Data models
│   │   ├── services/     # API services
│   │   └── main.dart
│   └── pubspec.yaml
├── database/              # Database schemas
├── docs/                  # Documentation
└── package.json          # Root scripts
```

### **Technology Choices** ✅
- **Web**: Next.js for SEO, SSR, and performance
- **Mobile**: Flutter for native performance and single codebase (iOS + Android)
- **State**: Provider for Flutter, React Context for Next.js
- **Database**: Supabase (shared instance for both platforms)

---

## 📋 Next Steps Priority

### **Current Status**: ✅ Flutter Mobile Foundation Complete
**Web app functional, Flutter mobile app ready for feature development!**

### **Development Workflow** 🔄
**Phase-by-Phase Approach:**
1. Build one feature at a time from mobile-roadmap.md
2. Test the feature after completion
3. Get approval before moving to next task
4. This ensures quality and allows feedback at each step

### **Important Development Rules** ⚠️
**Before Starting Any Feature:**
1. **ALWAYS explain what you're going to build first**
2. **Wait for explicit approval before writing any code**
3. Show your understanding of the requirements
4. Only start development after getting confirmation

**Git Push Policy:**
- **NEVER ask if you should push to GitHub**
- **ONLY push when explicitly told: "push to github"**
- Commit changes locally, but wait for push command
- This prevents unnecessary deployments and gives control over timing

**Branch Strategy:**
- **`web`** branch: All web app development work
- **`mobile`** branch: All mobile app development work
- **`main`** branch: Production-ready merged code
- Work on feature branches, merge to main when complete and tested

### **Immediate Options for Next Session**:

1. **📱 Implement Invoices Screen** (Recommended First)
   - Create invoice list UI
   - Fetch invoices from Supabase
   - Implement invoice detail view
   - Add create invoice navigation

2. **👥 Implement Parties Screen**
   - Party list with search
   - Add/Edit party forms
   - Party detail view
   - Supabase CRUD operations

3. **📦 Implement Items Screen (Advanced Mode)**
   - Item list with search
   - Add/Edit item forms
   - Party-specific pricing UI
   - Supabase CRUD operations

4. **📄 Enhanced Invoice Creation**
   - Full invoice creation form
   - Party and item selection
   - Calculations (bundle charge, totals)
   - Save to Supabase

5. **🔐 Authentication**
   - Login screen
   - Supabase auth integration
   - Protected routes

### **Web App Status**: ✅ Complete
- All core features working
- Database schema established
- Ready as reference for mobile implementation

### **Mobile App Development Path** (from mobile-roadmap.md):
- [x] **Phase 1.1**: Project Setup & Basic/Advanced Mode Toggle
- [ ] **Phase 1.2**: Invoice List & Detail Views
- [ ] **Phase 1.3**: Party Management
- [ ] **Phase 1.4**: Item Management (Advanced Mode)
- [ ] **Phase 1.5**: Full Invoice Creation Flow

---

## 🛠️ Mobile App Reusable Utilities

### **Date Picker Theme** (`mobile/lib/utils/date_picker_theme.dart`)

**Purpose**: Ensures consistent date picker styling across the entire app with white background and light grey dividers.

**Usage**:
```dart
import '../../utils/date_picker_theme.dart';

// Use the helper function
Future<void> _selectDate() async {
  final DateTime? picked = await showAppDatePicker(
    context: context,
    initialDate: _selectedDate,
    firstDate: DateTime(2020),
    lastDate: DateTime(2100),
  );

  if (picked != null) {
    setState(() {
      _selectedDate = picked;
    });
  }
}
```

**Why it exists**:
- Provides consistent white background for date picker dialogs
- Ensures light grey dividers instead of default dark dividers
- Matches the app's overall design system
- Reduces code duplication across different screens

**Where it's used**:
- `lib/screens/invoices/add_payment_dialog.dart` - Payment date selection
- `lib/screens/invoices/create_invoice_screen.dart` - Bill date selection

**Important**: Always use `showAppDatePicker()` instead of Flutter's built-in `showDatePicker()` to maintain consistency.

### **Date Formatting Standards**

**Display Format**: `EEE, MMM d` (e.g., "Tue, Oct 7")
- Used for showing dates to users in a friendly, concise format

**Database Format**: `yyyy-MM-dd` (e.g., "2025-10-07")
- Used for storing dates in Supabase database
- ISO 8601 standard format

**Implementation**:
```dart
import 'package:intl/intl.dart';

String _formatDateForDisplay(DateTime date) {
  return DateFormat('EEE, MMM d').format(date);
}

String _formatDateForDatabase(DateTime date) {
  return DateFormat('yyyy-MM-dd').format(date);
}
```

### **Mobile Design System**

**Dialog Styling**:
- Background color: `Colors.white`
- Border radius: `16.0` for main dialogs
- Padding: `24.0` for content
- Date picker border radius: `8.0`

**Form Fields**:
- Border radius: `12.0`
- Standard spacing between fields: `16.0`
- Section spacing: `24.0`

**Color Conventions**:
- Success/Paid: `Colors.green`
- Error/Due: `Colors.red`
- Partial payment: `Colors.orange`
- Pending: `Colors.grey`

### **Payment Management Patterns**

**Status Calculation**: Payment status is **calculated client-side**, not stored in the database:
```dart
String get _paymentStatus {
  if (_balanceDue <= 0) return 'paid';
  if (_totalPaid > 0 && _balanceDue > 0) return 'partial';
  return 'pending';
}
```

**Payment Form Auto-fill**: When adding a new payment, the amount field is automatically prefilled with the current balance due:
```dart
_amountController.text = widget.balanceDue > 0
    ? widget.balanceDue.toStringAsFixed(2)
    : '0';
```

---

## 🔑 Key Files to Reference

| File | Purpose |
|------|---------|
| `docs/PROJECT-CONTEXT.md` | This file - session context |
| `docs/MOBILE-SETUP.md` | Mobile development achievements |
| `docs/roadmap.md` | Web app development progress |
| `docs/mobile-roadmap.md` | Mobile app detailed plan |
| `web/src/app/(app)/` | Web app pages & components |
| `web/src/shared/` | Shared code (database, types, utils) |
| `mobile/lib/` | Flutter app source code |
| `mobile/lib/screens/` | Mobile app screens |
| `mobile/lib/providers/` | State management |
| `database/` | Database schemas & migrations |

---

## 🚨 Important Notes

- **Database Schema**: Items have `default_rate`, parties have optional `bundle_rate`
- **Party-Specific Pricing**: Items can have different rates per party
- **Soft Deletes**: Use `deleted_at` column, don't hard delete
- **TypeScript**: Strict typing throughout, shared types planned
- **UI**: Shadcn/UI components with Tailwind CSS v4

---

## 💡 When Starting New Session

**Tell Claude**:
1. "Continue PlasticMart development - check PROJECT-CONTEXT.md"
2. Specify focus: "Work on [mobile invoices screen / parties / items / specific feature]"
3. Current git branch: `main`
4. **Structure**: Separate `web/` and `mobile/` folders

**Claude will**:
- Read current project structure and context
- Check Flutter mobile development status
- Review web app for feature reference
- Continue mobile development from Phase 1.2+

---

## 🎯 **ACHIEVEMENT SUMMARY**

✅ **Clean Architecture**: Separate web/ and mobile/ projects
✅ **Flutter SDK Installed**: Globally at ~/development/flutter (available for all projects)
✅ **Mobile Foundation**: Flutter app with Basic/Advanced Mode toggle
✅ **Supabase Integration**: Same database for web and mobile
✅ **State Management**: Provider configured and working
✅ **Professional Structure**: Organized folders ready for scaling

**🚀 Ready to implement full features following web app functionality!**