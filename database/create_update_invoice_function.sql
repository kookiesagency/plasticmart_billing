-- =================================================================
-- Create a PostgreSQL function to update invoice items atomically
-- =================================================================
-- This function uses a transaction to ensure that if the insert fails,
-- the delete is rolled back, preventing data loss.
-- =================================================================

CREATE OR REPLACE FUNCTION update_invoice_items(
  p_invoice_id INTEGER,
  p_items JSONB
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete existing invoice items
  DELETE FROM invoice_items WHERE invoice_id = p_invoice_id;

  -- Insert new invoice items
  INSERT INTO invoice_items (
    invoice_id,
    item_id,
    item_name,
    quantity,
    rate,
    item_unit,
    position,
    original_rate,
    original_unit
  )
  SELECT
    p_invoice_id,
    (item->>'item_id')::INTEGER,
    item->>'item_name',
    (item->>'quantity')::INTEGER,
    (item->>'rate')::NUMERIC,
    item->>'item_unit',
    (item->>'position')::INTEGER,
    (item->>'original_rate')::NUMERIC,
    item->>'original_unit'
  FROM jsonb_array_elements(p_items) AS item;

  -- If we reach here, both operations succeeded
  -- PostgreSQL will commit the transaction automatically
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_invoice_items(INTEGER, JSONB) TO authenticated;

-- Example usage:
-- SELECT update_invoice_items(
--   123,  -- invoice_id
--   '[
--     {"item_id": 1, "item_name": "Item 1", "quantity": 10, "rate": 100, "item_unit": "PCS", "position": 0},
--     {"item_id": 2, "item_name": "Item 2", "quantity": 5, "rate": 200, "item_unit": "PCS", "position": 1}
--   ]'::jsonb
-- );
