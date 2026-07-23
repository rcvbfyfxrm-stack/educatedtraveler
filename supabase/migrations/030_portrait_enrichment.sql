-- 030 — "Add to your portrait": the deeper options + a profile photo.
-- (028/029 were taken by parallel work; this is additive and non-conflicting.)
--
-- Members enrich their portrait after joining: a budget for a week, the
-- preferences that get them the best week, and a photo. Everything is optional
-- and saves onto their own profile row (owner-scoped RLS already governs it).
-- Apply: supabase db query --linked --yes -f supabase/migrations/030_portrait_enrichment.sql

-- 1) columns (avatar_url already exists from 005) --------------------------
alter table public.profiles add column if not exists budget text;
alter table public.profiles add column if not exists preferences jsonb;

-- 2) the avatars storage bucket -------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- 3) storage RLS: public read; each member writes ONLY their own folder ----
--    path convention: avatars/<user_id>/<file>
drop policy if exists "avatars public read"   on storage.objects;
drop policy if exists "avatars owner insert"  on storage.objects;
drop policy if exists "avatars owner update"  on storage.objects;
drop policy if exists "avatars owner delete"  on storage.objects;

create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars owner insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars owner update" on storage.objects
  for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars owner delete" on storage.objects
  for delete using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );
