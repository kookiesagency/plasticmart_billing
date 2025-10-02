-- Add purchase_party_id column to items table
-- This tracks which party the item is purchased from

-- Step 1: Add the column (nullable, optional field)
ALTER TABLE items
ADD COLUMN purchase_party_id INTEGER;

-- Step 2: Add foreign key constraint
ALTER TABLE items
ADD CONSTRAINT fk_items_purchase_party
FOREIGN KEY (purchase_party_id)
REFERENCES parties(id)
ON DELETE SET NULL;

-- Step 3: Create index for better query performance
CREATE INDEX idx_items_purchase_party_id ON items(purchase_party_id);

-- Step 4: Add comment for documentation
COMMENT ON COLUMN items.purchase_party_id IS 'Reference to the party from whom this item is purchased (optional)';
