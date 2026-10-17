-- Event system upgrade v2 — 8-section event creation
-- Run in Supabase SQL Editor

alter table public.events
  add column if not exists category text,
  add column if not exists short_desc text,
  add column if not exists organiser text,
  add column if not exists end_date date,
  add column if not exists doors_time text,
  add column if not exists start_time text,
  add column if not exists end_time text,
  add column if not exists booking_opens date,
  add column if not exists booking_closes date,
  add column if not exists province text,
  add column if not exists street text,
  add column if not exists maps_url text,
  add column if not exists venue_contact text,
  add column if not exists tickets jsonb not null default '[]'::jsonb,
  add column if not exists sales_start date,
  add column if not exists sales_end date,
  add column if not exists max_per_customer integer,
  add column if not exists ticket_source text,
  add column if not exists transport_offered boolean default false,
  add column if not exists gallery jsonb not null default '[]'::jsonb,
  add column if not exists video_url text,
  add column if not exists featured boolean default false,
  add column if not exists badge text,
  add column if not exists bookings_enabled boolean default true,
  add column if not exists allow_ticket_only boolean default true,
  add column if not exists allow_transport_only boolean default true,
  add column if not exists allow_ticket_transport boolean default true,
  add column if not exists max_pax integer default 8,
  add column if not exists confirm_method text,
  add column if not exists whatsapp_number text,
  add column if not exists cancellation_policy text,
  add column if not exists terms text,
  add column if not exists status text not null default 'draft';

-- tickets  = [{ "type": "General Admission", "price": 150, "quantity": 500 }]
-- routes   = [{ "name": "Bolobedu Matipane", "pickup": "Taxi rank", "time": "07:00",
--               "return": true, "transport_type": "Minibus", "price": 850,
--               "seats": 60, "provider": "GiftWako", "status": "Active" }]
-- gallery  = ["url1", "url2"]
-- status   = 'draft' | 'published'

-- existing visible events become published
update public.events set status = 'published' where visible = true;
