-- Migration: Add Purchase Parties table and update items reference
-- Description: Create purchase_parties table with party codes (BPN, JY, etc.) and update items.purchase_party_id reference
-- Date: 2025-01-10

-- Create purchase_parties table
CREATE TABLE IF NOT EXISTS purchase_parties (
  id SERIAL PRIMARY KEY,
  party_code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Remove phone and address columns if they exist (we only want code and name)
ALTER TABLE purchase_parties DROP COLUMN IF EXISTS phone;
ALTER TABLE purchase_parties DROP COLUMN IF EXISTS address;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_purchase_parties_code ON purchase_parties(party_code);
CREATE INDEX IF NOT EXISTS idx_purchase_parties_deleted ON purchase_parties(deleted_at);
CREATE INDEX IF NOT EXISTS idx_purchase_parties_name ON purchase_parties(name);

-- Add updated_at trigger for purchase_parties
CREATE OR REPLACE FUNCTION update_purchase_parties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists before creating
DROP TRIGGER IF EXISTS trigger_purchase_parties_updated_at ON purchase_parties;

CREATE TRIGGER trigger_purchase_parties_updated_at
  BEFORE UPDATE ON purchase_parties
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_parties_updated_at();

-- Add trigger to auto-uppercase party_code
CREATE OR REPLACE FUNCTION uppercase_party_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.party_code = UPPER(NEW.party_code);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists before creating
DROP TRIGGER IF EXISTS trigger_uppercase_party_code ON purchase_parties;

CREATE TRIGGER trigger_uppercase_party_code
  BEFORE INSERT OR UPDATE ON purchase_parties
  FOR EACH ROW
  EXECUTE FUNCTION uppercase_party_code();

-- Enable Row Level Security (RLS) for purchase_parties
ALTER TABLE purchase_parties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON purchase_parties;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON purchase_parties;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON purchase_parties;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON purchase_parties;

-- Create policies for purchase_parties
CREATE POLICY "Enable read access for authenticated users" ON purchase_parties
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON purchase_parties
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON purchase_parties
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON purchase_parties
  FOR DELETE USING (auth.role() = 'authenticated');

-- Update items table to reference purchase_parties instead of parties
-- First, check if old constraint exists and drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_items_purchase_party'
    AND table_name = 'items'
  ) THEN
    ALTER TABLE items DROP CONSTRAINT fk_items_purchase_party;
  END IF;
END $$;

-- Drop the old purchase_party_id column if it exists (it currently references parties table)
-- We'll create a new one that references purchase_parties
ALTER TABLE items DROP COLUMN IF EXISTS purchase_party_id;

-- Add new purchase_party_id column referencing purchase_parties table
ALTER TABLE items ADD COLUMN IF NOT EXISTS purchase_party_id INTEGER;

-- Add foreign key constraint to purchase_parties
ALTER TABLE items
  ADD CONSTRAINT fk_items_purchase_party
  FOREIGN KEY (purchase_party_id)
  REFERENCES purchase_parties(id)
  ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_items_purchase_party_id ON items(purchase_party_id);

-- Add comments to table
COMMENT ON TABLE purchase_parties IS 'Stores purchase party information with unique party codes for inventory sourcing';
COMMENT ON COLUMN purchase_parties.party_code IS 'Unique party code (e.g., BPN, JY) - auto-converted to uppercase';
COMMENT ON COLUMN purchase_parties.name IS 'Full name of the purchase party';
COMMENT ON COLUMN purchase_parties.deleted_at IS 'Soft delete timestamp - NULL means not deleted';

-- Insert some example purchase parties (optional - remove if not needed)
-- INSERT INTO purchase_parties (party_code, name)
-- VALUES
--   ('BPN', 'Best Plastics Network'),
--   ('JY', 'Jaipur Yard')
-- ON CONFLICT (party_code) DO NOTHING;
