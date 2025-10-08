-- Step 1: Check ALL invoices for total_amount mismatches
-- This will show which invoices have incorrect stored totals

SELECT
  i.id,
  i.total_amount AS stored_total,
  (
    SELECT COALESCE(SUM(ii.quantity * ii.rate), 0)
    FROM invoice_items ii
    WHERE ii.invoice_id = i.id
  ) + COALESCE(i.bundle_charge, 0) AS calculated_total,
  (
    SELECT COALESCE(SUM(ii.quantity * ii.rate), 0)
    FROM invoice_items ii
    WHERE ii.invoice_id = i.id
  ) + COALESCE(i.bundle_charge, 0) - i.total_amount AS difference,
  (SELECT name FROM parties WHERE id = i.party_id) AS party_name
FROM invoices i
WHERE i.deleted_at IS NULL
  AND i.is_offline IS NOT TRUE  -- Only check regular invoices, not offline bills
  AND (
    SELECT COALESCE(SUM(ii.quantity * ii.rate), 0)
    FROM invoice_items ii
    WHERE ii.invoice_id = i.id
  ) + COALESCE(i.bundle_charge, 0) != i.total_amount
ORDER BY i.created_at DESC;

-- Step 2: Fix ALL invoices by recalculating totals from items
-- IMPORTANT: Only run this AFTER reviewing Step 1 results!

-- Uncomment the lines below to run the fix:
/*
UPDATE invoices i
SET total_amount = (
  SELECT COALESCE(SUM(ii.quantity * ii.rate), 0)
  FROM invoice_items ii
  WHERE ii.invoice_id = i.id
) + COALESCE(i.bundle_charge, 0)
WHERE i.deleted_at IS NULL
  AND i.is_offline IS NOT TRUE;  -- Don't update offline bills (they don't have items)

-- Show how many were updated
SELECT COUNT(*) AS invoices_fixed
FROM invoices i
WHERE i.deleted_at IS NULL
  AND i.is_offline IS NOT TRUE;
*/
