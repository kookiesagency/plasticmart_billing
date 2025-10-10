# Mobile App Roadmap: PlasticMart Mobile

This document outlines the development plan for the PlasticMart Mobile application. The mobile app will share the same Supabase database with the web application and provide a simplified, layman-friendly interface for core business operations.

## **Development Approach** 🚀
**Phase-by-Phase Implementation:**
1. I build one feature at a time following this roadmap
2. You test the feature in your environment
3. Once approved, we move to the next task
4. This ensures quality and allows for feedback at each step

### **Important Development Rules** ⚠️
**Before Starting Any Feature:**
1. **ALWAYS explain what I'm going to build first**
2. **Wait for explicit approval before writing any code**
3. Show my understanding of the requirements
4. Only start development after getting confirmation

**Git Push Policy:**
- **NEVER ask if I should push to GitHub**
- **ONLY push when explicitly told: "push to github"**
- Commit changes locally, but wait for push command
- This prevents unnecessary deployments and gives control over timing

---

## **App Overview**

**Target Users:** Business owners, field staff, and anyone who needs to create invoices and manage basic data on-the-go
**Platform:** Cross-platform (iOS & Android) using **Flutter**
**Database:** Shared Supabase database with web application
**Sync:** Real-time bidirectional sync with web app
**State Management:** Provider (ChangeNotifier)

---

## **Core Concept: ~~Two Operating Modes~~ Single Unified Mode**

### **~~Basic Mode (Default)~~ Complete Feature Set (Current)**
- **Status:** ✅ COMPLETED - All core features implemented
- **Target:** All users (laymen, field staff, business owners)
- **Focus:** Complete business management with clean, simple UI
- **Features:** Full CRUD operations, invoicing, payments, PDF generation, dashboard analytics, party reports

### **~~Advanced Mode (Settings Toggle)~~ Future Enhancements (Deferred)**
- **Status:** 📅 DEFERRED - Will be implemented based on user feedback
- **Original Plan:** Advanced reporting, bulk operations, complex analytics
- **Decision:** Keep app simple and focused. Advanced features will be added incrementally based on actual business needs
- **Theme Toggle:** The Settings toggle now controls Light/Dark mode instead of Basic/Advanced mode

---

## **Phase 1: MVP - Complete Mobile App** ✅ COMPLETED

### **1.1 Project Setup & Architecture** ✅ COMPLETE
- [x] Set up Flutter project with Dart
- [x] Configure Supabase Flutter client
- [x] Set up navigation (Bottom Navigation Bar)
- [x] Set up state management (Provider)
- [x] Configure persistent storage (SharedPreferences)
- [x] ~~Implement Basic/Advanced Mode toggle~~ (Removed - app now has single unified mode)
- [x] Create home screen with 5 tabs (Dashboard, Bills, Items, Parties, Settings)
- [x] Set up project folder structure

### **1.2 Authentication & Settings** ✅ COMPLETE
- [x] **App Settings:** ~~Mode toggle (Basic/Advanced)~~ Dark Mode toggle (Light/Dark theme)
- [x] **Simple Login/Authentication:**
  - Splash screen with auto-login check
  - Login screen with email/password
  - Supabase authentication integration
  - Session persistence
- [x] **Settings Screen:**
  - Consistent card-based UI design
  - ~~App mode toggle (Basic/Advanced)~~ Dark Mode toggle (placeholder - full implementation pending)
  - Default bundle rate configuration with dialog
  - Units management access
  - Clean, modern interface with proper spacing
- [x] **Unit Management:**
  - Add/edit/delete measurement units (KG, PCS, DOZ, etc.)
  - Simple list with search functionality
  - Active/Deleted tabs
  - Soft delete with restore capability
  - Swipe gestures (edit/delete)
  - Duplicate name validation

### **1.3 Party Management** ✅ COMPLETE
- [x] **Add New Party:**
  - Simple form: Name, Bundle Rate, Opening Balance (optional)
  - Large, touch-friendly buttons
  - Duplicate name validation
- [x] **Party List:**
  - Card-based layout with search
  - Swipe actions: Edit (right swipe), Delete (left swipe)
  - Pull-to-refresh functionality
  - Invoice count badge ("X Bills") - bottom right
  - Bundle rate display
  - Created date display
  - NEW badge for parties created within 24 hours
  - Sort by newest first (created_at desc)
  - Active/Deleted tabs
