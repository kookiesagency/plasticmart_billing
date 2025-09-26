# Mobile App Roadmap: PlasticMart Mobile

This document outlines the development plan for the PlasticMart Mobile application. The mobile app will share the same Supabase database with the web application and provide a simplified, layman-friendly interface for core business operations.

---

## **App Overview**

**Target Users:** Business owners, field staff, and anyone who needs to create invoices and manage basic data on-the-go
**Platform:** Cross-platform (iOS & Android) using React Native
**Database:** Shared Supabase database with web application
**Sync:** Real-time bidirectional sync with web app

---

## **Core Concept: Two Operating Modes**

### **Basic Mode (Default)**
- **Target:** Laymen, field staff, simple operations
- **Focus:** Essential CRUD operations with clean, simple UI
- **Features:** Add items, create invoices, add parties, basic management

### **Advanced Mode (Settings Toggle)**
- **Target:** Power users, business owners
- **Focus:** All features equivalent to web application
- **Features:** Complete feature parity with web app including advanced reporting, bulk operations, etc.

---

## **Phase 1: MVP - Basic Mode Foundation**

### **1.1 Project Setup & Architecture**
- [ ] Set up React Native project with TypeScript
- [ ] Configure shared components library (@plasticmart/shared)
- [ ] Set up Supabase React Native client
- [ ] Configure navigation (React Navigation v6)
- [ ] Set up state management (Zustand/Redux Toolkit)
- [ ] Configure offline storage (MMKV/AsyncStorage)

### **1.2 Authentication & Settings**
- [ ] **Simple Login:** Basic authentication flow
- [ ] **App Settings:** Mode toggle (Basic/Advanced)
- [ ] **User Preferences:** Theme, language, offline settings
- [ ] **Data Sync Settings:** Auto-sync intervals, offline behavior

### **1.3 Party Management (Basic Mode)**
- [ ] **Add New Party:**
  - Simple form: Name, Phone Number, Bundle Rate (optional)
  - Contact picker integration (import from phone)
  - Large, touch-friendly buttons
- [ ] **Party List:**
  - Card-based layout with search
  - Swipe actions: Edit, Delete
  - Pull-to-refresh functionality
- [ ] **Edit Party:** Same simple form as add
- [ ] **Delete Party:** Soft delete with restore option (swipe to restore)
- [ ] **Permanent Delete:** Available in advanced mode only

### **1.4 Item Management (Basic Mode)**
- [ ] **Add New Item:**
  - Simple form: Name, Rate, Unit, Purchase Rate (optional)
  - Visual unit picker (KG, PCS, DZ, etc.)
  - Photo support for items (optional)
  - **Party-Specific Pricing:** Simple add/edit interface
- [ ] **Items List:**
  - Card-based layout with search
  - Show: Name, Rate, Unit, Special Prices Count
  - Swipe actions: Edit, Delete, Manage Prices
  - Pull-to-refresh functionality
- [ ] **Edit Item:** Same simple form as add with pricing management
- [ ] **Party-Specific Pricing Management:**
  - **Add Special Price:** Select party + enter rate
  - **Edit Special Price:** Update existing party rates
  - **Remove Special Price:** Delete party-specific rates
  - **Visual Indicator:** Show items with special pricing
  - **Quick Access:** Swipe action for price management
- [ ] **Delete Item:** Soft delete with restore option
- [ ] **Permanent Delete:** Available in advanced mode only

### **1.5 Invoice Creation (Basic Mode)**
- [ ] **Step-by-Step Invoice Wizard:**
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
- [ ] **Real-time Calculations:** Sub-total, bundle charge, grand total
- [ ] **Draft Invoices:** Save incomplete invoices
- [ ] **Voice Input:** For quantities and rates (optional)

