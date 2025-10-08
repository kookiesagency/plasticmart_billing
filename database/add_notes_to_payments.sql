-- Add notes column to payments table for storing payment remarks
-- This allows users to add context/description to payments (e.g., "Quick entry payment", "Partial payment for Invoice #123")

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment to document the column
COMMENT ON COLUMN payments.notes IS 'Optional notes or remarks for the payment';