- [x] **Edit Party:** Same simple form as add
- [x] **Delete Party:** Soft delete with restore option
- [x] **Permanent Delete:** Available in deleted tab with confirmation
- [x] **Weekly Mini Report:** Tap party to view weekly invoice summary
  - Previous outstanding balance
  - Current/last week's invoices list
  - Week total and grand total
  - Mobile-optimized layout

### **1.4 Item Management** ✅ COMPLETE
- [x] **Add New Item:**
  - Simple form: Name, Default Rate, Unit, Purchase Rate (optional)
  - Visual unit picker with search
  - Purchase Party selector with search
  - **Party-Specific Pricing:** Simple add/edit interface with dynamic forms
  - Duplicate name validation (normalized: case-insensitive, ignores spaces)
- [x] **Items List:**
  - Card-based layout with search
  - Show: Name, Rate (PCS/DOZ conversion), Purchase Rate, Party-specific prices count
  - Swipe actions: Edit (right swipe), Delete (left swipe)
  - Pull-to-refresh functionality
  - Active/Deleted tabs
  - Sort by created date (newest first)
- [x] **View Item Details:**
  - Header with gradient background
  - Pricing section (PCS Rate, DOZ Rate, Purchase Rate)
  - Purchase section (Rate, Party From)
  - Party-specific prices list with full details
  - Additional info (Unit, Created On)
  - Actions (Edit, Delete buttons)
- [x] **Edit Item:** Same form as add with all pricing management
- [x] **Party-Specific Pricing Management:**
  - **Add Special Price:** Select party + enter rate dynamically
  - **Edit Special Price:** Update existing party rates
  - **Remove Special Price:** Delete party-specific rates with confirmation
  - **Visual Display:** Show party name and rate in view screen
- [x] **Delete Item:** Soft delete with restore option
- [x] **Permanent Delete:** Available in deleted tab with confirmation
- [x] **Unit Conversion:** Auto-convert between PCS and DOZ (1 DOZ = 12 PCS)

### **1.5 Invoice Creation** ✅ COMPLETE
- [x] **Step-by-Step Invoice Wizard:**
  - **Step 1:** Select Party
    - Search existing parties
    - Quick "Add New Party" button
  - **Step 2:** Add Items
    - Search and select items
    - Quantity input with number pad
    - Rate auto-populated (editable)
    - Quick "Add New Item" button
  - **Step 3:** Review & Confirm
    - Show calculated totals
    - Bundle charge settings
    - Save invoice
- [x] **Real-time Calculations:** Sub-total, bundle charge, grand total
- [ ] **Draft Invoices:** Save incomplete invoices (PENDING - Will implement on web first)
- [ ] **Voice Input:** For quantities and rates (optional - SKIPPED)

### **1.6 Party-Specific Pricing UX** ✅ COMPLETE
- [x] **Simple Pricing Interface:**
  - **From Item Screen:** Manage prices in add/edit item screen
  - **Visual Indicators:** Party-specific prices shown in item view screen
  - **Add Special Price Flow:**
    - Select party from searchable list
    - Enter special rate dynamically
    - Save with confirmation
  - **Price List View:** Shows Party Name → Special Rate in item detail view
  - **Quick Actions:** Edit or delete prices with confirmation dialogs
- [x] **Automatic Rate Application:**
  - When creating invoices, special rates auto-apply
  - Fallback to default rate if no special price exists
- [x] **Mobile-Optimized UI:**
  - Large touch targets for easy interaction
  - Clear visual hierarchy (Default Rate vs Special Rates)
  - Search and filter for parties when adding special prices
  - Confirmation dialogs for price changes

### **1.7 Invoice Management** ✅ COMPLETE
- [x] **Invoice List:**
  - Card-based layout showing: Party, Date, Total, Status
  - Search and filter by party name/invoice number
  - Status indicators (Paid/Pending/Partial) with color coding
  - Pull-to-refresh functionality
  - Active/Deleted tabs
  - OFFLINE badge display
  - Swipe-to-delete with confirmation
- [x] **View Invoice Details Screen:** (`view_invoice_screen.dart`)
  - Party information with status badge
  - Invoice number and date
  - Created date with timestamp
  - Items list with quantities, rates, and totals
  - Sub-total (calculated from items)
  - Bundle quantity display
  - Bundle charge display
  - Grand total calculation
  - Clean dropdown menu with Edit/Delete actions
- [ ] **Invoice Actions:**
  - [x] View detailed invoice screen ✅
  - [ ] Download PDF (mobile-optimized) - PENDING (Step 8)
  - [ ] Share via WhatsApp/Email/SMS - PENDING (Step 8)
  - [ ] Print integration (if available) - PENDING (Step 8)
