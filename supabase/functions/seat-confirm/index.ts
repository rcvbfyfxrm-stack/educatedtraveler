// Edge Function: seat-confirm
//
// The one thing no website can know is whether money arrived. Revolut, PayPal
// and a bank transfer all settle somewhere this code cannot see, so a chef
// pressing "I've sent it" is a claim and nothing more. This function is where
// the claim becomes a fact: Arnaud looks at the account, and only then does a
// seat count toward the ten and only then does the chef hear that it is held.
//
//   GET  ?token=<seat_token>   → read-only interstitial with a POST button.
//   POST  token=<seat_token>   → stamps seat_paid_at, emails the chef.
//
// GET never mutates: email scanners and link prefetchers issue bare GETs, and
// one of those must never tell a chef his seat is safe. Same defence as
// confirm-enrollment.
//
// Deploy with --no-verify-jwt (it is opened from an email link, no session).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM = "Arnaud · EducatedTraveler <founder@educatedtraveler.app>";
const REPLY_TO = "arnaudcallier@pm.me";

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

// ── SEND LOCK ─────────────────────────────────────────────────────────────
// Arnaud, 17 Aug: "don't send an email to anyone… but ask me first."
// While this is false, confirming a seat records the money and NOTHING leaves
// the building. Not an instruction anyone has to remember — the send is simply
// not reachable. Flip to true only once he has approved the wording, and only
// on his say-so.
const SEND_LETTER = false;

function esc(s: unknown) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}
const eur = (n: number) => `€${n.toLocaleString("en-GB")}`;
const html = (body: string, status = 200) =>
  new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });

function seatOf(iv: unknown): Record<string, unknown> {
  const arr = Array.isArray(iv) ? iv : [];
  return (arr.find((x) =>
    x && typeof x === "object" && (x as Record<string, unknown>).kind === "seat-payment"
  ) as Record<string, unknown>) ?? {};
}

// ── The letter to the chef ────────────────────────────────────────────────
// Claims no skill, no rank, no position in the queue, and never a seat count.
// Every fact is checkable against the public /barcelona page — which is the
// point: the refund promise is only worth something if it is said in public
// and repeated in private in the same words.
function letterHtml(name: string, paid: number, balance: number, when: string): string {
  const P = "color:#3d3630;font-size:15px;line-height:1.7;margin:0 0 18px 0;";
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#6b625a;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-family:'Courier New',monospace;white-space:nowrap;vertical-align:top;">${esc(k)}</td><td style="padding:6px 0;color:#2b2621;font-size:15px;">${v}</td></tr>`;

  return `<div style="background:#faf7f2;padding:30px 0;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:540px;margin:0 auto;padding:0 26px;">
    <p style="font-size:10px;text-transform:uppercase;letter-spacing:2.5px;color:#8f5820;margin:0 0 12px 0;font-family:'Courier New',monospace;">Lab Week 01 &nbsp;&middot;&nbsp; Barcelona</p>
    <h1 style="font-size:25px;font-weight:normal;color:#2b2621;margin:0 0 22px 0;line-height:1.25;">Your ${esc(eur(paid))} arrived. Your seat is held.</h1>
    <p style="${P}">That's the whole message. The rest is so that nothing surprises you later.</p>
    <table style="border-collapse:collapse;width:100%;margin:0 0 22px 0;background:#f2ede4;border-left:2px solid #b06f33;border-radius:0 8px 8px 0;padding:4px;">
      ${row("Received", `<strong>${esc(eur(paid))}</strong>, ${esc(when)}`)}
      ${balance > 0 ? row("Still to come", `${esc(eur(balance))}, and not before the week is confirmed`) : row("Paid", "in full &mdash; nothing further to send")}
      ${row("The week", "22&ndash;26 October 2026, at Vakuum in Barcelona")}
    </table>
    <p style="${P}">Your money is safe with me until the week is locked. If anything at all were to stop it running, every euro comes back to you &mdash; deposit or full payment, without conditions and without you having to ask for it.</p>
    <p style="${P}">Hold off on flights for now. I'll write to you the moment the dates are locked for everyone, and that mail is your green light to book.</p>
    <p style="${P}">After that your seat is transferable but not refundable. If you can't come, send a chef of comparable calibre in your place, up to seven days before.</p>
    <p style="${P}">You'll hear from me before then anyway &mdash; where to stay, how to reach Passatge de Centelles, what the five days actually look like, and the add-ons around the week once they're booked and real. Nothing is sold here before it exists.</p>
    <p style="${P}">Anything at all, reply to this. It's me at the other end.</p>
    <p style="${P}margin-bottom:26px;">Arnaud</p>
    <p style="color:#6b625a;font-family:Georgia,serif;font-style:italic;font-size:15px;margin:0;border-top:1px solid #e2dbd0;padding-top:18px;">A skill, a place, a person, your people.</p>
  </div>
</div>`;
}

// ── The two screens Arnaud sees ───────────────────────────────────────────
function page(opts: { eyebrow: string; heading: string; body: string; form?: string; tone?: string }) {
  const accent = opts.tone === "error" ? "#c0663a" : opts.tone === "done" ? "#0b7a58" : "#b06f33";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.heading)}</title></head>
