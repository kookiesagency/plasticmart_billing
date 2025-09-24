-- Add a position column to preserve item ordering on invoices
ALTER TABLE public.invoice_items
ADD COLUMN IF NOT EXISTS position INTEGER;

-- Backfill position per invoice using existing insertion order (by id)
WITH numbered AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY invoice_id ORDER BY id) - 1 AS rn
  FROM public.invoice_items
)
UPDATE public.invoice_items ii
SET position = n.rn
FROM numbered n
WHERE ii.id = n.id AND ii.position IS NULL;

-- Ensure not null going forward
ALTER TABLE public.invoice_items
ALTER COLUMN position SET NOT NULL;

-- Helpful index for ordered retrieval
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id_position
  ON public.invoice_items (invoice_id, position);

