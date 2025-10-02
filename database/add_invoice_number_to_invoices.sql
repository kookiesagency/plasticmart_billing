-- Migration: Add invoice_number to invoices table
-- Date: 2025-01-02
-- Description: Adds invoice_number column with format YYYY-YY/XXX (financial year) and auto-generates numbers for existing invoices
-- Financial year starts on April 1st and resets counter each year

-- Add the invoice_number column
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(20) UNIQUE;

-- Create a function to calculate financial year from a date
CREATE OR REPLACE FUNCTION get_financial_year(invoice_date DATE)
RETURNS VARCHAR(7) AS $$
DECLARE
  year INTEGER;
  month INTEGER;
  fy_start_year INTEGER;
  fy_end_year INTEGER;
  financial_year VARCHAR(7);
BEGIN
  year := EXTRACT(YEAR FROM invoice_date)::INTEGER;
  month := EXTRACT(MONTH FROM invoice_date)::INTEGER;

  -- If month is January-March, financial year is (previous_year)-(current_year)
  -- If month is April-December, financial year is (current_year)-(next_year)
  IF month >= 4 THEN
    fy_start_year := year;
    fy_end_year := year + 1;
  ELSE
    fy_start_year := year - 1;
    fy_end_year := year;
  END IF;

  -- Format as YYYY-YY (e.g., 2024-25)
  financial_year := fy_start_year || '-' || RIGHT(fy_end_year::TEXT, 2);

  RETURN financial_year;
END;
$$ LANGUAGE plpgsql;

-- Create a function to generate invoice numbers based on financial year
CREATE OR REPLACE FUNCTION generate_invoice_number(invoice_date DATE)
RETURNS VARCHAR(20) AS $$
DECLARE
  next_number INTEGER;
  new_invoice_number VARCHAR(20);
  financial_year VARCHAR(7);
BEGIN
  -- Get the financial year for this invoice
  financial_year := get_financial_year(invoice_date);

  -- Get the highest invoice number for this financial year
  SELECT COALESCE(MAX(CAST(SPLIT_PART(invoice_number, '/', 2) AS INTEGER)), 0) + 1
  INTO next_number
  FROM invoices
  WHERE invoice_number LIKE financial_year || '/%';

  -- Generate the new invoice number in format YYYY-YY/XXX
  new_invoice_number := financial_year || '/' || LPAD(next_number::TEXT, 3, '0');

  RETURN new_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Generate invoice numbers for all existing invoices ordered by invoice_date and created_at
DO $$
DECLARE
  invoice_record RECORD;
  new_number VARCHAR(20);
BEGIN
  FOR invoice_record IN
    SELECT id, invoice_date
    FROM invoices
    WHERE invoice_number IS NULL
    ORDER BY invoice_date ASC, created_at ASC
  LOOP
    new_number := generate_invoice_number(invoice_record.invoice_date);

    UPDATE invoices
    SET invoice_number = new_number
    WHERE id = invoice_record.id;
  END LOOP;
END $$;

-- Create a trigger function to auto-generate invoice numbers on insert
CREATE OR REPLACE FUNCTION auto_generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if invoice_number is not provided
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := generate_invoice_number(NEW.invoice_date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run before insert
DROP TRIGGER IF EXISTS trigger_auto_generate_invoice_number ON invoices;
CREATE TRIGGER trigger_auto_generate_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_invoice_number();

-- Make invoice_number NOT NULL after populating existing records
ALTER TABLE invoices
ALTER COLUMN invoice_number SET NOT NULL;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
