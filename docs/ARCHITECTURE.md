# Shared Codebase Architecture: Web + Mobile

This document outlines the recommended architecture for sharing code between the web application (Next.js) and mobile application (React Native) while maintaining clean separation and easy maintenance.

---

## **🏗️ Recommended Project Structure**

```
plasticmart-ecosystem/
├── packages/
│   ├── shared/                    # Shared business logic & types
│   ├── web/                       # Next.js web application (current)
│   └── mobile/                    # React Native mobile app
├── apps/ (alternative structure)
│   ├── web/                       # Web app
│   └── mobile/                    # Mobile app
├── libs/
│   └── shared/                    # Shared utilities
└── package.json                   # Root workspace config
```

---

## **🎯 Best Architecture Approach: Monorepo with Workspace**

### **Option 1: Yarn/NPM Workspaces (Recommended)**

**Pros:**
- ✅ Simple setup and maintenance
- ✅ Easy dependency management
- ✅ Works with existing tools
- ✅ No additional infrastructure needed
- ✅ Easy CI/CD setup

**Cons:**
- ❌ Less sophisticated than specialized tools
- ❌ Manual optimization needed

### **Option 2: Nx Monorepo (Advanced)**

**Pros:**
- ✅ Advanced caching and optimization
- ✅ Dependency graph visualization
- ✅ Built-in code generation
- ✅ Excellent tooling

**Cons:**
- ❌ Learning curve
- ❌ Additional complexity
- ❌ Overkill for current scope

### **Recommendation: Start with Yarn Workspaces**

---

## **📁 Detailed Project Structure**

```
plasticmart/
├── package.json                   # Root workspace config
├── packages/
│   ├── shared/                    # Shared package
│   │   ├── src/
│   │   │   ├── types/            # TypeScript interfaces
│   │   │   │   ├── invoice.ts
│   │   │   │   ├── item.ts
│   │   │   │   ├── party.ts
│   │   │   │   └── index.ts
│   │   │   ├── schemas/          # Zod validation schemas
│   │   │   │   ├── invoice.ts
│   │   │   │   ├── item.ts
│   │   │   │   └── party.ts
│   │   │   ├── utils/            # Shared utilities
│   │   │   │   ├── calculations.ts
│   │   │   │   ├── formatting.ts
│   │   │   │   ├── validation.ts
│   │   │   │   └── constants.ts
│   │   │   ├── database/         # Supabase utilities
│   │   │   │   ├── client.ts
│   │   │   │   ├── invoices.ts
│   │   │   │   ├── items.ts
│   │   │   │   ├── parties.ts
│   │   │   │   └── types.ts
│   │   │   └── hooks/            # Shared React hooks (optional)
│   │   │       ├── useInvoices.ts
│   │   │       ├── useItems.ts
│   │   │       └── useParties.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                       # Next.js web app (your current app)
│   │   ├── src/
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   └── tsconfig.json
│   │
│   └── mobile/                    # React Native mobile app
│       ├── src/
│       │   ├── components/       # Mobile-specific components
│       │   ├── screens/         # Mobile screens
│       │   ├── navigation/      # React Navigation setup
│       │   ├── hooks/          # Mobile-specific hooks
│       │   ├── utils/          # Mobile-specific utilities
│       │   └── App.tsx
│       ├── android/
│       ├── ios/
│       ├── package.json
│       ├── metro.config.js
│       └── tsconfig.json
│
├── docs/                          # Documentation
│   ├── roadmap.md
│   ├── mobile-roadmap.md
│   └── ARCHITECTURE.md
└── tools/                         # Build tools & scripts
    ├── scripts/
    └── configs/
```

---

## **🔧 Implementation Steps**

### **Step 1: Restructure Current Project**

```bash
# 1. Create new project structure
mkdir plasticmart-ecosystem
cd plasticmart-ecosystem

# 2. Initialize root workspace
npm init -y

# 3. Move current project to web package
mkdir -p packages/web
# Move your current project files to packages/web/

# 4. Create shared package
mkdir -p packages/shared/src/{types,schemas,utils,database}
cd packages/shared && npm init -y

# 5. Update root package.json
```

### **Step 2: Root package.json Configuration**

