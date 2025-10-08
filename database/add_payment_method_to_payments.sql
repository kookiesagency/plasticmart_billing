-- Add payment_method column to payments table
-- This allows tracking how payment was received (cash, bank transfer, upi, etc.)

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';

-- Add comment to document the column
COMMENT ON COLUMN payments.payment_method IS 'Payment method used (cash, bank, upi, cheque, etc.)';