### **1.6 Party-Specific Pricing UX (Basic Mode)**
- [ ] **Simple Pricing Interface:**
  - **From Item Screen:** Tap "Manage Prices" button or swipe action
  - **Visual Indicators:** Badge showing "X special prices" on item cards
  - **Add Special Price Flow:**
    - Step 1: Select party from searchable list
    - Step 2: Enter special rate with number pad
    - Step 3: Save with confirmation
  - **Price List View:** Simple list showing Party Name → Special Rate
  - **Quick Actions:** Edit or delete prices with swipe gestures
- [ ] **Automatic Rate Application:**
  - When creating invoices, special rates auto-apply
  - Visual indicator showing "Special Rate Applied"
  - Fallback to default rate if no special price exists
- [ ] **Mobile-Optimized UI:**
  - Large touch targets for easy interaction
  - Clear visual hierarchy (Default Rate vs Special Rates)
  - Quick search and filter for parties
  - Confirmation dialogs for price changes

### **1.7 Invoice Management (Basic Mode)**
- [ ] **Invoice List:**
  - Card-based layout showing: Party, Date, Total, Status
  - Search and filter by party/date
  - Status indicators (Paid/Pending/Partial)
  - Pull-to-refresh functionality
- [ ] **Invoice Actions:**
  - View invoice details
  - Download PDF (same as web app)
  - Share via WhatsApp/Email/SMS
- [ ] **Invoice Status Updates:** Mark as paid/pending
- [ ] **Delete Invoice:** Soft delete with restore option

---

## **Phase 2: Advanced Mode Features**

### **2.1 Advanced Party Management**
- [ ] **Detailed Party View:** Complete party profile with invoice history
- [ ] **Bulk Operations:** Import/export parties
- [ ] **Advanced Search:** Filter by balance, bundle rate, etc.
- [ ] **Payment History:** View all payments from party

### **2.2 Advanced Item Management**
- [ ] **Advanced Pricing Features:**
  - Bulk pricing updates
  - Pricing history tracking
  - Price comparison tools
  - Profit margin calculations
- [ ] **Bulk Operations:** Import/export items
- [ ] **Item Categories:** Organize items by categories
- [ ] **Stock Management:** Basic inventory tracking
- [ ] **Advanced Search:** Filter by rate, unit, category, pricing status

### **2.3 Advanced Invoice Features**
- [ ] **Invoice Templates:** Multiple invoice layouts
- [ ] **Recurring Invoices:** Set up automatic invoice generation
- [ ] **Multi-Currency:** Support for different currencies
- [ ] **Tax Management:** Add tax calculations
- [ ] **Bulk Invoice Operations:** Bulk status updates, exports

### **2.4 Reports & Analytics**
- [ ] **Sales Reports:** Daily, weekly, monthly sales
- [ ] **Party Reports:** Outstanding balances, payment history
- [ ] **Item Reports:** Best-selling items, stock levels
- [ ] **Dashboard:** Key metrics and charts
- [ ] **Export Options:** PDF, CSV, Excel exports

---

## **Phase 3: Enhanced Mobile Experience**

### **3.1 Mobile-Specific Features**
- [ ] **Offline Mode:** Work without internet connection
- [ ] **Background Sync:** Sync data when connected
- [ ] **Push Notifications:** Payment reminders, low stock alerts
- [ ] **Widget Support:** Quick invoice creation from home screen
- [ ] **Haptic Feedback:** Touch feedback for better UX

### **3.2 Integration Features**
- [ ] **Contact Integration:** Import parties from phone contacts
- [ ] **Camera Integration:** Take photos of items
- [ ] **Location Services:** Add location to invoices (optional)
- [ ] **Calendar Integration:** Schedule invoice due dates
- [ ] **Share Extensions:** Share invoices to other apps

### **3.3 Advanced UX/UI**
- [ ] **Dark Mode:** Battery-friendly dark theme
- [ ] **Accessibility:** Support for screen readers, large text
- [ ] **Multi-language:** Support for local languages
- [ ] **Customizable UI:** Adjustable layouts for different screen sizes
- [ ] **Gesture Navigation:** Swipe gestures for common actions

---

## **Phase 4: Business Intelligence & Automation**

