export type Party = {
    id: number | string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    bundle_rate: number | null;
    created_at: string;
    updated_at?: string;
    deleted_at?: string | null;
};
export type Item = {
    id: number | string;
    name: string;
    default_rate: number;
    purchase_rate?: number | null;
    unit_id: number;
    created_at: string;
    updated_at?: string;
    deleted_at?: string | null;
    units?: Unit | null;
    item_party_prices?: ItemPartyPrice[];
};
export type Unit = {
    id: number;
    name: string;
    abbreviation?: string | null;
    created_at?: string;
    updated_at?: string;
};
export type ItemPartyPrice = {
    id?: number;
    item_id: number | string;
    party_id: number | string;
    price: number;
    created_at?: string;
    updated_at?: string;
};
export type Invoice = {
    id: number | string;
    party_id: number | string | null;
    party_name: string;
    invoice_date: string;
    bundle_rate: number;
    bundle_quantity: number;
    bundle_charge: number;
    total_amount: number;
    amount_received?: number;
    amount_pending?: number;
    status?: 'pending' | 'partial' | 'paid';
    public_id?: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
};
export type InvoiceItem = {
    id?: number | string;
    invoice_id: number | string;
    item_id: number | string;
    item_name: string;
    quantity: number;
    rate: number;
    amount: number;
    unit_name?: string;
    position?: number;
    created_at?: string;
    updated_at?: string;
};
export type Payment = {
    id: number | string;
    invoice_id: number | string;
    amount: number;
    payment_date: string;
    notes?: string | null;
    created_at: string;
    updated_at?: string;
};
export type AppSetting = {
    id?: number;
    key: string;
    value: string;
    created_at?: string;
    updated_at?: string;
};
export type ActivityLog = {
    id: number;
    action: string;
    table_name: string;
    record_id: string;
    old_values?: Record<string, any> | null;
    new_values?: Record<string, any> | null;
    user_id?: string | null;
    created_at: string;
};