```json
{
  "name": "plasticmart-ecosystem",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev:web": "yarn workspace @plasticmart/web dev",
    "dev:mobile": "yarn workspace @plasticmart/mobile start",
    "build:web": "yarn workspace @plasticmart/web build",
    "build:mobile": "yarn workspace @plasticmart/mobile build:android",
    "test": "yarn workspaces run test",
    "lint": "yarn workspaces run lint",
    "shared:build": "yarn workspace @plasticmart/shared build"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

### **Step 3: Shared Package Structure**

**packages/shared/package.json:**
```json
{
  "name": "@plasticmart/shared",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.50.0",
    "zod": "^3.25.67"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

---

## **🔄 Migration Strategy**

### **Phase 1: Extract Shared Code (Week 1)**
1. **Move Types**: Extract all TypeScript interfaces
2. **Move Schemas**: Extract all Zod validation schemas
3. **Move Utilities**: Extract calculation and formatting functions
4. **Move Database Layer**: Extract Supabase client and queries

### **Phase 2: Update Web App (Week 1)**
1. Update imports to use shared package
2. Test all existing functionality
3. Ensure no breaking changes

### **Phase 3: Create Mobile App (Week 2-3)**
1. Initialize React Native project
2. Import shared package
3. Build mobile-specific UI components
4. Implement basic mode features

### **Phase 4: Testing & Optimization (Week 4)**
1. End-to-end testing
2. Performance optimization
3. Code review and refinement

---

## **📦 Shared Package Contents**

### **Types (packages/shared/src/types/)**
```typescript
// invoice.ts
export interface Invoice {
  id: number;
  party_id: number | null;
  party_name: string;
  invoice_date: string;
  bundle_rate: number;
  bundle_quantity: number;
  bundle_charge: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

// item.ts
export interface Item {
  id: number;
  name: string;
  default_rate: number;
  purchase_rate: number | null;
  unit_id: number;
  units?: {
    id: number;
    name: string;
  } | null;
  item_party_prices: ItemPartyPrice[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// party.ts
export interface Party {
  id: number;
  name: string;
  bundle_rate: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
```

### **Database Layer (packages/shared/src/database/)**
```typescript
// client.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// invoices.ts
import { Invoice } from '../types';
import { supabaseClient } from './client';

export const invoicesAPI = {
  getAll: async () => {
    return supabaseClient.from('invoices').select('*').order('created_at', { ascending: false });
  },

  create: async (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) => {
    return supabaseClient.from('invoices').insert(invoice).select().single();
  },

  // ... other methods
};
```

### **Utils (packages/shared/src/utils/)**
```typescript
// calculations.ts
export const calculateInvoiceTotal = (items: InvoiceItem[], bundleCharge: number) => {
  const subTotal = items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
  return subTotal + bundleCharge;
};

// formatting.ts
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};
```

---

## **📱 Mobile App Integration**

### **Using Shared Package in Mobile**
```typescript
// mobile/src/screens/CreateInvoice.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { invoicesAPI, calculateInvoiceTotal } from '@plasticmart/shared';

export const CreateInvoiceScreen = () => {
  const createInvoice = async (invoiceData) => {
    const total = calculateInvoiceTotal(invoiceData.items, invoiceData.bundleCharge);
    await invoicesAPI.create({ ...invoiceData, total_amount: total });
  };

  return (
    <View>
      <Text>Create Invoice</Text>
      {/* Mobile UI components */}
    </View>
  );
};
```

---

## **🚀 Benefits of This Architecture**

### **Code Reusability**
- ✅ **90%+ code sharing** for business logic
- ✅ **Type safety** across platforms
- ✅ **Consistent validation** rules
- ✅ **Single source of truth** for data structures

### **Maintainability**
- ✅ **Update once, deploy everywhere**
- ✅ **Centralized business logic**
- ✅ **Easy testing** of shared components
- ✅ **Consistent behavior** across platforms

### **Development Speed**
- ✅ **Faster mobile development**
- ✅ **Reduced debugging** time
- ✅ **Easier feature additions**
- ✅ **Better collaboration** between teams

---

## **🎯 Next Steps**

1. **Restructure Project**: Move to workspace structure
2. **Extract Shared Code**: Create @plasticmart/shared package
3. **Update Web App**: Use shared package
4. **Create Mobile App**: Build React Native app using shared code
5. **Test Integration**: Ensure both apps work correctly
6. **Document Changes**: Update documentation

This architecture ensures that when you add features to the web app, the same logic is immediately available to the mobile app, maintaining consistency and reducing development time.