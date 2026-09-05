// RETIRED 2026-08-17 — the day3/day7 drip carried the pre-pivot get-certified thesis
// ("Real certifications — PADI, RYA, Yoga Alliance, WSET"; "Real instructors — 5+ years,
// world-class credentials": claims with no true version today). New joiners receive the
// approved circle-welcome letter instead. ACTION OWED: unschedule this function's cron
// in the Supabase dashboard — the code now no-ops either way.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(() =>
  new Response(JSON.stringify({ ok: true, retired: true, retired_on: "2026-08-17" }), {
    headers: { "Content-Type": "application/json" },
  })
);
