import { z } from 'zod';
export declare const partySchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    bundle_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    bundle_rate?: number | null | undefined;
}, {
    name: string;
    email?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    bundle_rate?: number | null | undefined;
}>;
export declare const createPartySchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    bundle_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    bundle_rate?: number | null | undefined;
}, {
    name: string;
    email?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    bundle_rate?: number | null | undefined;
}>;
export declare const updatePartySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    bundle_rate: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    bundle_rate?: number | null | undefined;
}, {
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    bundle_rate?: number | null | undefined;
}>;
export declare const itemSchema: z.ZodObject<{
    name: z.ZodString;
    default_rate: z.ZodNumber;
    purchase_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    unit_id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    default_rate: number;
    unit_id: number;
    purchase_rate?: number | null | undefined;
}, {
    name: string;
    default_rate: number;
    unit_id: number;
    purchase_rate?: number | null | undefined;
}>;
export declare const createItemSchema: z.ZodObject<{
    name: z.ZodString;
    default_rate: z.ZodNumber;
    purchase_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    unit_id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    default_rate: number;
    unit_id: number;
    purchase_rate?: number | null | undefined;
}, {
    name: string;
    default_rate: number;
    unit_id: number;
    purchase_rate?: number | null | undefined;
}>;
export declare const updateItemSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    default_rate: z.ZodOptional<z.ZodNumber>;
    purchase_rate: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    unit_id: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    default_rate?: number | undefined;
    purchase_rate?: number | null | undefined;
    unit_id?: number | undefined;
}, {
    name?: string | undefined;
    default_rate?: number | undefined;
    purchase_rate?: number | null | undefined;
    unit_id?: number | undefined;
}>;
export declare const itemPartyPriceSchema: z.ZodObject<{
    item_id: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    party_id: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    price: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    item_id: string | number;
    party_id: string | number;
    price: number;
}, {
    item_id: string | number;
    party_id: string | number;
    price: number;
}>;
export declare const unitSchema: z.ZodObject<{
    name: z.ZodString;
    abbreviation: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    abbreviation?: string | undefined;
}, {
    name: string;
    abbreviation?: string | undefined;
}>;
export declare const createUnitSchema: z.ZodObject<{
    name: z.ZodString;
    abbreviation: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    abbreviation?: string | undefined;
}, {
    name: string;
    abbreviation?: string | undefined;
}>;
export declare const updateUnitSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    abbreviation: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    abbreviation?: string | undefined;
}, {
    name?: string | undefined;
    abbreviation?: string | undefined;
}>;
export declare const invoiceItemSchema: z.ZodObject<{
    itemId: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    itemName: z.ZodString;
    quantity: z.ZodNumber;
    rate: z.ZodNumber;
    amount: z.ZodNumber;
    unitName: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    itemId: string | number;
    itemName: string;
    quantity: number;
    rate: number;
    amount: number;
    unitName?: string | undefined;
    position?: number | undefined;
}, {
    itemId: string | number;
    itemName: string;
    quantity: number;
    rate: number;
    amount: number;
    unitName?: string | undefined;
    position?: number | undefined;
}>;
export declare const invoiceSchema: z.ZodObject<{
    partyId: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    partyName: z.ZodString;
    invoiceDate: z.ZodString;
    bundleRate: z.ZodNumber;
    bundleQuantity: z.ZodNumber;
    bundleCharge: z.ZodNumber;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
        itemName: z.ZodString;
        quantity: z.ZodNumber;
        rate: z.ZodNumber;
        amount: z.ZodNumber;
        unitName: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        itemId: string | number;
        itemName: string;
        quantity: number;
        rate: number;
        amount: number;
        unitName?: string | undefined;
        position?: number | undefined;
    }, {
        itemId: string | number;
        itemName: string;
        quantity: number;
        rate: number;
        amount: number;
        unitName?: string | undefined;
        position?: number | undefined;
    }>, "many">;
    totalAmount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    partyId: string | number;
    partyName: string;
    invoiceDate: string;
    bundleRate: number;
    bundleQuantity: number;
    bundleCharge: number;
    items: {
        itemId: string | number;
        itemName: string;
        quantity: number;
        rate: number;
        amount: number;
        unitName?: string | undefined;
        position?: number | undefined;
    }[];
    totalAmount: number;
}, {
    partyId: string | number;
    partyName: string;
    invoiceDate: string;
    bundleRate: number;
    bundleQuantity: number;
    bundleCharge: number;
    items: {
        itemId: string | number;
        itemName: string;
        quantity: number;
        rate: number;
        amount: number;
        unitName?: string | undefined;
        position?: number | undefined;
    }[];
    totalAmount: number;
}>;
export declare const createInvoiceSchema: z.ZodObject<{
    partyId: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    partyName: z.ZodString;
    invoiceDate: z.ZodString;
    bundleRate: z.ZodNumber;
    bundleQuantity: z.ZodNumber;
    bundleCharge: z.ZodNumber;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
        itemName: z.ZodString;
        quantity: z.ZodNumber;
        rate: z.ZodNumber;
        amount: z.ZodNumber;
        unitName: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        itemId: string | number;
        itemName: string;
        quantity: number;
        rate: number;
        amount: number;
        unitName?: string | undefined;
        position?: number | undefined;
    }, {
        itemId: string | number;
        itemName: string;
        quantity: number;
        rate: number;
        amount: number;
        unitName?: string | undefined;
        position?: number | undefined;
    }>, "many">;
    totalAmount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    partyId: string | number;
    partyName: string;
    invoiceDate: string;
    bundleRate: number;
    bundleQuantity: number;
    bundleCharge: number;
    items: {
        itemId: string | number;
        itemName: string;
        quantity: number;
        rate: number;
        amount: number;
        unitName?: string | undefined;
        position?: number | undefined;
    }[];
    totalAmount: number;
}, {
    partyId: string | number;
    partyName: string;
    invoiceDate: string;
    bundleRate: number;
    bundleQuantity: number;
    bundleCharge: number;
    items: {
        itemId: string | number;
        itemName: string;
        quantity: number;
        rate: number;
        amount: number;
        unitName?: string | undefined;
        position?: number | undefined;
    }[];
    totalAmount: number;
}>;
export declare const updateInvoiceSchema: z.ZodObject<{
    partyId: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    partyName: z.ZodOptional<z.ZodString>;
    invoiceDate: z.ZodOptional<z.ZodString>;
    bundleRate: z.ZodOptional<z.ZodNumber>;
    bundleQuantity: z.ZodOptional<z.ZodNumber>;
    bundleCharge: z.ZodOptional<z.ZodNumber>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        itemId: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
        itemName: z.ZodString;
        quantity: z.ZodNumber;
        rate: z.ZodNumber;
        amount: z.ZodNumber;
        unitName: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        itemId: string | number;
        itemName: string;
        quantity: number;
        rate: number;
        amount: number;
        unitName?: string | undefined;
        position?: number | undefined;
    }, {
        itemId: string | number;
        itemName: string;
        quantity: number;
        rate: number;
        amount: number;
        unitName?: string | undefined;
        position?: number | undefined;
    }>, "many">>;
    totalAmount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    partyId?: string | number | undefined;
    partyName?: string | undefined;
    invoiceDate?: string | undefined;
    bundleRate?: number | undefined;
    bundleQuantity?: number | undefined;
    bundleCharge?: number | undefined;
    items?: {
        itemId: string | number;
        itemName: string;
        quantity: number;
        rate: number;
        amount: number;
        unitName?: string | undefined;
        position?: number | undefined;
    }[] | undefined;
    totalAmount?: number | undefined;
}, {
    partyId?: string | number | undefined;
    partyName?: string | undefined;
    invoiceDate?: string | undefined;
    bundleRate?: number | undefined;
    bundleQuantity?: number | undefined;
    bundleCharge?: number | undefined;
    items?: {
        itemId: string | number;
        itemName: string;
        quantity: number;
        rate: number;
        amount: number;
        unitName?: string | undefined;
        position?: number | undefined;
    }[] | undefined;
    totalAmount?: number | undefined;
}>;
export declare const paymentSchema: z.ZodObject<{
    invoice_id: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    amount: z.ZodNumber;
    payment_date: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    invoice_id: string | number;
    payment_date: string;
    notes?: string | undefined;
}, {
    amount: number;
    invoice_id: string | number;
    payment_date: string;
    notes?: string | undefined;
}>;
export declare const createPaymentSchema: z.ZodObject<{
    invoice_id: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    amount: z.ZodNumber;
    payment_date: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    invoice_id: string | number;
    payment_date: string;
    notes?: string | undefined;
}, {
    amount: number;
    invoice_id: string | number;
    payment_date: string;
    notes?: string | undefined;
}>;
export declare const updatePaymentSchema: z.ZodObject<{
    invoice_id: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    amount: z.ZodOptional<z.ZodNumber>;
    payment_date: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    amount?: number | undefined;
    invoice_id?: string | number | undefined;
    payment_date?: string | undefined;
    notes?: string | undefined;
}, {
    amount?: number | undefined;
    invoice_id?: string | number | undefined;
    payment_date?: string | undefined;
    notes?: string | undefined;
}>;
export declare const appSettingSchema: z.ZodObject<{
    key: z.ZodString;
    value: z.ZodString;
}, "strip", z.ZodTypeAny, {
    value: string;
    key: string;
}, {
    value: string;
    key: string;
}>;
export declare const schemas: {
    party: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        phone: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        bundle_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        email?: string | undefined;
        phone?: string | undefined;
        address?: string | undefined;
        bundle_rate?: number | null | undefined;
    }, {
        name: string;
        email?: string | undefined;
        phone?: string | undefined;
        address?: string | undefined;
        bundle_rate?: number | null | undefined;
    }>;
    createParty: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        phone: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        bundle_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        email?: string | undefined;
        phone?: string | undefined;
        address?: string | undefined;
        bundle_rate?: number | null | undefined;
    }, {
        name: string;
        email?: string | undefined;
        phone?: string | undefined;
        address?: string | undefined;
        bundle_rate?: number | null | undefined;
    }>;
    updateParty: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
        phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        bundle_rate: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        email?: string | undefined;
        phone?: string | undefined;
        address?: string | undefined;
        bundle_rate?: number | null | undefined;
    }, {
        name?: string | undefined;
        email?: string | undefined;
        phone?: string | undefined;
        address?: string | undefined;
        bundle_rate?: number | null | undefined;
    }>;
    item: z.ZodObject<{
        name: z.ZodString;
        default_rate: z.ZodNumber;
        purchase_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        unit_id: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        default_rate: number;
        unit_id: number;
        purchase_rate?: number | null | undefined;
    }, {
        name: string;
        default_rate: number;
        unit_id: number;
        purchase_rate?: number | null | undefined;
    }>;
    createItem: z.ZodObject<{
        name: z.ZodString;
        default_rate: z.ZodNumber;
        purchase_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        unit_id: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        default_rate: number;
        unit_id: number;
        purchase_rate?: number | null | undefined;
    }, {
        name: string;
        default_rate: number;
        unit_id: number;
        purchase_rate?: number | null | undefined;
    }>;
    updateItem: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        default_rate: z.ZodOptional<z.ZodNumber>;
        purchase_rate: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
        unit_id: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        default_rate?: number | undefined;
        purchase_rate?: number | null | undefined;
        unit_id?: number | undefined;
    }, {
        name?: string | undefined;
        default_rate?: number | undefined;
        purchase_rate?: number | null | undefined;
        unit_id?: number | undefined;
    }>;
    itemPartyPrice: z.ZodObject<{
        item_id: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
        party_id: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
        price: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        item_id: string | number;
        party_id: string | number;
        price: number;
    }, {
        item_id: string | number;
        party_id: string | number;
        price: number;
    }>;
    unit: z.ZodObject<{
        name: z.ZodString;
        abbreviation: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        abbreviation?: string | undefined;
    }, {
        name: string;
        abbreviation?: string | undefined;
    }>;
    createUnit: z.ZodObject<{
        name: z.ZodString;
        abbreviation: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        abbreviation?: string | undefined;
    }, {
        name: string;
        abbreviation?: string | undefined;
    }>;
    updateUnit: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        abbreviation: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        abbreviation?: string | undefined;
    }, {
        name?: string | undefined;
        abbreviation?: string | undefined;
    }>;
    invoiceItem: z.ZodObject<{
        itemId: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
        itemName: z.ZodString;
        quantity: z.ZodNumber;
        rate: z.ZodNumber;
        amount: z.ZodNumber;
        unitName: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        itemId: string | number;
        itemName: string;
        quantity: number;
        rate: number;
        amount: number;
        unitName?: string | undefined;
        position?: number | undefined;
    }, {
        itemId: string | number;
        itemName: string;
        quantity: number;
        rate: number;
        amount: number;
        unitName?: string | undefined;
        position?: number | undefined;
    }>;
    invoice: z.ZodObject<{
        partyId: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
        partyName: z.ZodString;
        invoiceDate: z.ZodString;
        bundleRate: z.ZodNumber;
        bundleQuantity: z.ZodNumber;
        bundleCharge: z.ZodNumber;
        items: z.ZodArray<z.ZodObject<{
            itemId: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
            itemName: z.ZodString;
            quantity: z.ZodNumber;
            rate: z.ZodNumber;
            amount: z.ZodNumber;
            unitName: z.ZodOptional<z.ZodString>;
            position: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            itemId: string | number;
            itemName: string;
            quantity: number;
            rate: number;
            amount: number;
            unitName?: string | undefined;
            position?: number | undefined;
        }, {
            itemId: string | number;
            itemName: string;
            quantity: number;
            rate: number;
            amount: number;
            unitName?: string | undefined;
            position?: number | undefined;
        }>, "many">;
        totalAmount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        partyId: string | number;
        partyName: string;
        invoiceDate: string;
        bundleRate: number;
        bundleQuantity: number;
        bundleCharge: number;
        items: {
            itemId: string | number;
            itemName: string;
            quantity: number;
            rate: number;
            amount: number;
            unitName?: string | undefined;
            position?: number | undefined;
        }[];
        totalAmount: number;
    }, {
        partyId: string | number;
        partyName: string;
        invoiceDate: string;
        bundleRate: number;
        bundleQuantity: number;
        bundleCharge: number;
        items: {
            itemId: string | number;
            itemName: string;
            quantity: number;
            rate: number;
            amount: number;
            unitName?: string | undefined;
            position?: number | undefined;
        }[];
        totalAmount: number;
    }>;
    createInvoice: z.ZodObject<{
        partyId: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
        partyName: z.ZodString;
        invoiceDate: z.ZodString;
        bundleRate: z.ZodNumber;
        bundleQuantity: z.ZodNumber;
        bundleCharge: z.ZodNumber;
        items: z.ZodArray<z.ZodObject<{
            itemId: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
            itemName: z.ZodString;
            quantity: z.ZodNumber;
            rate: z.ZodNumber;
            amount: z.ZodNumber;
            unitName: z.ZodOptional<z.ZodString>;
            position: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            itemId: string | number;
            itemName: string;
            quantity: number;
            rate: number;
            amount: number;
            unitName?: string | undefined;
            position?: number | undefined;
        }, {
            itemId: string | number;
            itemName: string;
            quantity: number;
            rate: number;
            amount: number;
            unitName?: string | undefined;
            position?: number | undefined;
        }>, "many">;
        totalAmount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        partyId: string | number;
        partyName: string;
        invoiceDate: string;
        bundleRate: number;
        bundleQuantity: number;
        bundleCharge: number;
        items: {
            itemId: string | number;
            itemName: string;
            quantity: number;
            rate: number;
            amount: number;
            unitName?: string | undefined;
            position?: number | undefined;
        }[];
        totalAmount: number;
    }, {
        partyId: string | number;
        partyName: string;
        invoiceDate: string;
        bundleRate: number;
        bundleQuantity: number;
        bundleCharge: number;
        items: {
            itemId: string | number;
            itemName: string;
            quantity: number;
            rate: number;
            amount: number;
            unitName?: string | undefined;
            position?: number | undefined;
        }[];
        totalAmount: number;
    }>;
    updateInvoice: z.ZodObject<{
        partyId: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        partyName: z.ZodOptional<z.ZodString>;
        invoiceDate: z.ZodOptional<z.ZodString>;
        bundleRate: z.ZodOptional<z.ZodNumber>;
        bundleQuantity: z.ZodOptional<z.ZodNumber>;
        bundleCharge: z.ZodOptional<z.ZodNumber>;
        items: z.ZodOptional<z.ZodArray<z.ZodObject<{
            itemId: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
            itemName: z.ZodString;
            quantity: z.ZodNumber;
            rate: z.ZodNumber;
            amount: z.ZodNumber;
            unitName: z.ZodOptional<z.ZodString>;
            position: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            itemId: string | number;
            itemName: string;
            quantity: number;
            rate: number;
            amount: number;
            unitName?: string | undefined;
            position?: number | undefined;
        }, {
            itemId: string | number;
            itemName: string;
            quantity: number;
            rate: number;
            amount: number;
            unitName?: string | undefined;
            position?: number | undefined;
        }>, "many">>;
        totalAmount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        partyId?: string | number | undefined;
        partyName?: string | undefined;
        invoiceDate?: string | undefined;
        bundleRate?: number | undefined;
        bundleQuantity?: number | undefined;
        bundleCharge?: number | undefined;
        items?: {
            itemId: string | number;
            itemName: string;
            quantity: number;
            rate: number;
            amount: number;
            unitName?: string | undefined;
            position?: number | undefined;
        }[] | undefined;
        totalAmount?: number | undefined;
    }, {
        partyId?: string | number | undefined;
        partyName?: string | undefined;
        invoiceDate?: string | undefined;
        bundleRate?: number | undefined;
        bundleQuantity?: number | undefined;
        bundleCharge?: number | undefined;
        items?: {
            itemId: string | number;
            itemName: string;
            quantity: number;
            rate: number;
            amount: number;
            unitName?: string | undefined;
            position?: number | undefined;
        }[] | undefined;
        totalAmount?: number | undefined;
    }>;
    payment: z.ZodObject<{
        invoice_id: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
        amount: z.ZodNumber;
        payment_date: z.ZodString;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        amount: number;
        invoice_id: string | number;
        payment_date: string;
        notes?: string | undefined;
    }, {
        amount: number;
        invoice_id: string | number;
        payment_date: string;
        notes?: string | undefined;
    }>;
    createPayment: z.ZodObject<{
        invoice_id: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
        amount: z.ZodNumber;
        payment_date: z.ZodString;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        amount: number;
        invoice_id: string | number;
        payment_date: string;
        notes?: string | undefined;
    }, {
        amount: number;
        invoice_id: string | number;
        payment_date: string;
        notes?: string | undefined;
    }>;
    updatePayment: z.ZodObject<{
        invoice_id: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        amount: z.ZodOptional<z.ZodNumber>;
        payment_date: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        amount?: number | undefined;
        invoice_id?: string | number | undefined;
        payment_date?: string | undefined;
        notes?: string | undefined;
    }, {
        amount?: number | undefined;
        invoice_id?: string | number | undefined;
        payment_date?: string | undefined;
        notes?: string | undefined;
    }>;
    appSetting: z.ZodObject<{
        key: z.ZodString;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: string;
        key: string;
    }, {
        value: string;
        key: string;
    }>;
};
