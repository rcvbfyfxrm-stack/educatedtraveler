-- =====================================================
-- 029: THE CIRCLE → PORTRAIT HANDOFF
-- =====================================================
-- /circle captures the lead into launch_waitlist with no account (that
-- stays the front door — magic-link flows shed people). When that person
-- later gets an account — the portrait continuation's magic link, or any
-- later sign-in — their waitlist answers move onto their profile, so
-- /portrait opens already filled and never asks the same question twice.
--
--   1. copy_waitlist_to_profile(id, email): fill-the-gaps copy across ALL
--      waitlist rows for that email, newest first. It never overwrites a
--      value the profile already has, and it sends no email
--      (notify-portrait is client-invoked only; the 001 profile-insert
--      webhook is retired).
--   2. handle_new_user (from 012): still creates the profile row on
--      sign-up, then runs the copy. The copy can never block a sign-up.
--   3. The continuation's two extra answers (profession + what-brought-you)
--      ride a second waitlist row with source='portrait-continuation', so
--      they survive the magic link opening in a different browser (in-app
--      email webviews). The notify-lead and circle-welcome triggers SKIP
--      that source — Arnaud already got the full sheet from the original
--      insert seconds earlier, and the joiner must not be welcomed twice.
--   4. Backfill: run the copy once for every existing account that also
--      has a waitlist row.
--
-- Waitlist `interests` shapes seen in prod (parse defensively, lose
-- nothing): array of kind-objects (circle-questionnaire), array of plain
-- strings (homepage/orb), or an already-categorized object (old profiles).
-- Anything unrecognized is simply left where it lives — in the waitlist
-- row and Arnaud's notify-lead sheet.
--
-- The intent slugs become the same visible labels /portrait writes
-- (answer() labels, curly apostrophes included) so a value round-trips
-- identically whichever page wrote it first.
-- =====================================================

