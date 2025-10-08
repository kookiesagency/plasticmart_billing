-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activity_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_email text,
  action text NOT NULL,
  target_table text,
  target_id text,
  details jsonb,
  deleted_at timestamp with time zone,
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.app_settings (
  key text NOT NULL,
  value text NOT NULL,
  CONSTRAINT app_settings_pkey PRIMARY KEY (key)
);
CREATE TABLE public.invoice_items (
  id integer NOT NULL DEFAULT nextval('invoice_items_id_seq'::regclass),
  invoice_id integer NOT NULL,
  item_id integer,
  quantity integer NOT NULL,
  rate numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  item_name text NOT NULL,
  item_unit text NOT NULL,
  position integer NOT NULL,
  original_rate numeric,
  original_unit character varying,
  CONSTRAINT invoice_items_pkey PRIMARY KEY (id),
  CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id),
  CONSTRAINT invoice_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id)
);
CREATE TABLE public.invoices (
  id integer NOT NULL DEFAULT nextval('invoices_id_seq'::regclass),
  party_id integer,
  invoice_date date NOT NULL,
  bundle_charge numeric DEFAULT 0,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  bundle_rate numeric DEFAULT 0,
  bundle_quantity integer DEFAULT 0,
  total_amount numeric,
  deleted_at timestamp with time zone,
  public_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  updated_at timestamp with time zone DEFAULT now(),
  party_name text NOT NULL,
  invoice_number character varying NOT NULL UNIQUE,
  is_offline boolean NOT NULL DEFAULT false,
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_party_id_fkey FOREIGN KEY (party_id) REFERENCES public.parties(id)
);
CREATE TABLE public.item_party_prices (
  item_id integer NOT NULL,
  party_id integer NOT NULL,
  price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT item_party_prices_pkey PRIMARY KEY (item_id, party_id),
  CONSTRAINT item_party_prices_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id),
  CONSTRAINT item_party_prices_party_id_fkey FOREIGN KEY (party_id) REFERENCES public.parties(id)
);
CREATE TABLE public.items (
  id integer NOT NULL DEFAULT nextval('items_id_seq'::regclass),
  name text NOT NULL,
  default_rate numeric NOT NULL,
  unit_id integer,
  created_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  purchase_rate numeric,
  purchase_party_id integer,
  CONSTRAINT items_pkey PRIMARY KEY (id),
  CONSTRAINT items_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id),
  CONSTRAINT fk_items_purchase_party FOREIGN KEY (purchase_party_id) REFERENCES public.parties(id)
);
CREATE TABLE public.parties (
  id integer NOT NULL DEFAULT nextval('parties_id_seq'::regclass),
  name text NOT NULL,
  bundle_rate numeric,
  created_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  opening_balance numeric NOT NULL DEFAULT 0,
  CONSTRAINT parties_pkey PRIMARY KEY (id)
);
CREATE TABLE public.payments (
  id integer NOT NULL DEFAULT nextval('payments_id_seq'::regclass),
  invoice_id integer NOT NULL,
  amount numeric NOT NULL,
  payment_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  remark text,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
);
CREATE TABLE public.units (
  id integer NOT NULL DEFAULT nextval('units_id_seq'::regclass),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT units_pkey PRIMARY KEY (id)
);