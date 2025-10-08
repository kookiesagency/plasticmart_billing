-- Migration: Add trigger to auto-calculate invoice total_amount
-- Date: 2025-10-09
-- Description: Automatically recalculates total_amount whenever invoice items change
--              This prevents timing bugs where total gets out of sync with items

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_invoice_total_on_items_change ON invoice_items;
DROP FUNCTION IF EXISTS recalculate_invoice_total();

-- Create function to recalculate invoice total
CREATE OR REPLACE FUNCTION recalculate_invoice_total()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id INTEGER;
  v_subtotal NUMERIC;
  v_bundle_charge NUMERIC;
  v_new_total NUMERIC;
BEGIN
  -- Get the invoice_id (works for INSERT, UPDATE, and DELETE)
  IF TG_OP = 'DELETE' THEN
    v_invoice_id := OLD.invoice_id;
  ELSE
    v_invoice_id := NEW.invoice_id;
  END IF;

  -- Calculate subtotal from all items for this invoice
  SELECT COALESCE(SUM(quantity * rate), 0)
  INTO v_subtotal
  FROM invoice_items
  WHERE invoice_id = v_invoice_id;

  -- Get bundle_charge from invoice
  SELECT COALESCE(bundle_charge, 0)
  INTO v_bundle_charge
  FROM invoices
  WHERE id = v_invoice_id;

  -- Calculate new total
  v_new_total := v_subtotal + v_bundle_charge;

  -- Update the invoice total_amount
  UPDATE invoices
  SET total_amount = v_new_total
  WHERE id = v_invoice_id
    AND is_offline IS NOT TRUE;  -- Don't auto-update offline invoices

  RETURN NULL;  -- Result is ignored for AFTER triggers
END;
$$ LANGUAGE plpgsql;

-- Create trigger on invoice_items table
-- Fires AFTER any INSERT, UPDATE, or DELETE on invoice items
CREATE TRIGGER update_invoice_total_on_items_change
AFTER INSERT OR UPDATE OR DELETE ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION recalculate_invoice_total();

-- Also create trigger for when bundle_charge changes on invoice itself
DROP TRIGGER IF EXISTS update_invoice_total_on_bundle_change ON invoices;

CREATE OR REPLACE FUNCTION recalculate_invoice_total_on_bundle_change()
RETURNS TRIGGER AS $$
DECLARE
  v_subtotal NUMERIC;
  v_new_total NUMERIC;
BEGIN
  -- Only recalculate if bundle_charge changed and it's not an offline invoice
  IF NEW.is_offline IS NOT TRUE AND (OLD.bundle_charge IS DISTINCT FROM NEW.bundle_charge) THEN
    -- Calculate subtotal from all items
    SELECT COALESCE(SUM(quantity * rate), 0)
    INTO v_subtotal
    FROM invoice_items
    WHERE invoice_id = NEW.id;

    -- Calculate new total
    v_new_total := v_subtotal + COALESCE(NEW.bundle_charge, 0);

    -- Update total_amount
    NEW.total_amount := v_new_total;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_total_on_bundle_change
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION recalculate_invoice_total_on_bundle_change();

-- Test: Verify triggers work by showing current state
SELECT
  'Triggers created successfully!' AS status,
  COUNT(*) AS total_invoices,
  SUM(CASE
    WHEN total_amount = (
      SELECT COALESCE(SUM(ii.quantity * ii.rate), 0)
      FROM invoice_items ii
      WHERE ii.invoice_id = invoices.id
    ) + COALESCE(bundle_charge, 0)
    THEN 1 ELSE 0
  END) AS correct_totals,
  SUM(CASE
    WHEN total_amount != (
      SELECT COALESCE(SUM(ii.quantity * ii.rate), 0)
      FROM invoice_items ii
      WHERE ii.invoice_id = invoices.id
    ) + COALESCE(bundle_charge, 0)
    THEN 1 ELSE 0
  END) AS incorrect_totals
FROM invoices
WHERE deleted_at IS NULL AND is_offline IS NOT TRUE;
