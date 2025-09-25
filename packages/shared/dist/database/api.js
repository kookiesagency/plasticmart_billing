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
    getById: async (id) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('units')
            .select('*')
            .eq('id', id)
            .single();
        return handleResponse(response);
    },
    create: async (unit) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('units')
            .insert(unit)
            .select()
            .single();
        return handleResponse(response);
    },
    update: async (id, unit) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('units')
            .update({ ...unit, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        return handleResponse(response);
    },
    delete: async (id) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('units')
            .delete()
            .eq('id', id);
        handleResponse(response);
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
    getById: async (id) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('invoices')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .single();
        return handleResponse(response);
    },
    getByPublicId: async (publicId) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('invoices')
            .select('*')
            .eq('public_id', publicId)
            .is('deleted_at', null)
            .single();
        return handleResponse(response);
    },
    create: async (invoice) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('invoices')
            .insert(invoice)
            .select()
            .single();
        return handleResponse(response);
    },
    update: async (id, invoice) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('invoices')
            .update({ ...invoice, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        return handleResponse(response);
    },
    delete: async (id) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('invoices')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);
        handleResponse(response);
    }
};
// Invoice Items API
export const invoiceItemsAPI = {
    getByInvoiceId: async (invoiceId) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('invoice_items')
            .select('*')
            .eq('invoice_id', invoiceId)
            .order('position', { ascending: true, nullsFirst: false });
        return handleResponse(response) || [];
    },
    createMany: async (items) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('invoice_items')
            .insert(items)
            .select();
        return handleResponse(response) || [];
    },
    deleteByInvoiceId: async (invoiceId) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('invoice_items')
            .delete()
            .eq('invoice_id', invoiceId);
        handleResponse(response);
    }
};
// Payments API
export const paymentsAPI = {
    getByInvoiceId: async (invoiceId) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('payments')
            .select('*')
            .eq('invoice_id', invoiceId)
            .order('payment_date', { ascending: false });
        return handleResponse(response) || [];
    },
    create: async (payment) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('payments')
            .insert(payment)
            .select()
            .single();
        return handleResponse(response);
    },
    update: async (id, payment) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('payments')
            .update({ ...payment, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        return handleResponse(response);
    },
    delete: async (id) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('payments')
            .delete()
            .eq('id', id);
        handleResponse(response);
    }
};
// App Settings API
export const appSettingsAPI = {
    getAll: async () => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('app_settings')
            .select('*')
            .order('key', { ascending: true });
        return handleResponse(response) || [];
    },
    getByKey: async (key) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('app_settings')
            .select('*')
            .eq('key', key)
            .single();
        return handleResponse(response);
    },
    upsert: async (setting) => {
        const supabase = getSupabaseClient();
        const response = await supabase
            .from('app_settings')
            .upsert(setting, { onConflict: 'key' })
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
    invoices: invoicesAPI,
    invoiceItems: invoiceItemsAPI,
    payments: paymentsAPI,
    appSettings: appSettingsAPI
};
