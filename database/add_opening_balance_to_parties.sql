-- Migration: Add opening_balance column to parties table
-- Date: 2025-01-02
-- Description: Adds opening_balance field to track initial balance for each party

-- Add opening_balance column to parties table
ALTER TABLE parties
ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN parties.opening_balance IS 'Initial balance owed by the party at the start (can be positive or negative)';

-- Create index for performance (optional, if querying by opening balance)
CREATE INDEX IF NOT EXISTS idx_parties_opening_balance ON parties(opening_balance);
