-- 049 — a signature may carry a few words, or none.
--
-- Arnaud, 7 Nov 2026: "make sure people can just write a couple of words and
-- don't have to fill up everything, or even anything, to validate."
--
-- 044 and 045 set a 40-character floor on `what`, as a spam filter and a quality
-- bar. It also turned a chef who would happily put their name on a school into a
-- chef who closed the tab. Every row is still pending until Arnaud approves it in
-- admin, and one address still signs a school once (vouches_one_per_school_email),
-- so moderation does the work the floor did.
--
-- A row with no words is NULL, not '': "they said nothing" and "they said an empty
-- string" are different claims. school-note.js prints such a row as the name alone,
-- "· learned here". The member route on /you (vouch.js) keeps its own floor in the
-- browser; refresh-vouches.mjs never reads school comments, so no grade moves.
--
-- Applied by hand with `supabase db query --linked` (migrations are not auto-applied).

alter table public.vouches alter column what drop not null;

alter table public.vouches drop constraint if exists vouches_what_check;
alter table public.vouches add constraint vouches_what_check
    check (what is null or length(btrim(what)) between 1 and 1200);

drop policy if exists "vouches_insert_anon" on public.vouches;
create policy "vouches_insert_anon" on public.vouches
    for insert to anon
    with check (
        user_id is null
        and status = 'pending'
        and decided_by is null
        and decided_at is null
        and school is not null
        and (what is null or char_length(btrim(what)) between 1 and 2000)
        and char_length(coalesce(display_name, '')) <= 60
        and char_length(coalesce(email, '')) <= 254
    );
