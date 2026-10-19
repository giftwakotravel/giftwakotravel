-- Driver Portal — accounts, profiles, vehicles, documents, contracts, trips, jobs, notifications
-- Run in Supabase SQL Editor. Requires Supabase Auth (Email provider) enabled.
-- Dashboard → Authentication → Providers → Email → turn OFF "Confirm email" for instant login.

-- ---------------------------------------------------------------- profiles
create table if not exists public.driver_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'Incomplete',   -- Incomplete | Pending | Rejected | Approved | Suspended
  rejection_reason text,
  full_name text, surname text, email text, phone text, whatsapp text,
  dob date, sa_id text, gender text, nationality text default 'South African',
  address text, town text, province text,
  emergency_name text, emergency_phone text, emergency_relation text,
  licence_number text, licence_code text, licence_expiry date,
  prdp_number text, prdp_expiry date,
  services text[] not null default '{}', operating_province text, towns_served text,
  available_days text[] not null default '{}', working_hours text, pricing text,
  account_holder text, bank_name text, account_type text, account_number text, branch_code text,
  submitted_at timestamptz, reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- vehicles
create table if not exists public.driver_vehicles (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  make text, model text, year text, colour text, reg text, vehicle_type text,
  capacity integer, doors integer, aircon boolean default true, luggage text, fuel_type text,
  photo_urls text[] not null default '{}',
  status text not null default 'Pending',       -- Pending | Approved | Rejected
  created_at timestamptz not null default now()
);
create index if not exists driver_vehicles_user on public.driver_vehicles(user_id);

-- ---------------------------------------------------------------- documents
create table if not exists public.driver_documents (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id bigint references public.driver_vehicles(id) on delete cascade,
  doc_type text not null,                       -- id_doc | selfie | licence | prdp | reg_cert | ownership | roadworthy | licence_disc | insurance | op_licence | bank_proof | other
  file_url text not null, file_name text, expiry date,
  status text not null default 'Pending',       -- Pending | Verified | Rejected
  note text,
  created_at timestamptz not null default now()
);
create index if not exists driver_documents_user on public.driver_documents(user_id);

-- ---------------------------------------------------------------- contracts
create table if not exists public.driver_contracts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  version text not null,
  accepted_at timestamptz not null default now(),
  signature_name text,
  signature_url text,                           -- drawn e-signature PNG
  signed_file_url text                          -- uploaded signed copy
);
create index if not exists driver_contracts_user on public.driver_contracts(user_id);

