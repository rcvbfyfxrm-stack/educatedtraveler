-- 047: a folded duplicate must still reach Arnaud.
--
-- THE BUG THIS CLOSES (found 5 Sept 2026, the first run of THE CHECK).
-- 036's dedupe is BEFORE INSERT and ends in `return null` to swallow a second
-- row for an address already on the list. A BEFORE trigger that returns NULL
-- cancels the INSERT, and a cancelled INSERT fires NO AFTER INSERT trigger.
-- So for anyone already on the list — every founding-import row, every past
-- writer, every member — the following all happened silently:
--
--   · /pay        a seat payment left no `pay:` row, so notify-lead never fired,
--                 no seat_token was minted, no confirm link ever reached Arnaud,
--                 seat-confirm could never run, and the chef never received the
--                 "your €350 arrived" note. Money in, nothing out.
--   · /you        a member's note was folded into their old row and nothing told
--                 him it existed, while the page said "I read every one myself,
--                 and I answer."
--   · craft sheets, /lab-weeks, /teach, /chain — same, for any listed address
--                 whose account probe came back "not a member".
--
-- The fold itself is right: one person, one row. What was wrong is that folding
-- was silent. So the fold now posts the SAME webhook the AFTER INSERT trigger
-- would have posted, pointing at the row that absorbed the answers. notify-lead
-- re-fetches by id and mails the full sheet, so Arnaud sees the new words.
--
-- Deliberately NOT changed:
--   · circle-welcome is not called here. A folded row belongs to someone who is
--     already on the list; welcoming them again is the thing `is_carrier` and
--     the welcomed_at check exist to prevent.
--   · `unsubscribed` is still untouched by a fold (036's reasoning holds:
--     filling in a form again is not consent to undo an opt-out).
--
-- Apply (migrations are NOT auto-applied to prod):
--   supabase link --project-ref exaehwaqwcledemwpluw
--   supabase db query --linked --yes --dns-resolver https \
--     -f supabase/migrations/047_dedupe_still_notifies.sql
-- Then prove it, don't assume it — insert a second row for an address already
-- on the list and check net._http_response for a 200 from notify-lead.

create or replace function public.launch_waitlist_dedupe()
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

  -- THE FIX: tell him. Same webhook, same shape, pointing at the row that now
  -- holds the words. Async and swallowed, exactly like 024 — a notify failure
  -- must never cost a person their answers.
  begin
    perform net.http_post(
      url := 'https://exaehwaqwcledemwpluw.supabase.co/functions/v1/notify-lead',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'type', 'INSERT',
        'table', 'launch_waitlist',
        'schema', 'public',
        'record', jsonb_build_object('id', existing.id)
      ),
      timeout_milliseconds := 5500
    );
  exception when others then
    null;
  end;

  return null;  -- still swallow the duplicate row; the answers live on the old one
end;
$$;

-- The trigger itself is unchanged (036 created it); this only replaces the body.
