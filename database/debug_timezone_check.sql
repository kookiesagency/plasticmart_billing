-- Debug query to check timezone and invoice dates
-- Run this in Supabase SQL Editor to see actual data

-- Check current database timezone
SHOW TIMEZONE;

-- Check invoices created this week with both UTC and IST dates
SELECT
  id,
  total_amount,
  -- Show created_at in different formats
  created_at AS utc_timestamp,
  created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' AS ist_timestamp,
  DATE(created_at) AS utc_date,
  DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') AS ist_date,
  -- Show invoice details
  (SELECT name FROM parties WHERE id = invoices.party_id) AS party_name
FROM invoices
WHERE deleted_at IS NULL
  -- Check invoices around Oct 5-9
  AND created_at >= '2025-10-05'::timestamptz
  AND created_at < '2025-10-10'::timestamptz
ORDER BY created_at DESC;

-- Count and sum for this week in UTC
SELECT
  COUNT(*) AS count_utc,
  SUM(total_amount) AS total_utc
FROM invoices
WHERE deleted_at IS NULL
  AND DATE(created_at) >= '2025-10-06'
  AND DATE(created_at) <= '2025-10-09';

-- Count and sum for this week in IST
SELECT
  COUNT(*) AS count_ist,
  SUM(total_amount) AS total_ist
FROM invoices
WHERE deleted_at IS NULL
  AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') >= '2025-10-06'
  AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') <= '2025-10-09';
