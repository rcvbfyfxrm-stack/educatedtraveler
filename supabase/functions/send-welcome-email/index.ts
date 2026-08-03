// Supabase Edge Function: notify Arnaud when a new profile is created.
// The old user-facing "Your adventure matches are saved" email is RETIRED
// (Arnaud's order, 2026-07-22): it was stale quest-era copy, and new joiners
// already get the approved circle-welcome letter. Only the admin
// "New adventurer" notification remains — Arnaud's sole signal for accounts
// created outside the waitlist funnel.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// `catch (e)` binds `unknown`. Reading `.message` off it was a type error and a
// real one: a thrown string, or a Supabase error object, reported `undefined` as
// the reason — so the failure was logged with no cause attached.
function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null && "message" in e) {
    return String((e as { message: unknown }).message);
  }
  return String(e);
}


const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const admin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

function fmtList(arr: unknown): string {
  if (!Array.isArray(arr) || arr.length === 0) return "—";
  return arr.map(String).join(", ");
}

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v as object).length === 0;
  return String(v).trim() === "";
}

const kvRow = (k: string, v: string) =>
  `<tr><td style="padding:6px 0;color:#6b625a;width:120px;vertical-align:top;">${esc(k)}</td><td>${v}</td></tr>`;

// profiles.interests arrives in several shapes depending on the surface that
// wrote it (category-objects from the profile page, kind-objects from /circle,
// plain strings from the orb/intent forms). Render every shape; anything
// unrecognised still shows as raw JSON — losing someone's words is worse than ugly.
function renderProfileInterests(interests: unknown): string[] {
  if (isEmpty(interests)) return [];
  const rows: string[] = [];

  if (Array.isArray(interests)) {
    const plain = interests.filter((i) => typeof i === "string") as string[];
    const objs = interests.filter((i) => i && typeof i === "object") as Record<string, unknown>[];
    if (plain.length) rows.push(kvRow("Wants to learn", esc(plain.join(", "))));
    for (const o of objs) {
      const label = String(o.kind ?? o.category ?? o.type ?? "Also");
      const items = o.items ?? o.values ?? o.skills;
      if (Array.isArray(items)) rows.push(kvRow(label, esc(items.map(String).join(", "))));
      else rows.push(kvRow(label, `<code style="font-size:12px;color:#555;">${esc(JSON.stringify(o))}</code>`));
    }
    return rows;
  }

  if (typeof interests === "object") {
    for (const [cat, val] of Object.entries(interests as Record<string, unknown>)) {
      if (isEmpty(val)) continue;
      rows.push(kvRow(cat, Array.isArray(val) ? esc(val.map(String).join(", ")) : esc(String(val))));
    }
    return rows;
  }

  return [kvRow("Wants to learn", esc(String(interests)))];
}

