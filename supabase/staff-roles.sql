-- Staff role assignments — run in Supabase SQL Editor

create table if not exists public.staff_roles (
  id bigint generated always as identity primary key,
  email text not null,
  role text not null,
  department text not null,
  created_at timestamptz not null default now()
);

alter table public.staff_roles enable row level security;

drop policy if exists "staff_roles anon" on public.staff_roles;
create policy "staff_roles anon" on public.staff_roles
  for all to anon using (true) with check (true);