<body style="margin:0;background:#0d0b09;color:#f3ede2;font-family:-apple-system,system-ui,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:56px 24px;">
    <p style="font-size:11px;text-transform:uppercase;letter-spacing:.18em;color:${accent};margin:0 0 12px 0;font-family:ui-monospace,monospace;">${esc(opts.eyebrow)}</p>
    <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:27px;line-height:1.2;margin:0 0 18px 0;">${esc(opts.heading)}</h1>
    <div style="color:rgba(243,237,226,.72);font-size:15px;line-height:1.7;">${opts.body}</div>
    ${opts.form ?? ""}
  </div>
</body></html>`;
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") ??
      (req.method === "POST" ? new URLSearchParams(await req.text()).get("token") : null);

    if (!token) {
      return html(page({ eyebrow: "Link error", heading: "Missing token", body: "<p>This link is incomplete.</p>", tone: "error" }), 400);
    }

    const { data: row } = await admin
      .from("launch_waitlist")
      .select("id,email,interests,seat_paid_at,seat_paid_eur")
      .eq("seat_token", token)
      .maybeSingle();

    if (!row) {
      return html(page({ eyebrow: "Link error", heading: "No seat for this link", body: "<p>The token doesn't match a seat. It may have been regenerated.</p>", tone: "error" }), 404);
    }

    const s = seatOf(row.interests);
    const name = String(s.name ?? row.email);
    const amount = typeof s.amount_eur === "number" ? s.amount_eur : 0;
    const balance = typeof s.balance_eur === "number" ? s.balance_eur : Math.max(0, 1500 - amount);

    if (row.seat_paid_at) {
      const on = new Date(String(row.seat_paid_at)).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      return html(page({
        eyebrow: "Already done", tone: "done",
        heading: `${name} was confirmed on ${on}`,
        body: `<p>${esc(eur(Number(row.seat_paid_eur ?? amount)))} recorded, and the note has already gone. Nothing further to do &mdash; and nothing was sent twice.</p>`,
      }));
    }

    // ---- GET: show, don't act. A scanner following this link must not send. ----
    if (req.method !== "POST") {
      return html(page({
        eyebrow: "Confirm a seat",
        heading: `Did ${eur(amount)} from ${name} actually arrive?`,
        body: `<p>Press this only once you can see the money in Revolut, PayPal or the bank. It stamps the seat as paid &mdash; the count toward the ten &mdash; and sends ${esc(name)} the note saying the seat is held.</p>
               <p style="color:rgba(243,237,226,.5);font-size:13px;">${esc(String(row.email))}${balance > 0 ? ` &nbsp;&middot;&nbsp; ${esc(eur(balance))} still to come` : " &nbsp;&middot;&nbsp; paid in full"}</p>`,
        form: `<form method="POST" style="margin-top:26px;">
                 <input type="hidden" name="token" value="${esc(token)}">
                 <button type="submit" style="width:100%;border:0;border-radius:6px;padding:16px;cursor:pointer;background:linear-gradient(100deg,#7fa8a5,#d28a52);color:#0d0b09;font-size:13px;letter-spacing:.12em;text-transform:uppercase;font-family:ui-monospace,monospace;">Yes &mdash; the money is here</button>
               </form>
               <p style="color:rgba(243,237,226,.4);font-size:12px;margin-top:16px;">If it hasn't arrived, close this tab. Nothing happens.</p>`,
      }));
    }

    // ---- POST: the money is real. Stamp it, then write to the chef. ----
    const paidAt = new Date().toISOString();
    await admin.from("launch_waitlist")
      .update({ seat_paid_at: paidAt, seat_paid_eur: amount })
      .eq("id", row.id);

    const when = new Date(paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    if (!SEND_LETTER) {
      return html(page({
        eyebrow: "Seat recorded", tone: "done",
        heading: `${name} is counted as paid.`,
        body: `<p>${esc(eur(amount))} recorded${balance > 0 ? `, ${esc(eur(balance))} still to come` : " in full"}. <strong>No email was sent</strong> &mdash; the note is held until you've approved the wording.</p>
               <p style="color:rgba(243,237,226,.5);font-size:13px;">${esc(name)} has not heard anything from this. Write to them yourself, or say the word and the note switches on.</p>`,
      }));
    }

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM, to: [String(row.email)], reply_to: REPLY_TO,
        subject: "Your seat is held — Lab Week 01, Barcelona",
        html: letterHtml(name, amount, balance, when),
      }),
    });

    if (!r.ok) {
      // The seat is stamped either way — the money is real and the count must
      // reflect it. Say plainly that the chef has NOT been told.
      const err = await r.text().catch(() => "");
      console.error("seat-confirm note failed:", err);
      return html(page({
        eyebrow: "Half done", tone: "error",
        heading: "Seat recorded, note did not send",
        body: `<p>${esc(name)} is counted as paid, but the note failed to go out. Write to them yourself &mdash; they are owed the confirmation today.</p>`,
      }), 502);
    }

    return html(page({
      eyebrow: "Seat confirmed", tone: "done",
      heading: `${name} is in.`,
      body: `<p>${esc(eur(amount))} recorded${balance > 0 ? `, ${esc(eur(balance))} still to come` : " in full"}. The note has gone to ${esc(String(row.email))}.</p>
             <p style="color:rgba(243,237,226,.5);font-size:13px;">This is now a paid seat in the count toward ten.</p>`,
    }));
  } catch (e) {
    console.error(e);
    return html(page({ eyebrow: "Error", heading: "Something broke", body: `<p>${esc(String(e))}</p>`, tone: "error" }), 500);
  }
});