- [ ] **Invoice Status Updates:** Mark as paid/pending/partial - PENDING (Step 6 - via payment recording)
- [x] **Edit Invoice:** Modify existing invoices (all fields editable)
- [x] **Delete Invoice:** Soft delete with restore option
- [x] **Restore Invoice:** From deleted tab
- [x] **Permanent Delete:** Irreversible deletion with confirmation

### **1.8 Payment Management** ✅ COMPLETE
- [x] **Record Payments:**
  - Simple payment entry form with amount, date, remark
  - ~~Payment method selection~~ (NOT implemented - matched web app exactly)
  - Partial payment support (client-side status calculation)
  - Payment date selection with consistent white background theme
  - Auto-fill balance due when adding payment
- [x] **Payment History:**
  - List payments per invoice with compact card design
  - Date, amount, and remark display
  - Edit payment functionality
  - Swipe-to-delete with confirmation
- [x] **Outstanding Balance:**
  - Visual indicators for payment status (paid/partial/pending)
  - Client-side status calculation from payments
  - Balance calculation displayed on invoice view
  - Auto-refresh invoice list when payments change
  - Fixed status sync: Invoice list now calculates status dynamically from payments
- [x] **Reusable Utilities:**
  - Created `utils/date_picker_theme.dart` for consistent date picker styling
  - Date formatting standards established
- [x] **Critical Bug Fix:**
  - Fixed data loss bug in invoice updates (mobile and web)
  - Implemented atomic PostgreSQL RPC function with transactions

### **1.9 Party Report** ✅ COMPLETE
- [x] **Party Details Screen:**
  - Comprehensive party information card with gradient header
  - Summary cards (white background with subtle borders):
    - Total Billed (aggregate of all invoices)
    - Total Received (aggregate of all payments)
    - Current Balance (opening balance + billed - received)
    - Invoice Count with visual indicator
  - Full invoice list for the party with status badges
  - Pull-to-refresh functionality
  - Navigation to invoice details on tap
- [x] **Weekly Mini Report:**
  - Accessible from party list (tap on party)
  - Previous outstanding balance calculation
  - Current/last week's invoices with full details
  - Total This Week calculation
  - Grand Total Outstanding display
  - Clean white card design with consistent styling
  - "More Details" button for comprehensive party details navigation
- [x] **UI Excellence:**
  - Mobile-optimized layout preventing text overflow
  - Responsive font sizes (14px standard, 12px for metadata)
  - Visual hierarchy with proper spacing (16-24px gaps)
  - Color-coded status indicators
  - Gradient headers for visual appeal
- [x] **Button Styling Standardization (Major UX Improvement):**
  - Created `/docs/mobile-button-styling-guide.md` - comprehensive styling reference
  - Standardized all buttons across 8 screens:
    - party_weekly_report_screen.dart
    - parties_screen.dart
    - create_invoice_screen.dart
    - add_edit_item_screen.dart
    - view_invoice_screen.dart
    - add_payment_dialog.dart
  - Standard specs: 12px border radius, 16px font, 600 weight, proper padding
  - Replaced all FilledButton with ElevatedButton for consistency
- [x] **Additional UI Refinements:**
  - Added SR numbers (1., 2., 3.) to invoice items list
  - Compact Add Payment button (removed icon, smaller padding: 16×8)
  - Matched invoice date font size to created date (12px)
  - Repositioned status badge below party name (prevents overflow)
  - Changed invoice list sorting to invoice_number descending

### **1.10 PDF & Sharing** ✅ COMPLETE
- [x] **PDF Generation:**
  - Mobile-optimized invoice templates with 50% width layout
  - Professional formatting with Google Fonts for Rupee symbol
  - Multi-page PDF support for long invoices
  - Smart filename formatting
- [x] **Sharing Options:**
  - Direct WhatsApp sharing with position origin support
  - Share via any app (email, messaging, etc.)
  - Save to device storage
  - Preview before sharing
- [x] **Offline Invoice Handling:**
  - Hide PDF and Share buttons for offline invoices (no items to display)

### **1.11 Home Screen Dashboard** ✅ COMPLETE
- [x] **Financial Summary Cards:**
  - Today's Revenue (timezone-aware IST calculations)
  - This Week's Revenue (Monday-based week)
  - This Month's Revenue (from 1st to today)
  - Total Outstanding (opening balance + billed - received)
- [x] **Quick Actions Grid (2x2):**
  - Create Bill button (primary action)
  - Offline Bill button
  - Add Party button
  - Add Item button
