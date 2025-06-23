-- Permanently delete soft-deleted records older than 30 days
CREATE OR REPLACE FUNCTION public.purge_soft_deleted_records()
RETURNS void AS $$
BEGIN
  -- Invoices
  DELETE FROM public.invoices WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days';
  -- Parties
  DELETE FROM public.parties WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days';
  -- Items
  DELETE FROM public.items WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days';
  -- Units
  DELETE FROM public.units WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule the function to run daily at midnight (requires pg_cron extension)
SELECT cron.schedule('purge_soft_deleted_records_daily', '0 0 * * *', $$SELECT public.purge_soft_deleted_records();$$); 