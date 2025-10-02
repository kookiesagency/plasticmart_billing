# Mobile App Roadmap: PlasticMart Mobile

This document outlines the development plan for the PlasticMart Mobile application. The mobile app will share the same Supabase database with the web application and provide a simplified, layman-friendly interface for core business operations.

---

## **App Overview**

**Target Users:** Business owners, field staff, and anyone who needs to create invoices and manage basic data on-the-go
**Platform:** Cross-platform (iOS & Android) using **Flutter**
**Database:** Shared Supabase database with web application
**Sync:** Real-time bidirectional sync with web app
**State Management:** Provider (ChangeNotifier)

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

### **1.1 Project Setup & Architecture** ✅ COMPLETE
- [x] Set up Flutter project with Dart
- [x] Configure Supabase Flutter client
- [x] Set up navigation (Bottom Navigation Bar)
- [x] Set up state management (Provider)
- [x] Configure persistent storage (SharedPreferences)
- [x] Implement Basic/Advanced Mode toggle
- [x] Create home screen with adaptive tabs
- [x] Set up project folder structure

### **1.2 Authentication & Settings** ⏳ IN PROGRESS
- [x] **App Settings:** Mode toggle (Basic/Advanced) implemented
- [ ] **Simple Login:** Basic authentication flow with Supabase
- [ ] **User Preferences:** Theme, language, offline settings
- [ ] **Data Sync Settings:** Auto-sync intervals, offline behavior
- [ ] **Unit Management:** Add/edit/delete measurement units (KG, PCS, DZ, etc.)
  - Simple list with add/edit forms
  - Default unit selection
  - Soft delete with restore
- [ ] **Default Bundle Rate:** Configure global bundle rate setting
- [ ] **App Configuration:**
  - Company name and details
  - Invoice number prefix/format
  - Default currency settings
- [ ] **Security Settings:** Auto-logout, PIN protection (optional)

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
  - Search and filter by party/date/amount
  - Status indicators (Paid/Pending/Partial)
  - Pull-to-refresh functionality
  - Infinite scroll for large datasets
- [ ] **Invoice Actions:**
  - View detailed invoice screen
  - Download PDF (mobile-optimized)
  - Share via WhatsApp/Email/SMS
  - Print integration (if available)
- [ ] **Invoice Status Updates:** Mark as paid/pending/partial
- [ ] **Edit Invoice:** Modify existing invoices (Basic: limited fields)
- [ ] **Delete Invoice:** Soft delete with restore option
- [ ] **Duplicate Invoice:** Create copy of existing invoice

### **1.8 Payment Management (Basic Mode)**
- [ ] **Record Payments:**
  - Simple payment entry form
  - Payment method selection (Cash, Bank, UPI, etc.)
  - Partial payment support
  - Payment date selection
- [ ] **Payment History:**
  - List payments per invoice
  - Payment method indicators
  - Date and amount display
- [ ] **Outstanding Balance:**
  - Visual indicators for pending amounts
  - Quick payment shortcuts
  - Balance summary per party

### **1.9 PDF & Sharing (Basic Mode)**
- [ ] **PDF Generation:**
  - Mobile-optimized invoice templates
  - Company logo and details
  - Professional formatting
  - Local storage for offline access
- [ ] **Sharing Options:**
  - Direct WhatsApp sharing
  - Email with PDF attachment
  - SMS with link (for large files)
  - Save to device storage
- [ ] **Print Integration:**
  - Bluetooth printer support
  - Cloud printing (Google Cloud Print)
  - Preview before printing

---

## **Phase 2: Advanced Mode Features**

### **2.1 Advanced Party Management**
- [ ] **Detailed Party View:** Complete party profile with invoice history
- [ ] **Bulk Operations:** Import/export parties via CSV
- [ ] **Advanced Search:** Filter by balance, bundle rate, creation date
- [ ] **Payment History:** View all payments from party with detailed breakdown
- [ ] **Party Reports:** Outstanding balances, payment trends
- [ ] **Bulk Actions:** Mass update bundle rates, merge duplicate parties
- [ ] **Contact Sync:** Two-way sync with phone contacts
- [ ] **Party Categories:** Group parties by type/location
- [ ] **Credit Limits:** Set and monitor credit limits per party
- [ ] **Deleted Parties Tab:** View and restore deleted parties
- [ ] **Permanent Delete:** Irreversible party deletion with confirmations

### **2.2 Advanced Item Management**
- [ ] **Advanced Pricing Features:**
  - Bulk pricing updates across multiple items
  - Pricing history tracking and analytics
  - Price comparison tools and suggestions
  - Profit margin calculations and reporting
  - Automated pricing rules based on purchase rate
