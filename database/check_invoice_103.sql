-- Check invoice #103 (AAGAYA PLASTIC - BHANDUP) details
-- This invoice has ₹150 difference between stored and calculated total

-- Check the invoice record
SELECT
  id,
  total_amount AS stored_total,
  bundle_charge,
  created_at
FROM invoices
WHERE id = 103;

-- Check the invoice items and calculate the actual total
SELECT
  item_name,
  quantity,
  rate,
  (quantity * rate) AS item_total
FROM invoice_items
WHERE invoice_id = 103
ORDER BY position;

-- Calculate sub_total from items
SELECT
  SUM(quantity * rate) AS calculated_subtotal
FROM invoice_items
WHERE invoice_id = 103;

-- Show what the total SHOULD be (sub_total + bundle_charge)
SELECT
  (SELECT SUM(quantity * rate) FROM invoice_items WHERE invoice_id = 103) AS calculated_subtotal,
  i.bundle_charge,
  (SELECT SUM(quantity * rate) FROM invoice_items WHERE invoice_id = 103) + i.bundle_charge AS calculated_total,
  i.total_amount AS stored_total,
  ((SELECT SUM(quantity * rate) FROM invoice_items WHERE invoice_id = 103) + i.bundle_charge) - i.total_amount AS difference
FROM invoices i
WHERE i.id = 103;
