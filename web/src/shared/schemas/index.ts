import { z } from 'zod'

// Party schemas
export const partySchema = z.object({
  name: z.string().min(1, 'Party name is required'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  bundle_rate: z.number().min(0, 'Bundle rate must be positive').nullable().optional()
})

export const createPartySchema = partySchema
export const updatePartySchema = partySchema.partial()

// Item schemas
export const itemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  default_rate: z.number().min(0, 'Default rate must be positive'),
  purchase_rate: z.number().min(0, 'Purchase rate must be positive').nullable().optional(),
  unit_id: z.number().min(1, 'Unit is required')
})

export const createItemSchema = itemSchema
export const updateItemSchema = itemSchema.partial()

// Item party price schemas
export const itemPartyPriceSchema = z.object({
  item_id: z.union([z.number(), z.string()]),
  party_id: z.union([z.number(), z.string()]),
  price: z.number().min(0, 'Price must be positive')
})

// Unit schemas
export const unitSchema = z.object({
  name: z.string().min(1, 'Unit name is required'),
  abbreviation: z.string().optional()
})

export const createUnitSchema = unitSchema
export const updateUnitSchema = unitSchema.partial()

// Invoice schemas
export const invoiceItemSchema = z.object({
  itemId: z.union([z.number(), z.string()], {
    required_error: 'Item ID is required'
  }),
  itemName: z.string().min(1, 'Item name is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  rate: z.number().min(0, 'Rate must be positive'),
  amount: z.number().min(0, 'Amount must be positive'),
  unitName: z.string().optional(),
  position: z.number().optional()
})

export const invoiceSchema = z.object({
  partyId: z.union([z.number(), z.string()], {
    required_error: 'Party ID is required'
  }),
  partyName: z.string().min(1, 'Party name is required'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  bundleRate: z.number().min(0, 'Bundle rate must be positive'),
  bundleQuantity: z.number().min(0, 'Bundle quantity must be positive'),
  bundleCharge: z.number().min(0, 'Bundle charge must be positive'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  totalAmount: z.number().min(0, 'Total amount must be positive')
})

export const createInvoiceSchema = invoiceSchema
export const updateInvoiceSchema = invoiceSchema.partial()

// Payment schemas
export const paymentSchema = z.object({
  invoice_id: z.union([z.number(), z.string()]),
  amount: z.number().min(0.01, 'Payment amount must be greater than 0'),
  payment_date: z.string().min(1, 'Payment date is required'),
  notes: z.string().optional()
})

export const createPaymentSchema = paymentSchema
export const updatePaymentSchema = paymentSchema.partial()

// Settings schemas
export const appSettingSchema = z.object({
  key: z.string().min(1, 'Setting key is required'),
  value: z.string().min(1, 'Setting value is required')
})

// Export all schemas as a group for easier importing
export const schemas = {
  party: partySchema,
  createParty: createPartySchema,
  updateParty: updatePartySchema,
  item: itemSchema,
  createItem: createItemSchema,
  updateItem: updateItemSchema,
  itemPartyPrice: itemPartyPriceSchema,
  unit: unitSchema,
  createUnit: createUnitSchema,
  updateUnit: updateUnitSchema,
  invoiceItem: invoiceItemSchema,
  invoice: invoiceSchema,
  createInvoice: createInvoiceSchema,
  updateInvoice: updateInvoiceSchema,
  payment: paymentSchema,
  createPayment: createPaymentSchema,
  updatePayment: updatePaymentSchema,
  appSetting: appSettingSchema
}