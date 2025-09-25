import type { Database } from './types';
import type { Party, Item, Unit, Invoice, InvoiceItem, Payment, AppSetting } from '../types';
export declare const partiesAPI: {
    getAll: () => Promise<Party[]>;
    getById: (id: number) => Promise<Party | null>;
    create: (party: Database["public"]["Tables"]["parties"]["Insert"]) => Promise<Party>;
    update: (id: number, party: Database["public"]["Tables"]["parties"]["Update"]) => Promise<Party>;
    delete: (id: number) => Promise<void>;
};
export declare const itemsAPI: {
    getAll: () => Promise<Item[]>;
    getById: (id: number) => Promise<Item | null>;
    create: (item: Database["public"]["Tables"]["items"]["Insert"]) => Promise<Item>;
    update: (id: number, item: Database["public"]["Tables"]["items"]["Update"]) => Promise<Item>;
    delete: (id: number) => Promise<void>;
};
export declare const unitsAPI: {
    getAll: () => Promise<Unit[]>;
    getById: (id: number) => Promise<Unit | null>;
    create: (unit: Database["public"]["Tables"]["units"]["Insert"]) => Promise<Unit>;
    update: (id: number, unit: Database["public"]["Tables"]["units"]["Update"]) => Promise<Unit>;
    delete: (id: number) => Promise<void>;
};
export declare const invoicesAPI: {
    getAll: () => Promise<Invoice[]>;
    getById: (id: number) => Promise<Invoice | null>;
    getByPublicId: (publicId: string) => Promise<Invoice | null>;
    create: (invoice: Database["public"]["Tables"]["invoices"]["Insert"]) => Promise<Invoice>;
    update: (id: number, invoice: Database["public"]["Tables"]["invoices"]["Update"]) => Promise<Invoice>;
    delete: (id: number) => Promise<void>;
};
export declare const invoiceItemsAPI: {
    getByInvoiceId: (invoiceId: number) => Promise<InvoiceItem[]>;
    createMany: (items: Database["public"]["Tables"]["invoice_items"]["Insert"][]) => Promise<InvoiceItem[]>;
    deleteByInvoiceId: (invoiceId: number) => Promise<void>;
};
export declare const paymentsAPI: {
    getByInvoiceId: (invoiceId: number) => Promise<Payment[]>;
    create: (payment: Database["public"]["Tables"]["payments"]["Insert"]) => Promise<Payment>;
    update: (id: number, payment: Database["public"]["Tables"]["payments"]["Update"]) => Promise<Payment>;
    delete: (id: number) => Promise<void>;
};
export declare const appSettingsAPI: {
    getAll: () => Promise<AppSetting[]>;
    getByKey: (key: string) => Promise<AppSetting | null>;
    upsert: (setting: Database["public"]["Tables"]["app_settings"]["Insert"]) => Promise<AppSetting>;
};
export declare const api: {
    parties: {
        getAll: () => Promise<Party[]>;
        getById: (id: number) => Promise<Party | null>;
        create: (party: Database["public"]["Tables"]["parties"]["Insert"]) => Promise<Party>;
        update: (id: number, party: Database["public"]["Tables"]["parties"]["Update"]) => Promise<Party>;
        delete: (id: number) => Promise<void>;
    };
    items: {
        getAll: () => Promise<Item[]>;
        getById: (id: number) => Promise<Item | null>;
        create: (item: Database["public"]["Tables"]["items"]["Insert"]) => Promise<Item>;
        update: (id: number, item: Database["public"]["Tables"]["items"]["Update"]) => Promise<Item>;
        delete: (id: number) => Promise<void>;
    };
    units: {
        getAll: () => Promise<Unit[]>;
        getById: (id: number) => Promise<Unit | null>;
        create: (unit: Database["public"]["Tables"]["units"]["Insert"]) => Promise<Unit>;
        update: (id: number, unit: Database["public"]["Tables"]["units"]["Update"]) => Promise<Unit>;
        delete: (id: number) => Promise<void>;
    };
    invoices: {
        getAll: () => Promise<Invoice[]>;
        getById: (id: number) => Promise<Invoice | null>;
        getByPublicId: (publicId: string) => Promise<Invoice | null>;
        create: (invoice: Database["public"]["Tables"]["invoices"]["Insert"]) => Promise<Invoice>;
        update: (id: number, invoice: Database["public"]["Tables"]["invoices"]["Update"]) => Promise<Invoice>;
        delete: (id: number) => Promise<void>;
    };
    invoiceItems: {
        getByInvoiceId: (invoiceId: number) => Promise<InvoiceItem[]>;
        createMany: (items: Database["public"]["Tables"]["invoice_items"]["Insert"][]) => Promise<InvoiceItem[]>;
        deleteByInvoiceId: (invoiceId: number) => Promise<void>;
    };
    payments: {
        getByInvoiceId: (invoiceId: number) => Promise<Payment[]>;
        create: (payment: Database["public"]["Tables"]["payments"]["Insert"]) => Promise<Payment>;
        update: (id: number, payment: Database["public"]["Tables"]["payments"]["Update"]) => Promise<Payment>;
        delete: (id: number) => Promise<void>;
    };
    appSettings: {
        getAll: () => Promise<AppSetting[]>;
        getByKey: (key: string) => Promise<AppSetting | null>;
        upsert: (setting: Database["public"]["Tables"]["app_settings"]["Insert"]) => Promise<AppSetting>;
    };
};
