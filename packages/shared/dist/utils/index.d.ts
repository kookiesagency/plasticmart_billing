export declare const calculateInvoiceTotal: (items: Array<{
    quantity: number;
    rate: number;
}>, bundleCharge?: number) => number;
export declare const calculateSubTotal: (items: Array<{
    quantity: number;
    rate: number;
}>) => number;
export declare const calculateItemAmount: (quantity: number, rate: number) => number;
export declare const calculateBundleCharge: (bundleQuantity: number, bundleRate: number) => number;
export declare const formatCurrency: (amount: number, locale?: string, currency?: string) => string;
export declare const formatNumber: (value: number, minimumFractionDigits?: number) => string;
export declare const formatDate: (date: string | Date, format?: "short" | "long" | "iso") => string;
export declare const isValidEmail: (email: string) => boolean;
export declare const isValidPhone: (phone: string) => boolean;
export declare const normalizeString: (str: string) => string;
export declare const capitalizeFirst: (str: string) => string;
export declare const generateId: () => string;
export declare const generatePublicId: () => string;
export declare const sortByDate: <T extends {
    created_at: string;
}>(items: T[], order?: "asc" | "desc") => T[];
export declare const sortByName: <T extends {
    name: string;
}>(items: T[], order?: "asc" | "desc") => T[];
export declare const CONSTANTS: {
    readonly CURRENCY: {
        readonly DEFAULT: "INR";
        readonly LOCALE: "en-IN";
    };
    readonly DATE_FORMATS: {
        readonly ISO: "YYYY-MM-DD";
        readonly DISPLAY: "DD/MM/YYYY";
        readonly LONG: "DD MMMM YYYY";
    };
    readonly INVOICE: {
        readonly STATUS: {
            readonly PENDING: "pending";
            readonly PARTIAL: "partial";
            readonly PAID: "paid";
        };
    };
    readonly VALIDATION: {
        readonly MIN_QUANTITY: 0.01;
        readonly MIN_RATE: 0;
        readonly MIN_AMOUNT: 0;
    };
};
export declare const utils: {
    calculations: {
        calculateInvoiceTotal: (items: Array<{
            quantity: number;
            rate: number;
        }>, bundleCharge?: number) => number;
        calculateSubTotal: (items: Array<{
            quantity: number;
            rate: number;
        }>) => number;
        calculateItemAmount: (quantity: number, rate: number) => number;
        calculateBundleCharge: (bundleQuantity: number, bundleRate: number) => number;
    };
    formatting: {
        formatCurrency: (amount: number, locale?: string, currency?: string) => string;
        formatNumber: (value: number, minimumFractionDigits?: number) => string;
        formatDate: (date: string | Date, format?: "short" | "long" | "iso") => string;
    };
    validation: {
        isValidEmail: (email: string) => boolean;
        isValidPhone: (phone: string) => boolean;
    };
    string: {
        normalizeString: (str: string) => string;
        capitalizeFirst: (str: string) => string;
        generateId: () => string;
        generatePublicId: () => string;
    };
    array: {
        sortByDate: <T extends {
            created_at: string;
        }>(items: T[], order?: "asc" | "desc") => T[];
        sortByName: <T extends {
            name: string;
        }>(items: T[], order?: "asc" | "desc") => T[];
    };
    constants: {
        readonly CURRENCY: {
            readonly DEFAULT: "INR";
            readonly LOCALE: "en-IN";
        };
        readonly DATE_FORMATS: {
            readonly ISO: "YYYY-MM-DD";
            readonly DISPLAY: "DD/MM/YYYY";
            readonly LONG: "DD MMMM YYYY";
        };
        readonly INVOICE: {
            readonly STATUS: {
                readonly PENDING: "pending";
                readonly PARTIAL: "partial";
                readonly PAID: "paid";
            };
        };
        readonly VALIDATION: {
            readonly MIN_QUANTITY: 0.01;
            readonly MIN_RATE: 0;
            readonly MIN_AMOUNT: 0;
        };
    };
};
