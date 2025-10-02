-- =================================================================
--  Temporary Development Security Policies
--  !! WARNING !!: This is for development only.
--  These policies allow ANYONE with the public anon key to read and
--  write to your database. They will be replaced with secure
--  policies once user authentication is implemented.
-- =================================================================

-- Drop the old, restrictive policies first.
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.units;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.parties;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.items;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.item_party_prices;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.invoices;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.invoice_items;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.payments;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.app_settings;

-- Create new, permissive policies that grant access to the 'anon' role (public users).
CREATE POLICY "Allow public access for development" ON public.units FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for development" ON public.parties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for development" ON public.items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for development" ON public.item_party_prices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for development" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for development" ON public.invoice_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for development" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for development" ON public.app_settings FOR ALL USING (true) WITH CHECK (true); 