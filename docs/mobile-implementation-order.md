# Mobile App Implementation Order

This document provides a step-by-step implementation order for building the PlasticMart Mobile app in **Basic Mode first**, following the mobile roadmap.

---

## ✅ **Phase 1.1: Project Setup & Architecture** - COMPLETED

- [x] Flutter project setup with Dart
- [x] Supabase Flutter client configuration
- [x] Bottom Navigation Bar setup
- [x] Provider state management
- [x] SharedPreferences for persistence
- [x] ~~Basic/Advanced Mode toggle~~ (Removed - all features now in one mode)
- [x] Home screen with adaptive tabs
- [x] Project folder structure
- [x] Light and Dark theme implementation

---

## 🚧 **Phase 1: Basic Mode MVP - Implementation Order**

### ✅ **Step 0: Authentication Foundation** 🔐 - COMPLETED
**Why first?** Essential security layer - users need to login before accessing the app.

#### ✅ **Step 0.1: Splash Screen** - COMPLETED
**What to build:**
- [x] Create `screens/auth/splash_screen.dart`
- [x] Design splash screen with:
  - [x] PlasticMart logo/branding
  - [x] App name
  - [x] Loading indicator
  - [x] Version number (optional)
- [x] Auto-navigate after 2-3 seconds:
  - [x] If user is logged in → Navigate to HomeScreen
  - [x] If not logged in → Navigate to LoginScreen
- [x] Check authentication state using Supabase

**Dependencies:** None (uses existing Supabase config)

**Testing:** App launches with splash, then navigates correctly based on auth state

---

#### ✅ **Step 0.2: Login Screen** - COMPLETED
**What to build:**
- [x] Create `screens/auth/login_screen.dart`
- [x] Create `providers/auth_provider.dart` for authentication state
- [x] Design simple login form:
  - [x] Email input field
  - [x] Password input field
  - [x] "Login" button
  - [x] Show/hide password toggle
  - [x] Error message display
  - [x] Loading state during authentication
- [x] Implement Supabase email/password authentication
- [x] Store auth session persistently
- [x] Navigate to HomeScreen on successful login
- [x] Handle login errors gracefully

**Optional features:**
- [x] "Forgot Password" link
- [ ] "Remember Me" checkbox
- [ ] Sign up option (if needed)

**Database:** Uses Supabase auth system (no custom tables needed)

**Testing:** Can login with valid credentials, see error messages for invalid credentials

---

### ✅ **Step 1: Unit Management (Settings)** 📦 - COMPLETED
**Why next?** Units are foundational - needed for items and invoices.

**What to build:**
- [x] Create `models/unit.dart` model
- [x] Create `services/unit_service.dart` for Supabase operations
- [x] Create `screens/settings/units_screen.dart`
- [x] Add "Units" option in Settings screen
- [x] Build Units list with card UI
- [x] Add dialog for creating new unit
- [x] Edit unit functionality
- [x] Soft delete units (mark as deleted)
- [x] Set default unit

**Database:** Uses existing `units` table

**Testing:** Can add, edit, delete, and set default units

---

### ✅ **Step 2: Party Management (Basic Mode)** 👥 - COMPLETED
**Why second?** Parties are needed before creating invoices.

**What to build:**
- [x] Create `models/party.dart` model
- [x] Create `services/party_service.dart` for Supabase operations
- [x] Create `providers/party_provider.dart` for state management
- [x] Build Party List screen (`screens/parties/parties_screen.dart`)
  - [x] Card-based layout
  - [x] Search functionality
  - [x] Pull-to-refresh
- [x] Create Add Party dialog/screen
  - [x] Name field (required)
  - [x] Phone number field (optional)
  - [x] Bundle rate field (optional)
  - [x] Opening balance field (optional)
- [x] Edit party functionality
- [x] Soft delete party (swipe to delete)
- [x] Restore deleted party (swipe to restore)

**Database:** Uses existing `parties` table

**Testing:** Can add, view, edit, search, and delete parties

---

### ✅ **Step 3: Item Management (Basic Mode)** 📦 - COMPLETED
**Why third?** Items are needed for creating invoice line items.

**What to build:**
- [x] Create `models/item.dart` model
- [x] Create `services/item_service.dart` for Supabase operations
- [x] Create `providers/item_provider.dart` for state management
- [x] Build Item List screen (`screens/items/items_screen.dart`)
  - [x] Card-based layout showing name, rate, unit
  - [x] Search functionality
  - [x] Pull-to-refresh
- [x] Create Add Item dialog/screen
  - [x] Name field (required)
  - [x] Rate field (required)
  - [x] Unit dropdown from units list (required)
  - [x] Purchase rate field (optional)
  - [x] Purchase party dropdown (optional)
