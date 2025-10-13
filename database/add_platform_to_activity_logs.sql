-- Add platform field to activity_logs table to track mobile vs web operations
-- Run this migration in Supabase SQL Editor

-- Add platform column (defaults to 'web' for existing records)
ALTER TABLE public.activity_logs
ADD COLUMN platform text DEFAULT 'web' CHECK (platform IN ('web', 'mobile'));

-- Create index for faster filtering by platform
CREATE INDEX IF NOT EXISTS idx_activity_logs_platform ON public.activity_logs(platform);

-- Add comment to document the column
COMMENT ON COLUMN public.activity_logs.platform IS 'Platform where the operation occurred: web or mobile';
