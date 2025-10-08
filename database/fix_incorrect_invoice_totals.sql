-- Migration: Fix existing invoices with incorrect totals
-- Date: 2025-10-09
-- Description: Fixes the 2 invoices (#103, #62) that have incorrect total_amount

-- Fix invoice #103 and #62
UPDATE invoices
SET total_amount = (
  SELECT COALESCE(SUM(ii.quantity * ii.rate), 0)
  FROM invoice_items ii
  WHERE ii.invoice_id = invoices.id
) + COALESCE(bundle_charge, 0)
WHERE id IN (103, 62);

-- Verify the fix
SELECT
  id,
  invoice_number,
  (SELECT name FROM parties WHERE id = party_id) AS party_name,
  (
    SELECT COALESCE(SUM(ii.quantity * ii.rate), 0)
    FROM invoice_items ii
    WHERE ii.invoice_id = invoices.id
  ) AS subtotal,
  bundle_charge,
  total_amount AS fixed_total
FROM invoices
WHERE id IN (103, 62);