- [x] **Recent Invoices:**
  - Last 5 invoices with status badges
  - "View All" button navigates to Bills tab
  - Same card style as Bills tab
- [x] **Database Improvements:**
  - Auto-calculate invoice totals trigger
  - Web dashboard fixes (Monday weeks, created_at filtering)
  - Timezone handling (UTC to IST conversion)

---

## **Phase 3: Enhanced Mobile Experience**

### **3.1 Mobile-Specific Features**
- [ ] **Offline Mode:** Work without internet connection
- [ ] **Background Sync:** Sync data when connected


### **3.3 Advanced UX/UI**
- [ ] **Dark Mode:** Battery-friendly dark theme
- [ ] **Accessibility:** Support for screen readers, large text
- [ ] **Multi-language:** Support for Hindi and Urdu
- [ ] **Gesture Navigation:** Swipe gestures for common actions

---

## **Phase 4: AI/ML Features (Future)**

### **4.1 Intelligent Automation**
- [ ] **OCR for Receipts:** Scan and auto-create items/invoices from receipt images
- [ ] **Voice Commands:** Create invoices using voice input

---

## 📝 **Pending Tasks - Future Development**

### **High Priority:**
1. **Dark Mode Implementation**
   - Create ThemeProvider with ChangeNotifier
   - Persist theme preference in SharedPreferences
   - Update MaterialApp with themeMode property
   - Implement light and dark ThemeData
   - Update all screens to be dark mode compatible
   - Settings toggle is already in place as placeholder

2. **Hindi and Urdu Localization**
   - Full language support with language switcher
   - Translate all UI text and messages
   - RTL support for Urdu
   - Persistent language preference

### **Medium Priority:**
3. **Invoice Filters** (Optional)
   - Date range filter for invoices
   - Payment status filter (Paid/Pending/Partial)

4. **Draft Invoices** (Deferred)
   - Save incomplete invoices
   - Will implement on web first, then mobile

### **Low Priority - Phase 3:**
5. **Offline Mode**
   - Work without internet connection
   - Local data storage with sync queue

6. **Background Sync**
   - Sync data when connected
   - Conflict resolution strategy

7. **Accessibility**
   - Screen reader support
   - Large text support
   - High contrast mode

8. **Gesture Navigation**
   - Enhanced swipe gestures for common actions

### **Future - Phase 4:**
9. **AI/ML Features**
   - OCR for receipts - Scan and create items/invoices from receipt images
   - Voice commands - Create invoices using voice input

### **Quality Assurance:**
10. **Testing Suite**
    - Unit tests for core business logic
    - Integration tests for database operations
    - E2E tests for critical user flows
    - Device testing on multiple devices and OS versions

11. **Deployment**
    - App Store optimization with screenshots
    - Google Play Store release with metadata
    - Beta testing with TestFlight/Firebase
    - Analytics integration for tracking

---

## **Technical Architecture**

### **Development Stack**
- **Framework:** Flutter with Dart
- **Navigation:** Bottom Navigation Bar with 5 tabs
- **State Management:** Provider (ChangeNotifier)
- **Database:** Supabase (shared with web) with Flutter client
- **Storage:** SharedPreferences for app preferences
- **UI:** Material Design 3 with custom themes
- **PDF Generation:** pdf package with Google Fonts
- **Sharing:** share_plus for multi-platform sharing
- **File System:** path_provider for document management
- **Printing:** printing package for PDF preview

### **Shared Resources**
- **Database:** Shared Supabase database with web app (PostgreSQL)
- **Database Functions:** Shared RPC functions for complex operations
- **Database Triggers:** Auto-calculation triggers (invoice totals, etc.)
- **Row Level Security:** Shared authentication and authorization policies
- **Business Logic:** Implemented separately in Flutter (mobile) and TypeScript (web)

### **Performance Considerations**
- **Lazy Loading:** Load data on-demand with pagination
- **Memory Management:** Efficient list rendering with ListView.builder
- **Image Optimization:** Cached network images
- **State Management:** Efficient Provider updates with notifyListeners
- **Database Queries:** Optimized Supabase queries with proper indexing

---

## **Success Metrics**

### **User Adoption**
- **Target:** 80% of web users adopt mobile app within 6 months
- **~~Basic Mode Usage~~** (REMOVED - Single unified mode)
- **~~Advanced Mode Usage~~** (REMOVED - Single unified mode)
- **Active Users:** Target 60% monthly active users

### **Performance Metrics**
- **App Store Rating:** Maintain 4.5+ stars
- **Crash Rate:** < 1% crash rate
- **User Retention:** 60% monthly active users

