-- GiftWako Travel — Supabase schema
-- Paste into Supabase SQL Editor (Dashboard → SQL → New query) and run.

create table if not exists public.properties (
  id bigint generated always as identity primary key,
  name text not null,
  owner text,
  city text,
  province text,
  type text,
  stars smallint,
  rating numeric(2,1),
  price integer,
  status text default 'Pending' check (status in ('Live','Pending','Rejected','Suspended')),
  image text,
  reviews integer default 0,
  facilities text[],
  rooms jsonb,
  added date default current_date
);

create table if not exists public.owners (
  id bigint generated always as identity primary key,
  name text, company text, email text, phone text,
  properties integer default 0,
  bookings_30d integer default 0,
  revenue_30d integer default 0,
  commission_pct smallint default 15,
  status text default 'Pending' check (status in ('Active','Suspended','Pending')),
  joined date default current_date,
  docs text
);

create table if not exists public.customers (
  id bigint generated always as identity primary key,
  name text, email text unique, phone text,
  bookings integer default 0,
  spent integer default 0,
  status text default 'Active' check (status in ('Active','Suspended')),
  joined date default current_date,
  wishlist integer default 0,
  support integer default 0
);

create table if not exists public.bookings (
  id text primary key,             -- e.g. GW-8K4M2P
  guest text, email text,
  property text, room text,
  checkin date, checkout date,
  nights smallint, guests smallint,
  total integer,
  status text default 'Pending' check (status in ('Pending','Confirmed','Completed','Cancelled')),
  payment text default 'Pending' check (payment in ('Paid','Pending','Refunded','Partial')),
  created timestamptz default now()
);

create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  property text, customer text,
  rating smallint check (rating between 1 and 5),
  text text, date date default current_date,
  status text default 'Published' check (status in ('Published','Reported','Hidden'))
);

create table if not exists public.destinations (
  id bigint generated always as identity primary key,
  name text, province text, properties integer default 0,
  blurb text, featured boolean default false, visible boolean default true, image text
);

create table if not exists public.promotions (
  id bigint generated always as identity primary key,
  title text, description text, discount text,
  starts date, ends date, properties text,
  status text default 'Draft' check (status in ('Active','Scheduled','Expired','Draft')),
  featured boolean default false, image text
);

create table if not exists public.tickets (
  id text primary key,             -- e.g. SUP-1042
  subject text, customer text, category text,
  priority text default 'Normal' check (priority in ('Low','Normal','High')),
  submitted date default current_date,
  status text default 'Open' check (status in ('Open','In progress','Resolved'))
);

create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  type text, text text, time text, is_new boolean default true
);

-- ---------------- staff & operations ----------------

create table if not exists public.employees (
  id bigint generated always as identity primary key,
  code text unique, name text, title text, dept text,
  phone text, email text, location text,
  start_date date, employment text,
  status text default 'Active' check (status in ('Active','Probation','On leave','Suspended','Former')),
  manager text, experience text, emergency text, initials text
);

create table if not exists public.drivers (
  id bigint generated always as identity primary key,
  code text unique, name text, phone text, email text, area text,
  licence_cat text, licence_expiry date,
  prdp text, prdp_expiry date,
  years smallint, languages text[], vehicle text,
  status text default 'Available' check (status in ('Available','On trip','On leave','Unavailable','Suspended')),
  employ_status text default 'Active',
  emergency text, trips integer default 0, incidents integer default 0,
  docs jsonb
);

create table if not exists public.guides (
  id bigint generated always as identity primary key,
  code text unique, name text, phone text, email text,
  languages text[], expertise text, quals text,
  years smallint, destinations text[],
  status text default 'Available' check (status in ('Available','On tour','On leave','Suspended')),
  employ_status text default 'Active',
  tours integer default 0, rating numeric(2,1)
);

create table if not exists public.registrations (
  id bigint generated always as identity primary key,
  ref text unique, name text, position text, dept text,
  submitted date default current_date, email text, phone text,
  status text default 'New' check (status in ('New','Pending','Approved','Rejected','Incomplete','Suspended'))
);

create table if not exists public.vehicles (
  id bigint generated always as identity primary key,
  code text unique, reg text unique, make text, model text,
  cat text, seats smallint, year smallint,
  driver text, insurance date, licence_disc date, service date,
  status text default 'Available' check (status in ('Available','In use','Maintenance','Unavailable'))
);

create table if not exists public.assignments (
  id text primary key,             -- e.g. ASN-041
  trip text, booking_ref text, pickup text, dest text,
  date date, depart text, eta text,
  driver text, vehicle text, guide text,
  pax smallint, notes text,
  status text default 'Pending' check (status in ('Pending','Upcoming','Active','Completed','Cancelled','Unassigned'))
);

create table if not exists public.attendance (
  id bigint generated always as identity primary key,
  day date default current_date,
  staff text, shift text,
  check_in text, check_out text,
  status text check (status in ('Present','Absent','Late','Leave'))
);

create table if not exists public.staff_documents (
  id bigint generated always as identity primary key,
  staff text, type text, issued date, expires date,
  status text default 'Pending' check (status in ('Verified','Pending','Expiring','Expired')),
  notes text
);

create table if not exists public.leave_requests (
  id bigint generated always as identity primary key,
  staff text, type text, from_date date, to_date date, reason text,
  status text default 'Pending' check (status in ('Pending','Approved','Rejected'))
);

create table if not exists public.announcements (
  id bigint generated always as identity primary key,
  title text, body text, date text, audience text
);

-- ---------------- row level security ----------------
-- Demo/dev: allow anon read+write on all tables.
-- Tighten these policies before going to production!

alter table public.properties enable row level security;
alter table public.owners enable row level security;
alter table public.customers enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.destinations enable row level security;
alter table public.promotions enable row level security;
alter table public.tickets enable row level security;
alter table public.notifications enable row level security;
alter table public.employees enable row level security;
alter table public.drivers enable row level security;
alter table public.guides enable row level security;
alter table public.registrations enable row level security;
alter table public.vehicles enable row level security;
alter table public.assignments enable row level security;
alter table public.attendance enable row level security;
alter table public.staff_documents enable row level security;
alter table public.leave_requests enable row level security;
alter table public.announcements enable row level security;

do $$
declare t text;
begin
  foreach t in array array['properties','owners','customers','bookings','reviews','destinations','promotions','tickets','notifications','employees','drivers','guides','registrations','vehicles','assignments','attendance','staff_documents','leave_requests','announcements'] loop
    execute format('drop policy if exists "anon_all" on public.%I', t);
    execute format('create policy "anon_all" on public.%I for all using (true) with check (true)', t);
  end loop;
end $$;