- [ ] **Bulk Operations:**
  - Import/export items via CSV with preview
  - Mass edit item properties
  - Bulk delete and restore operations
- [ ] **Item Categories:**
  - Create and manage item categories
  - Nested category support
  - Category-based reporting
- [ ] **Stock Management:**
  - Basic inventory tracking
  - Low stock alerts and notifications
  - Stock adjustment logs
- [ ] **Advanced Search:**
  - Filter by rate, unit, category, pricing status
  - Multi-criteria search with saved filters
  - Global search across all item properties
- [ ] **Item Analytics:**
  - Best-selling items reports
  - Price trend analysis
  - Party preference insights
- [ ] **Deleted Items Management:**
  - Deleted items tab with restore functionality
  - Permanent delete with cascading confirmations
  - Bulk restore operations
- [ ] **Item Images:**
  - Photo gallery for each item
  - Image compression and optimization
  - Photo-based item search

### **2.3 Advanced Invoice Features**
- [ ] **Invoice Templates:**
  - Multiple professional invoice layouts
  - Custom logo and branding options
  - Template preview and selection
  - Company-specific formatting
- [ ] **Recurring Invoices:**
  - Set up automatic invoice generation
  - Flexible scheduling (daily, weekly, monthly)
  - Auto-send and notification options
- [ ] **Multi-Currency:**
  - Support for different currencies
  - Real-time exchange rate updates
  - Currency conversion history
- [ ] **Tax Management:**
  - Multiple tax rate support (GST, VAT, etc.)
  - Tax-inclusive and exclusive pricing
  - Tax reports and compliance
- [ ] **Bulk Invoice Operations:**
  - Bulk status updates (paid/pending)
  - Mass export to PDF/CSV
  - Bulk delete and restore
  - Batch email/WhatsApp sending
- [ ] **Advanced Invoice Management:**
  - Invoice versioning and history
  - Credit notes and refunds
  - Invoice approval workflows
  - Custom invoice numbering schemes
- [ ] **Invoice Analytics:**
  - Invoice performance metrics
  - Payment pattern analysis
  - Revenue forecasting
- [ ] **Deleted Invoices Management:**
  - Deleted invoices tab
  - Restore functionality with dependencies
  - Permanent delete with data integrity checks

### **2.4 Reports & Analytics**
- [ ] **Sales Reports:**
  - Daily, weekly, monthly, yearly sales
  - Custom date range reporting
  - Sales trend analysis with charts
  - Top-selling items and parties
  - Revenue vs target tracking
- [ ] **Party Reports:**
  - Outstanding balances with aging analysis
  - Payment history and patterns
  - Party-wise profitability analysis
  - Credit limit utilization
- [ ] **Item Reports:**
  - Best-selling items with quantities
  - Stock levels and movement reports
  - Price history and trend analysis
  - Profit margin reports per item
- [ ] **Dashboard:**
  - Key metrics with visual indicators
  - Interactive charts and graphs
  - Real-time data updates
  - Customizable widget layout
  - Quick action shortcuts
- [ ] **Export Options:**
  - PDF reports with professional formatting
  - CSV exports for Excel compatibility
  - Email reports with scheduling
  - Cloud storage integration (Google Drive, Dropbox)

### **2.5 Advanced Data Management**
- [ ] **Global Search:**
  - Search across all data types (parties, items, invoices)
  - Smart search suggestions
  - Recent searches history
  - Saved search queries
- [ ] **Data Import/Export:**
  - Comprehensive CSV import with mapping
  - Data validation and error handling
  - Import preview and confirmation
  - Export with custom field selection
- [ ] **Data Backup & Sync:**
  - Manual and automatic backup options
  - Cloud backup integration
  - Data restoration from backups
  - Sync conflict resolution
- [ ] **Activity Logs (Advanced Mode):**
  - Detailed audit trail of all changes
  - User action tracking
  - Data change history
  - Export logs for compliance

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
- **Framework:** React Native with TypeScript and Expo
- **Navigation:** React Navigation v6 with stack and tab navigators
- **State Management:** Zustand (lightweight) with persistence
- **Database:** Supabase (shared with web) with React Native client
- **Storage:** MMKV for offline data and app preferences
- **UI Library:** React Native Elements or NativeBase
- **Forms:** React Hook Form with Zod validation schemas
- **Charts:** Victory Native (for advanced mode analytics)
- **PDF Generation:** react-native-pdf-lib or react-native-html-to-pdf
- **Image Handling:** react-native-image-picker and image compression
- **Notifications:** Expo Notifications for push notifications
- **File System:** Expo FileSystem for document management
- **Printing:** react-native-print for invoice printing
- **Sharing:** react-native-share for multi-platform sharing