### **Business Impact**
- **Invoice Creation Speed:** 50% faster than web on mobile
- **User Satisfaction:** 90% user satisfaction score
- **Feature Parity:** 100% core feature parity with web app

---

## **Implementation Guidelines**

### **Database Integration Strategy**
- **Shared Database:** ✅ Mobile app connected to existing Supabase PostgreSQL database
- **Shared Tables:** ✅ Using same tables as web app (parties, items, invoices, payments, etc.)
- **Shared Functions:** ✅ Using shared RPC functions (update_invoice, etc.)
- **Shared Triggers:** ✅ Auto-calculation triggers for invoice totals
- **Real-time Sync:** ✅ Data syncs automatically between web and mobile
- **Offline Mode:** (Future - will add local cache and sync queue)
- **Conflict Resolution:** (Future - for offline mode)

### **Navigation Architecture**
```
App Navigator (Stack)
├── Auth Stack (when not logged in)
│   └── SplashScreen
│   └── LoginScreen
├── Main Tab Navigator (when logged in) - 5 tabs
│   ├── Dashboard Tab (Home)
│   │   ├── Financial Summary Cards
│   │   ├── Quick Actions Grid
│   │   └── Recent Invoices List
│   ├── Bills Tab (Invoices)
│   │   ├── InvoiceListScreen (Active/Deleted tabs)
│   │   ├── CreateInvoiceScreen
│   │   ├── ViewInvoiceScreen
│   │   └── AddOfflineBillScreen
│   ├── Items Tab
│   │   ├── ItemsScreen (Active/Deleted tabs)
│   │   ├── AddEditItemScreen
│   │   └── ViewItemScreen
│   ├── Parties Tab
│   │   ├── PartiesScreen (Active/Deleted tabs)
│   │   ├── AddEditPartyScreen
│   │   ├── PartyDetailsScreen
│   │   └── PartyWeeklyReportScreen
│   └── Settings Tab
│       ├── SettingsScreen (Dark Mode, Bundle Rate)
│       └── UnitsScreen
└── Modal/Dialog Overlays
    ├── AddPaymentDialog
    ├── PDF Preview (via printing package)
    └── Share Dialog (via share_plus)
```

### **State Management Architecture**
```dart
// Flutter Provider Structure
// Auth state
class AuthProvider extends ChangeNotifier {
  User? user;
  bool isAuthenticated;
  login(user) { ... }
  logout() { ... }
}

// App settings
// mode: Removed - single unified app mode
// theme: 'light' | 'dark' (to be implemented)

// Data providers (for state management)
class PartyProvider extends ChangeNotifier { ... }
class ItemProvider extends ChangeNotifier { ... }
class InvoiceProvider extends ChangeNotifier { ... }
class UnitProvider extends ChangeNotifier { ... }

// UI state managed locally in widgets
```

### **Security & Authentication**
- **Authentication:** Supabase JWT tokens with auto-refresh ✅ Implemented
- **Session Management:** Persistent session with auto-login ✅ Implemented
- **API Security:** Supabase RLS (Row Level Security) policies ✅ Implemented
- **Data Encryption:** (Future - for offline mode)
- **Biometric Auth:** (Future - optional enhancement)

### **Error Handling**
- **Network Error Handling:** Graceful handling of connection issues ✅ Implemented
- **User-Friendly Messages:** Clear error messages with SnackBars ✅ Implemented
- **Form Validation:** Duplicate checking, required fields ✅ Implemented
- **Crash Reporting:** (Future - Sentry/Firebase Crashlytics)

---

## 🎯 **Current Status Summary**

### **✅ Completed Features (Phase 1):**
- Full Authentication & Settings
- Units, Parties, Items Management (CRUD)
- Invoice Creation & Management
- Payment Tracking & History
- Party Reports & Analytics
- PDF Generation & Sharing
- Offline Bill Entry
- Home Screen Dashboard with Financial Metrics
- UI/UX Polish & Consistency

### **📅 Next Priority:**
- **Dark Mode Implementation** - Settings toggle ready, needs full implementation
- **Hindi and Urdu Localization** - Business requirement

### **🚀 Mobile App Status:**
**100% Core Feature Complete** - The mobile app has full feature parity with the web application. All CRUD operations, invoicing, payments, PDF generation, and analytics are functional. Future development will focus on enhancements like dark mode, localization, offline mode, and AI/ML features based on user feedback and business priorities.

---

**Note:** This roadmap follows a progressive development approach, with all essential features now complete. Future phases will add enhancements and advanced capabilities while maintaining high code quality and performance standards.