create or replace function public.copy_waitlist_to_profile(p_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ints jsonb;
  v_el jsonb;
  v_key text;
  v_first text; v_region text; v_dream text;
  v_timing text; v_length text; v_depth text; v_reach text;
  v_prof text; v_status text;
  v_interests jsonb := '{}'::jsonb;
  v_cat text; v_disc text;
begin
  if p_id is null or p_email is null then return; end if;

  -- newest row first: on a conflict the most recent answer wins,
  -- and every row (original signup, portrait continuation, older
  -- signups from other surfaces) contributes what the others lack.
  for v_ints in
    select interests from public.launch_waitlist
    where lower(email) = lower(p_email)
    order by created_at desc
  loop
    if v_ints is null then continue; end if;

    if jsonb_typeof(v_ints) = 'object' then
      -- already categorized (old-profile shape) — merge key by key
      for v_key in select jsonb_object_keys(v_ints) loop
        if jsonb_typeof(v_ints->v_key) = 'array' then
          for v_el in select * from jsonb_array_elements(v_ints->v_key) loop
            if jsonb_typeof(v_el) = 'string' then
              v_disc := nullif(trim(both '"' from v_el::text), '');
              if v_disc is not null
                 and not (coalesce(v_interests->v_key, '[]'::jsonb) @> to_jsonb(v_disc)) then
                v_interests := jsonb_set(v_interests, array[v_key],
                                         coalesce(v_interests->v_key, '[]'::jsonb) || to_jsonb(v_disc));
              end if;
            end if;
          end loop;
        end if;
      end loop;

    elsif jsonb_typeof(v_ints) = 'array' then
      for v_el in select * from jsonb_array_elements(v_ints) loop
        if jsonb_typeof(v_el) = 'object' then
          case v_el->>'kind'
            when 'profile' then
              v_first  := coalesce(v_first,  nullif(trim(v_el->>'name'), ''));
              v_region := coalesce(v_region, nullif(trim(v_el->>'region'), ''));
            when 'discipline' then
              v_disc := coalesce(nullif(trim(v_el->>'discipline'), ''), nullif(trim(v_el->>'open'), ''));
              if v_disc is not null then
                v_cat := case
                  when v_disc in ('Freediving','Scuba Diving','Spearfishing','Sailing & Yachtmaster',
                                  'Surfing','Kitesurfing','Whitewater Kayaking') then 'ocean'
                  when v_el->>'world' = 'The Wild'         then 'adventure'
                  when v_el->>'world' = 'Kitchen & Cellar' then 'culinary'
                  when v_el->>'world' = 'Body & Spirit'    then 'wellness'
                  else 'creative'
                end;
                if not (coalesce(v_interests->v_cat, '[]'::jsonb) @> to_jsonb(v_disc)) then
                  v_interests := jsonb_set(v_interests, array[v_cat],
                                           coalesce(v_interests->v_cat, '[]'::jsonb) || to_jsonb(v_disc));
                end if;
              end if;
            when 'intent' then
              v_timing := coalesce(v_timing, nullif(v_el->>'timing', ''));
              v_length := coalesce(v_length, nullif(v_el->>'length', ''));
              v_depth  := coalesce(v_depth,  nullif(v_el->>'depth', ''));
              v_reach  := coalesce(v_reach,  nullif(v_el->>'reach', ''));
            when 'dream' then
              v_dream := coalesce(v_dream, nullif(trim(v_el->>'text'), ''));
            when 'portrait-extras' then
              -- the continuation's two answers; lifestage arrives as the
              -- final answer text (own words already won client-side)
              v_prof   := coalesce(v_prof,   nullif(trim(v_el->>'prof'), ''));
              v_status := coalesce(v_status, nullif(trim(v_el->>'lifestage'), ''));
            else
              null;  -- mastery + future kinds: no profile column; stays in the waitlist sheet
          end case;
        elsif jsonb_typeof(v_el) = 'string' then
          -- legacy bare craft name (homepage/orb) — keep it; best-effort category
          v_disc := nullif(trim(both '"' from v_el::text), '');
          if v_disc is not null then
            v_cat := case
              when v_disc in ('Freediving','Scuba Diving','Spearfishing','Sailing & Yachtmaster',
                              'Surfing','Kitesurfing','Whitewater Kayaking') then 'ocean'
              else 'creative'
            end;
            if not (coalesce(v_interests->v_cat, '[]'::jsonb) @> to_jsonb(v_disc)) then
              v_interests := jsonb_set(v_interests, array[v_cat],
                                       coalesce(v_interests->v_cat, '[]'::jsonb) || to_jsonb(v_disc));
            end if;
          end if;
        end if;
      end loop;
    end if;
  end loop;

  -- slugs → the exact labels the pages show (and /portrait stores)
  v_timing := case v_timing
    when 'ready-now' then 'I''m ready now'       when 'this-year' then 'This year'
    when 'next-year' then 'Next year'            when 'someday'   then 'Someday — I’m dreaming'
    else v_timing end;
  v_length := case v_length
    when 'weekend' then 'A weekend'              when 'most-week' then 'Most of a week'
    when 'full-week' then 'A full week or more'  when 'open'      then 'As long as it takes'
    else v_length end;
  v_depth := case v_depth
    when 'beginner' then 'Total beginner'        when 'dabbled'   then 'I’ve dabbled'
    when 'deeper' then 'I practice — want to go deeper'
    when 'mastery' then 'Serious — chasing mastery'
    else v_depth end;
  v_reach := case v_reach
    when 'close' then 'Close to home'            when 'region'    then 'My region / a short hop'
    when 'world' then 'Across the world for the right one'
    else v_reach end;

  update public.profiles p set
    first_name          = coalesce(p.first_name, v_first),
    location            = coalesce(p.location, v_region),
    profession          = coalesce(p.profession, v_prof),
    status              = coalesce(p.status, v_status),
    availability        = coalesce(p.availability, v_timing),
    preferred_duration  = coalesce(p.preferred_duration, v_length),
    previous_experience = coalesce(p.previous_experience, v_depth),
    reach               = coalesce(p.reach, v_reach),
    dream_letter        = coalesce(p.dream_letter, v_dream),
    interests           = case when (p.interests is null or p.interests = '{}'::jsonb
                                     or p.interests = '[]'::jsonb)
                                    and v_interests <> '{}'::jsonb
                               then v_interests else p.interests end,
    updated_at          = now()
  where p.id = p_id
    -- only touch the row when there is actually a gap to fill: the claim runs
    -- on every /portrait boot and must not churn updated_at / realtime for
    -- nothing.
    and (   (p.first_name is null          and v_first  is not null)
         or (p.location is null            and v_region is not null)
         or (p.profession is null          and v_prof   is not null)
         or (p.status is null              and v_status is not null)
         or (p.availability is null        and v_timing is not null)
         or (p.preferred_duration is null  and v_length is not null)
         or (p.previous_experience is null and v_depth  is not null)
         or (p.reach is null               and v_reach  is not null)
         or (p.dream_letter is null        and v_dream  is not null)
         or ((p.interests is null or p.interests = '{}'::jsonb or p.interests = '[]'::jsonb)
             and v_interests <> '{}'::jsonb));
end;
$$;

-- security definer touching admin-only waitlist data: callable by the
-- trigger, the claim RPC and admin SQL only — never with caller-chosen args
-- from the browser roles.
revoke execute on function public.copy_waitlist_to_profile(uuid, text) from public, anon, authenticated;

-- The claim path: /portrait calls this on every signed-in boot. A user can
-- only ever claim their OWN waitlist rows — id and email come from their
-- session, not from arguments — and the copy is fill-gaps-only, so repeat
-- calls are idempotent. This is what serves accounts that already existed
-- (signInWithOtp only INSERTs auth.users for new emails, so handle_new_user
-- never fires for them) and closes the request-time race for new ones.
--
-- Trust note, decided consciously: waitlist rows are anonymous inserts, so
-- a forged row for someone else's email could pre-fill that person's EMPTY
-- profile fields when they later sign in. Accepted at this scale because the
-- copy never overwrites anything, every field lands on the owner's own
-- /portrait where they see and can change it, and the same forged row
-- already reaches Arnaud's notify-lead sheet today. Revisit before opening
-- any surface that shows profile fields to OTHER members unreviewed.
create or replace function public.claim_waitlist_answers()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_email text;
begin
  if auth.uid() is null then return; end if;
  select u.email into v_email from auth.users u where u.id = auth.uid();
  if v_email is null then return; end if;
  perform public.copy_waitlist_to_profile(auth.uid(), v_email);
end;
$$;
revoke execute on function public.claim_waitlist_answers() from public, anon;
grant execute on function public.claim_waitlist_answers() to authenticated;

-- 2. Sign-up hook (replaces 012's body; the trigger itself is unchanged)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, created_at)
  values (new.id, new.email, now())
  on conflict (id) do nothing;
  begin
    perform public.copy_waitlist_to_profile(new.id, new.email);
  exception when others then
    null;  -- the handoff must never block a sign-up
  end;
  return new;
end;
$$;

-- 3. Carrier rows must not re-notify or re-welcome: recreate 024/025's
--    triggers with a WHEN guard (functions untouched). Two silent sources:
--    'portrait-continuation' (the /circle continuation's two extra answers)
--    and 'portrait-questionnaire' (/portrait's own signed-out carrier).
--    Both are data carriers claimed at sign-in — Arnaud's sheet for the
--    /circle flow already fired from the original row, and no user-facing
--    email may fire from a surface he has not approved.
drop trigger if exists trg_notify_lead_on_signup on public.launch_waitlist;
create trigger trg_notify_lead_on_signup
  after insert on public.launch_waitlist
  for each row
  when (coalesce(NEW.source, '') not in ('portrait-continuation','portrait-questionnaire'))
  execute function public.notify_lead_on_signup();

drop trigger if exists trg_welcome_lead_on_signup on public.launch_waitlist;
create trigger trg_welcome_lead_on_signup
  after insert on public.launch_waitlist
  for each row
  when (coalesce(NEW.source, '') not in ('portrait-continuation','portrait-questionnaire'))
  execute function public.welcome_lead_on_signup();

-- 4. Backfill existing accounts that also joined the waitlist
do $$
declare r record;
begin
  for r in
    select u.id, u.email from auth.users u
    where u.email is not null
      and exists (select 1 from public.launch_waitlist w where lower(w.email) = lower(u.email))
  loop
    begin
      perform public.copy_waitlist_to_profile(r.id, r.email);
    exception when others then
      null;
    end;
  end loop;
end $$;
