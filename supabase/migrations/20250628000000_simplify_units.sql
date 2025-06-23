-- This migration simplifies the units table by removing the abbreviation column.
-- The full name of the unit will be used everywhere.

ALTER TABLE public.units
DROP COLUMN IF EXISTS abbreviation; 