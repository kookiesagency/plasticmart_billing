-- =================================================================
-- Fix invoice_items to be independent from items table
-- =================================================================
-- Issue: When items are deleted from the items table, invoice_items.item_id
-- was being set to NULL, causing issues even though item details
-- (item_name, rate, etc.) are already copied to invoice_items.
--
-- Solution: Remove the foreign key constraint entirely and make item_id nullable.
-- This allows invoices to remain intact even when source items are deleted.
-- Invoice items are historical records with copied data, so they don't need
-- the foreign key relationship.
-- =================================================================

-- STEP 1: Check for any invoice_items with NULL item_id (data that was affected)
SELECT
    ii.id,
    ii.invoice_id,
    ii.item_name,
    ii.quantity,
    ii.rate,
    i.party_id,
    p.name as party_name
FROM invoice_items ii
LEFT JOIN invoices i ON ii.invoice_id = i.id
LEFT JOIN parties p ON i.party_id = p.id
WHERE ii.item_id IS NULL
ORDER BY ii.invoice_id;

-- NOTE: If the above query returns rows, these invoice items had their item_id set to NULL
-- when the source item was deleted. The item_name, rate, and quantity should still be intact.

-- STEP 2: Drop the foreign key constraint entirely
-- This makes invoice_items completely independent from the items table
ALTER TABLE invoice_items
DROP CONSTRAINT IF EXISTS invoice_items_item_id_fkey;

-- STEP 3: Make item_id nullable (if it isn't already)
-- This allows item_id to be NULL when items are deleted, without breaking invoices
ALTER TABLE invoice_items
ALTER COLUMN item_id DROP NOT NULL;

-- STEP 4: Add an index on item_id for performance (optional but recommended)
-- Even without the foreign key, we may still want to join on this column
CREATE INDEX IF NOT EXISTS idx_invoice_items_item_id ON invoice_items(item_id);

-- STEP 5: Verification - Confirm no foreign key constraint exists
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'invoice_items'
    AND kcu.column_name = 'item_id'
    AND tc.constraint_type = 'FOREIGN KEY';

-- Should return 0 rows if successful

-- STEP 6: Count invoice_items with NULL item_id
SELECT COUNT(*) as items_with_null_item_id
FROM invoice_items
WHERE item_id IS NULL;

-- STEP 7: Verify all invoice_items still have their data intact
SELECT
    ii.id,
    ii.invoice_id,
    ii.item_id,
    ii.item_name,
    ii.quantity,
    ii.rate,
    ii.unit,
    i.invoice_number,
    p.name as party_name
FROM invoice_items ii
LEFT JOIN invoices i ON ii.invoice_id = i.id
LEFT JOIN parties p ON i.party_id = p.id
ORDER BY ii.invoice_id, ii.id
LIMIT 20;
