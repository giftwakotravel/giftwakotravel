-- Booking flow — packages, transport rates, service bookings, public vehicle view
-- Run in Supabase SQL Editor AFTER driver-portal.sql.

-- ---------------------------------------------------------------- packages (tours, getaways, complete trips, groups)
create table if not exists public.packages (
  id bigint generated always as identity primary key,
  slug text unique not null,
  category text not null check (category in ('tours','getaways','complete','groups')),
  title text not null,
  subtitle text,                                  -- e.g. "1 night · Hartbeespoort & Sun City"
  description text,
  image text, image_alt text,
  destination text, province text,
  pickup_towns text[] not null default '{}',
  duration_days integer not null default 1,
  nights integer not null default 0,
  price_from integer,                             -- ZAR per person, null = on request
  price_rows jsonb not null default '[]',         -- [{label, price, note}]
  includes text[] not null default '{}',
  dates date[] not null default '{}',             -- scheduled departure dates; empty = on request / any date
  seats integer,                                  -- per departure; null = unlimited
  deposit integer,
  note text,
  featured boolean not null default false,
  status text not null default 'Active' check (status in ('Active','Draft','Archived')),
  sort integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists packages_touch on public.packages;
create trigger packages_touch before update on public.packages
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- transport rates (per vehicle type, set by admin)
create table if not exists public.transport_rates (
  vehicle_type text primary key,                  -- matches driver_vehicles.vehicle_type
  per_km numeric(10,2),
  per_day numeric(10,2),
  min_charge numeric(10,2),
  description text,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.transport_rates (vehicle_type, per_km, per_day, min_charge) values
  ('Sedan', 12, 1500, 350), ('Hatchback', 11, 1400, 350), ('SUV', 15, 2000, 450),
  ('Bakkie', 14, 1800, 400), ('Minibus', 18, 2800, 600), ('Minibus Taxi', 16, 2500, 550),
  ('Coaster', 24, 4200, 900), ('Bus', 32, 6500, 1500), ('Luxury Vehicle', 25, 4000, 900), ('Other', null, null, null)
on conflict (vehicle_type) do nothing;

-- ---------------------------------------------------------------- service bookings (all services; payment columns ready for later)
create table if not exists public.service_bookings (
  id bigint generated always as identity primary key,
  ref text unique not null,                       -- e.g. GW-TR-8K4M2P
  service text not null check (service in ('transport','accommodation','events','tours','getaways','complete','groups','airways')),
  item_id bigint,                                 -- vehicle id / property id / event id / package id
  item_title text,
  -- what was booked
  date_from date, date_to date,
  pax integer not null default 1,
  pickup text, dropoff text, notes text,
  selection jsonb not null default '{}',          -- room, ticket type, route, package date, event_id for event transport, etc.
  -- who
  customer_name text not null, customer_email text, customer_phone text not null,
  contact_method text default 'WhatsApp',
  -- money (quote now, payment later)
  currency text not null default 'ZAR',
  quoted_total numeric(10,2),
  deposit_due numeric(10,2),
  amount_paid numeric(10,2) not null default 0,
  payment_status text not null default 'Unpaid' check (payment_status in ('Unpaid','Deposit paid','Paid','Refunded')),
  payment_provider text, payment_ref text, paid_at timestamptz,
  -- lifecycle
  status text not null default 'Pending' check (status in ('Pending','Confirmed','Completed','Cancelled','Declined')),
  assigned_driver uuid references auth.users(id) on delete set null,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists service_bookings_item on public.service_bookings(service, item_id, date_from, date_to);
create index if not exists service_bookings_status on public.service_bookings(status, created_at desc);
drop trigger if exists service_bookings_touch on public.service_bookings;
create trigger service_bookings_touch before update on public.service_bookings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- public view of bookable vehicles (safe columns only)
-- Only vehicles that are approved AND belong to an approved driver. Runs as owner, so anon never touches driver tables directly.
create or replace view public.bookable_vehicles as
  select v.id, v.make, v.model, v.year, v.colour, v.vehicle_type, v.capacity, v.aircon, v.luggage, v.fuel_type,
         v.photo_urls, v.user_id as driver_id,
         p.town as driver_town, p.province as driver_province, p.operating_province, p.towns_served,
         r.per_km, r.per_day, r.min_charge
  from public.driver_vehicles v
  join public.driver_profiles p on p.user_id = v.user_id and p.status = 'Approved'
  left join public.transport_rates r on r.vehicle_type = v.vehicle_type and r.active
  where v.status = 'Approved';
grant select on public.bookable_vehicles to anon, authenticated;

-- Days a driver is already committed (used to exclude vehicles for the requested dates)
create or replace view public.driver_busy_dates as
  select user_id as driver_id, trip_date as busy_on from public.driver_trips
   where status not in ('Cancelled','Completed') and trip_date is not null
  union all
  select assigned_driver, d::date from public.service_bookings b,
        generate_series(b.date_from, coalesce(b.date_to, b.date_from), interval '1 day') d
   where b.assigned_driver is not null and b.status in ('Pending','Confirmed');
grant select on public.driver_busy_dates to anon, authenticated;

-- ---------------------------------------------------------------- RLS
alter table public.packages         enable row level security;
alter table public.transport_rates  enable row level security;
alter table public.service_bookings enable row level security;

drop policy if exists "packages public read" on public.packages;
create policy "packages public read" on public.packages for select using (status = 'Active');
drop policy if exists "packages admin anon" on public.packages;
create policy "packages admin anon" on public.packages for all to anon using (true) with check (true);

drop policy if exists "rates public read" on public.transport_rates;
create policy "rates public read" on public.transport_rates for select using (true);
drop policy if exists "rates admin anon" on public.transport_rates;
create policy "rates admin anon" on public.transport_rates for all to anon using (true) with check (true);

-- Customers (anon) may create bookings and read bookings only for availability checks via the view below;
-- the admin dashboard (anon) manages them. Tighten once admin auth exists.
drop policy if exists "bookings admin anon" on public.service_bookings;
create policy "bookings admin anon" on public.service_bookings for all to anon using (true) with check (true);
drop policy if exists "bookings driver sees assigned" on public.service_bookings;
create policy "bookings driver sees assigned" on public.service_bookings
  for select to authenticated using (assigned_driver = auth.uid());

-- Minimal occupancy view so availability checks need no customer data
create or replace view public.booked_slots as
  select service, item_id, date_from, coalesce(date_to, date_from) as date_to, pax, selection
  from public.service_bookings where status in ('Pending','Confirmed');
grant select on public.booked_slots to anon, authenticated;
