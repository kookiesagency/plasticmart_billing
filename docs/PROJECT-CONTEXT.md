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

### **Web App Status**: ✅ Core features complete + Offline Invoice Support
- ✅ Invoice creation with drag-and-drop reordering
- ✅ Item management with inline editing (double-click)
- ✅ Party-specific pricing system
- ✅ Smart item filtering in invoice form
- ✅ Create item directly from invoice workflow
- ✅ Offline invoice quick entry with limited fields
- ✅ OFFLINE badge display on invoice lists
- ✅ Hide items/bundle sections for offline invoices
- ✅ Payment management with `remark` field

### **Mobile App Status**: ✅ Basic Mode MVP Nearly Complete (Flutter)
- ✅ Flutter SDK 3.27.1 installed globally at ~/development/flutter
- ✅ Separate mobile/ folder with clean Flutter project structure
- ✅ Basic/Advanced Mode toggle with persistent settings
- ✅ Supabase integration with same credentials as web
- ✅ Provider state management configured
- ✅ Bottom navigation (3 tabs: Home, Invoices, Settings)
- ✅ **Complete Feature Set** (Steps 0-9):
  - ✅ Authentication (Login with Splash Screen)
  - ✅ Unit Management (Settings)
  - ✅ Party Management (CRUD with search, delete/restore)
  - ✅ Item Management (with party-specific pricing)
  - ✅ Invoice Creation (step-by-step wizard)
  - ✅ Invoice Management (view, edit, delete, restore)
  - ✅ Payment Management (add, edit, delete payments)
  - ✅ Party Reports (weekly reports, comprehensive details)
  - ✅ PDF Generation & Sharing (invoice PDFs with WhatsApp share)
  - ✅ Offline Bill Entry (quick invoice creation)
- ✅ **UI/UX Polish**:
  - ✅ Consistent outline/flat icons across all screens
  - ✅ Unified card design (white bg, grey borders, 16px radius)
  - ✅ Standardized button styling (12px radius, consistent padding)
  - ✅ OFFLINE badge for offline invoices
- 📋 **Next Phase**: Home Screen Dashboard (business metrics & quick actions)

---

## 🔧 Recent Technical Work

### **Mobile UI/UX Standardization** (December 2025)

**Icon Consistency Across All Screens:**
- Converted all icons to outline/flat versions for consistent design language
- Updated 14 files across auth, invoices, parties, items, and settings screens
- Standardized icon naming: `_outline` → `person_outline`, `_outlined` → all others
- Icons updated: person, phone, email, location, calendar, payment, check_circle, access_time, receipt_long, account_balance_wallet, description, business, straighten, delete, people

**Units Screen Redesign:**
- Removed green avatar box for cleaner, simpler layout
- Card design now matches invoice/party/item list screens
- Unit name at top (bold 16px) with "Created on [date]" below (grey 12px)
- Consistent white cards with grey borders (16px radius)
- Edit/Restore icons aligned right with zero padding

**Files Modified:**
- `mobile/lib/screens/settings/units_screen.dart`
- `mobile/lib/screens/settings/parties_screen.dart`
- `mobile/lib/screens/invoices/*` (5 files)
- `mobile/lib/screens/parties/*` (3 files)
- `mobile/lib/screens/items/*` (3 files)
- `mobile/lib/screens/auth/login_screen.dart`

### **Offline Invoice Improvements** (Mobile & Web, December 2025)

**Mobile App (`mobile/lib/`):**
- OFFLINE badge display on invoice list and view screens
- Hide Items/Bundle sections for offline invoices in view screen
- Edit support with limited fields (Party, Amount, Date only)
- Badge sizing and positioning consistency (9px font, 6px padding)
- Conditional spacing before Payment History (only for offline)

**Web App (`web/src/app/(app)/invoices/`):**
- Quick entry dialog: hide payment fields in edit mode
- Database schema fix: use `remark` field instead of `notes` for payments
- OFFLINE badge already implemented in invoice columns
- Items section hidden for offline invoices in detail view
- Consistent edit behavior between mobile and web

**Database Changes:**
- Confirmed `remark` column in payments table (not `notes`)
- No `payment_method` field needed (removed from code)

**Git Sync:**
- All changes committed and pushed across `mobile`, `web`, and `main` branches
- Feature parity achieved between mobile and web platforms

### **Previous Work** (Historical Context)

**Invoice Form Enhancements** (`src/app/(app)/invoices/new/invoice-form.tsx`)
- Smart Item Filtering: Hide already-added items from dropdown
- Contextual Messaging: "Item already added" vs "Create new item"
- Full CreateItemDialog: Party-specific pricing within invoice form
- Fixed Database Error: Removed non-existent `subTotal` column from save

**Items Table** (`src/app/(app)/items/items-columns.tsx`)
- Inline Editing: Double-click any field to edit (name, rates)
- Real-time Updates: Instant Supabase sync with toast notifications

### **Git Branches**
- **Current**: `mobile` branch (active development)
- **Main**: Production-ready code with all latest merges
- **Web**: Web-specific features (synced with mobile)
- **Recent Commits**: Icon standardization, offline invoice fixes, units redesign

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

### **Current Status**: ✅ Mobile App Basic Mode MVP Nearly Complete!
**Steps 0-9 complete, UI polished, ready for Home Screen Dashboard!**

### **Development Workflow** 🔄
**Phase-by-Phase Approach:**
1. Build one feature at a time from mobile-implementation-order.md
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
- **`mobile`** branch: All mobile app development work (current)
- **`main`** branch: Production-ready merged code
- Work on feature branches, merge to main when complete and tested

### **Next Immediate Task: Home Screen Dashboard** 🏠

**Step 11 - Priority 1 Features:**
1. **📊 Financial Summary Cards** (Top Priority)
   - Today's Revenue card
   - This Week's Revenue card
   - This Month's Revenue card
   - Total Outstanding card (pending + partial payments)

2. **💳 Payment Status Cards**
   - Paid Invoices count (green)
   - Pending Invoices count (red)
   - Partial Payments count (orange)
   - Tappable cards navigating to filtered lists

3. **📋 Recent Activity Section**
   - Recent Invoices list (last 10)
   - Party name, amount, date, status badge
   - Tap to view invoice details
   - "View All" button → Invoices tab

4. **⚡ Quick Actions Row**
   - Create Invoice button
   - Offline Bill button (reuse existing)
   - Add Party button
   - Consistent styling (12px radius)

**Implementation Plan:**
- Start with financial summary cards (2x2 grid layout)
- Add payment status cards (row or grid)
- Implement recent invoices list with tap navigation
- Add quick action buttons at top
- Use aggregate Supabase queries for data
- Real-time updates with Provider state management

**Reference Files:**
- `mobile/lib/screens/home_screen.dart` - Currently shows placeholder, needs full dashboard
- `mobile/lib/providers/invoice_provider.dart` - Fetch and calculate metrics
- `docs/mobile-implementation-order.md` - Step 11 detailed specifications

### **Web App Status**: ✅ Complete
- All core features working
- Database schema established
- Offline invoice support added
- Ready as reference for mobile implementation

### **Mobile App Development Path** (from mobile-implementation-order.md):
- [x] **Steps 0-9**: Authentication → Offline Bill Entry (All Complete!)
- [x] **UI/UX Polish**: Icon standardization, consistent design
- [ ] **Step 11**: Home Screen Dashboard (Next - In Planning)
- [ ] **Step 10**: Settings (Theme toggle deferred)
- [ ] **Phase 2**: Advanced Mode features (after Basic Mode complete)

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