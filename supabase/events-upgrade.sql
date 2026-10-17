-- Event booking upgrade — run in Supabase SQL Editor

alter table public.events
  add column if not exists featuring text,
  add column if not exists venue text,
  add column if not exists presented_by text,
  add column if not exists routes jsonb not null default '[]'::jsonb;

-- routes = [{ "name": "Bolobedu Matipane", "price": 850, "note": "" }, ...]
-- price = per person; note optional (e.g. "Car service" for shuttle-style options)
-- the existing `price` column is the general-admission ticket price
