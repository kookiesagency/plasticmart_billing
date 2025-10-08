-- Migration: Update get_dashboard_stats to use created_at instead of invoice_date
-- Date: 2025-10-09
-- Description: Changes dashboard stats to filter by created_at (when invoice was created)
--              instead of invoice_date (bill date), for more accurate business metrics

-- Drop the existing function
DROP FUNCTION IF EXISTS get_dashboard_stats(date, date);

-- Recreate the function with created_at filtering
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_received NUMERIC,
  total_outstanding NUMERIC,
  total_billed NUMERIC,
  total_invoices BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH invoice_stats AS (
    SELECT
      COALESCE(SUM(i.total_amount), 0) AS billed,
      COUNT(i.id) AS invoice_count
    FROM invoices i
    WHERE i.deleted_at IS NULL
      AND (start_date IS NULL OR DATE(i.created_at) >= start_date)
      AND (end_date IS NULL OR DATE(i.created_at) <= end_date)
  ),
  payment_stats AS (
    SELECT
      COALESCE(SUM(p.amount), 0) AS received
    FROM payments p
    JOIN invoices i ON p.invoice_id = i.id
    WHERE i.deleted_at IS NULL
      AND (start_date IS NULL OR DATE(i.created_at) >= start_date)
      AND (end_date IS NULL OR DATE(i.created_at) <= end_date)
  ),
  opening_balance_stats AS (
    SELECT
      COALESCE(SUM(opening_balance), 0) AS total_opening
    FROM parties
    WHERE deleted_at IS NULL
  )
  SELECT
    ps.received AS total_received,
    (obs.total_opening + ist.billed - ps.received) AS total_outstanding,
    ist.billed AS total_billed,
    ist.invoice_count AS total_invoices
  FROM invoice_stats ist, payment_stats ps, opening_balance_stats obs;
END;
$$ LANGUAGE plpgsql;
