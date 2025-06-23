ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read access to activity logs"
ON public.activity_logs
FOR SELECT
TO anon
USING (true);
