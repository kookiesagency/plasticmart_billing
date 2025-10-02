import { getSupabaseClient } from './client'
import type { Database } from './types'
import type { Party, Item, Unit, Invoice, InvoiceItem, Payment, AppSetting } from '../types'

type SupabaseClient = ReturnType<typeof getSupabaseClient>

// Helper function to handle Supabase responses
const handleResponse = <T>(response: { data: T | null; error: any }) => {
  if (response.error) {
    throw new Error(response.error.message)
  }
  return response.data
}

// Parties API
export const partiesAPI = {
  getAll: async (): Promise<Party[]> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('parties')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    return handleResponse(response) || []
  },

  getById: async (id: number): Promise<Party | null> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('parties')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()
    return handleResponse(response)
  },

  create: async (party: Database['public']['Tables']['parties']['Insert']): Promise<Party> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('parties')
      .insert(party)
      .select()
      .single()
    return handleResponse(response)!
  },

  update: async (id: number, party: Database['public']['Tables']['parties']['Update']): Promise<Party> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('parties')
      .update({ ...party, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    return handleResponse(response)!
  },

  delete: async (id: number): Promise<void> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('parties')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    handleResponse(response)
  }
}

// Items API
export const itemsAPI = {
  getAll: async (): Promise<Item[]> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('items')
      .select(`
        *,
        units (id, name, abbreviation),
        item_party_prices (id, party_id, price)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    return handleResponse(response) || []
  },

  getById: async (id: number): Promise<Item | null> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('items')
      .select(`
        *,
        units (id, name, abbreviation),
        item_party_prices (id, party_id, price)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()
    return handleResponse(response)
  },

  create: async (item: Database['public']['Tables']['items']['Insert']): Promise<Item> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('items')
      .insert(item)
      .select(`
        *,
        units (id, name, abbreviation),
        item_party_prices (id, party_id, price)
      `)
      .single()
    return handleResponse(response)!
  },

  update: async (id: number, item: Database['public']['Tables']['items']['Update']): Promise<Item> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('items')
      .update({ ...item, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        units (id, name, abbreviation),
        item_party_prices (id, party_id, price)
      `)
      .single()
    return handleResponse(response)!
  },

  delete: async (id: number): Promise<void> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    handleResponse(response)
  }
}

// Units API
export const unitsAPI = {
  getAll: async (): Promise<Unit[]> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('units')
      .select('*')
      .order('name', { ascending: true })
    return handleResponse(response) || []
  },

  getById: async (id: number): Promise<Unit | null> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('units')
      .select('*')
      .eq('id', id)
      .single()
    return handleResponse(response)
  },

  create: async (unit: Database['public']['Tables']['units']['Insert']): Promise<Unit> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('units')
      .insert(unit)
      .select()
      .single()
    return handleResponse(response)!
  },

  update: async (id: number, unit: Database['public']['Tables']['units']['Update']): Promise<Unit> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('units')
      .update({ ...unit, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    return handleResponse(response)!
  },

  delete: async (id: number): Promise<void> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('units')
      .delete()
      .eq('id', id)
    handleResponse(response)
  }
}

// Invoices API
export const invoicesAPI = {
  getAll: async (): Promise<Invoice[]> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('invoices')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    return handleResponse(response) || []
  },

  getById: async (id: number): Promise<Invoice | null> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()
    return handleResponse(response)
  },

  getByPublicId: async (publicId: string): Promise<Invoice | null> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('invoices')
      .select('*')
      .eq('public_id', publicId)
      .is('deleted_at', null)
      .single()
    return handleResponse(response)
  },

  create: async (invoice: Database['public']['Tables']['invoices']['Insert']): Promise<Invoice> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('invoices')
      .insert(invoice)
      .select()
      .single()
    return handleResponse(response)!
  },

  update: async (id: number, invoice: Database['public']['Tables']['invoices']['Update']): Promise<Invoice> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('invoices')
      .update({ ...invoice, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    return handleResponse(response)!
  },

  delete: async (id: number): Promise<void> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('invoices')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    handleResponse(response)
  }
}

// Invoice Items API
export const invoiceItemsAPI = {
  getByInvoiceId: async (invoiceId: number): Promise<InvoiceItem[]> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('position', { ascending: true, nullsFirst: false })
    return handleResponse(response) || []
  },

  createMany: async (items: Database['public']['Tables']['invoice_items']['Insert'][]): Promise<InvoiceItem[]> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('invoice_items')
      .insert(items)
      .select()
    return handleResponse(response) || []
  },

  deleteByInvoiceId: async (invoiceId: number): Promise<void> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', invoiceId)
    handleResponse(response)
  }
}

// Payments API
export const paymentsAPI = {
  getByInvoiceId: async (invoiceId: number): Promise<Payment[]> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('payment_date', { ascending: false })
    return handleResponse(response) || []
  },

  create: async (payment: Database['public']['Tables']['payments']['Insert']): Promise<Payment> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('payments')
      .insert(payment)
      .select()
      .single()
    return handleResponse(response)!
  },

  update: async (id: number, payment: Database['public']['Tables']['payments']['Update']): Promise<Payment> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('payments')
      .update({ ...payment, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    return handleResponse(response)!
  },

  delete: async (id: number): Promise<void> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('payments')
      .delete()
      .eq('id', id)
    handleResponse(response)
  }
}

// App Settings API
export const appSettingsAPI = {
  getAll: async (): Promise<AppSetting[]> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('app_settings')
      .select('*')
      .order('key', { ascending: true })
    return handleResponse(response) || []
  },

  getByKey: async (key: string): Promise<AppSetting | null> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('app_settings')
      .select('*')
      .eq('key', key)
      .single()
    return handleResponse(response)
  },

  upsert: async (setting: Database['public']['Tables']['app_settings']['Insert']): Promise<AppSetting> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('app_settings')
      .upsert(setting, { onConflict: 'key' })
      .select()
      .single()
    return handleResponse(response)!
  }
}

// Export all APIs
export const api = {
  parties: partiesAPI,
  items: itemsAPI,
  units: unitsAPI,
  invoices: invoicesAPI,
  invoiceItems: invoiceItemsAPI,
  payments: paymentsAPI,
  appSettings: appSettingsAPI
}