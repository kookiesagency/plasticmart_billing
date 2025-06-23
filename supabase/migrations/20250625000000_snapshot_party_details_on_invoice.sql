-- Add party detail columns to the invoices table
ALTER TABLE public.invoices
ADD COLUMN party_name TEXT,
ADD COLUMN party_contact_details TEXT;

-- Backfill the new columns with data from the parties table
-- Use COALESCE to handle any potentially missing data in the parties table
UPDATE public.invoices
SET 
  party_name = COALESCE(p.name, 'Unknown Party'),
  party_contact_details = COALESCE(p.contact_details::text, '')
FROM public.parties p
WHERE public.invoices.party_id = p.id;

-- Now that data is safely backfilled, make the columns NOT NULL
ALTER TABLE public.invoices
ALTER COLUMN party_name SET NOT NULL;
-- party_contact_details can be optional, so we don't set it to NOT NULL

-- Drop the old foreign key constraint if it exists
ALTER TABLE public.invoices
DROP CONSTRAINT IF EXISTS invoices_party_id_fkey;

-- Add it back with ON DELETE SET NULL. If a party is deleted, the
-- party_id on the invoice becomes NULL, but the snapshotted details remain.
ALTER TABLE public.invoices
ADD CONSTRAINT invoices_party_id_fkey
FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE SET NULL; 