-- ---------------------------------------------------------------- trips (assigned by admin)
create table if not exists public.driver_trips (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, pickup text, dropoff text,
  trip_date date, trip_time text, passengers integer,
  status text not null default 'Assigned',      -- Assigned | Confirmed | In progress | Completed | Cancelled
  amount numeric(10,2), paid boolean not null default false, paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists driver_trips_user on public.driver_trips(user_id);

-- ---------------------------------------------------------------- open jobs (posted by admin)
create table if not exists public.driver_jobs (
  id bigint generated always as identity primary key,
  title text not null, pickup text, dropoff text,
  trip_date date, trip_time text, passengers integer, vehicle_type text,
  pay numeric(10,2), notes text,
  status text not null default 'Open',          -- Open | Requested | Assigned | Closed
  requested_by uuid references auth.users(id) on delete set null,
  requested_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- notifications
create table if not exists public.driver_notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'info',            -- info | contract | decision | trip | document
  title text not null, body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists driver_notifications_user on public.driver_notifications(user_id, read);

-- ---------------------------------------------------------------- auto-create profile on driver sign-up
create or replace function public.handle_new_driver()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.raw_user_meta_data->>'role' = 'driver' then
    insert into public.driver_profiles (user_id, email, full_name, surname, phone)
    values (new.id, new.email,
            new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'surname',
            new.raw_user_meta_data->>'phone')
    on conflict (user_id) do nothing;
    insert into public.driver_notifications (user_id, type, title, body)
    values (new.id, 'info', 'Welcome to the GiftWako Driver Portal',
            'Complete your profile, add a vehicle, upload your documents and accept the agreement to submit for approval.');
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created_driver on auth.users;
create trigger on_auth_user_created_driver
  after insert on auth.users for each row execute function public.handle_new_driver();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists driver_profiles_touch on public.driver_profiles;
create trigger driver_profiles_touch before update on public.driver_profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- row level security
alter table public.driver_profiles      enable row level security;
alter table public.driver_vehicles      enable row level security;
alter table public.driver_documents     enable row level security;
alter table public.driver_contracts     enable row level security;
alter table public.driver_trips         enable row level security;
alter table public.driver_jobs          enable row level security;
alter table public.driver_notifications enable row level security;

-- Drivers: own rows only
drop policy if exists "driver own profile" on public.driver_profiles;
create policy "driver own profile" on public.driver_profiles
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "driver own vehicles" on public.driver_vehicles;
create policy "driver own vehicles" on public.driver_vehicles
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "driver own documents" on public.driver_documents;
create policy "driver own documents" on public.driver_documents
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "driver own contracts" on public.driver_contracts;
create policy "driver own contracts" on public.driver_contracts
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "driver accept contract" on public.driver_contracts;
create policy "driver accept contract" on public.driver_contracts
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "driver own trips" on public.driver_trips;
create policy "driver own trips" on public.driver_trips
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "driver update own trip status" on public.driver_trips;
create policy "driver update own trip status" on public.driver_trips
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "driver sees open jobs" on public.driver_jobs;
create policy "driver sees open jobs" on public.driver_jobs
  for select to authenticated using (status = 'Open' or requested_by = auth.uid());
drop policy if exists "driver requests open job" on public.driver_jobs;
create policy "driver requests open job" on public.driver_jobs
  for update to authenticated using (status = 'Open') with check (requested_by = auth.uid() and status = 'Requested');

drop policy if exists "driver own notifications" on public.driver_notifications;
create policy "driver own notifications" on public.driver_notifications
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Admin dashboard (currently password-gated and using the anon key — same posture as
-- driver_registrations / staff_roles). TIGHTEN to a real admin role once admin auth exists.
drop policy if exists "admin anon profiles" on public.driver_profiles;
create policy "admin anon profiles" on public.driver_profiles for all to anon using (true) with check (true);
drop policy if exists "admin anon vehicles" on public.driver_vehicles;
create policy "admin anon vehicles" on public.driver_vehicles for all to anon using (true) with check (true);
drop policy if exists "admin anon documents" on public.driver_documents;
create policy "admin anon documents" on public.driver_documents for all to anon using (true) with check (true);
drop policy if exists "admin anon contracts" on public.driver_contracts;
create policy "admin anon contracts" on public.driver_contracts for select to anon using (true);
drop policy if exists "admin anon trips" on public.driver_trips;
create policy "admin anon trips" on public.driver_trips for all to anon using (true) with check (true);
drop policy if exists "admin anon jobs" on public.driver_jobs;
create policy "admin anon jobs" on public.driver_jobs for all to anon using (true) with check (true);
drop policy if exists "admin anon notifications" on public.driver_notifications;
create policy "admin anon notifications" on public.driver_notifications for all to anon using (true) with check (true);

-- ---------------------------------------------------------------- storage: driver-docs bucket
-- Public read (same as the existing "media" bucket); drivers may only write inside their own folder <uid>/...
insert into storage.buckets (id, name, public) values ('driver-docs', 'driver-docs', true)
on conflict (id) do nothing;

drop policy if exists "driver-docs public read" on storage.objects;
create policy "driver-docs public read" on storage.objects
  for select using (bucket_id = 'driver-docs');
drop policy if exists "driver-docs own insert" on storage.objects;
create policy "driver-docs own insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'driver-docs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "driver-docs own update" on storage.objects;
create policy "driver-docs own update" on storage.objects
  for update to authenticated using (bucket_id = 'driver-docs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "driver-docs own delete" on storage.objects;
create policy "driver-docs own delete" on storage.objects
  for delete to authenticated using (bucket_id = 'driver-docs' and (storage.foldername(name))[1] = auth.uid()::text);
