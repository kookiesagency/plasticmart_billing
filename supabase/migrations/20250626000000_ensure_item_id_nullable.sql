-- This migration ensures that the item_id column in the invoice_items table
-- can be set to NULL. This is required for the 'ON DELETE SET NULL' foreign
-- key constraint to work correctly, allowing items to be deleted without
-- breaking historical invoices.

ALTER TABLE public.invoice_items
ALTER COLUMN item_id DROP NOT NULL; 