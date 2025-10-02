// Calculation utilities
export const calculateInvoiceTotal = (
  items: Array<{ quantity: number; rate: number }>,
  bundleCharge: number = 0
): number => {
  const subTotal = items.reduce((acc, item) => acc + (item.quantity * item.rate), 0)
  return subTotal + bundleCharge
}

export const calculateSubTotal = (
  items: Array<{ quantity: number; rate: number }>
): number => {
  return items.reduce((acc, item) => acc + (item.quantity * item.rate), 0)
}

export const calculateItemAmount = (quantity: number, rate: number): number => {
  return quantity * rate
}

export const calculateBundleCharge = (bundleQuantity: number, bundleRate: number): number => {
  return bundleQuantity * bundleRate
}

// Formatting utilities
export const formatCurrency = (amount: number, locale: string = "en-IN", currency: string = "INR"): string => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount)
}

export const formatNumber = (value: number, minimumFractionDigits: number = 2): string => {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  }).format(value)
}

export const formatDate = (date: string | Date, format: 'short' | 'long' | 'iso' = 'short'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  switch (format) {
    case 'long':
      return dateObj.toLocaleDateString("en-IN", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    case 'iso':
      return dateObj.toISOString().split('T')[0]
    case 'short':
    default:
      return dateObj.toLocaleDateString("en-IN")
  }
}

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhone = (phone: string): boolean => {
  // Basic Indian phone number validation (10 digits)
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(phone.replace(/\s+/g, ''))
}

// String utilities
export const normalizeString = (str: string): string => {
  return str.trim().toLowerCase().replace(/\s+/g, ' ')
}

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

export const generatePublicId = (): string => {
  return 'inv_' + Math.random().toString(36).substr(2, 12)
}

// Array utilities
export const sortByDate = <T extends { created_at: string }>(items: T[], order: 'asc' | 'desc' = 'desc'): T[] => {
  return items.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return order === 'desc' ? dateB - dateA : dateA - dateB
  })
}

export const sortByName = <T extends { name: string }>(items: T[], order: 'asc' | 'desc' = 'asc'): T[] => {
  return items.sort((a, b) => {
    const nameA = a.name.toLowerCase()
    const nameB = b.name.toLowerCase()
    if (order === 'desc') {
      return nameB.localeCompare(nameA)
    }
    return nameA.localeCompare(nameB)
  })
}

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
      PENDING: 'pending' as const,
      PARTIAL: 'partial' as const,
      PAID: 'paid' as const
    }
  },
  VALIDATION: {
    MIN_QUANTITY: 0.01,
    MIN_RATE: 0,
    MIN_AMOUNT: 0
  }
} as const

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
}