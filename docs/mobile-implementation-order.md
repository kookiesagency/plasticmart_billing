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

### **Step 0: Authentication Foundation** 🔐
**Why first?** Essential security layer - users need to login before accessing the app.

#### **Step 0.1: Splash Screen**
**What to build:**
- [ ] Create `screens/auth/splash_screen.dart`
- [ ] Design splash screen with:
  - [ ] PlasticMart logo/branding
  - [ ] App name
  - [ ] Loading indicator
  - [ ] Version number (optional)
- [ ] Auto-navigate after 2-3 seconds:
  - [ ] If user is logged in → Navigate to HomeScreen
  - [ ] If not logged in → Navigate to LoginScreen
- [ ] Check authentication state using Supabase

**Dependencies:** None (uses existing Supabase config)

**Testing:** App launches with splash, then navigates correctly based on auth state

---

#### **Step 0.2: Login Screen**
**What to build:**
- [ ] Create `screens/auth/login_screen.dart`
- [ ] Create `providers/auth_provider.dart` for authentication state
- [ ] Design simple login form:
  - [ ] Email input field
  - [ ] Password input field
  - [ ] "Login" button
  - [ ] Show/hide password toggle
  - [ ] Error message display
  - [ ] Loading state during authentication
- [ ] Implement Supabase email/password authentication
- [ ] Store auth session persistently
- [ ] Navigate to HomeScreen on successful login
- [ ] Handle login errors gracefully

**Optional features:**
- [ ] "Forgot Password" link
- [ ] "Remember Me" checkbox
- [ ] Sign up option (if needed)

**Database:** Uses Supabase auth system (no custom tables needed)

**Testing:** Can login with valid credentials, see error messages for invalid credentials

---

### **Step 1: Unit Management (Settings)** 📦
**Why next?** Units are foundational - needed for items and invoices.

**What to build:**
- [ ] Create `models/unit.dart` model
- [ ] Create `services/unit_service.dart` for Supabase operations
- [ ] Create `screens/settings/units_screen.dart`
- [ ] Add "Units" option in Settings screen
- [ ] Build Units list with card UI
- [ ] Add dialog for creating new unit
- [ ] Edit unit functionality
- [ ] Soft delete units (mark as deleted)
- [ ] Set default unit

**Database:** Uses existing `units` table

**Testing:** Can add, edit, delete, and set default units

---

### **Step 2: Party Management (Basic Mode)** 👥
**Why second?** Parties are needed before creating invoices.

**What to build:**
- [ ] Create `models/party.dart` model
- [ ] Create `services/party_service.dart` for Supabase operations
- [ ] Create `providers/party_provider.dart` for state management
- [ ] Build Party List screen (`screens/parties/parties_screen.dart`)
  - [ ] Card-based layout
  - [ ] Search functionality
  - [ ] Pull-to-refresh
- [ ] Create Add Party dialog/screen
  - [ ] Name field (required)
  - [ ] Phone number field (optional)
  - [ ] Bundle rate field (optional)
  - [ ] Opening balance field (optional)
- [ ] Edit party functionality
- [ ] Soft delete party (swipe to delete)
- [ ] Restore deleted party (swipe to restore)

**Database:** Uses existing `parties` table

**Testing:** Can add, view, edit, search, and delete parties

---

### **Step 3: Item Management (Basic Mode)** 📦
**Why third?** Items are needed for creating invoice line items.

**What to build:**
- [ ] Create `models/item.dart` model
- [ ] Create `services/item_service.dart` for Supabase operations
- [ ] Create `providers/item_provider.dart` for state management
- [ ] Build Item List screen (`screens/items/items_screen.dart`)
  - [ ] Card-based layout showing name, rate, unit
  - [ ] Search functionality
  - [ ] Pull-to-refresh
- [ ] Create Add Item dialog/screen
  - [ ] Name field (required)
  - [ ] Rate field (required)
  - [ ] Unit dropdown from units list (required)
  - [ ] Purchase rate field (optional)
  - [ ] Purchase party dropdown (optional)
- [ ] Edit item functionality
- [ ] Soft delete item (swipe to delete)
- [ ] **Party-Specific Pricing** (Simple Version)
  - [ ] "Manage Prices" button on item card
  - [ ] List of party-specific prices
  - [ ] Add special price: select party + enter rate
  - [ ] Edit special price
  - [ ] Remove special price

