import { getSupabaseClient } from './client'
import type { Party, Item, Unit, Invoice, InvoiceItem, Payment, AppSetting } from '../types'

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

  create: async (party: Omit<Party, 'id' | 'created_at' | 'updated_at'>): Promise<Party> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('parties')
      .insert(party as any)
      .select()
      .single()
    return handleResponse(response)!
  },

  update: async (id: number, party: Partial<Omit<Party, 'id' | 'created_at'>>): Promise<Party> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('parties')
      .update({ ...party, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single()
    return handleResponse(response)!
  },

  delete: async (id: number): Promise<void> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('parties')
      .update({ deleted_at: new Date().toISOString() } as any)
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

  create: async (item: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'units' | 'item_party_prices'>): Promise<Item> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('items')
      .insert(item as any)
      .select(`
        *,
        units (id, name, abbreviation),
        item_party_prices (id, party_id, price)
      `)
      .single()
    return handleResponse(response)!
  },

  update: async (id: number, item: Partial<Omit<Item, 'id' | 'created_at' | 'units' | 'item_party_prices'>>): Promise<Item> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('items')
      .update({ ...item, updated_at: new Date().toISOString() } as any)
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
      .update({ deleted_at: new Date().toISOString() } as any)
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

  create: async (unit: Omit<Unit, 'id' | 'created_at' | 'updated_at'>): Promise<Unit> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('units')
      .insert(unit as any)
      .select()
      .single()
    return handleResponse(response)!
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

  create: async (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Promise<Invoice> => {
    const supabase = getSupabaseClient()
    const response = await supabase
      .from('invoices')
      .insert(invoice as any)
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
  invoices: invoicesAPI
}