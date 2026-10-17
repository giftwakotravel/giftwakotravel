-- Events / featured trips — run in Supabase SQL Editor

create table if not exists public.events (
  id bigint generated always as identity primary key,
  title text not null,
  location text,
  event_date date,
  price integer,
  image text,
  description text,
  visible boolean default true,
  created_at timestamptz default now()
);

-- if the table already existed, make sure the defaults are right
alter table public.events alter column visible set default true;
update public.events set visible = true where visible is null;

alter table public.events enable row level security;
drop policy if exists "anon_all" on public.events;
create policy "anon_all" on public.events for all using (true) with check (true);
