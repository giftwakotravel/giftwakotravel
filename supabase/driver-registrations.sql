-- Driver & vehicle registration — run in Supabase SQL Editor

create table if not exists public.driver_registrations (
  id bigint generated always as identity primary key,
  status text not null default 'Pending',           -- Pending | Approved | Rejected
  -- step 1 personal
  full_name text, surname text, dob date, sa_id text, gender text, nationality text,
  mobile text, whatsapp text, email text, address text, province text, town text,
  id_doc_url text, selfie_url text,
  -- step 2 licence
  licence_number text, licence_code text, licence_expiry date,
  prdp_number text, prdp_expiry date, licence_doc_url text, prdp_doc_url text,
  -- step 3 vehicle
  vehicle_make text, vehicle_model text, vehicle_year text, vehicle_colour text,
  vehicle_reg text, vehicle_type text, passenger_capacity integer, doors integer,
  aircon boolean, luggage text, fuel_type text,
  -- step 4 vehicle documents
  reg_cert_url text, ownership_url text, roadworthy_url text, licence_disc_url text,
  insurance_url text, operating_licence_url text,
  licence_disc_expiry date, roadworthy_expiry date, insurance_expiry date, op_licence_expiry date,
  -- step 5 services
  services text[], operating_province text, towns_served text, pickup_locations text,
  max_distance text, available_days text[], working_hours text, pricing text,
  -- step 6 banking
  account_holder text, bank_name text, account_type text, account_number text,
  branch_code text, bank_proof_url text,
  -- step 6 driver agreement
  contract_accepted boolean not null default false, contract_version text,
  contract_accepted_at timestamptz, signed_contract_url text,
  created_at timestamptz not null default now()
);

alter table public.driver_registrations enable row level security;

drop policy if exists "driver_registrations anon" on public.driver_registrations;
create policy "driver_registrations anon" on public.driver_registrations
  for all to anon using (true) with check (true);
