-- Add soft-delete support to activity_logs
ALTER TABLE public.activity_logs
ADD COLUMN deleted_at TIMESTAMPTZ; 