-- Supabase Storage — public "media" bucket for event/property images
-- Run in Supabase SQL Editor

-- create the bucket (public read access)
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- anyone can read images
drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects
  for select using (bucket_id = 'media');

-- allow uploads (tighten to admin-only when auth is implemented)
drop policy if exists "media anon upload" on storage.objects;
create policy "media anon upload" on storage.objects
  for insert with check (bucket_id = 'media');

drop policy if exists "media anon update" on storage.objects;
create policy "media anon update" on storage.objects
  for update using (bucket_id = 'media');

drop policy if exists "media anon delete" on storage.objects;
create policy "media anon delete" on storage.objects
  for delete using (bucket_id = 'media');