### **4.1 Smart Features**
- [ ] **Smart Suggestions:** Suggest items for parties based on history
- [ ] **Price Optimization:** Suggest optimal pricing
- [ ] **Payment Predictions:** Predict payment likelihood
- [ ] **Inventory Alerts:** Low stock notifications

### **4.2 Automation**
- [ ] **Auto-Invoice Generation:** Based on schedules or triggers
- [ ] **Payment Reminders:** Automatic SMS/WhatsApp reminders
- [ ] **Backup & Restore:** Automatic data backups
- [ ] **Data Cleanup:** Automatic cleanup of old data

---

## **Technical Architecture**

### **Development Stack**
- **Framework:** React Native with TypeScript
- **Navigation:** React Navigation v6
- **State Management:** Zustand (lightweight) or Redux Toolkit
- **Database:** Supabase (shared with web)
- **Storage:** MMKV for offline data
- **UI Library:** React Native Paper or NativeBase
- **Forms:** React Hook Form with Zod validation
- **Charts:** Victory Native (for advanced mode)

### **Shared Code Strategy**
- **Database Layer:** Shared Supabase utilities
- **Business Logic:** Shared TypeScript utilities
- **Types:** Shared TypeScript interfaces
- **Validation:** Shared Zod schemas

### **Performance Considerations**
- **Lazy Loading:** Load features based on mode
- **Memory Management:** Efficient list rendering
- **Bundle Optimization:** Code splitting for advanced features
- **Caching Strategy:** Smart caching for offline support

---

## **Quality Assurance**

### **Testing Strategy**
- [ ] **Unit Tests:** Core business logic
- [ ] **Integration Tests:** Database operations
- [ ] **E2E Tests:** Critical user flows
- [ ] **Device Testing:** Multiple devices and OS versions

### **Performance Metrics**
- [ ] **App Launch Time:** < 2 seconds cold start
- [ ] **Screen Load Time:** < 1 second for common screens
- [ ] **Memory Usage:** Optimize for low-end devices
- [ ] **Battery Usage:** Minimal background processing

---

## **Deployment & Distribution**

### **Beta Testing**
- [ ] **Internal Testing:** Team testing with TestFlight/Firebase
- [ ] **User Acceptance Testing:** Real users testing core flows
- [ ] **Feedback Integration:** Collect and implement user feedback

### **Production Release**
- [ ] **App Store Optimization:** Proper listing with screenshots
- [ ] **Play Store Release:** Android release with proper metadata
- [ ] **Update Strategy:** OTA updates for non-native changes
- [ ] **Analytics:** Track user behavior and app performance

---

## **Future Enhancements**

### **Advanced Integrations**
- [ ] **WhatsApp Business API:** Send invoices via WhatsApp
- [ ] **Payment Gateway Integration:** Accept online payments
- [ ] **Accounting Software Sync:** QuickBooks, Tally integration
- [ ] **E-commerce Integration:** Sync with online store

### **AI/ML Features**
- [ ] **OCR for Receipts:** Scan and create items from receipts
- [ ] **Voice Commands:** Create invoices using voice
- [ ] **Smart Categorization:** Auto-categorize items and parties
- [ ] **Predictive Analytics:** Forecast sales and inventory needs

---

## **Success Metrics**

### **User Adoption**
- **Target:** 80% of web users adopt mobile app within 6 months
- **Basic Mode Usage:** 70% of users remain in basic mode
- **Advanced Mode Usage:** 30% of users switch to advanced mode

### **Performance Metrics**
- **App Store Rating:** Maintain 4.5+ stars
- **Crash Rate:** < 1% crash rate
- **User Retention:** 60% monthly active users

### **Business Impact**
- **Invoice Creation Speed:** 50% faster than web on mobile
- **User Satisfaction:** 90% user satisfaction score
- **Feature Parity:** 100% core feature parity with web app

---

This roadmap ensures a progressive development approach, starting with essential features for laymen and gradually adding advanced capabilities for power users.