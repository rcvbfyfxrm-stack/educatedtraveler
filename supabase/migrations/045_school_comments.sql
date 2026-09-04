-- 045 — a comment on a school, from whoever actually went.
--
-- 044 built `vouches` for a signed-in member: craft, place, trade, date, route,
-- the lot. It has never been used once. The reason is where it lives — on /you,
-- behind a sign-in, found only by someone already looking at their own account
-- page. The person who has something to say about a school is standing on that
-- school's page, and usually has no account at all.
--
-- So the same table now takes a lighter row from an anonymous writer, submitted
-- from the school itself. Same moderation, same pending gate, one queue to read.
-- The member's structured form keeps filling every column it always did.
--
-- The address is asked AFTER the comment is written and arrives in the same
-- insert — the order is a matter of how it FEELS to the person writing, and the
-- doctrine in intent-capture.js is explicit that a page asking who you are before
-- you have said anything is a form, not a note.

alter table public.vouches alter column user_id      drop not null;
alter table public.vouches alter column trade        drop not null;
alter table public.vouches alter column visited_on   drop not null;
alter table public.vouches alter column route        drop not null;
alter table public.vouches alter column state        drop not null;
alter table public.vouches alter column display_name drop not null;

alter table public.vouches add column if not exists school       text;
alter table public.vouches add column if not exists email        text;
alter table public.vouches add column if not exists wants_circle boolean not null default false;

-- An anonymous row must be exactly that: no user_id borrowed from someone else,
-- pending like every other, undecided, and long enough to be worth reading. The
-- length floor is the cheapest spam filter there is and it doubles as a quality
-- bar — "great place!!" is not evidence anybody can use.
create policy "vouches_insert_anon" on public.vouches
    for insert to anon
    with check (
        user_id is null
        and status = 'pending'
        and decided_by is null
        and decided_at is null
        and school is not null
        and char_length(what) between 40 and 2000
        and char_length(coalesce(display_name, '')) <= 60
        and char_length(coalesce(email, '')) <= 254
    );

-- The same door for a signed-in member writing from a school page rather than
-- from /you: their row carries their id, so `vouches_insert_own` already covers
-- it — nothing to add.

-- What the world may read back: an approved comment whose writer said it could
-- be public. Nothing else. `status` and `consent_public` are both in the USING
-- clause on purpose — either one alone would leak the wrong rows.
create policy "vouches_select_public" on public.vouches
    for select to anon, authenticated
    using (status = 'approved' and consent_public = true);

-- One comment per address per school. Someone with something more to say can
-- write to Arnaud; an open write path that lets one person post fifty times on
-- the same school is not a comment box, it is a billboard.
create unique index if not exists vouches_one_per_school_email
    on public.vouches (school, lower(email))
    where email is not null and school is not null;

comment on column public.vouches.school is
    'The school this comment is about. Null for a 044-era member vouch, which is keyed to the destination as a whole.';
comment on column public.vouches.email is
    'Asked AFTER the comment is written, in a dialog. Null when a signed-in member wrote it — their address is on their account.';
