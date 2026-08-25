-- 042 — storage for /chain "thinking face" photos.
--
-- WHAT IS ACTUALLY STORED HERE IS CIPHERTEXT, NOT A PHOTO.
-- The page encrypts the image in the browser (AES-GCM-256) and puts the key in the
-- LINK FRAGMENT (#k=...). Fragments are never sent to a server, so the key never
-- reaches Supabase, this bucket, a log, or Arnaud. Only someone holding the whole
-- link can decrypt. That is what makes "only the friend you sent it to can see it"
-- a true statement rather than an approximation.
--
-- Consequences to keep in mind:
--   · public read is SAFE here precisely because the bytes are meaningless without
--     the key. Do NOT start storing plain images in this bucket.
--   · nobody can recover a face, including us. There is no admin view. That is the point.
--   · mime is locked to application/octet-stream so an image can't be stored raw by
--     mistake and quietly become world-readable.
--
-- Anon may INSERT only. No anon UPDATE and no anon DELETE, so a guessed object name
-- cannot be overwritten or removed by a stranger.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chain-faces', 'chain-faces', true, 1048576, array['application/octet-stream'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "chain faces public read" on storage.objects;
create policy "chain faces public read"
  on storage.objects for select
  to public
  using (bucket_id = 'chain-faces');

drop policy if exists "chain faces anon insert" on storage.objects;
create policy "chain faces anon insert"
  on storage.objects for insert
  to public
  with check (bucket_id = 'chain-faces');

-- Retention. Without this there is no DELETE policy at all, so nothing in this bucket
-- could EVER be removed — not by a stranger, but not by us either, and the ciphertext
-- would pile up forever. Restricted to service_role and postgres, so a purge is a
-- deliberate admin act and never something a visitor can trigger.
drop policy if exists "chain faces admin delete" on storage.objects;
create policy "chain faces admin delete"
  on storage.objects for delete
  to service_role, postgres
  using (bucket_id = 'chain-faces');

-- ⚠ PURGE VIA THE STORAGE API, NOT SQL. Deleting from storage.objects removes the row
-- but leaves the blob in the backing store, so the bytes survive a "successful" delete.
-- Retention is owed and not yet automated; today it is a manual admin step:
--   list:   POST /storage/v1/object/list/chain-faces   {"prefix":"","limit":1000}
--   delete: DELETE /storage/v1/object/chain-faces      {"prefixes":[…]}
-- both with the service_role key. Faces are unreadable to us in any case — once the link
-- is gone the ciphertext is noise — so this is housekeeping, not an exposure.
