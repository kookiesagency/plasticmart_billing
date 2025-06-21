-- This script updates the 'invoices' table to store bundle details separately.
-- It is safe to run this script multiple times.

-- Add a column to store the rate of the bundle at the time of invoice creation.
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS bundle_rate NUMERIC(10, 2) DEFAULT 0;

-- Add a column to store the quantity of bundles.
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS bundle_quantity INT DEFAULT 0;

-- Note: The existing 'bundle_charge' column will now store the total (rate * quantity).
-- This provides both detailed and summary data. 