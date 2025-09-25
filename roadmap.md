# Project Roadmap: Smart Billing System

This document outlines the development plan for the Smart Billing System. The project is structured into sequential phases, starting from initial setup to final deployment.

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