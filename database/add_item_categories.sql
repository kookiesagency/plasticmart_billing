-- Migration: Add Item Categories table and link to items
-- Description: Create item_categories table for organizing items into categories
-- Date: 2025-01-10

-- Create item_categories table
CREATE TABLE IF NOT EXISTS item_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Add category_id column to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS category_id INTEGER;

-- Add foreign key constraint
ALTER TABLE items
  ADD CONSTRAINT fk_items_category
  FOREIGN KEY (category_id)
  REFERENCES item_categories(id)
  ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_item_categories_deleted ON item_categories(deleted_at);
CREATE INDEX IF NOT EXISTS idx_item_categories_name ON item_categories(name);

-- Add updated_at trigger for item_categories
CREATE OR REPLACE FUNCTION update_item_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_item_categories_updated_at
  BEFORE UPDATE ON item_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_item_categories_updated_at();

-- Enable Row Level Security (RLS) for item_categories
ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for item_categories (assuming auth.users table exists)
CREATE POLICY "Enable read access for authenticated users" ON item_categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON item_categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON item_categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON item_categories
  FOR DELETE USING (auth.role() = 'authenticated');

-- Add comment to table
COMMENT ON TABLE item_categories IS 'Stores item categories for organizing inventory items';
COMMENT ON COLUMN item_categories.name IS 'Unique category name';
COMMENT ON COLUMN item_categories.description IS 'Optional description of the category';
COMMENT ON COLUMN item_categories.deleted_at IS 'Soft delete timestamp - NULL means not deleted';
