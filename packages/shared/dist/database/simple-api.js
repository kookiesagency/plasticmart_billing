import { getSupabaseClient } from './client';
// Helper function to handle Supabase responses
const handleResponse = (response) => {
    if (response.error) {
        throw new Error(response.error.message);
    }
    return response.data;
};
// Parties API
export const partiesAPI = {
    getAll: async () => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('parties')
            .select('*')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });
        return handleResponse(response) || [];
    },
    getById: async (id) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('parties')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .single();
        return handleResponse(response);
    },
    create: async (party) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('parties')
            .insert(party)
            .select()
            .single();
        return handleResponse(response);
    },
    update: async (id, party) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('parties')
            .update({ ...party, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        return handleResponse(response);
    },
    delete: async (id) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('parties')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);
        handleResponse(response);
    }
};
// Items API
export const itemsAPI = {
    getAll: async () => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('items')
            .select(`
        *,
        units (id, name, abbreviation),
        item_party_prices (id, party_id, price)
      `)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });
        return handleResponse(response) || [];
    },
    getById: async (id) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('items')
            .select(`
        *,
        units (id, name, abbreviation),
        item_party_prices (id, party_id, price)
      `)
            .eq('id', id)
            .is('deleted_at', null)
            .single();
        return handleResponse(response);
    },
    create: async (item) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('items')
            .insert(item)
            .select(`
        *,
        units (id, name, abbreviation),
        item_party_prices (id, party_id, price)
      `)
            .single();
        return handleResponse(response);
    },
    update: async (id, item) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('items')
            .update({ ...item, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select(`
        *,
        units (id, name, abbreviation),
        item_party_prices (id, party_id, price)
      `)
            .single();
        return handleResponse(response);
    },
    delete: async (id) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('items')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);
        handleResponse(response);
    }
};
// Units API
export const unitsAPI = {
    getAll: async () => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('units')
            .select('*')
            .order('name', { ascending: true });
        return handleResponse(response) || [];
    },
    create: async (unit) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('units')
            .insert(unit)
            .select()
            .single();
        return handleResponse(response);
    }
};
// Invoices API
export const invoicesAPI = {
    getAll: async () => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('invoices')
            .select('*')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });
        return handleResponse(response) || [];
    },
    create: async (invoice) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('invoices')
            .insert(invoice)
            .select()
            .single();
        return handleResponse(response);
    }
};
// Export all APIs
export const api = {
    parties: partiesAPI,
    items: itemsAPI,
    units: unitsAPI,
    invoices: invoicesAPI
};
