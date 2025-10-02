-- Add original_rate and original_unit columns to invoice_items table
-- These columns store the original values before any unit conversions

ALTER TABLE invoice_items
ADD COLUMN IF NOT EXISTS original_rate DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS original_unit VARCHAR(50);

-- Update existing rows to set original values from current values
UPDATE invoice_items
SET
  original_rate = rate,
  original_unit = item_unit
WHERE original_rate IS NULL;
