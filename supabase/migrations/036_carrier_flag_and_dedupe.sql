-- 036 — two root causes behind a day of wrong answers about real people.
--
-- (1) `unsubscribed` carried two unrelated meanings: "this person opted out",
--     and "this row is a trigger-silent DATA CARRIER, not an audience row"
--     (portrait continuations, the /hello depth row). Reading one as the other
--     produced a wrong answer for Arnaud, a wrong fix from me, and a live
--     regression that would have dropped everyone who completed /portrait.
--     `is_carrier` now says the second thing, and `unsubscribed` only the first.
--
-- (2) Nothing deduped on write. The same address arrived via founding import,
--     then /circle, then /pay — 41 rows for 30 people, plus 7 test rows from a
--     single /pay run. Every count was wrong, and per-person claims were read
--     off whichever row was found first. The client cannot check before
--     inserting (anon may INSERT, only admins may SELECT), so this has to be
--     enforced in the database.

-- ── 1. the carrier flag ──────────────────────────────────────────────────────
alter table launch_waitlist
  add column if not exists is_carrier boolean not null default false;

update launch_waitlist
   set is_carrier = true
 where source in ('portrait-questionnaire', 'portrait-continuation', 'qr-hello-depth')
   and not is_carrier;

-- Those rows were only ever flagged unsubscribed to keep them out of the
-- audience. is_carrier does that job now, so the opt-out flag goes back to
-- meaning exactly one thing.
update launch_waitlist
   set unsubscribed = false
 where is_carrier and unsubscribed;

comment on column launch_waitlist.is_carrier is
  'Trigger-silent data row (portrait continuation, /hello depth). Never an audience row, never a recipient. NOT an opt-out — that is `unsubscribed`, and the two must never be conflated again.';

-- ── 2. dedupe on write ───────────────────────────────────────────────────────
create or replace function launch_waitlist_dedupe()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing launch_waitlist%rowtype;
begin
  -- Normalise first, so this holds for pages still sending the old shape.
  if new.source in ('portrait-questionnaire', 'portrait-continuation', 'qr-hello-depth') then
    new.is_carrier  := true;
    new.unsubscribed := false;
  end if;

  -- Carriers are meant to be separate rows; /portrait claims them later.
  if new.is_carrier then
    return new;
  end if;

  select * into existing
    from launch_waitlist
   where lower(email) = lower(new.email)
     and not is_carrier
   order by created_at
   limit 1;

  if not found then
    return new;
  end if;

  -- Fold the new answers into the row that already exists. Union, never
  -- replace: a second visit that skipped a question must not erase the first
  -- answer. Later entries win for scalar fields because the readers take the
  -- last occurrence.
  update launch_waitlist
     set interests   = coalesce(existing.interests, '[]'::jsonb) || coalesce(new.interests, '[]'::jsonb),
         welcomed_at = coalesce(existing.welcomed_at, new.welcomed_at),
         last_issue  = coalesce(existing.last_issue, new.last_issue)
   where id = existing.id;

  -- unsubscribed is deliberately untouched: signing up again through a form is
  -- not consent to undo an opt-out. Clearing it is a human decision.

  return null;  -- swallow the duplicate
end;
$$;

drop trigger if exists trg_launch_waitlist_dedupe on launch_waitlist;
create trigger trg_launch_waitlist_dedupe
  before insert on launch_waitlist
  for each row execute function launch_waitlist_dedupe();