**Database:** Uses existing `items` and `party_item_prices` tables

**Testing:** Can add items with default rates and party-specific pricing

---

### **Step 4: Invoice Creation (Basic Mode - Step-by-Step Wizard)** 📄
**Why fourth?** Core feature that ties everything together.

**What to build:**
- [ ] Create `models/invoice.dart` and `models/invoice_item.dart` models
- [ ] Create `services/invoice_service.dart` for Supabase operations
- [ ] Create `providers/invoice_provider.dart` for state management
- [ ] Build Create Invoice Wizard (`screens/invoices/create_invoice_screen.dart`)

**Step 1: Select Party**
- [ ] Searchable party list
- [ ] Quick "Add New Party" button
- [ ] Display selected party info (name, bundle rate)

**Step 2: Add Items**
- [ ] Search and select items
- [ ] For each item:
  - [ ] Quantity input with number pad
  - [ ] Unit dropdown (defaults to item's unit)
  - [ ] Rate (auto-populated from party-specific price or default)
  - [ ] Editable rate field
  - [ ] Amount calculation (Qty × Rate)
- [ ] Quick "Add New Item" button
- [ ] Remove item button
- [ ] Smart unit conversion when changing units

**Step 3: Review & Confirm**
- [ ] Show invoice summary:
  - [ ] Party name
  - [ ] Invoice date (editable)
  - [ ] List of items with quantities and amounts
  - [ ] Sub-total calculation
  - [ ] Bundle charge (from party's bundle rate)
  - [ ] Grand total (Sub-total + Bundle charge)
- [ ] Payment status dropdown (Paid/Pending/Partial)
- [ ] Amount received field (conditional on payment status)
- [ ] Save invoice button

**Features:**
- [ ] Real-time calculations for totals
- [ ] Draft invoice saving (in-progress invoices)
- [ ] Auto-generate invoice number (YYYY-YY/XXX format)
- [ ] Mark invoice as offline if needed

**Database:** Uses `invoices`, `invoice_items`, and `payments` tables

**Testing:** Can create complete invoices with items and payments

---

### **Step 5: Invoice Management (Basic Mode)** 📋
**Why fifth?** Users need to view, edit, and manage created invoices.

**What to build:**
- [ ] Build Invoice List screen (update existing `screens/invoices/invoices_screen.dart`)
  - [ ] Card-based layout showing:
    - [ ] Invoice number
    - [ ] Party name
    - [ ] Invoice date
    - [ ] Total amount
    - [ ] Payment status badge (Paid/Pending/Partial)
    - [ ] OFFLINE badge if applicable
  - [ ] Search by party name or invoice number
  - [ ] Filter by date range
  - [ ] Filter by payment status
  - [ ] Pull-to-refresh
  - [ ] Infinite scroll for large datasets
- [ ] View Invoice Details screen
  - [ ] Party information
  - [ ] Invoice number and date
  - [ ] List of items with quantities and rates
  - [ ] Sub-total, bundle charge, grand total
  - [ ] Payment status and amount received
  - [ ] Payment history
- [ ] Invoice Actions
  - [ ] Edit invoice (navigate to edit screen)
  - [ ] Duplicate invoice (create copy with new date)
  - [ ] Update payment status
  - [ ] Record additional payments
  - [ ] Soft delete invoice
  - [ ] Restore deleted invoice

**Database:** Read/update operations on `invoices`, `invoice_items`, `payments`

**Testing:** Can view, search, filter, edit, and manage invoices

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

**Completed:** Phase 1.1 (Project Setup)
**Next Step:** Step 0.1 - Splash Screen
**Then:** Step 0.2 - Login Screen
**Mode:** Basic Mode First
**Awaiting:** Approval to start Step 0 (Authentication Foundation)

---

## 🔄 **After Basic Mode is Complete**

Once all 10 steps are complete and tested, we'll move to:

- **Phase 2:** Advanced Mode features (advanced party management, bulk operations, analytics)
- **Phase 3:** Mobile-specific features (offline mode, push notifications, widgets)
- **Phase 4:** Business intelligence & automation

---

**Note:** This order ensures we build a fully functional Basic Mode app first, allowing real-world testing and feedback before adding advanced features.
