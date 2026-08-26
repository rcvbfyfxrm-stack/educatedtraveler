-- 042 — the chain's photo bucket.
--
-- /chain asks for a photo and will not go past the first screen without one, so this
-- is not optional plumbing: until the bucket exists, every visitor is stopped at
-- "The photo would not upload just now" and the page cannot be used at all.
-- Apply: supabase db query --linked --yes -f supabase/migrations/042_chain_faces_bucket.sql

-- 1) the bucket ------------------------------------------------------------
-- Public READ, because the whole point is that a link handed to one person opens the
-- photo in their browser with no account and no sign-in.
--
-- Two objects per photo: <id>.jpg and <id>-seal.jpg, the second a 32px thumbnail. The
-- sealed card in the page loads only the seal, so a recipient who has not answered yet
-- has nothing better than 32px in their browser. Both live at the top level, no folders.
--
-- The size and type limits are set HERE, on the bucket, because this is the only place
-- storage enforces them. chain.html shrinks to 1400px JPEG before uploading, but the
-- page is not the boundary: the anon key is visible in it, and anyone can call the same
-- endpoint directly. 2 MB is comfortably above what a 1400px JPEG comes to.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chain-faces', 'chain-faces', true, 2097152, array['image/jpeg'])
on conflict (id) do update
  set public             = true,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2) storage RLS -----------------------------------------------------------
-- INSERT only, and only on a name this page could have minted: the same shape as
-- SAFE_PHOTO in chain.html, with room for the -seal suffix. The pattern forbids "/",
-- so nothing can be written into a folder either.
--
-- Both roles, because a signed-in member on /chain carries the authenticated role and
-- would otherwise be the one visitor who cannot send a photo.
--
-- There is deliberately NO select policy. A public bucket serves an object to anyone
-- holding its URL without one; what a select policy would add is the right to LIST the
-- bucket — and a list of every face that has ever been sent through the chain is the
-- one thing this design must never hand out. No update and no delete either: a photo
-- that has gone out inside a link cannot be swapped for a different one afterwards.
--
-- What this does NOT do is rate-limit. Anonymous INSERT with a public key is a
-- write endpoint, and the ceiling on it is 2 MB per object and nothing else. If the
-- bucket is ever found filling with junk, the fix is an edge function issuing signed
-- upload URLs, not a tighter policy here.
-- ⚠ The bucket was created by hand before this migration existed, and that hand-made
-- setup carried a public SELECT policy. On a fresh project there is nothing to drop and
-- this is a no-op; on THIS project it is the whole point of the file. Verified on prod
-- 2026-08-26: "chain faces public read" was present, and with it the anon key in the
-- page could list every object in the bucket — every face ever sent through the chain,
-- to anyone who asked, with no link. The public URL keeps working without it: a public
-- bucket serves an object to whoever holds its URL, and a select policy only ever added
-- the right to enumerate.
drop policy if exists "chain faces public read" on storage.objects;

drop policy if exists "chain faces anon insert" on storage.objects;

create policy "chain faces anon insert" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'chain-faces'
    and name ~ '^[A-Za-z0-9_-]{6,64}(-seal)?\.jpg$'
  );
