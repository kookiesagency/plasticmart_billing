-- Add item_name and item_unit columns to invoice_items
ALTER TABLE public.invoice_items
ADD COLUMN item_name TEXT,
ADD COLUMN item_unit TEXT;

-- Backfill item_name, using a fallback for any items that might have a null name
UPDATE public.invoice_items
SET item_name = COALESCE(i.name, 'Unknown Item')
FROM public.items i
WHERE public.invoice_items.item_id = i.id;

-- Backfill item_unit, using a LEFT JOIN to handle items without a unit
-- and COALESCE to provide a default 'N/A' value.
UPDATE public.invoice_items
SET item_unit = COALESCE(u.abbreviation, 'N/A')
FROM public.items i
LEFT JOIN public.units u ON i.unit_id = u.id
WHERE public.invoice_items.item_id = i.id;

-- Now that data is safely backfilled, make the columns NOT NULL
ALTER TABLE public.invoice_items
ALTER COLUMN item_name SET NOT NULL,
ALTER COLUMN item_unit SET NOT NULL;

-- Drop the old foreign key constraint if it exists
ALTER TABLE public.invoice_items
DROP CONSTRAINT IF EXISTS invoice_items_item_id_fkey;

-- Add it back with ON DELETE SET NULL. This means if an item is deleted,
-- the item_id on the invoice will become NULL, but the snapshotted
-- item_name and item_unit will remain, preserving the invoice's history.
ALTER TABLE public.invoice_items
ADD CONSTRAINT invoice_items_item_id_fkey
FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL; 