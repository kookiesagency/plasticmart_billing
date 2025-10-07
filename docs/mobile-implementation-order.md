# Mobile App Implementation Order

This document provides a step-by-step implementation order for building the PlasticMart Mobile app in **Basic Mode first**, following the mobile roadmap.

---

## ✅ **Phase 1.1: Project Setup & Architecture** - COMPLETED

- [x] Flutter project setup with Dart
- [x] Supabase Flutter client configuration
- [x] Bottom Navigation Bar setup
- [x] Provider state management
- [x] SharedPreferences for persistence
- [x] Basic/Advanced Mode toggle
- [x] Home screen with adaptive tabs
- [x] Project folder structure

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

### **Step 6: Payment Management (Basic Mode)** 💰
**Why sixth?** Essential for tracking outstanding balances.

**What to build:**
- [ ] Create `models/payment.dart` model
- [ ] Create `services/payment_service.dart`
- [ ] Add Payment dialog (from invoice view)
  - [ ] Payment amount field
  - [ ] Payment method dropdown (Cash, Bank, UPI, Cheque, etc.)
  - [ ] Payment date picker
  - [ ] Notes field (optional)
- [ ] Payment history list (on invoice details screen)
  - [ ] Date, amount, method
  - [ ] Edit payment
  - [ ] Delete payment
- [ ] Outstanding balance calculation
  - [ ] Show on invoice list
  - [ ] Show on party details
  - [ ] Visual indicators for pending payments

**Database:** Uses `payments` table

**Testing:** Can record payments, view history, track outstanding amounts

---

### **Step 7: Party Report (Basic Mode)** 📊
**Why seventh?** Users need to see party-wise summaries.

**What to build:**
- [ ] Create Party Details screen (`screens/parties/party_details_screen.dart`)
  - [ ] Party information card
  - [ ] Summary cards:
    - [ ] Total Billed (sum of all invoices)
    - [ ] Total Received (sum of all payments)
    - [ ] Current Balance (opening balance + billed - received)
    - [ ] Number of invoices
  - [ ] List of all invoices for this party
    - [ ] Invoice number, date, amount, status
    - [ ] Tap to view invoice details
  - [ ] Payment history for this party
- [ ] Weekly Mini Report feature
  - [ ] Previous outstanding balance
  - [ ] Current week's invoices with totals
  - [ ] Grand total outstanding

**Database:** Aggregate queries on `invoices` and `payments`

**Testing:** Can view party summaries and weekly reports

---

### **Step 8: PDF Generation & Sharing (Basic Mode)** 🖨️
**Why eighth?** Essential for professional invoice sharing.

**What to build:**
- [ ] Add `pdf` package to pubspec.yaml
- [ ] Create `services/pdf_service.dart`
- [ ] Create PDF template for invoices
  - [ ] Company logo and details
  - [ ] Invoice number and date
  - [ ] Party details (billed to)
  - [ ] Items table with quantities, rates, amounts
  - [ ] Sub-total, bundle charge, grand total
  - [ ] Payment status and amount received
- [ ] PDF Actions (from invoice details screen)
  - [ ] Preview PDF
  - [ ] Download PDF to device
  - [ ] Share via WhatsApp
  - [ ] Share via Email
  - [ ] Share via SMS (for small files)
- [ ] Print integration (optional)
  - [ ] Bluetooth printer support

**Dependencies:** `pdf`, `printing`, `share_plus`

**Testing:** Can generate, preview, download, and share invoice PDFs

---

### **Step 9: Offline Bill Entry (Quick Entry Dialog)** ⚡
**Why ninth?** Quick way to add invoices that were sent manually.

**What to build:**
- [ ] Create Quick Entry dialog (`screens/invoices/quick_entry_dialog.dart`)
- [ ] Add "Quick Entry" button in Invoice List screen
- [ ] Quick Entry Form:
  - [ ] Party dropdown (searchable)
  - [ ] Total amount field
  - [ ] Invoice date picker
  - [ ] Payment status dropdown (Paid/Pending/Partial)
  - [ ] Amount received field (conditional)
  - [ ] Notes field (optional)
- [ ] Mark invoice as `is_offline = true`
- [ ] Auto-create payment record based on status
- [ ] Show OFFLINE badge in invoice list

**Database:** Creates entries in `invoices` and `payments` tables

**Testing:** Can quickly add offline bills with payment information

---

### **Step 10: Settings & Configuration** ⚙️
**Why last?** Nice-to-have features after core functionality is complete.

**What to build:**
- [ ] Enhance Settings screen with:
  - [ ] App theme toggle (Light/Dark mode)
  - [ ] Default currency setting
  - [ ] Auto-logout timeout
  - [ ] Data sync settings
  - [ ] About app section
  - [ ] Version information
- [ ] Company Configuration (optional)
  - [ ] Company name
  - [ ] Address and contact details
  - [ ] Logo upload
  - [ ] Invoice number prefix

**Database:** May need `app_settings` or `company_info` table

**Testing:** Can configure app preferences and company details

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

**Completed:** Steps 0-5 (Authentication, Units, Parties, Items, Invoice Creation, Invoice Management)
**Next Step:** Step 6 - Payment Management
**Mode:** Basic Mode First
**Pending from Step 5:** Date/status filters, payment features (will be covered in Step 6)
**Awaiting:** User approval to proceed with Step 6

---

## 🔄 **After Basic Mode is Complete**

Once all 10 steps are complete and tested, we'll move to:

- **Phase 2:** Advanced Mode features (advanced party management, bulk operations, analytics)
- **Phase 3:** Mobile-specific features (offline mode, push notifications, widgets)
- **Phase 4:** Business intelligence & automation

---

**Note:** This order ensures we build a fully functional Basic Mode app first, allowing real-world testing and feedback before adding advanced features.
