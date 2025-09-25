export interface Database {
    public: {
        Tables: {
            parties: {
                Row: {
                    id: number;
                    name: string;
                    email: string | null;
                    phone: string | null;
                    address: string | null;
                    bundle_rate: number | null;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: {
                    name: string;
                    email?: string | null;
                    phone?: string | null;
                    address?: string | null;
                    bundle_rate?: number | null;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
                Update: {
                    name?: string;
                    email?: string | null;
                    phone?: string | null;
                    address?: string | null;
                    bundle_rate?: number | null;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
            };
            units: {
                Row: {
                    id: number;
                    name: string;
                    abbreviation: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    name: string;
                    abbreviation?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    name?: string;
                    abbreviation?: string | null;
                    updated_at?: string;
                };
            };
            items: {
                Row: {
                    id: number;
                    name: string;
                    default_rate: number;
                    purchase_rate: number | null;
                    unit_id: number;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: {
                    name: string;
                    default_rate: number;
                    purchase_rate?: number | null;
                    unit_id: number;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
                Update: {
                    name?: string;
                    default_rate?: number;
                    purchase_rate?: number | null;
                    unit_id?: number;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
            };
            item_party_prices: {
                Row: {
                    id: number;
                    item_id: number;
                    party_id: number;
                    price: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    item_id: number;
                    party_id: number;
                    price: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    price?: number;
                    updated_at?: string;
                };
            };
            invoices: {
                Row: {
                    id: number;
                    party_id: number | null;
                    party_name: string;
                    invoice_date: string;
                    bundle_rate: number;
                    bundle_quantity: number;
                    bundle_charge: number;
                    total_amount: number;
                    amount_received: number;
                    amount_pending: number;
                    status: 'pending' | 'partial' | 'paid';
                    public_id: string | null;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: {
                    party_id?: number | null;
                    party_name: string;
                    invoice_date: string;
                    bundle_rate: number;
                    bundle_quantity: number;
                    bundle_charge: number;
                    total_amount: number;
                    amount_received?: number;
                    amount_pending?: number;
                    status?: 'pending' | 'partial' | 'paid';
                    public_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
                Update: {
                    party_id?: number | null;
                    party_name?: string;
                    invoice_date?: string;
                    bundle_rate?: number;
                    bundle_quantity?: number;
                    bundle_charge?: number;
                    total_amount?: number;
                    amount_received?: number;
                    amount_pending?: number;
                    status?: 'pending' | 'partial' | 'paid';
                    public_id?: string | null;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
            };
            invoice_items: {
                Row: {
                    id: number;
                    invoice_id: number;
                    item_id: number | null;
                    item_name: string;
                    quantity: number;
                    rate: number;
                    amount: number;
                    unit_name: string | null;
                    position: number | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    invoice_id: number;
                    item_id?: number | null;
                    item_name: string;
                    quantity: number;
                    rate: number;
                    amount: number;
                    unit_name?: string | null;
                    position?: number | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    item_id?: number | null;
                    item_name?: string;
                    quantity?: number;
                    rate?: number;
                    amount?: number;
                    unit_name?: string | null;
                    position?: number | null;
                    updated_at?: string;
                };
            };
            payments: {
                Row: {
                    id: number;
                    invoice_id: number;
                    amount: number;
                    payment_date: string;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    invoice_id: number;
                    amount: number;
                    payment_date: string;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    amount?: number;
                    payment_date?: string;
                    notes?: string | null;
                    updated_at?: string;
                };
            };
            app_settings: {
                Row: {
                    id: number;
                    key: string;
                    value: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    key: string;
                    value: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    value?: string;
                    updated_at?: string;
                };
            };
            activity_logs: {
                Row: {
                    id: number;
                    action: string;
                    table_name: string;
                    record_id: string;
                    old_values: any | null;
                    new_values: any | null;
                    user_id: string | null;
                    created_at: string;
                };
                Insert: {
                    action: string;
                    table_name: string;
                    record_id: string;
                    old_values?: any | null;
                    new_values?: any | null;
                    user_id?: string | null;
                    created_at?: string;
                };
                Update: {
                    action?: string;
                    table_name?: string;
                    record_id?: string;
                    old_values?: any | null;
                    new_values?: any | null;
                    user_id?: string | null;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}
