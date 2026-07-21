/* Studio — People tab. The Circle, person by person.
 * Merges launch_waitlist (leads) + profiles (members) by email via the shared
 * Supabase client. RLS: both tables are admin-only SELECT — without an admin
 * session the room stays sealed (same pattern as studio-news.js).
 * Organised by what they love (craft cloud filters) and what they wrote
 * (dreams + letters on warm paper). Renders via window.ET_RENDER_PEOPLE.
 */
(function () {
  "use strict";

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const INTENT_LABEL = { timing: "When", length: "Length", depth: "Depth", reach: "Reach" };
  const SOURCE_LABEL = {
    "circle-questionnaire": "/circle", "homepage": "homepage", "homepage-circle": "homepage",
    "join-page": "join page", "barcelona": "/barcelona", "founding-add": "added by hand",
    "founding-list-2": "founding list",
  };

  const pretty = (slug) => {
    const s = String(slug || "").trim();
    if (/\d/.test(s)) return s; // "1-3months" etc — show as stored
    return s.replace(/[-_]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  };

  function fmtDate(iso) {
    try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
    catch (e) { return String(iso || ""); }
  }

  // ---- merge both tables into person records (pure; unit-testable) ----
  function build(waitlist, profiles) {
    const people = new Map();
    const get = (email) => {
      const key = String(email || "").trim().toLowerCase();
      if (!key) return null;
      if (!people.has(key)) people.set(key, {
        email: key, name: "", region: "", profession: "", member: false, portrait: false,
        unsubscribed: false, crafts: [], writings: [], sources: [], intent: [], masters: [], first: null, last: null,
        onList: false, welcomedAt: null, lastIssue: "",
      });
      return people.get(key);
    };
    const seen = (p, iso) => {
      if (!iso) return;
      if (!p.first || iso < p.first) p.first = iso;
      if (!p.last || iso > p.last) p.last = iso;
    };
    const addCraft = (p, label, own) => {
      const t = String(label || "").trim();
      if (!t) return;
      if (!p.crafts.some((c) => c.label.toLowerCase() === t.toLowerCase())) p.crafts.push({ label: t, own: !!own });
    };
    const addWriting = (p, label, text) => {
      const t = String(text || "").trim();
      if (t && !p.writings.some((w) => w.text === t)) p.writings.push({ label, text: t });
    };

    (waitlist || []).forEach((row) => {
      const p = get(row.email);
      if (!p) return;
      seen(p, row.created_at);
      if (row.unsubscribed) p.unsubscribed = true;
      p.onList = true;
      if (row.welcomed_at && (!p.welcomedAt || row.welcomed_at > p.welcomedAt)) p.welcomedAt = row.welcomed_at;
      // rows arrive newest-first; keep the most recent real issue ("welcome" is covered by welcomedAt)
      if (row.last_issue && row.last_issue !== "welcome" && !p.lastIssue) p.lastIssue = row.last_issue;
      const src = SOURCE_LABEL[row.source] || row.source;
      if (src && !p.sources.includes(src)) p.sources.push(src);
      let items = Array.isArray(row.interests) ? row.interests
        : (row.interests && typeof row.interests === "object") ? Object.values(row.interests).flat() : [];
      items.forEach((it) => {
        if (typeof it === "string") return addCraft(p, it, false);
        if (!it || typeof it !== "object") return;
        if (it.kind === "profile") {
          if (it.name && !p.name) p.name = String(it.name).trim();
          if (it.region && !p.region) p.region = String(it.region).trim();
        } else if (it.kind === "discipline") {
          if (it.discipline) addCraft(p, it.discipline, false);
          if (it.open) addCraft(p, it.open, true);
        } else if (it.kind === "intent") {
          ["timing", "length", "depth", "reach"].forEach((k) => {
            const v = String(it[k] || "").trim();
            if (v && !p.intent.some((x) => x[0] === INTENT_LABEL[k])) p.intent.push([INTENT_LABEL[k], v]);
          });
        } else if (it.kind === "dream") {
          addWriting(p, "Their dream week", it.text);
        } else if (it.kind === "mastery") {
          const skill = String(it.skill || "").trim();
          const advanced = it.advanced || (it.perfect === true ? "yes" : "");
          if (skill || it.relation || advanced) {
            const rel = { work: "their work", passion: "a lifelong passion" }[it.relation] || it.relation || "";
            const adv = { yes: "wants to go deeper", curious: "curious about going deeper", no: "" }[advanced] || "";
            p.masters.push({ skill: skill || "(unnamed)", rel, adv });
          }
        }
      });
    });

    (profiles || []).forEach((row) => {
      const p = get(row.email);
      if (!p) return;
      p.member = true;
      seen(p, row.created_at);
      const nm = String(row.first_name || row.name || "").trim();
      if (nm) p.name = nm;
      if (row.location && !p.region) p.region = String(row.location).trim();
      if (row.profession) p.profession = String(row.profession).trim();
      if (row.portrait_completed_at || row.portrait_complete) p.portrait = true;
      const iv = row.interests;
      if (Array.isArray(iv)) iv.forEach((c) => addCraft(p, pretty(c), false));
      else if (iv && typeof iv === "object") Object.values(iv).flat().forEach((c) => addCraft(p, pretty(c), false));
      addWriting(p, "The letter", row.dream_letter);
      addWriting(p, "About them", row.about);
      addWriting(p, "What matters to them", row.what_matters);
      [["When", row.availability], ["Length", row.preferred_duration], ["Reach", row.reach]].forEach(([k, v]) => {
        const s = String(v || "").trim();
        if (s && !p.intent.some((x) => x[0] === k)) p.intent.push([k, pretty(s)]);
      });
    });

    const out = [...people.values()];
    out.forEach((p) => { if (!p.name) p.name = p.email.split("@")[0]; });
    // the ones who wrote you come first; then most recently active
    out.sort((a, b) => (b.writings.length ? 1 : 0) - (a.writings.length ? 1 : 0) || String(b.last).localeCompare(String(a.last)));
    return out;
  }

  // ---- craft cloud ----
  function craftCounts(people) {
    const counts = new Map();
    people.forEach((p) => p.crafts.forEach((c) => {
      const k = c.label;
      counts.set(k, (counts.get(k) || 0) + 1);
    }));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }

  // ---- render ----
  const state = { craft: null, lettersOnly: false };

  function chip(label, n, active, own) {
    const border = active ? "var(--ember)" : own ? "rgba(210,138,82,.4)" : "var(--line)";
    const color = active ? "var(--ember)" : own ? "var(--ember)" : "var(--muted)";
    return '<button class="ppl-chip" data-craft="' + esc(label) + '" style="font-family:\'IBM Plex Mono\',monospace; font-size:11px; letter-spacing:.04em; padding:5px 11px; border-radius:999px; border:1px solid ' + border + "; color:" + color + '; background:' + (active ? "rgba(210,138,82,.08)" : "none") + '; margin:0 6px 8px 0;">' +
      esc(label) + (n != null ? ' <span style="opacity:.55;">' + n + "</span>" : "") + "</button>";
  }

  function paper(w, name) {
    return '<div style="background:#efe6d3; border-radius:8px; padding:16px 18px; margin:10px 0 0;">' +
      '<div class="font-mono" style="font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:#6f6350; margin-bottom:8px;">' + esc(w.label) + "</div>" +
      '<p style="color:#2c231a; font-family:Georgia,serif; font-size:14.5px; line-height:1.75; margin:0; white-space:pre-wrap;">' + esc(w.text) + "</p>" +
      '<p style="color:#3a2c1e; font-family:Georgia,serif; font-style:italic; font-size:13px; margin:10px 0 0; text-align:right;">— ' + esc(name) + "</p></div>";
  }

  function personCard(p) {
    const pills =
      '<span class="pill ' + (p.member ? "confirmed" : "in") + '">' + (p.member ? "member" : "lead") + "</span>" +
      (p.portrait ? ' <span class="pill posted">portrait ✓</span>' : "") +
      (p.unsubscribed ? ' <span class="pill none">unsubscribed</span>' : "");
    const meta = [p.region, p.profession].filter(Boolean).map(esc).join(" · ");
    const via = [p.sources.length ? "via " + esc(p.sources.join(", ")) : "", p.first ? "since " + esc(fmtDate(p.first)) : ""].filter(Boolean).join(" · ");
    // what the mail system has actually done for this person (welcomed_at + last_issue stamps)
    const letters = p.onList
      ? (p.welcomedAt
          ? 'welcomed ' + esc(fmtDate(p.welcomedAt))
          : '<span style="color:var(--ember);">never welcomed ⚠</span>') +
        (p.lastIssue ? ' &nbsp;·&nbsp; last letter: <span style="color:var(--muted);">' + esc(p.lastIssue) + "</span>" : "")
      : '<span style="font-style:italic;">not on the letter list</span>';
    const crafts = p.crafts.length
      ? '<div style="margin:12px 0 0;">' + p.crafts.map((c) =>
          '<span style="display:inline-block; margin:0 6px 6px 0; padding:3px 10px; border:1px solid ' + (c.own ? "rgba(210,138,82,.45)" : "rgba(127,168,165,.35)") + '; border-radius:9px; font-size:12px; color:var(--paper);">' + esc(c.label) + (c.own ? ' <span style="color:var(--ember); font-size:10px; font-style:italic;">their words</span>' : "") + "</span>").join("") + "</div>"
      : '<p style="color:var(--faint); font-size:13px; font-style:italic; margin:12px 0 0;">No crafts named yet.</p>';
    const intent = p.intent.length
      ? '<div class="font-mono" style="font-size:11px; color:var(--faint); margin:10px 0 0;">' + p.intent.map(([k, v]) => esc(k) + ": <span style=\"color:var(--muted);\">" + esc(v) + "</span>").join(" &nbsp;·&nbsp; ") + "</div>"
      : "";
    const masters = p.masters.length
      ? '<div style="margin:12px 0 0;">' + p.masters.map((m) =>
          '<div style="display:inline-block; margin:0 8px 6px 0; padding:6px 12px; border:1px solid rgba(127,168,165,.4); border-left:2px solid var(--sea); border-radius:10px; font-size:12.5px; color:var(--paper);">' +
          '<span style="color:var(--sea); font-family:\'IBM Plex Mono\',monospace; font-size:10px; letter-spacing:.1em; text-transform:uppercase;">Masters</span> ' + esc(m.skill) +
          (m.rel ? ' <span style="color:var(--faint);">— ' + esc(m.rel) + '</span>' : '') +
          (m.adv ? ' <span style="color:var(--ember); font-style:italic;">· ' + esc(m.adv) + '</span>' : '') + '</div>').join("") + "</div>"
      : "";
    const writings = p.writings.map((w) => paper(w, p.name)).join("");
    return '<div class="panel" style="padding:22px 24px;">' +
      '<div style="display:flex; align-items:baseline; gap:12px; flex-wrap:wrap;">' +
      '<h3 class="font-serif" style="font-size:21px; margin:0; color:var(--paper);">' + esc(p.name) + "</h3>" + pills +
      '<a class="link-quiet" style="margin-left:auto; font-size:12px; color:var(--sea); text-decoration:none;" href="mailto:' + esc(p.email) + '">Write back →</a></div>' +
      '<div class="font-mono" style="font-size:11.5px; color:var(--sea); margin:6px 0 0;"><a class="link-quiet" style="color:var(--sea); text-decoration:none;" href="mailto:' + esc(p.email) + '">' + esc(p.email) + "</a>" + (meta ? ' &nbsp;·&nbsp; <span style="color:var(--muted);">' + meta + "</span>" : "") + "</div>" +
      (via ? '<div class="font-mono" style="font-size:10.5px; color:var(--faint); margin:4px 0 0;">' + via + "</div>" : "") +
      '<div class="font-mono" style="font-size:10.5px; color:var(--faint); margin:4px 0 0;">Letters: ' + letters + "</div>" +
      crafts + masters + intent + writings + "</div>";
  }

  function renderBody(body, people) {
    const wrote = people.filter((p) => p.writings.length).length;
    const cloud = craftCounts(people);
    let shown = people;
    if (state.craft) shown = shown.filter((p) => p.crafts.some((c) => c.label === state.craft));
    if (state.lettersOnly) shown = shown.filter((p) => p.writings.length);

    body.innerHTML =
      '<div class="font-mono" style="font-size:11px; color:var(--faint); margin:0 0 18px;">' +
      people.length + " people &nbsp;·&nbsp; " + wrote + " wrote you something &nbsp;·&nbsp; " + cloud.length + " crafts named</div>" +
      '<div style="margin:0 0 6px;">' +
      chip("Everyone", people.length, !state.craft && !state.lettersOnly) +
      chip("Wrote to me", wrote, state.lettersOnly) +
      "</div>" +
      '<div style="margin:0 0 22px; border-bottom:1px solid var(--line); padding-bottom:14px;">' +
      cloud.map(([label, n]) => chip(label, n, state.craft === label)).join("") + "</div>" +
      (shown.length
        ? '<div style="display:grid; gap:14px;">' + shown.map(personCard).join("") + "</div>"
        : '<p style="color:var(--faint); font-size:14px; font-style:italic;">No one here under that filter.</p>');

    body.querySelectorAll(".ppl-chip").forEach((b) => b.addEventListener("click", () => {
      const c = b.getAttribute("data-craft");
      if (c === "Everyone") { state.craft = null; state.lettersOnly = false; }
      else if (c === "Wrote to me") { state.lettersOnly = !state.lettersOnly; }
      else state.craft = state.craft === c ? null : c;
      renderBody(body, people);
    }));
  }

  function note(v, text, extraHtml) {
    v.innerHTML = '<div style="border:1px solid var(--line); border-radius:14px; padding:26px 28px; background:var(--ink-2);">' +
      '<p style="margin:0; color:var(--muted); font-size:14px; line-height:1.8;">' + text + "</p>" + (extraHtml || "") + "</div>";
  }

  function waitForClient(cb, n) {
    n = n || 0;
    if (window.supabaseClient) return cb(window.supabaseClient);
    if (window.supabaseError || n > 100) return cb(null);
    setTimeout(() => waitForClient(cb, n + 1), 50);
  }

  window.ET_RENDER_PEOPLE = function (v) {
    const wrap = document.createElement("div");
    wrap.innerHTML =
      '<div style="margin-bottom:26px;">' +
      '<h1 class="font-serif" style="font-size:15px; letter-spacing:.02em; margin:0; color:var(--sea);">The Circle — person by person</h1>' +
      '<p class="font-mono" style="font-size:11px; color:var(--faint); margin:6px 0 0;">Everyone who raised a hand · what they love · every word they wrote you.</p>' +
      '</div><div id="people-body"></div>';
    v.appendChild(wrap);
    const body = wrap.querySelector("#people-body");
    note(body, "Opening the room…");

    waitForClient((client) => {
      if (!client) return note(body, "Couldn’t reach the Circle (connection issue). The rest of the Studio still works.");
      client.auth.getSession().then((res) => {
        const session = res && res.data ? res.data.session : null;
        if (!session) {
          return note(body,
            "The room is sealed — it opens only for the admin account. Sign in once and come back; the session sticks to this browser.",
            '<p style="margin:12px 0 0;"><a class="link-quiet" style="color:var(--sea); font-size:13px;" href="/join">Sign in →</a></p>');
        }
        Promise.all([
          client.from("launch_waitlist").select("email,interests,source,created_at,unsubscribed,welcomed_at,last_issue").order("created_at", { ascending: false }).limit(500),
          client.from("profiles").select("email,name,first_name,location,profession,about,interests,what_matters,dream_letter,availability,preferred_duration,reach,portrait_complete,portrait_completed_at,created_at").order("created_at", { ascending: false }).limit(500),
        ]).then(([w, pr]) => {
          if (w.error && pr.error) return note(body, "The room answered with an error: " + esc(w.error.message));
          const people = build(w.data || [], pr.data || []);
          if (!people.length) return note(body, "No one yet — the Circle door just opened. They’ll appear here the moment they join.");
          renderBody(body, people);
          if (w.error || pr.error) {
            const warn = document.createElement("p");
            warn.className = "font-mono";
            warn.style.cssText = "font-size:11px; color:var(--ember); margin:14px 0 0;";
            warn.textContent = "One source didn’t answer (" + (w.error ? "waitlist" : "profiles") + ") — showing the rest.";
            body.appendChild(warn);
          }
        });
      });
    });
  };

  // test hook (node): pure builders, no DOM
  window.ET_PEOPLE_TEST = { build, craftCounts };
})();
