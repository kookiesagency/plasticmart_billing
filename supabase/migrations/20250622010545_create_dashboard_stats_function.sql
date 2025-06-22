create or replace function get_dashboard_stats()
returns table (
  total_received numeric,
  total_outstanding numeric,
  total_billed numeric,
  total_invoices bigint
) as $$
begin
  return query
  select
    coalesce(sum(amount_received), 0) as total_received,
    coalesce(sum(amount_pending), 0) as total_outstanding,
    coalesce(sum(total_amount), 0) as total_billed,
    count(id) as total_invoices
  from invoices
  where deleted_at is null;
end;
$$ language plpgsql; 