async function buildInterestHtml(userId: string, email: string, isUpdate = false): Promise<string> {
  if (!admin) return "";
  try {
    async function fetchAll() {
      return Promise.all([
        admin!.from("user_preferences")
          .select("elements, desires, time_preference, intensity, updated_at")
          .eq("user_id", userId).maybeSingle(),
        admin!.from("saved_adventures")
          .select("adventure_id, created_at")
          .eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
        admin!.from("experience_interests")
          .select("experience_id, created_at")
          .eq("email", email).order("created_at", { ascending: false }).limit(10),
      ]);
    }

    // PRIMARY source: the profile row itself. The profile page and the Circle
    // flows write what people pick straight to profiles.interests/skills — the
    // three tables below are older, narrower paths. Reading only those was why
    // every profile-page signup notified Arnaud with an empty sheet.
    async function fetchProfile() {
      return admin!.from("profiles")
        .select("interests, skills, what_matters, profession, location, completion_pct, profile_complete")
        .eq("id", userId).maybeSingle();
    }

    // On INSERT the client is often still writing; wait a beat. On UPDATE the
    // data is already committed — the trigger fired *because* it landed.
    if (!isUpdate) await new Promise((r) => setTimeout(r, 2000));
    let [profRes, prefsRes, savedRes, expRes] = await Promise.all([fetchProfile(), ...(await fetchAll())]);

    // One retry if nothing came back yet (handles slower mobile clients).
    if (!isUpdate && isEmpty(profRes.data?.interests) && !prefsRes.data &&
        (savedRes.data || []).length === 0 && (expRes.data || []).length === 0) {
      await new Promise((r) => setTimeout(r, 2500));
      [profRes, prefsRes, savedRes, expRes] = await Promise.all([fetchProfile(), ...(await fetchAll())]);
    }

    const prof = profRes.data as Record<string, unknown> | null;
    const prefs = prefsRes.data;
    const saved = savedRes.data || [];
    const interests = expRes.data || [];

    const profileRows = renderProfileInterests(prof?.interests);
    if (Array.isArray(prof?.skills) && (prof!.skills as unknown[]).length) {
      profileRows.push(kvRow("Skills they list", esc((prof!.skills as unknown[]).map(String).join(", "))));
    }
    if (!isEmpty(prof?.what_matters)) profileRows.push(kvRow("What matters", esc(String(prof!.what_matters))));
    if (!isEmpty(prof?.profession))   profileRows.push(kvRow("Profession", esc(String(prof!.profession))));
    if (!isEmpty(prof?.location))     profileRows.push(kvRow("Location", esc(String(prof!.location))));
    if (prof?.completion_pct != null) profileRows.push(kvRow("Profile", `${esc(prof.completion_pct)}% complete`));

    if (profileRows.length === 0 && !prefs && saved.length === 0 && interests.length === 0) return "";

    const rows: string[] = [...profileRows];
    if (prefs) {
      rows.push(
        `<tr><td style="padding:6px 0;color:#6b625a;width:120px;">Elements</td><td>${fmtList(prefs.elements)}</td></tr>`,
        `<tr><td style="padding:6px 0;color:#6b625a;">Desires</td><td>${fmtList(prefs.desires)}</td></tr>`,
        `<tr><td style="padding:6px 0;color:#6b625a;">Time</td><td>${prefs.time_preference || "—"}</td></tr>`,
        `<tr><td style="padding:6px 0;color:#6b625a;">Intensity</td><td>${prefs.intensity ?? "—"}</td></tr>`,
      );
    }
    if (saved.length) {
      rows.push(
        `<tr><td style="padding:6px 0;color:#6b625a;">Saved</td><td>${saved.map((s) => s.adventure_id).join(", ")}</td></tr>`,
      );
    }
    if (interests.length) {
      rows.push(
        `<tr><td style="padding:6px 0;color:#6b625a;">Interests</td><td>${interests.map((i) => i.experience_id).join(", ")}</td></tr>`,
      );
    }

    return `
    <p style="margin:24px 0 8px 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#666;">What they want</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333;">${rows.join("")}</table>`;
  } catch (e) {
    console.error("Interest lookup failed:", e);
    return "";
  }
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE";
  table: string;
  record: {
    id: string;
    email: string;
    name: string | null;
    created_at: string;
  };
}

serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();

    if ((payload.type !== "INSERT" && payload.type !== "UPDATE") || payload.table !== "profiles") {
      return new Response(JSON.stringify({ message: "Ignored" }), { status: 200 });
    }

    const { email, name, id, created_at } = payload.record;
    const firstName = name || email.split("@")[0];
    const ADMIN_EMAIL = "arnaudcallier@pm.me";
    const isUpdate = payload.type === "UPDATE";

    const interestHtml = await buildInterestHtml(id, email, isUpdate);

    // An UPDATE that carries nothing new is not worth an email.
    if (isUpdate && !interestHtml) {
      return new Response(JSON.stringify({ message: "Update had nothing to report" }), { status: 200 });
    }

    const adminNotify = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "EducatedTraveler <founder@educatedtraveler.app>",
        to: [ADMIN_EMAIL],
        reply_to: email,
        subject: isUpdate
          ? `Profile filled in: ${firstName} (${email})`
          : `New adventurer: ${firstName} (${email})`,
        html: `
<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;">
    <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#666;">${isUpdate ? "Told you what they want" : "New signup"}</p>
    <h2 style="margin:0 0 20px 0;font-size:20px;font-weight:500;color:#111;">${firstName}</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333;">
      <tr><td style="padding:6px 0;color:#6b625a;width:120px;">Email</td><td><a href="mailto:${email}" style="color:#0066B1;text-decoration:none;">${email}</a></td></tr>
      <tr><td style="padding:6px 0;color:#6b625a;">Profile ID</td><td style="font-family:monospace;font-size:12px;color:#555;">${id}</td></tr>
      <tr><td style="padding:6px 0;color:#6b625a;">Joined</td><td>${created_at}</td></tr>
    </table>
    ${interestHtml}
    <p style="margin:24px 0 0 0;">
      <a href="https://educatedtraveler.app/admin.html" style="display:inline-block;padding:10px 18px;background:#0066B1;color:#fff;border-radius:6px;text-decoration:none;font-size:13px;">Open admin console</a>
    </p>
  </div>
</body></html>
        `,
      }),
    });

    const data = await adminNotify.json().catch(() => ({}));

    if (!adminNotify.ok) {
      console.error("Admin notify failed:", data);
      return new Response(JSON.stringify({ error: data }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, id: data.id, userEmail: "retired" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: errMessage(error) }), { status: 500 });
  }
});
