# Project Roadmap: Smart Billing System

This document outlines the development plan for the Smart Billing System. The project is structured into sequential phases, starting from initial setup to final deployment.

## **Development Rules** ⚠️
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

## Recently Added Features

### Invoice & Item Management Enhancements (Latest)
- **Enhanced Create Item Dialog**: Full-featured item creation directly from invoice form with party-specific pricing support
- **Smart Item Filtering**: Hide already-added items from selection list to prevent duplicates
- **Intelligent Search UX**: Context-aware messaging for different item states (already added, found, create new)
- **Improved Create Button**: Professional black styling with proper hover states for "Create new item" actions
- **Fixed Invoice Saving**: Resolved database schema conflicts by removing non-existent subTotal column
- **Comprehensive Inline Editing**: Double-click editing functionality for items table (name, rates, purchase rates)
- **Type Safety Improvements**: Resolved Party type conflicts and ensured consistent data structures
- **Enhanced Error Handling**: Better user feedback and validation throughout the item management flow

### Previous Features
- Drag-and-drop reordering for invoice items with a modern handle icon.
- Serial number ("No") column for invoice items, auto-updating with order.
- Editable item name field directly in the invoice table.
- Left-aligned Qty, Unit, and Rate columns for better readability.
- Red trash icon for deleting invoice items, improving clarity of destructive actions.
- Table alignment and spacing improvements for a cleaner UI.
- Empty state row now spans the full table width for better appearance.

---

### **Core Technologies**

*   **Frontend:** Next.js (with TypeScript)
*   **UI Framework:** Shadcn/UI & Tailwind CSS
*   **Backend & Database:** Supabase (PostgreSQL)
*   **Hosting:** Vercel

---

## **Upcoming Features - Next Development Phase**

### **Feature Priority Matrix**

| Priority | Feature | Complexity | Status |
|----------|---------|------------|--------|
| 🔴 High | Party Invoice Count | Low | ✅ Completed |
| 🔴 High | Opening Balance | Low | ✅ Completed |
| 🔴 High | Invoice Numbering System | Medium | ✅ Completed |
| 🔴 High | Offline Bill Entry | Low | Pending |
| 🔴 High | Smart Unit Conversion | Medium | Pending |
| 🔴 High | Fetch Updated Data | High | Pending |
| 🟡 Medium | Duplicate Item | Low | Pending |
| 🟡 Medium | Weekly Mini Report | Medium | Pending |
| 🟡 Medium | Purchase Party Dropdown | Low | Pending |
| 🟡 Medium | Hindi Localization | High | Pending |
| 🟢 Low | AI Chat for Invoices | Very High | Future |

---

### **1. Party Invoice Count Column** 🔴 High Priority ✅ **COMPLETED**
**Description:** Display total number of invoices for each party in the party listing page

**Files Modified:**
- `web/src/app/(app)/parties/columns.tsx` - Added "No. of Invoices" column with sorting
- `web/src/app/(app)/parties/use-parties.ts` - Fetch invoice count using Supabase aggregate

**Database Changes:** None (uses aggregate query)

**Implementation:**
```typescript
supabase.from('parties').select('*, invoices!party_id(count)')
```

---

### **2. Party Opening Balance** 🔴 High Priority ✅ **COMPLETED**
**Description:** Track initial balance for each party at the start

**Files Modified:**
- `database/add_opening_balance_to_parties.sql` - Database migration
- `web/src/app/(app)/parties/party-form.tsx` - Added "Opening Balance" field with validation
- `web/src/app/(app)/parties/[id]/page.tsx` - Display opening balance in 4-card summary
- `database/update_dashboard_stats_with_opening_balance.sql` - Updated RPC function

**Database Changes:**
```sql
ALTER TABLE parties ADD COLUMN opening_balance DECIMAL(10, 2) DEFAULT 0;
```

**Calculation Logic:**
- Total Outstanding = Opening Balance + Total Invoiced - Total Paid
- Opening balance is a ONE-TIME value set at party creation
- Never updated automatically - used only for initial offline amounts

---

### **3. Invoice Numbering System** 🔴 High Priority ✅ **COMPLETED**
**Description:** Auto-generate invoice numbers with financial year format (YYYY-YY/XXX), apply to existing and new invoices, display in PDFs

