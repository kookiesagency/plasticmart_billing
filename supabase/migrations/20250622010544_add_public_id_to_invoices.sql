alter table "public"."invoices"
add column "public_id" uuid not null default gen_random_uuid();

create unique index invoices_public_id_key on public.invoices using btree (public_id);

alter table "public"."invoices" add constraint "invoices_public_id_key" UNIQUE using index "invoices_public_id_key";
