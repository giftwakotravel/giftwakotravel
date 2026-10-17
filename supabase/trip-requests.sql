-- Trip request intake table — run in Supabase SQL Editor

create table if not exists public.trip_requests (
  id bigint generated always as identity primary key,
  ref text unique,
  created_at timestamptz default now(),
  -- step 1: contact
  full_name text not null,
  email text,
  phone text,
  whatsapp text,
  contact_method text,
  country_residence text,
  -- step 2: destination
  departure_location text,
  destination_country text,
  destination_area text,
  trip_type text,
  trip_type_other text,
  -- step 3: dates
  departure_date date,
  return_date date,
  nights smallint,
  date_flexibility text,
  -- step 4: travellers
  adults smallint,
  children smallint,
  children_ages jsonb,
  rooms smallint,
  special_requirements text,
  -- step 5: budget
  budget text,
  budget_basis text,
  accommodation text,
  transport text,
  -- step 6
  notes text,
  -- workflow
  status text default 'New' check (status in ('New','Reviewing','Quoted','Confirmed','Closed')),
  admin_notes text
);

alter table public.trip_requests enable row level security;
drop policy if exists "anon_all" on public.trip_requests;
create policy "anon_all" on public.trip_requests for all using (true) with check (true);
