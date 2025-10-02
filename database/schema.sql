-- =================================================================
--  Phase 1: Core Tables
-- =================================================================

-- Table for managing measurement units (e.g., PCS, DZ, KG)
CREATE TABLE units (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for managing parties (clients)
CREATE TABLE parties (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    contact_details JSONB, -- Can store phone, email, address etc.
    bundle_rate NUMERIC(10, 2), -- Party-specific bundle rate
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for managing items/products
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    default_rate NUMERIC(10, 2) NOT NULL,
    unit_id INT REFERENCES units(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for party-specific item prices
CREATE TABLE item_party_prices (
    item_id INT REFERENCES items(id) ON DELETE CASCADE,
    party_id INT REFERENCES parties(id) ON DELETE CASCADE,
    price NUMERIC(10, 2) NOT NULL,
    PRIMARY KEY (item_id, party_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
--  Phase 2: Invoice & Payment Tables
-- =================================================================

-- Table for invoices
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    party_id INT NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    invoice_date DATE NOT NULL,
    bundle_charge NUMERIC(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'pending', -- e.g., pending, paid, partial
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for individual line items on an invoice
CREATE TABLE invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_id INT NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    rate NUMERIC(10, 2) NOT NULL, -- Price at the time of invoice creation
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for recording payments against invoices
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
--  Phase 3: Settings Table
-- =================================================================

-- Key-value table for global application settings
CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Insert a default bundle rate as an initial setting
INSERT INTO app_settings (key, value) VALUES ('default_bundle_rate', '0');

-- =================================================================
--  Enable Row Level Security (RLS)
--  Important for security when using Supabase client-side
-- =================================================================

ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_party_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies to allow authenticated users to access data.
-- These are broad policies; they can be made more restrictive later if needed.

CREATE POLICY "Allow all access to authenticated users" ON units FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access to authenticated users" ON parties FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access to authenticated users" ON items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access to authenticated users" ON item_party_prices FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access to authenticated users" ON invoices FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access to authenticated users" ON invoice_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access to authenticated users" ON payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access to authenticated users" ON app_settings FOR ALL TO authenticated USING (true); 