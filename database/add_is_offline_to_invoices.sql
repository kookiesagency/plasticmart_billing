-- Migration: Add is_offline flag to invoices table
-- Date: 2025-01-02
-- Description: Adds is_offline boolean column to mark invoices created via quick entry (no item breakdown)

-- Add the is_offline column
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS is_offline BOOLEAN DEFAULT FALSE NOT NULL;

-- Create an index for filtering offline invoices
CREATE INDEX IF NOT EXISTS idx_invoices_is_offline ON invoices(is_offline);
