-- 043 — a photo on /chain is not kept forever, and its sender can take it back.
--
-- Two gaps 042 left open, both of which matter more than usual because these are
-- photographs of people:
--   · nothing ever expired. A face sent through the chain sat in a public bucket
--     for good.
--   · anon may INSERT but not DELETE, so the one person with any moral claim on
--     the photo — whoever took it — was the one person who could not remove it.
--
-- The bucket cannot answer either question on its own: storage has no TTL, and the
-- object name travels inside the link, so knowing a name proves nothing about who
-- uploaded it. Both need a row, and that is all this table is.

create table if not exists public.chain_photos (
  name        text primary key,
  delete_key  text        not null,
  created_at  timestamptz not null default now()
);

comment on table  public.chain_photos is
  'One row per /chain photo. Holds the secret that lets its uploader delete it, and the clock that expires it.';
comment on column public.chain_photos.delete_key is
  'Minted in the uploader''s browser and kept only there (localStorage). Never in the link, never readable by anon — it is the only proof of authorship this page can have without accounts.';

create index if not exists chain_photos_created_at_idx on public.chain_photos (created_at);

alter table public.chain_photos enable row level security;

-- INSERT only, and only in the shape chain.html mints. No SELECT for anon: the
-- delete keys are the whole security of the delete path, so nothing may read them
-- back out. No UPDATE and no DELETE either — the edge function holds the service
-- role and is the only way a row leaves.
drop policy if exists "chain photos anon insert" on public.chain_photos;
create policy "chain photos anon insert" on public.chain_photos
  for insert to anon, authenticated
  with check (
    name ~ '^[A-Za-z0-9_-]{6,64}\.jpg$'
    and length(delete_key) between 16 and 128
  );

-- The nightly sweep. 90 days is long enough that a chain still moving is not cut
-- short, and short enough that a face does not sit in a public bucket for years.
-- The number lives here so it can be changed in one place and read by anyone.
create or replace function public.chain_photos_expired(max_age_days int default 90)
returns setof public.chain_photos
language sql stable as $$
  select * from public.chain_photos
   where created_at < now() - (max_age_days || ' days')::interval
$$;