- [x] Edit item functionality
- [x] Soft delete item (swipe to delete)
- [x] **Party-Specific Pricing** (Simple Version)
  - [x] "Manage Prices" button on item card
  - [x] List of party-specific prices
  - [x] Add special price: select party + enter rate
  - [x] Edit special price
  - [x] Remove special price

**Database:** Uses existing `items` and `party_item_prices` tables

**Testing:** Can add items with default rates and party-specific pricing

---

### ✅ **Step 4: Invoice Creation (Basic Mode - Step-by-Step Wizard)** 📄 - COMPLETED
**Why fourth?** Core feature that ties everything together.

**What to build:**
- [x] Create `models/invoice.dart` and `models/invoice_item.dart` models
- [x] Create `services/invoice_service.dart` for Supabase operations
- [x] Create `providers/invoice_provider.dart` for state management
- [x] Build Create Invoice Wizard (`screens/invoices/create_invoice_screen.dart`)

**Step 1: Select Party**
- [x] Searchable party list
- [x] Quick "Add New Party" button
- [x] Display selected party info (name, bundle rate)

**Step 2: Add Items**
- [x] Search and select items
- [x] For each item:
  - [x] Quantity input with number pad
  - [x] Unit dropdown (defaults to item's unit)
  - [x] Rate (auto-populated from party-specific price or default)
  - [x] Editable rate field
  - [x] Amount calculation (Qty × Rate)
- [x] Quick "Add New Item" button
- [x] Remove item button
- [x] Smart unit conversion when changing units

**Step 3: Review & Confirm**
- [x] Show invoice summary:
  - [x] Party name
  - [x] Invoice date (editable)
  - [x] List of items with quantities and amounts
  - [x] Sub-total calculation
  - [x] Bundle charge (from party's bundle rate or default)
  - [x] Grand total (Sub-total + Bundle charge)
- [x] Payment status dropdown (Paid/Pending/Partial)
- [x] Amount received field (conditional on payment status)
- [x] Save invoice button

**Features:**
- [x] Real-time calculations for totals
- [x] Smart number formatting (integers without decimals)
- [ ] Draft invoice saving (in-progress invoices) - PENDING (Will implement on web first)
- [x] Auto-generate invoice number (YYYY-YY/XXX format)
- [ ] Mark invoice as offline if needed - PENDING

**Recent Improvements:**
- [x] Fixed bundle rate loading from party-specific or default settings
- [x] Added smart number formatting across all steps
- [x] Improved bundle rate fallback logic (handles null and 0 values)

**Database:** Uses `invoices`, `invoice_items`, and `payments` tables

**Testing:** Can create complete invoices with items and payments

---

### ✅ **Step 5: Invoice Management (Basic Mode)** 📋 - MOSTLY COMPLETED
**Why fifth?** Users need to view, edit, and manage created invoices.

**What to build:**
- [x] Build Invoice List screen (updated existing `screens/invoices/invoices_screen.dart`)
  - [x] Card-based layout showing:
    - [x] Invoice number
    - [x] Party name
    - [x] Invoice date
    - [x] Total amount
    - [x] Payment status badge (Paid/Pending/Partial)
    - [x] OFFLINE badge if applicable
  - [x] Search by party name or invoice number
  - [ ] Filter by date range (PENDING - Not critical for MVP)
  - [ ] Filter by payment status (PENDING - Not critical for MVP)
  - [x] Pull-to-refresh
  - [x] Infinite scroll for large datasets (not needed yet)
- [x] View Invoice Details screen (`screens/invoices/view_invoice_screen.dart` - NEW FILE)
  - [x] Party information with status badge
  - [x] Invoice number and date
  - [x] Created date with timestamp
  - [x] List of items with quantities and rates
  - [x] Sub-total (calculated from items), bundle quantity, bundle charge, grand total
  - [x] Payment status and amount received
  - [ ] Payment history (PENDING - Step 6 feature)
- [x] Invoice Actions
  - [x] Edit invoice (navigate to edit screen)
  - [x] ~~Duplicate invoice~~ (Removed - not needed, doesn't exist on web)
  - [ ] Update payment status (PENDING - Step 6 feature)
  - [ ] Record additional payments (PENDING - Step 6 feature)
  - [x] Soft delete invoice
  - [x] Restore deleted invoice
  - [x] Permanently delete invoice (from deleted tab)
- [x] Share and PDF buttons (UI placeholders added, implementation in Step 8)

**UI Improvements:**
- [x] Clean dropdown menu with white background, border, light shadow
- [x] Light ripple effect on all clickable items (global theme)
- [x] Smart number formatting (integers without decimals)
- [x] Edit button shows "Update Bill" when editing, "Create Bill" when creating

**Database:** Read/update operations on `invoices`, `invoice_items`, `payments`

**Testing:** Can view, search, edit, delete, and manage invoices

---

### ✅ **Step 6: Payment Management (Basic Mode)** 💰 - COMPLETED
**Why sixth?** Essential for tracking outstanding balances.

**What was built:**
- [x] Create `models/payment.dart` model
- [x] Create `services/payment_service.dart`
- [x] Add Payment dialog (from invoice view)
  - [x] Payment amount field (auto-filled with balance due)
  - [x] Payment date picker with consistent white background theming
  - [x] Remark/Note field (optional)
  - [x] **Note:** Payment method dropdown was NOT added - matched web implementation exactly (web only has amount, date, remark)
- [x] Payment history list (on invoice details screen)
  - [x] Date, amount, remark display in compact card format
  - [x] Edit payment with same dialog
  - [x] Delete payment with swipe-to-delete gesture and confirmation
- [x] Outstanding balance calculation (client-side, not stored in database)
  - [x] Status calculation: paid (balance = 0), partial (balance > 0 and payments > 0), pending (no payments)
  - [x] Show calculated status on invoice list with color-coded badges
  - [x] Show on invoice view screen with real-time calculations
  - [x] Visual indicators for payment status
- [x] Auto-refresh invoice list
  - [x] Implemented `_hasChanges` flag to track payment modifications
  - [x] Used `PopScope` to return result when navigating back
  - [x] Invoice list automatically refreshes when payments are added/edited/deleted
  - [x] **Fixed status sync issue**: Updated `fetchInvoices()` to calculate status from payments dynamically instead of reading stale database values
- [x] Reusable utilities created:
  - [x] `utils/date_picker_theme.dart` - Consistent date picker theme across app
  - [x] Date formatting standards: "EEE, MMM d" for display, "yyyy-MM-dd" for database

**UI/UX Features:**
- [x] White background for all dialogs and screens (consistency across app)
- [x] Compact payment card design with edit/delete actions
- [x] Swipe-to-delete with confirmation dialog
- [x] Amount pre-filled with balance due when adding payment
- [x] Validation for payment amounts

**Critical Bug Fix:**
- [x] Fixed data loss bug in invoice update (both mobile and web)
- [x] Changed from unsafe delete+insert pattern to atomic PostgreSQL RPC function
- [x] Created `database/create_update_invoice_function.sql` with transaction support
- [x] Updated `mobile/lib/providers/invoice_provider.dart` to use RPC function
- [x] Updated `web/src/app/(app)/invoices/new/invoice-form.tsx` to use RPC function

**Database:** Uses `payments` table, reads from `invoices` and `invoice_items`

**Testing:** ✅ Can record payments, view history, track outstanding amounts, auto-refresh invoice list

**Note on Payment Method:** We intentionally did NOT add payment method dropdown because the web app doesn't have it. This maintains feature parity between web and mobile apps.

---

### ✅ **Step 7: Party Report (Basic Mode)** 📊 - COMPLETED
**Why seventh?** Users need to see party-wise summaries.

**What was built:**
- [x] Create Party Details screen (`screens/parties/party_details_screen.dart`)
  - [x] Party information card with gradient header
  - [x] Summary cards (white background with borders):
    - [x] Total Billed (sum of all invoices)
    - [x] Total Received (sum of all payments)
    - [x] Current Balance (opening balance + billed - received)
    - [x] Number of invoices
  - [x] List of all invoices for this party
    - [x] Invoice number, date, amount, status
    - [x] Tap to navigate to invoice details
  - [x] Pull-to-refresh functionality
- [x] Weekly Mini Report feature (enhanced from web)
  - [x] Accessible from party list (tap on party)
  - [x] Previous outstanding balance display
  - [x] Current/last week's invoices list with details
  - [x] Total This Week calculation
  - [x] Grand Total Outstanding calculation
  - [x] White card design with consistent styling
  - [x] "More Details" button navigating to comprehensive party details screen

**UI Improvements:**
- [x] Clean white card layouts with subtle borders
- [x] Responsive font sizes (14px for most text)
- [x] Gradient header for party info section
- [x] Visual hierarchy with proper spacing
- [x] Mobile-optimized layout preventing overflow
- [x] Standardized button styling (ElevatedButton with 12px border radius)

**Button Styling Standardization (Step 7 Bonus):**
- [x] Created comprehensive button styling guide at `/docs/mobile-button-styling-guide.md`
- [x] Standardized all buttons across the app:
  - [x] party_weekly_report_screen.dart - More Details button
  - [x] parties_screen.dart - Save, Delete, Add First Party buttons
  - [x] create_invoice_screen.dart - 6 FilledButtons and 1 OutlinedButton
  - [x] add_edit_item_screen.dart - Remove and Add/Update Item buttons
  - [x] view_invoice_screen.dart - Add Payment, Share, PDF, Delete buttons
  - [x] add_payment_dialog.dart - Save button with loading state
- [x] Standard button specs:
  - Border Radius: 12px
  - Font Size: 16px (14px for smaller buttons)
  - Font Weight: 600 (semi-bold)
  - Vertical Padding: 16px (full-width), 12px (dialog), 8px (compact)

**Additional UI Refinements:**
- [x] Added SR numbers to invoice items list (1., 2., 3., etc.)
- [x] Made Add Payment button compact (no icon, smaller padding)
- [x] Matched invoice date font size to created date (12px)
- [x] Repositioned status badge below party name to prevent overflow
- [x] Changed invoice list sorting to invoice_number (descending)

**Database:** Aggregate queries on `invoices` and `payments`

**Testing:** ✅ Can view party summaries, weekly reports, and navigate to comprehensive details

---

### ✅ **Step 8: PDF Generation & Sharing (Basic Mode)** 🖨️ - COMPLETED
**Why eighth?** Essential for professional invoice sharing.

**What was built:**
- [x] Add `pdf` package to pubspec.yaml
- [x] Create `services/pdf_service.dart`
- [x] Create PDF template for invoices (matching web format)
  - [x] Invoice header ("CASH MEMO" title with underline)
  - [x] Invoice number and date (top-right alignment)
  - [x] Party details (Bill To section)
  - [x] Items table with SR. NO, quantities, units, rates, amounts
  - [x] Sub-total, bundle quantity, bundle charge, grand total
  - [x] Footer with computer-generated message
- [x] PDF Actions (from invoice details screen)
  - [x] Preview PDF with native viewer
  - [x] Download PDF to device
  - [x] Share via WhatsApp and other apps
- [x] Smart filename formatting: "{invoice_number} {party_name} {invoice_date}.pdf"
- [x] Proper filename sanitization (replace invalid characters)

**Key Features Implemented:**
- [x] Google Fonts integration for proper Rupee symbol (₹) rendering
- [x] Multi-page PDF support for invoices with many items
- [x] 50% width layout optimization (compact, professional look)
- [x] Smart number formatting (integers without decimals)
- [x] Share position origin support for iPad/tablet popup positioning
- [x] Error handling for PDF generation and sharing
- [x] Debug logging for troubleshooting

**Recent Improvements:**
- [x] Optimized PDF layout to 50% width for compact printing
- [x] Added Google Fonts (Noto Sans) for consistent Rupee symbol rendering
- [x] Enabled multi-page support using `pw.MultiPage` for long invoices
- [x] Removed icons from Share and PDF buttons for clean UI

**Dependencies:** `pdf`, `printing`, `share_plus`, `path_provider`

**Database:** Read-only operations on `invoices` and `invoice_items` tables

**Testing:** ✅ Can generate, preview, download, and share invoice PDFs with proper formatting

---

### ✅ **Step 9: Offline Bill Entry** ⚡ - COMPLETED
**Why ninth?** Quick way to add invoices that were sent manually.

**What was built:**
- [x] Create Offline Bill screen (`screens/invoices/add_offline_bill_screen.dart`)
- [x] Add "Offline Bill" button (lightning bolt icon ⚡) in Home screen AppBar
- [x] Party Selection Bottom Sheet (matches item selection design):
  - [x] Draggable bottom sheet with rounded top corners
  - [x] Searchable party list with real-time filtering
  - [x] Clean white cards for each party
  - [x] Party name as title, phone as subtitle
  - [x] Consistent design with item selection bottom sheet
  - [x] Swipe down to dismiss functionality
  - [x] Placeholder text matches theme hint color
- [x] Complete Offline Bill Form (matching web version):
  - [x] Party selection with bottom sheet picker
  - [x] Total Amount input field with rupee icon
  - [x] Invoice Date picker with calendar icon
  - [x] Payment Status selection with bottom sheet (Paid/Pending/Partial)
  - [x] Amount Received field (shows only when Partial is selected)
  - [x] Notes field (Optional, multiline, top-aligned)
  - [x] All fields use consistent bordered input style (12px border radius)
  - [x] Icons for each field (person, rupee, calendar, payment)
- [x] Payment Status Bottom Sheet:
  - [x] Color-coded status indicators (red for Pending, orange for Partial, green for Paid)
  - [x] Visual selection with check icon
  - [x] Consistent design with party selection bottom sheet
- [x] Mark invoice as `is_offline = true`
- [x] Show OFFLINE badge in invoice list (orange background with dark orange text)
- [x] Auto-create payment record based on payment status
- [x] Validation for partial payments (must be > 0 and < total amount)

**Key Features:**
- [x] Full-screen dedicated interface matching web version
- [x] All 5 fields from web: Party, Amount, Date, Payment Status, Notes
- [x] Bottom sheet for party selection (matches item selection design)
- [x] Bottom sheet for payment status (consistent UI pattern)
- [x] Draggable bottom sheets with smooth animations
- [x] Date picker with calendar icon
- [x] Conditional Amount Received field for partial payments
- [x] Auto-create payment based on status (Paid/Partial)
- [x] Search parties by name with instant results
- [x] Visual feedback with icons and colors
- [x] Fixed bottom button with full width
- [x] Back arrow navigation (consistent with other screens)

**UI/UX Enhancements:**
- [x] Consistent bordered input style (12px border radius, matching other screens)
- [x] Icon for each field (person, rupee, calendar, payment)
- [x] Grey borders and proper padding (16px horizontal, 16px vertical)
- [x] Multiline notes field with top alignment
- [x] Consistent bottom sheet design across all pickers
- [x] Clean white cards for parties with borders
- [x] Phone numbers displayed in party list
- [x] Swipe-to-dismiss bottom sheets
- [x] Theme-based hint color for placeholders
- [x] Color-coded payment status options with circular indicators
- [x] Selected status highlighted with check icon

**Database:** Creates entries in `invoices` and `payments` tables based on payment status

**Testing:** ✅ Can create offline bills with all fields matching web version functionality, including partial payments

---

### ✅ **UI/UX Polish & Consistency** 🎨 - COMPLETED
**Why important?** Consistent design improves user experience and app professionalism.

**What was done:**

**Units Screen Redesign:**
- [x] Removed green avatar box with letter
- [x] Simplified card layout matching invoice/party list style
- [x] Unit name displayed at top (bold, 16px)
- [x] "Created on [date]" shown below name (grey, 12px)
- [x] Edit/Restore icon aligned to right with zero padding
- [x] Added margin to dismissible background for alignment
- [x] Consistent white cards with grey borders (16px radius)

**Icon Standardization (Outline/Flat Icons):**
- [x] Converted all icons to outline versions for consistency
- [x] Updated across all screens:
  - `person` → `person_outline`
  - `phone` → `phone_outlined`
  - `email` → `email_outlined`
  - `location_on` → `location_on_outlined`
  - `calendar_today` → `calendar_today_outlined`
  - `payment` → `payment_outlined`
  - `check_circle` → `check_circle_outline`
  - `access_time` → `access_time_outlined`
  - `receipt_long` → `receipt_long_outlined`
  - `account_balance_wallet` → `account_balance_wallet_outlined`
  - `description` → `description_outlined`
  - `business` → `business_outlined`
  - `straighten` → `straighten_outlined`
  - `delete_outline` → `delete_outlined`
  - `people_outline` → `people_outlined`

**Files Updated:**
- [x] settings/units_screen.dart
- [x] settings/parties_screen.dart
- [x] invoices/add_payment_dialog.dart
- [x] invoices/add_offline_bill_screen.dart
- [x] invoices/view_invoice_screen.dart
- [x] invoices/create_invoice_screen.dart
- [x] invoices/invoices_screen.dart
- [x] parties/party_details_screen.dart
- [x] parties/add_edit_party_screen.dart
- [x] parties/parties_screen.dart
- [x] items/add_edit_item_screen.dart
- [x] items/view_item_screen.dart
- [x] items/items_screen.dart
- [x] auth/login_screen.dart

**Design Consistency Achieved:**
- ✅ All empty state icons use outline versions
- ✅ All form field prefix icons use outline versions
- ✅ All action button icons use outline versions
- ✅ All status indicator icons use outline versions
- ✅ Consistent card layouts across all list screens

**Database:** No changes required

**Testing:** ✅ All screens display consistent outline icons

---

### ✅ **Step 10: Settings & Configuration** ⚙️ - COMPLETED
**Why last?** Nice-to-have features after core functionality is complete.

**What was built:**
- [x] Enhanced Settings screen with:
  - [x] Dark Mode toggle (Light/Dark theme switching)
  - [x] Theme persistence using SharedPreferences
  - [x] ThemeProvider with ChangeNotifier pattern
  - [x] Default Bundle Rate management
  - [x] Units management access

**Dark Mode Implementation:**
- [x] Created ThemeProvider with theme state management
- [x] Persist theme preference in SharedPreferences
- [x] Updated MaterialApp with themeMode property
- [x] Implemented comprehensive light and dark ThemeData
- [x] Updated all screens to be dark mode compatible:
  - [x] Create Invoice Screen (stepper colors fixed)
  - [x] Item Details Screen (header and button styling)
  - [x] Weekly Report Screen (header styling)
  - [x] Settings Screen (border and switch styling)
  - [x] All dialogs and date pickers with theme support
- [x] Wired Settings toggle to theme provider with Switch component

**UI Components:**
- [x] Section headers (Appearance, General Settings, Master Data)
- [x] Setting cards with icons and descriptions
- [x] Dark mode toggle switch with proper colors
- [x] Bundle rate dialog with theme-aware styling
- [x] Navigation to Units screen

**Database:** Uses `app_settings` table for bundle rate

**Testing:** ✅ Can toggle dark/light mode with persistence, configure bundle rate, access units management

---

### ✅ **Step 11: Home Screen Dashboard** 🏠 - COMPLETED
**Why eleventh?** Central hub providing business overview and quick access to key metrics.

**What was built:**

**Dashboard Summary Cards:**
- [x] Financial Overview Section with timezone-aware calculations (IST):
  - [x] **Today's Revenue** card - Total sales today (using created_at instead of invoice_date)
  - [x] **This Week's Revenue** card - Weekly total from Monday to today
  - [x] **This Month's Revenue** card - Monthly total from 1st to today
  - [x] **Total Outstanding** card - Opening Balance + Total Billed - Total Received

**Quick Actions Section:**
- [x] Quick Actions Grid (2x2 layout):
  - [x] Create Bill button (primary action with green background)
  - [x] Offline Bill button (lightning bolt icon)
  - [x] Add Party button (navigate to party creation)
  - [x] Add Item button (navigate to item creation)
  - [x] Gradient backgrounds for visual appeal
  - [x] Consistent icons and styling

**Recent Activity:**
- [x] Recent Invoices Section:
  - [x] List last 5 invoices (optimized for mobile)
  - [x] Show: Party name, amount, date, status badge, offline badge
  - [x] Invoice number and date with proper formatting
  - [x] Tap to view invoice details
  - [x] "View All" button navigating to Bills tab
  - [x] Same card style as Bills tab (vertical layout)

**UI Layout Structure Implemented**:
```
Dashboard Screen
├── Financial Summary (4 cards in 2x2 grid)
├── Quick Actions (4 buttons in 2x2 grid)
└── Recent Invoices (Last 5 invoices with "View All")
```

**Card Design Features**:
- White background with grey border (16px radius)
- Gradient backgrounds for financial cards
- Icon + Title + Value layout
- Consistent padding (16px)
- Color coding for status badges
- Proper text overflow handling

**Key Technical Features**:
- [x] Timezone-aware date filtering (Asia/Kolkata)
- [x] Week calculation using Monday as start day (business week convention)
- [x] Real-time calculations from invoices and payments
- [x] Proper date comparison using `DateTime.compareTo()`
- [x] Outstanding calculation: opening_balance + billed - received
- [x] Provider-based state management with Consumer2 pattern
- [x] Smart number formatting (integers without decimals)

**Critical Fixes & Improvements**:
- [x] Fixed web dashboard to use Monday-based weeks (added `weekStartsOn: 1`)
- [x] Fixed timezone handling in SQL (convert UTC to IST before date extraction)
- [x] Created database trigger to auto-calculate invoice totals
- [x] Fixed Next.js hydration error with `suppressHydrationWarning`
- [x] Updated dashboard stats to use `created_at` instead of `invoice_date`
- [x] Database migrations created:
  - `update_dashboard_stats_use_created_at.sql`
  - `fix_dashboard_timezone_ist.sql`
  - `add_auto_calculate_invoice_total_trigger.sql`

**Database:** Read-only aggregate queries on `invoices`, `payments`, and `parties` tables

**Testing:** ✅ Can view business metrics, navigate to invoice details, use quick actions, see accurate financial data matching web dashboard

---

## 📝 **Development Workflow for Each Step**

For each step above, follow this process:

1. **Explain** what I'm going to build
2. **Wait for approval** before writing code
3. **Build** the feature with proper error handling
4. **Test** the feature locally
5. **Commit** changes with descriptive message
6. **Wait for "push to github"** command before pushing

---

## 🎯 **Success Criteria for Basic Mode MVP**

After completing all 10 steps, users should be able to:

✅ Manage units, parties, and items
✅ Create invoices with step-by-step wizard
✅ Apply party-specific pricing automatically
✅ View and manage all invoices
✅ Record and track payments
✅ View party-wise reports and outstanding balances
✅ Generate and share PDF invoices
✅ Quickly add offline bills
✅ Configure basic app settings

---

## 📌 **Current Status**

**Completed:** Steps 0-11 + UI/UX Polish + Basic Mode (Authentication, Units, Parties, Items, Invoice Creation, Invoice Management, Payment Management, Party Report, PDF Generation & Sharing, Offline Bill Entry, Icon Standardization, Home Screen Dashboard, Light/Dark Theme, Basic Mode Toggle)
**Next Step:** Localization (Hindi & Urdu) - Priority 2
**Mode:** Basic Mode implemented with toggle (enabled by default)
**Pending from Step 5:** Date/status filters (not critical for MVP)

**Recent Completions:**
- **Priority 1: Basic Mode Implementation** ✅ (October 2025)
  - BasicModeProvider with state management and persistence
  - Basic Mode enabled by default for new users
  - Dynamic bottom navigation (4 tabs in Basic Mode, 5 in Full Mode)
  - Dashboard customized for Basic Mode (Add Item + Add Party quick actions only)
  - Toggle switch in Settings with real-time updates
  - Vertical button layout with large touch targets (48px padding)
  - Custom colors: Sky Blue for Add Item, Amber for Add Party
  - Files: basic_mode_provider.dart, home_screen.dart, dashboard_tab.dart, settings_screen.dart

- **Step 10: Light/Dark Theme Implementation** ✅ (October 2025)
  - Complete dark mode support across all screens
  - ThemeProvider with state persistence
  - Fixed stepper background colors in Create Invoice screen
  - Updated Item Details and Weekly Report headers for dark theme
  - Refined Settings screen borders and switch styling
  - Theme-aware dialogs and date pickers
  - Consistent dark mode colors (#3D6B5C for dark green, proper opacity for borders)

- **Step 11: Home Screen Dashboard** ✅ (October 2025)
  - Financial summary cards with timezone-aware calculations (IST)
  - Quick actions grid (2x2 layout with Create Bill, Offline Bill, Add Party, Add Item)
  - Recent invoices section showing last 5 invoices with "View All" button
  - Database trigger for auto-calculating invoice totals
  - Fixed web dashboard to match mobile (Monday-based weeks, created_at filtering)
  - Critical bug fixes: timezone handling, hydration errors, invoice total sync

- **UI/UX Polish & Consistency** ✅ (December 2025)
  - Units screen redesigned with simplified card layout
  - All icons standardized to outline/flat versions across entire app
  - Consistent design system: white cards, grey borders, 16px radius
  - 14 files updated for icon consistency

- **Offline Invoice Improvements** ✅ (December 2025)
  - OFFLINE badge implementation on mobile and web
  - Hide items/bundle sections for offline invoices
  - Edit support with limited fields (Party, Amount, Date only)
  - Payment fields managed separately in Payment History
  - Database schema fix: using `remark` field instead of `notes`
  - Badge sizing and positioning consistency
  - All changes synced across mobile, web, and main branches

- **Step 9: Offline Bill Entry** ✅ (October 2025)
  - Lightning bolt button in AppBar for fast invoice creation
  - Full-screen form matching web version (all 5 fields)
  - Party selection with searchable draggable bottom sheet
  - Total Amount input with rupee icon
  - Invoice Date picker with calendar icon
  - Payment Status bottom sheet with color-coded indicators (Paid/Pending/Partial)
  - Amount Received field (conditional - shows only for Partial status)
  - Notes field (optional, multiline, top-aligned)
  - Consistent bordered input style matching other screens (12px border radius)
  - Auto-create payment record based on payment status
  - Auto-marks invoice as offline (`is_offline = true`)
  - OFFLINE badge display in invoice list (orange bg/text)
  - Validation for partial payments
  - Theme-based hint color for placeholders

- **Step 8: PDF Generation & Sharing** ✅ (October 2025)

---

## 📝 **Pending Tasks - Implementation Order**

### ✅ **Priority 1: Basic Mode** 🔒 - COMPLETED
**Status:** ✅ Completed (October 2025)

**What was implemented:**
- [x] Created `BasicModeProvider` with ChangeNotifier pattern for state management
- [x] Basic Mode enabled by default (`_isBasicMode = true`)
- [x] Persist Basic Mode preference in SharedPreferences
- [x] Toggle switch in Settings screen (Appearance section)
- [x] Dynamic bottom navigation tabs based on mode:
  - **Basic Mode:** 4 tabs (Home, Items, Parties, Settings)
  - **Full Mode:** 5 tabs (Home, Bills, Items, Parties, Settings)
- [x] Dashboard Quick Actions customized for Basic Mode:
  - Basic Mode: Shows only Add Item and Add Party buttons (vertical layout)
  - Full Mode: Shows all 4 quick actions (Create Bill, Offline Bill, Add Party, Add Item)
- [x] Real-time state updates when toggling between modes
- [x] Reset selected tab to 0 when switching modes to prevent out-of-bounds errors
- [x] Provider registered globally in MultiProvider

**UI Features:**
- [x] Toggle switch in Settings with blue accent color
- [x] Descriptive subtitle showing current mode status
- [x] Vertical layout for quick action buttons in Basic Mode (full-width with large touch targets)
- [x] Custom colors: Sky Blue (#0EA5E9) for Add Item, Amber (#F59E0B) for Add Party
- [x] Large button height (48px vertical padding, 40px icons, 18px font)

**Files Modified:**
- `mobile/lib/providers/basic_mode_provider.dart` (NEW FILE)
- `mobile/lib/main.dart` - Added BasicModeProvider to MultiProvider
- `mobile/lib/screens/home_screen.dart` - Dynamic tabs based on mode
- `mobile/lib/screens/dashboard_tab.dart` - Conditional Quick Actions
- `mobile/lib/screens/settings/settings_screen.dart` - Added Basic Mode toggle

**Database:** Uses SharedPreferences for persistence (no database changes)

**Testing:** ✅ Can toggle Basic/Full mode, tabs update dynamically, dashboard shows appropriate quick actions

---

### **Priority 2: Localization (Hindi & Urdu)** 🌐
**Status:** Pending
- Full language support with language switcher in Settings
- i18n strings for all UI text and messages
- RTL (Right-to-Left) handling for Urdu
- Persistent language preference in SharedPreferences
- Support for Hindi, Urdu, and English

### **Priority 3: Invoice Filters** 🔍
**Status:** Pending (Step 5 - Optional)
- Date range filter for invoices on Bills screen
- Payment status filter (Paid/Pending/Partial)
- Filter UI with bottom sheet or dialog
- Clear filters option

### **Priority 4: Draft Invoices** 💾
**Status:** Pending (Step 5 - Deferred, after web implementation)
- Save incomplete/unfinished invoices as drafts
- Resume draft invoices from where user left off
- Draft invoices list or section
- Auto-save draft functionality
- Will implement on web first, then mobile

### **Priority 5: Offline Mode** 📴
**Status:** Pending (Phase 3)
- Work without internet connection
- Local data storage with SQLite or Hive
- Sync queue for pending operations
- Offline indicator in UI
- Handle offline create/edit/delete operations

### **Priority 6: Background Sync** 🔄
**Status:** Pending (Phase 3)
- Automatic sync when device comes online
- Conflict resolution strategy for concurrent edits
- Sync status indicators
- Manual sync trigger option

### **Priority 7: Accessibility Enhancements** ♿
**Status:** Pending (Phase 3)
- Screen reader support with semantic labels
- Scalable fonts and large text support
- High contrast mode for better visibility
- Keyboard navigation support
- WCAG compliance

### **Priority 8: Gesture Navigation Improvements** 👆
**Status:** Pending (Phase 3)
- Enhanced swipe gestures for common flows
- Swipe to navigate between tabs
- Pinch to zoom for invoices/PDFs
- Custom gesture shortcuts

### **Priority 9: AI/ML Features** 🤖
**Status:** Pending (Phase 4 - Future)
- OCR for receipts: Scan and create items/invoices from receipt images
- Voice commands: Create invoices using voice input
- Smart suggestions based on usage patterns
- Auto-fill party/item details

### **Priority 10: Testing Suite** 🧪
**Status:** Pending (Quality Assurance)
- Unit tests for core business logic (services, providers)
- Integration tests for database operations
- Widget tests for UI components
- E2E tests for critical user flows (login, create invoice, payments)
- Device testing on multiple devices and OS versions (iOS/Android)
- Performance and memory leak testing

### **Priority 11: Deployment Preparation** 🚀
**Status:** Pending (Quality Assurance)
- App Store optimization with screenshots and descriptions
- Google Play Store release with metadata
- Beta testing with TestFlight (iOS) and Firebase/Play Console (Android)
- Analytics integration (Firebase Analytics, Mixpanel, etc.)
- Crash reporting setup (Crashlytics, Sentry)
- App versioning and release notes
- CI/CD pipeline for automated builds

---

## 🎯 **Current Status Summary**

**✅ Completed:** All core features (Steps 0-11) + Basic Mode
- Authentication & Settings
- Units, Parties, Items Management
- Invoice Creation & Management
- Payment Tracking
- Party Reports
- PDF Generation & Sharing
- Offline Bill Entry
- Home Screen Dashboard
- UI/UX Polish & Consistency
- Light/Dark Theme (Complete) ✅
- Basic Mode Toggle (Priority 1) ✅

**🚧 In Progress:** None

**📅 Next Up:** Localization (Hindi & Urdu) - Priority 2

---

**Note:** The mobile app now has full feature parity with the web app. All pending tasks are enhancements and future features that will be implemented based on user feedback and business priorities.
