-- Affiliation Agreement acceptance — run in Supabase SQL Editor
alter table public.driver_registrations
  add column if not exists contract_accepted boolean not null default false,
  add column if not exists contract_version text,
  add column if not exists contract_accepted_at timestamptz,
  add column if not exists signed_contract_url text;
