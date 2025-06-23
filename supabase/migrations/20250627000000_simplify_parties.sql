-- This migration simplifies the parties table by removing the contact_details column
-- and also removes the corresponding snapshot column from the invoices table.

ALTER TABLE public.parties
DROP COLUMN IF EXISTS contact_details;

ALTER TABLE public.invoices
DROP COLUMN IF EXISTS party_contact_details; 