### **Shared Code Strategy**
- **Database Layer:** Shared Supabase utilities and API functions
- **Business Logic:** Shared TypeScript utilities for calculations
- **Types:** Shared TypeScript interfaces for all data models
- **Validation:** Shared Zod schemas for form validation
- **Constants:** Shared app constants and configuration
- **Utils:** Shared formatting, currency, and date utilities

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

## **Implementation Guidelines**

### **Database Integration Strategy**
- **Phase 1 Priority:** Connect mobile app to existing Supabase database
- **Shared Tables:** Use same tables as web app (parties, items, invoices, etc.)
- **Mobile-Specific Tables:** Add mobile preferences, offline cache
- **Data Sync:** Implement real-time sync using Supabase subscriptions
- **Conflict Resolution:** Handle offline/online data conflicts gracefully

### **Navigation Architecture**
```
App Navigator (Stack)
├── Auth Stack (when not logged in)
│   └── LoginScreen
├── Main Tab Navigator (when logged in)
│   ├── Dashboard Tab (Advanced Mode only)
│   ├── Invoices Tab
│   │   ├── InvoiceListScreen
│   │   ├── CreateInvoiceScreen
│   │   └── InvoiceDetailScreen
│   ├── Parties Tab
│   │   ├── PartyListScreen
│   │   ├── AddPartyScreen
│   │   └── PartyDetailScreen
│   ├── Items Tab
│   │   ├── ItemListScreen
│   │   ├── AddItemScreen
│   │   └── ItemDetailScreen
│   └── Settings Tab
│       ├── SettingsScreen
│       ├── UnitsScreen
│       └── PreferencesScreen
└── Modal Stack (overlays)
    ├── PaymentModal
    ├── PDFPreviewModal
    └── ShareModal
```

### **State Management Architecture**
```typescript
// Global Zustand Store Structure
interface AppStore {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;

  // App settings
  mode: 'basic' | 'advanced';
  theme: 'light' | 'dark';

  // Data caches (for offline support)
  parties: Party[];
  items: Item[];
  invoices: Invoice[];

  // UI state
  isLoading: boolean;
  activeTab: string;

  // Actions
  login: (user: User) => void;
  logout: () => void;
  setMode: (mode: 'basic' | 'advanced') => void;
  syncData: () => Promise<void>;
}
```

### **Offline Strategy**
- **Local Storage:** Use MMKV for critical data caching
- **Sync Queue:** Queue operations when offline, sync when online
- **Conflict Resolution:** Last-write-wins with user confirmation for conflicts
- **Cached Data:** Store frequently accessed data locally
- **Progressive Sync:** Sync data in background incrementally

### **Security Considerations**
- **Authentication:** Supabase JWT tokens with auto-refresh
- **Data Encryption:** Encrypt sensitive data in local storage
- **API Security:** Use Supabase RLS (Row Level Security) policies
- **Biometric Auth:** Optional biometric authentication for app access
- **Session Management:** Auto-logout after inactivity

### **Performance Optimization**
- **Lazy Loading:** Load screens and data on-demand
- **Image Optimization:** Compress and cache item images
- **List Virtualization:** Use FlatList for large datasets
- **Memoization:** Cache expensive calculations
- **Bundle Splitting:** Separate Basic and Advanced mode features

### **Error Handling & Logging**
- **Global Error Boundary:** Catch and handle React Native errors
- **Network Error Handling:** Graceful handling of connection issues
- **User-Friendly Messages:** Clear error messages for users
- **Crash Reporting:** Integrate Crashlytics or Sentry
- **Debug Logging:** Comprehensive logging for development

### **Testing Strategy**
- **Unit Tests:** Jest for business logic and utilities
- **Component Tests:** React Native Testing Library
- **Integration Tests:** Detox for E2E testing
- **Manual Testing:** Device testing matrix (iOS/Android, various screen sizes)

### **Deployment & Distribution**
- **Code Push:** Expo Updates for over-the-air updates
- **App Store Deployment:** Automated CI/CD pipeline
- **Beta Testing:** TestFlight (iOS) and Google Play Console (Android)
- **Version Management:** Semantic versioning with changelog

---

This comprehensive roadmap ensures a progressive development approach, starting with essential features for laymen and gradually adding advanced capabilities for power users while maintaining high code quality and performance standards.