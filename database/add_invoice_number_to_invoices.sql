-- Migration: Add invoice_number to invoices table
-- Date: 2025-01-02
-- Description: Adds invoice_number column with format YYYY/XXX and auto-generates numbers for existing invoices

-- Add the invoice_number column
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(20) UNIQUE;

-- Create a function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number(invoice_year INTEGER)
RETURNS VARCHAR(20) AS $$
DECLARE
  next_number INTEGER;
  new_invoice_number VARCHAR(20);
BEGIN
  -- Get the highest invoice number for the given year
  SELECT COALESCE(MAX(CAST(SPLIT_PART(invoice_number, '/', 2) AS INTEGER)), 0) + 1
  INTO next_number
  FROM invoices
  WHERE invoice_number LIKE invoice_year || '/%';

  -- Generate the new invoice number in format YYYY/XXX
  new_invoice_number := invoice_year || '/' || LPAD(next_number::TEXT, 3, '0');

  RETURN new_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Generate invoice numbers for all existing invoices ordered by invoice_date and created_at
DO $$
DECLARE
  invoice_record RECORD;
  invoice_year INTEGER;
  new_number VARCHAR(20);
BEGIN
  FOR invoice_record IN
    SELECT id, EXTRACT(YEAR FROM invoice_date)::INTEGER AS year
    FROM invoices
    WHERE invoice_number IS NULL
    ORDER BY invoice_date ASC, created_at ASC
  LOOP
    invoice_year := invoice_record.year;
    new_number := generate_invoice_number(invoice_year);

    UPDATE invoices
    SET invoice_number = new_number
    WHERE id = invoice_record.id;
  END LOOP;
END $$;

-- Make invoice_number NOT NULL after populating existing records
ALTER TABLE invoices
ALTER COLUMN invoice_number SET NOT NULL;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