**Files Modified:**
- `database/add_invoice_number_to_invoices.sql` - Database migration with trigger
- `web/src/app/(app)/invoices/new/invoice-form.tsx` - Display auto-generated number (read-only)
- `web/src/app/(app)/invoices/columns.tsx` - Display invoice number column with sorting
- `web/src/app/(app)/invoices/invoice-pdf.tsx` - Show in PDF template
- `web/src/app/(app)/invoices/printable-invoice.tsx` - Show in print view
- `web/src/app/(public)/invoices/view/[public_id]/page.tsx` - Show in public invoice

**Database Changes:**
```sql
ALTER TABLE invoices ADD COLUMN invoice_number VARCHAR(20) UNIQUE NOT NULL;
CREATE INDEX idx_invoice_number ON invoices(invoice_number);
CREATE FUNCTION get_financial_year(invoice_date DATE) -- Calculate FY
CREATE FUNCTION generate_invoice_number(invoice_date DATE) -- Generate number
CREATE TRIGGER trigger_auto_generate_invoice_number -- Auto-generate on insert
```

**Number Generation Logic:**
- Format: **YYYY-YY/XXX** (Financial Year based)
- Financial year: April 1st to March 31st
- Examples:
  - Invoice dated April 1, 2024: `2024-25/001`
  - Invoice dated March 31, 2025: `2024-25/002`
  - Invoice dated April 1, 2025: `2025-26/001` (counter resets)
- Counter resets to 001 every April 1st
- Existing invoices auto-assigned numbers based on invoice_date

---

### **4. Quick Offline Bill Entry** 🔴 High Priority
**Description:** Quickly add invoices sent manually with only date, amount, and party name

**Files to Edit:**
- `web/src/app/(app)/invoices/page.tsx` - Add "Quick Entry" button
- `web/src/components/invoice/quick-entry-dialog.tsx` (new) - Simple 3-field form

**Form Fields:**
- Party (dropdown, required)
- Amount (number, required)
- Date (date picker, required)
- Notes (optional)

**Database Changes:**
```sql
ALTER TABLE invoices ADD COLUMN is_offline BOOLEAN DEFAULT FALSE;
```

---

### **5. Smart Unit Conversion in Invoice Items** 🔴 High Priority
**Description:** When changing unit (e.g., DOZ to PCS), automatically recalculate rate

**Files to Edit:**
- `web/src/app/(app)/invoices/new/invoice-form.tsx` - Add unit change handler
- `web/src/app/(app)/invoices/edit/[id]/page.tsx` - Add same logic for edit
- `web/src/app/(app)/invoices/new/items-columns.tsx` - Handle unit dropdown change

**Conversion Logic:**
- DOZ → PCS: rate ÷ 12
- PCS → DOZ: rate × 12
- KG → G: rate ÷ 1000
- Store conversion factors in configuration

**Database Changes:** None (client-side calculation)

---

### **6. Fetch Updated Data in Invoice** 🔴 High Priority
**Description:** Show popup with updated item names, rates, party names, units with manual approval to update invoice

**Files to Edit:**
- `web/src/app/(app)/invoices/edit/[id]/page.tsx` - Add "Fetch Updates" button
- `web/src/components/invoice/fetch-updates-dialog.tsx` (new) - Changes table
- `web/src/components/invoice/update-comparison.tsx` (new) - Side-by-side view

**Features:**
- Compare current invoice data with latest from database
- Show: Old Value → New Value
- Checkboxes for each change
- "Fetch Selected" or "Fetch All" buttons

**Database Changes:** None (reads current data)

---

### **7. Duplicate Item Feature** 🟡 Medium Priority
**Description:** Click "Duplicate" on item, opens popup with pre-filled data, change only item name

**Files to Edit:**
- `web/src/app/(app)/items/page.tsx` - Add "Duplicate" button in row actions
- `web/src/app/(app)/items/items-columns.tsx` - Add duplicate action dropdown

**Logic:**
1. Copy all item fields
2. Append " (Copy)" to item name
3. Open edit dialog with pre-filled data
4. User modifies name, saves as new item

**Database Changes:** None (creates new item)

---

