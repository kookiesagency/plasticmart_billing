import type { Party, Item, Unit, Invoice } from '../types';
export declare const partiesAPI: {
    getAll: () => Promise<Party[]>;
    getById: (id: number) => Promise<Party | null>;
    create: (party: Omit<Party, "id" | "created_at" | "updated_at">) => Promise<Party>;
    update: (id: number, party: Partial<Omit<Party, "id" | "created_at">>) => Promise<Party>;
    delete: (id: number) => Promise<void>;
};
export declare const itemsAPI: {
    getAll: () => Promise<Item[]>;
    getById: (id: number) => Promise<Item | null>;
    create: (item: Omit<Item, "id" | "created_at" | "updated_at" | "units" | "item_party_prices">) => Promise<Item>;
    update: (id: number, item: Partial<Omit<Item, "id" | "created_at" | "units" | "item_party_prices">>) => Promise<Item>;
    delete: (id: number) => Promise<void>;
};
export declare const unitsAPI: {
    getAll: () => Promise<Unit[]>;
    create: (unit: Omit<Unit, "id" | "created_at" | "updated_at">) => Promise<Unit>;
};
export declare const invoicesAPI: {
    getAll: () => Promise<Invoice[]>;
    create: (invoice: Omit<Invoice, "id" | "created_at" | "updated_at">) => Promise<Invoice>;
};
export declare const api: {
    parties: {
        getAll: () => Promise<Party[]>;
        getById: (id: number) => Promise<Party | null>;
        create: (party: Omit<Party, "id" | "created_at" | "updated_at">) => Promise<Party>;
        update: (id: number, party: Partial<Omit<Party, "id" | "created_at">>) => Promise<Party>;
        delete: (id: number) => Promise<void>;
    };
    items: {
        getAll: () => Promise<Item[]>;
        getById: (id: number) => Promise<Item | null>;
        create: (item: Omit<Item, "id" | "created_at" | "updated_at" | "units" | "item_party_prices">) => Promise<Item>;
        update: (id: number, item: Partial<Omit<Item, "id" | "created_at" | "units" | "item_party_prices">>) => Promise<Item>;
        delete: (id: number) => Promise<void>;
    };
    units: {
        getAll: () => Promise<Unit[]>;
        create: (unit: Omit<Unit, "id" | "created_at" | "updated_at">) => Promise<Unit>;
    };
    invoices: {
        getAll: () => Promise<Invoice[]>;
        create: (invoice: Omit<Invoice, "id" | "created_at" | "updated_at">) => Promise<Invoice>;
    };
};
