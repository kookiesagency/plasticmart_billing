// Calculation utilities
export const calculateInvoiceTotal = (items, bundleCharge = 0) => {
    const subTotal = items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    return subTotal + bundleCharge;
};
export const calculateSubTotal = (items) => {
    return items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
};
export const calculateItemAmount = (quantity, rate) => {
    return quantity * rate;
};
export const calculateBundleCharge = (bundleQuantity, bundleRate) => {
    return bundleQuantity * bundleRate;
};
// Formatting utilities
export const formatCurrency = (amount, locale = "en-IN", currency = "INR") => {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
    }).format(amount);
};
export const formatNumber = (value, minimumFractionDigits = 2) => {
    return new Intl.NumberFormat("en-IN", {
        minimumFractionDigits,
        maximumFractionDigits: minimumFractionDigits,
    }).format(value);
};
export const formatDate = (date, format = 'short') => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    switch (format) {
        case 'long':
            return dateObj.toLocaleDateString("en-IN", {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        case 'iso':
            return dateObj.toISOString().split('T')[0];
        case 'short':
        default:
            return dateObj.toLocaleDateString("en-IN");
    }
};
// Validation utilities
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
export const isValidPhone = (phone) => {
    // Basic Indian phone number validation (10 digits)
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
};
// String utilities
export const normalizeString = (str) => {
    return str.trim().toLowerCase().replace(/\s+/g, ' ');
};
export const capitalizeFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
export const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
};
export const generatePublicId = () => {
    return 'inv_' + Math.random().toString(36).substr(2, 12);
};
// Array utilities
export const sortByDate = (items, order = 'desc') => {
    return items.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return order === 'desc' ? dateB - dateA : dateA - dateB;
    });
};
export const sortByName = (items, order = 'asc') => {
    return items.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (order === 'desc') {
            return nameB.localeCompare(nameA);
        }
        return nameA.localeCompare(nameB);
    });
};
// Constants
export const CONSTANTS = {
    CURRENCY: {
        DEFAULT: 'INR',
        LOCALE: 'en-IN'
    },
    DATE_FORMATS: {
        ISO: 'YYYY-MM-DD',
        DISPLAY: 'DD/MM/YYYY',
        LONG: 'DD MMMM YYYY'
    },
    INVOICE: {
        STATUS: {
            PENDING: 'pending',
            PARTIAL: 'partial',
            PAID: 'paid'
        }
    },
    VALIDATION: {
        MIN_QUANTITY: 0.01,
        MIN_RATE: 0,
        MIN_AMOUNT: 0
    }
};
// Export all utilities
export const utils = {
    calculations: {
        calculateInvoiceTotal,
        calculateSubTotal,
        calculateItemAmount,
        calculateBundleCharge
    },
    formatting: {
        formatCurrency,
        formatNumber,
        formatDate
    },
    validation: {
        isValidEmail,
        isValidPhone
    },
    string: {
        normalizeString,
        capitalizeFirst,
        generateId,
        generatePublicId
    },
    array: {
        sortByDate,
        sortByName
    },
    constants: CONSTANTS
};