### **8. Weekly Mini Report** 🟡 Medium Priority
**Description:** Generate report showing previous outstanding balance + current week's invoices with totals, organized by party

**Files to Edit:**
- `web/src/app/(app)/page.tsx` - Add "Weekly Report" section or button
- `web/src/components/reports/weekly-report.tsx` (new) - Report component
- `web/src/components/reports/weekly-report-pdf.tsx` (new) - PDF export

**Report Format:**
```
Party Name:
  Previous Outstanding Balance: ₹X,XXX
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Current Week Invoices:
    Invoice #2024/001 - ₹XXX
    Invoice #2024/002 - ₹XXX
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total This Week: ₹X,XXX
  Grand Total Outstanding: ₹X,XXX
```

**Database Query:**
- Get outstanding balance before current week start
- Get all invoices created in current week (grouped by party)
- Calculate totals per party

---

### **9. Purchase Party Dropdown in Add Item** 🟡 Medium Priority
**Description:** Add optional "Purchased From" party dropdown when creating/editing items

**Files to Edit:**
- `web/src/app/(app)/items/page.tsx` - Add party dropdown in item dialog
- `web/src/app/(app)/invoices/new/invoice-form.tsx` - Update CreateItemDialog

**Database Changes:**
```sql
ALTER TABLE items ADD COLUMN purchase_party_id INTEGER REFERENCES parties(id);
```

---

### **10. Hindi Localization Support** 🟡 Medium Priority
**Description:** Add Hindi language support throughout the application with language toggle

**Files to Edit:**
- `web/src/app/layout.tsx` - Add language context provider
- `web/src/lib/i18n/` (new folder) - Translation files
  - `en.json` - English translations
  - `hi.json` - Hindi translations
- `web/src/components/layout/header.tsx` - Add language switcher button
- All component files - Replace hardcoded text with translation keys

**Database Changes:**
```sql
ALTER TABLE user_preferences ADD COLUMN language VARCHAR(5) DEFAULT 'en';
```

**Implementation:** Use next-intl or react-i18next

---

### **11. AI Chat for Invoice Creation** 🟢 Future Enhancement
**Description:** ChatGPT integration to create invoices from uploaded images, Excel files, or text chat

**Files to Edit:**
- `web/src/app/(app)/invoices/new/page.tsx` - Add "AI Assistant" button
- `web/src/components/ai-chat/` (new folder)
  - `ai-chat-dialog.tsx` - Chat interface
  - `file-uploader.tsx` - Image/Excel upload
  - `invoice-preview.tsx` - Preview before saving
- `web/src/lib/openai.ts` (new) - OpenAI API integration
- `.env.local` - Add `OPENAI_API_KEY`

**API Routes (new):**
- `web/src/app/api/ai/parse-invoice/route.ts` - Parse image/Excel
- `web/src/app/api/ai/chat/route.ts` - Chat endpoint

**Features:**
- Upload invoice image → Extract party, items, amounts
- Upload Excel → Parse and create invoice
- Chat to build invoice step-by-step
- Preview and confirm before saving

---

### **Recommended Implementation Order:**
1. ✅ Feature #2 (Opening Balance) - Foundation for calculations
2. ✅ Feature #1 (Party Invoice Count) - Quick win
3. ✅ Feature #3 (Invoice Numbering) - Important for business
4. ✅ Feature #4 (Offline Bill Entry) - High value, low effort
5. ✅ Feature #7 (Duplicate Item) - Quick win
6. ✅ Feature #5 (Smart Unit Conversion) - UX improvement
7. ✅ Feature #8 (Weekly Report) - Business reporting
8. ✅ Feature #6 (Fetch Updated Data) - Complex but valuable
9. ✅ Feature #9 (Purchase Party) - Nice to have
10. ✅ Feature #10 (Hindi Localization) - Large effort
11. ✅ Feature #11 (AI Chat) - Future enhancement

---

### **Phase 0: Project Setup & Foundation**

- [ ] **Initialize Next.js Project:** Set up a new Next.js application with TypeScript, Tailwind CSS, and the `app` router.
- [ ] **Integrate Shadcn UI:** Install and configure Shadcn UI as the primary component library.
- [ ] **Set up Supabase:** Create a new Supabase project, get API keys, and connect it to the application.
- [ ] **Define Database Schema:** Write and execute the initial SQL script to create all necessary tables (`parties`, `items`, `invoices`, `payments`, `units`, etc.).

