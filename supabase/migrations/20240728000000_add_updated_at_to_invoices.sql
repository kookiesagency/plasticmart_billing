-- Add updated_at column to the invoices table
ALTER TABLE public.invoices
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create a trigger function to update the updated_at column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the invoices table
CREATE TRIGGER on_invoice_update
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE PROCEDURE public.handle_updated_at(); 