-- 044_vouches.sql — a chef who stood in the room can sign for it.
--
-- Rule 10 of the Standard: "who checked this, what they actually did, and when.
-- No house voice. If nobody will put their name on it, it does not go up."
-- Until now the only way to add a check was to hand-edit data/repertoire.js, so
-- 1 of 384 places carried one. This is the door for the people who actually went.
--
-- THE SHAPE OF THE HONESTY HERE:
--   * A member submits; a member can never publish. status starts 'pending' and
--     the RLS WITH CHECK forbids inserting anything else — self-approval is not
--     a policy question, it is impossible.
--   * The witness carries their TRADE, not their membership. "Kate M., yacht
--     chef" is weighable by another yacht chef; "a Circle member" is not
--     evidence of anything (Arnaud, 2 Sept 2026).
--   * route is on the vouch itself, because ET sells one of these weeks and the
--     interest belongs at the point of the judgement, never in a log.
--   * consent_public is explicit and separate from submitting. Sending us your
--     account of a week is not the same act as agreeing it goes on a public page
--     under your name.
--   * display_name is first name + last initial by convention. Never a full
--     name, never an employer, never a boat.

create table if not exists public.vouches (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,

  craft          text not null,          -- Atlas discipline id
  destination    text not null,          -- Atlas destination id

  -- Only the two forms a visitor can honestly claim. "a named person vouched"
  -- is what WE write when somebody else vouches to us; it is not self-assignable.
  state          text not null check (state in ('stood in it', 'checked it')),

  display_name   text not null check (length(btrim(display_name)) between 2 and 40),
  trade          text not null check (length(btrim(trade)) between 2 and 60),
  visited_on     date not null check (visited_on <= current_date),
  route          text not null check (route in ('with-us', 'direct')),
  what           text not null check (length(btrim(what)) between 40 and 1200),

  consent_public boolean not null default false,

  status         text not null default 'pending'
                   check (status in ('pending', 'approved', 'declined')),
  decided_by     uuid references auth.users(id),
  decided_at     timestamptz,
  decline_reason text,

  created_at     timestamptz not null default now()
);

-- One person, one place. A second visit is an edit we make by hand, not a second row.
create unique index if not exists vouches_one_per_place
  on public.vouches (user_id, destination);

create index if not exists vouches_pending on public.vouches (status, created_at desc);

alter table public.vouches enable row level security;

-- Submit: only as yourself, only pending, only undecided.
drop policy if exists vouches_insert_own on public.vouches;
create policy vouches_insert_own on public.vouches
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and decided_by is null and decided_at is null
  );

-- Read your own, always. Read everything, only as an admin.
drop policy if exists vouches_select_own on public.vouches;
create policy vouches_select_own on public.vouches
  for select to authenticated using (user_id = auth.uid());

drop policy if exists vouches_select_admin on public.vouches;
create policy vouches_select_admin on public.vouches
  for select to authenticated using (public.is_admin());

-- Decide: admins only. Nobody edits a vouch's words after it is submitted —
-- a testimony you can revise on request is not a testimony.
drop policy if exists vouches_update_admin on public.vouches;
create policy vouches_update_admin on public.vouches
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.vouches from anon;
grant select, insert on public.vouches to authenticated;
grant update on public.vouches to authenticated;  -- narrowed by the admin policy above

-- ── Arnaud hears about it, per checklist #1: a form that only saves is a silent
-- failure waiting to be found by a hurt friend. Async, and never blocks the write.
create or replace function public.notify_on_vouch() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url     := 'https://exaehwaqwcledemwpluw.supabase.co/functions/v1/notify-vouch',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body    := jsonb_build_object('id', NEW.id)
  );
  return NEW;
exception when others then
  return NEW;
end $$;

drop trigger if exists on_vouch_notify on public.vouches;
create trigger on_vouch_notify after insert on public.vouches
  for each row execute function public.notify_on_vouch();