---

### **Phase 1: Core Data Management**

- [ ] **Unit Management (Settings Page):**
    - Create a settings page.
    - Build UI to perform full CRUD (Create, Read, Update, Delete) operations on `units` (e.g., PCS, DZ).
    - Implement functionality to set a "Default Bundle Rate" in the settings.

- [ ] **Party (Client) Management:**
    - Build the Party List page (`/parties`).
    - Implement a data table to display all parties.
    - Create a form (dialog/modal) to add and edit parties, including the **party-specific bundle rate**.

- [x] **Item Management:**
    - [x] Build the Item List page (`/items`).
    - [x] Implement a data table to display all items.
    - [x] Create a form to add and edit items (`name`, `default_rate`, `unit`).
    - [x] **Crucial:** Implement the UI to add/edit/remove **party-specific pricing** for each item.
    - [x] **Enhanced:** Add inline editing with double-click functionality for all item fields.
    - [x] **Enhanced:** Integrate full item creation within invoice form workflow.

---

### **Phase 2: Invoice Creation & Logic**

- [x] **Build the Invoice Form (`/invoices/new`):**
    - [x] Design the main form for creating new invoices.
    - [x] Add a searchable dropdown to select a `Party`.
    - [x] On party selection, automatically fetch and populate their specific `bundle_rate`.
    - [x] Create the dynamic "Invoice Items" table where users can add/remove line items.
    - [x] For each line item:
        - [x] Implement a searchable dropdown to select an `Item`.
        - [x] The `Rate` field should auto-populate based on the selected party (using their special price if it exists, otherwise the default item price).
        - [x] `Amount` should be calculated automatically (`QTY * Rate`).
    - [x] The form should calculate and display `Sub-Total`, `Bundle Charge`, and `Grand Total` in real-time.
    - [x] **Enhanced:** Smart item filtering and creation workflow within invoice form.
    - [x] **Enhanced:** Drag-and-drop reordering for invoice items.

---

### **Phase 3: Invoice & Party Reporting**

- [ ] **Invoice Listing & Management (`/invoices`):**
    - Implement a data table to list all created invoices.
    - Columns should include `Party Name`, `Date`, `Total`, `Amount Received`, `Amount Pending`, and `Status`.
    - Add action buttons for `Edit`, `Download PDF`, and `Share`.

- [ ] **Payment Management:**
    - On the invoice view page, add an "Add Payment" button to allow recording partial or full payments against an invoice.
    - Display a history of payments for each invoice.

- [ ] **Party Report Page (`/parties/[id]`):**
    - Create a detailed view for a single party.
    - Display summary cards for their `Total Billed`, `Total Received`, and `Current Balance`.
    - List all invoices associated with that party.

---

### **Phase 4: Advanced Features & Finalization**

- [ ] **PDF Generation:**
    - Create a well-formatted, printable PDF component that resembles a traditional memo bill.
    - Implement the "Download PDF" functionality.

- [ ] **Public Shareable Invoice:**
    - Create a public-facing page (`/invoice/[id]`) that displays invoice details without requiring a login and also give a download invoice to download pdf.
    - The "Share" button should provide a link to this page.

- [ ] **Import/Export Functionality:**
    - Implement "Import from CSV" for the `items` list.
    - Implement "Export to CSV/PDF" for party reports.

- [ ] **Dashboard:**
    - Build the main dashboard page.
    - Include summary cards for overall bucsiness metrics (Total Revenue, Total Outstanding, etc.).
    - Add filters to view stats by week, month, and year.
    - Show a list of recent invoices.
    - add logs page where we can we what we change the data like if someone update the invoice etc, something like activity tracking on all page
    - show charts like total sales means invoice geenrated this month, week, year, and custom date, or you add use any other thing as well to show charts


- [ ] **Authentication:**
    - Build a simple login page for the system's users.

---

### **Phase 5: Deployment**

- [ ] **Final Testing:** Conduct end-to-end testing of all features.
- [ ] **Deploy to Vercel:** Connect the repository to Vercel for continuous deployment. 