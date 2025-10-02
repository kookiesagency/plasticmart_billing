import { z } from 'zod';

export type Party = {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  bundle_rate: number | null
  created_at: string
  deleted_at?: string | null
}

export type Item = {
  id: string
  name: string
  default_rate: number
  unit_id: number
  created_at: string
  units: { name: string } | null
  special_prices?: {
    party_id: string
    price: number
  }[]
}

export type Unit = {
  id: number
  name: string
  abbreviation: string | null
}

export const invoiceSchema = z.object({
  partyId: z.string({
    required_error: 'Party ID is required'
  }),
  items: z.array(z.object({
    itemId: z.string({
      required_error: 'Item ID is required'
    }),
    quantity: z.number({
      required_error: 'Quantity is required'
    })
  }))
}); 