/* EducatedTraveler Studio — content operations cockpit.
 * Zero-dep vanilla JS. State lives in localStorage (offline-first; works at sea).
 * Data sources: studio-calendar.js (window.ET_DAILY_DROP), studio-plan.js
 * (window.ET_PLAN), studio-articles.js (window.ET_ARTICLES_SEED).
 * Voice lock for anything published: connect/introduce, never sell/book/enroll.
 * Banned words in public copy: transformation, life-changing, vacation, luxury, easy. */
(function () {
  "use strict";

  // ---------- tiny helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const el = (t, a = {}, kids = []) => {
    const n = document.createElement(t);
    for (const k in a) {
      if (k === "class") n.className = a[k];
      else if (k === "html") n.innerHTML = a[k];
      else if (k === "text") n.textContent = a[k];
      else if (k.startsWith("on") && typeof a[k] === "function") n.addEventListener(k.slice(2), a[k]);
      else if (a[k] != null) n.setAttribute(k, a[k]);
    }
    (Array.isArray(kids) ? kids : [kids]).forEach((c) => c != null && n.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return n;
  };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = () => "x" + Math.random().toString(36).slice(2, 9);
  const todayISO = () => new Date().toISOString().slice(0, 10);

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2200);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast("Copied to clipboard"); }
    catch (e) {
      const ta = el("textarea", {}); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); toast("Copied"); } catch (_) { toast("Copy failed — select manually"); }
      ta.remove();
    }
  }
  async function shareOrCopy(text, title) {
    if (navigator.share) { try { await navigator.share({ title: title || "EducatedTraveler", text }); return; } catch (e) { /* cancelled */ } }
    copy(text);
  }

  // ---------- state ----------
  const KEY = "et_studio_v1";
  const DROP = (window.ET_DAILY_DROP || []).slice();
  const PLAN = window.ET_PLAN || fallbackPlan();
  const ARTICLE_SEED = (window.ET_ARTICLES_SEED || []).slice();
  const IDEAS = window.ET_IDEAS || { shotList: [], hooks: [], series: [], saveTriggers: [], neverPost: [] };
  const POSTS = (window.ET_POSTS || []).slice();
  const LAUNCH = window.ET_LAUNCH || { intro: "", surfaces: [], phases: [] };
  const LETTER = window.ET_LETTER || { masthead: "The Circle", structure: [], scienceVault: [], issues: [], sendChecklist: [] };
  const CAMPAIGNS = (window.ET_CAMPAIGNS || []).slice();
  const MESSAGES = (window.ET_MESSAGES || []).slice();
  const PATH = window.ET_PATH || null;

  const DEFAULT_STATE = { plan: {}, drops: {}, outreach: [], articles: null, metrics: [], seq: {}, camp: {}, settings: { gate: "source" }, _v: 1 };
  let S = load();

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
      return Object.assign({}, DEFAULT_STATE, raw, {
        plan: raw.plan || {}, drops: raw.drops || {}, outreach: raw.outreach || [],
        metrics: raw.metrics || [], settings: Object.assign({}, DEFAULT_STATE.settings, raw.settings || {}),
        articles: raw.articles || null, seq: raw.seq || {}, camp: raw.camp || {},
      });
    } catch (e) { return JSON.parse(JSON.stringify(DEFAULT_STATE)); }
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(S)); }

  // articles = seed overlaid by user edits/additions (seed gives ids)
  function articles() {
    if (!S.articles) S.articles = JSON.parse(JSON.stringify(ARTICLE_SEED));
    return S.articles;
  }

  // ---------- gate ----------
  function initGate() {
    const gate = $("#gate"), input = $("#gate-input"), err = $("#gate-err");
    const PASS = "source"; // soft gate only
    const ok = () => { gate.classList.add("hidden"); $("#app").style.display = "block"; boot(); };
    if (localStorage.getItem("et_studio_gate") === "ok") return ok();
    const tryPass = () => {
      if ((input.value || "").trim().toLowerCase() === PASS) { localStorage.setItem("et_studio_gate", "ok"); ok(); }
      else { err.textContent = "Not it. (hint: where the craft is alive)"; input.value = ""; }
    };
    $("#gate-btn").addEventListener("click", tryPass);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") tryPass(); });
    input.focus();
  }

  // ---------- boot ----------
  let activeTab = "command";
  function boot() {
    $("#today-line").textContent = todayISO();
    setFocusLine();
    $$(".tab").forEach((b) => b.addEventListener("click", () => { setTab(b.dataset.tab); }));
    $("#btn-export").addEventListener("click", doExport);
    $("#btn-import").addEventListener("click", () => $("#file-import").click());
    $("#file-import").addEventListener("change", doImport);
    render();
  }
  function setTab(t) {
    activeTab = t;
    $$(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === t));
    render();
    window.scrollTo({ top: 0 });
  }
  function setFocusLine() {
    // during a live campaign, the standing focus is that campaign's next unticked step
    const live = CAMPAIGNS.find((c) => c.status === "live");
    if (live) {
      const next = campaignNextStep(live);
      if (next) {
        $("#focus-line").innerHTML = 'Do next → <span style="color:var(--paper)">' + esc(next.do) + "</span>";
        return;
      }
    }
    const wk = (PLAN.horizons || []).find((h) => h.id === "week");
    if (!wk) return;
    const items = wk.groups.flatMap((g) => g.items);
    const next = items.find((it) => !S.plan[it.id]);
    $("#focus-line").innerHTML = next
      ? 'Focus now → <span style="color:var(--paper)">' + esc(next.t) + "</span>"
      : '<span style="color:#94ad86">This week is clear — keep the daily drop running.</span>';
  }

  // first unticked step of a campaign's launch phase (shared with the Launch tab via S.seq)
  function campaignNextStep(c) {
    const ph = (LAUNCH.phases || []).find((p) => p.id === c.launchPhaseId);
    if (!ph) return null;
    return ph.steps.find((s) => !S.seq[s.id]) || null;
  }

  function render() {
    const v = $("#view"); v.innerHTML = "";
    ({ command: (n) => (window.ET_RENDER_COMMAND || renderCampaign)(n), news: (n) => (window.ET_RENDER_NEWS || renderCampaign)(n), people: (n) => (window.ET_RENDER_PEOPLE || renderCampaign)(n), campaign: renderCampaign, launch: renderLaunch, letter: renderLetter, plan: renderPlan, drop: renderDrop, ideas: renderIdeas, posts: renderPosts, outreach: renderOutreach, articles: renderArticles, metrics: renderMetrics }[activeTab] || renderCampaign)(v);
  }

  // ================= CAMPAIGN (the cockpit — home) =================
  function daysTo(dateStr, tz) {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr + "T23:59:59" + (tz || "+00:00")) - Date.now()) / 864e5);
  }
  function camp(cid) {
    if (!S.camp[cid]) S.camp[cid] = { seats: 0, confirmed: false, updated: "", pushedAt: "" };
    return S.camp[cid];
  }

  function renderCampaign(v) {
    v.appendChild(sectionHead("Campaign", "Your cockpit. What to do next, the clock, the real seat count, and every message one tap away. The whole plan is at the bottom."));

    // --- ONE THING banner ---
    if (PATH && PATH.oneThing) {
      const ot = el("div", { class: "panel", style: "padding:14px 18px; margin-bottom:18px; border-left:3px solid var(--ember);" });
      ot.appendChild(el("div", { class: "eyebrow", style: "margin-bottom:6px;", text: "The one thing that matters now" }));
      ot.appendChild(el("div", { style: "font-size:14.5px; line-height:1.55; color:var(--paper);", text: PATH.oneThing }));
      v.appendChild(ot);
    }

    CAMPAIGNS.forEach((c) => v.appendChild(c.status === "live" ? liveCampaignCard(c) : groundworkCard(c)));

    // --- message library ---
    if (MESSAGES.length) v.appendChild(messageLibrary());

    // --- the whole path ---
    if (PATH) v.appendChild(pathPanel());
  }

  function liveCampaignCard(c) {
    const st = camp(c.id);
    const wrap = el("div", { class: "panel", style: "padding:20px; margin-bottom:20px;" });
    wrap.appendChild(el("div", { class: "eyebrow", style: "color:var(--ember); margin-bottom:2px;", text: "Live campaign" }));
    wrap.appendChild(el("h3", { class: "font-serif", style: "font-size:22px; margin:0 0 2px;", text: c.name }));
    wrap.appendChild(el("div", { style: "color:var(--muted); font-size:13px; margin-bottom:16px;", text: c.partner }));

    // countdown strip
    const dGate = daysTo(c.deadline, c.tz), dEvent = daysTo(c.eventStart, c.tz);
    const need = Math.max(0, (c.goal || 0) - st.seats);
    const strip = el("div", { style: "display:flex; flex-wrap:wrap; gap:22px; margin-bottom:18px;" });
    const stat = (num, lab, warn) => {
      const b = el("div", {});
      b.appendChild(el("div", { class: "metric-num", style: "font-size:26px;" + (warn ? " color:var(--ember);" : ""), text: String(num) }));
      b.appendChild(el("div", { class: "font-mono", style: "font-size:10px; letter-spacing:.1em; color:var(--muted); text-transform:uppercase;", text: lab }));
      return b;
    };
    if (dGate != null) strip.appendChild(stat(dGate, "days to decide", dGate <= 14));
    strip.appendChild(stat(st.seats, "paid seats", false));
    strip.appendChild(stat(need, "still needed", need > 0 && dGate != null && dGate <= 21));
    if (dEvent != null) strip.appendChild(stat(dEvent, "days to the week", false));
    if (dGate != null && dGate > 0 && need > 0) strip.appendChild(stat((need / Math.max(1, dGate / 7)).toFixed(1), "seats / week pace", false));
    wrap.appendChild(strip);

    // next action (shared with Launch via S.seq)
    const next = campaignNextStep(c);
    if (next) {
      wrap.appendChild(el("div", { class: "eyebrow", style: "margin:6px 0 6px;", text: "Do next" }));
      const box = el("div", { class: "panel", style: "padding:2px 14px; background:rgba(255,255,255,.02);" });
      box.appendChild(seqRow(next));
      wrap.appendChild(box);
      wrap.appendChild(el("div", { style: "font-size:11.5px; color:var(--faint); margin:6px 0 14px;", text: "Ticking this also ticks it in the Launch tab. The full ordered list lives there." }));
    } else {
      wrap.appendChild(el("div", { style: "font-size:13px; color:#94ad86; margin:8px 0 14px;", text: "Every launch step is ticked. Keep the count honest and the letters shipping." }));
    }

    // live seat count entry
    wrap.appendChild(el("div", { class: "eyebrow", style: "margin:8px 0 6px;", text: "Record a paid seat" }));
    const row = el("div", { style: "display:flex; gap:10px; align-items:center; flex-wrap:wrap;" });
    const inp = el("input", { class: "fld", type: "number", min: "0", value: String(st.seats), style: "width:80px; text-align:center; font-size:18px;" });
    const commit = (val) => { st.seats = Math.max(0, val | 0); st.updated = todayISO(); save(); setFocusLine(); render(); };
    inp.addEventListener("change", () => commit(parseInt(inp.value || "0", 10)));
    row.appendChild(inp);
    row.appendChild(el("button", { class: "btn-primary", style: "padding:8px 14px; border-radius:9px; font-size:13px;", onclick: () => commit(st.seats + 1) }, "+1 paid"));
    row.appendChild(el("span", { style: "font-size:12px; color:var(--muted);", text: st.updated ? "updated " + st.updated : "not set yet" }));
    wrap.appendChild(row);
    wrap.appendChild(el("div", { style: "font-size:11.5px; color:var(--faint); margin-top:6px; line-height:1.5;", text: "REAL paid seats confirmed by the lab in writing. Never inflate — a made-up count is the one thing that breaks the whole campaign." }));

    // page-count reminder + "I pushed" stamp
    const rem = el("div", { class: "panel", style: "padding:10px 14px; margin-top:12px; border-left:3px solid var(--ember); background:rgba(210,138,82,.06);" });
    rem.appendChild(el("div", { style: "font-size:12.5px; line-height:1.5; color:var(--paper);", text: "The public page has its own count. When this changes, edit var " + (c.publicCountVar || "SEATS_TAKEN") + " in website/barcelona.html and push — same day (step lb-6)." }));
    const stampRow = el("div", { style: "display:flex; gap:10px; align-items:center; margin-top:8px;" });
    stampRow.appendChild(el("button", { class: "btn-ghost", style: "padding:6px 12px; border-radius:8px; font-size:12px;", onclick: () => { st.pushedAt = todayISO(); save(); render(); } }, "I updated the page"));
    if (st.updated && st.pushedAt !== st.updated) stampRow.appendChild(el("span", { class: "pill", style: "background:var(--ember); color:#1a1206;", text: "page is behind — push it" }));
    else if (st.pushedAt) stampRow.appendChild(el("span", { style: "font-size:12px; color:#94ad86;", text: "page synced " + st.pushedAt }));
    rem.appendChild(stampRow);
    wrap.appendChild(rem);

    // milestone callout
    const hit = (c.milestones || []).filter((m) => st.seats >= m.at).sort((a, b) => b.at - a.at)[0];
    if (hit) {
      const mc = el("div", { class: "panel", style: "padding:10px 14px; margin-top:12px; border-left:3px solid var(--sea);" });
      mc.appendChild(el("div", { class: "eyebrow", style: "color:var(--sea); margin-bottom:3px;", text: "At " + hit.at + " paid" }));
      mc.appendChild(el("div", { style: "font-size:13px; line-height:1.5; color:var(--paper);", text: hit.do }));
      wrap.appendChild(mc);
    }

    // quick links
    const links = el("div", { style: "display:flex; gap:8px; flex-wrap:wrap; margin-top:16px;" });
    (c.links || []).forEach((l) => {
      if (l.href) links.appendChild(linkBtn(l.label, l.href));
      else if (l.tab) links.appendChild(el("button", { class: "btn-ghost", style: "padding:8px 13px; border-radius:9px; font-size:12px;", onclick: () => setTab(l.tab) }, l.label + " →"));
    });
    links.appendChild(el("button", { class: "btn-ghost", style: "padding:8px 13px; border-radius:9px; font-size:12px;", onclick: () => setTab("launch") }, "Full checklist →"));
    wrap.appendChild(links);

    if (c.note) wrap.appendChild(el("div", { style: "font-size:11.5px; color:var(--faint); margin-top:12px; line-height:1.5;", text: c.note }));
    return wrap;
  }

  function groundworkCard(c) {
    const wrap = el("div", { class: "panel", style: "padding:16px 18px; margin-bottom:20px; opacity:.9;" });
    wrap.appendChild(el("div", { class: "eyebrow", style: "margin-bottom:2px;", text: "Groundwork — not selling yet" }));
    wrap.appendChild(el("h3", { class: "font-serif", style: "font-size:18px; margin:0 0 2px;", text: c.name }));
    wrap.appendChild(el("div", { style: "color:var(--muted); font-size:13px; margin-bottom:8px;", text: c.partner }));
    if (c.note) wrap.appendChild(el("div", { style: "font-size:12.5px; color:var(--faint); line-height:1.55; margin-bottom:10px;", text: c.note }));
    const next = campaignNextStep(c);
    if (next) { const box = el("div", { class: "panel", style: "padding:2px 14px; background:rgba(255,255,255,.02);" }); box.appendChild(seqRow(next)); wrap.appendChild(box); }
    return wrap;
  }

  function messageLibrary() {
    const wrap = el("div", { style: "margin-bottom:24px;" });
    wrap.appendChild(el("div", { class: "eyebrow", style: "margin:6px 0 4px;", text: "Messages — tap to copy" }));
    wrap.appendChild(el("p", { style: "color:var(--muted); font-size:13px; margin:0 0 14px; line-height:1.5;", text: "Counts and the deadline fill in automatically. Fill any [blank] before it will copy — that guard is what stops a fake number ever going out." }));
    MESSAGES.forEach((m) => wrap.appendChild(messageCard(m)));
    return wrap;
  }

  function autoFill(text, c) {
    const st = c ? camp(c.id) : null;
    const map = {
      SEATS: st ? String(st.seats) : "", GOAL: c && c.goal != null ? String(c.goal) : "",
      DEADLINE: c && c.deadline ? new Date(c.deadline + "T12:00").toLocaleDateString("en-GB", { day: "numeric", month: "long" }) : "",
      DAYS_LEFT: c ? String(daysTo(c.deadline, c.tz)) : "", PAGE: c ? c.page : "", PARTNER: c ? c.partner : "",
    };
    return text.replace(/\{(SEATS|GOAL|DEADLINE|DAYS_LEFT|PAGE|PARTNER)\}/g, (_, k) => map[k] || "{" + k + "}");
  }

  function messageCard(m) {
    const c = CAMPAIGNS.find((x) => x.id === m.campaign) || null;
    const card = el("div", { class: "panel", style: "padding:14px 16px; margin-bottom:12px;" });
    const head = el("div", { style: "display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:6px;" });
    head.appendChild(el("span", { class: "tag", text: m.kind }));
    head.appendChild(el("span", { style: "font-size:14px; color:var(--paper); font-weight:600;", text: m.label }));
    card.appendChild(head);
    if (m.when) card.appendChild(el("div", { class: "font-mono", style: "font-size:10.5px; color:var(--ember); letter-spacing:.06em; margin-bottom:8px;", text: m.when }));

    const inputs = {};
    (m.fields || []).forEach((f) => {
      const wrap = el("div", { style: "margin-bottom:6px;" });
      const i = el("input", { class: "fld", placeholder: f.toLowerCase(), style: "width:200px; font-size:13px;" });
      inputs[f] = i;
      wrap.appendChild(i);
      card.appendChild(wrap);
    });

    const pre = el("pre", { style: "white-space:pre-wrap; font-family:inherit; font-size:13px; line-height:1.55; color:var(--muted); margin:6px 0 10px; background:rgba(255,255,255,.02); padding:10px 12px; border-radius:8px;" });
    const build = () => {
      let t = autoFill(m.subject ? "Subject: " + m.subject + "\n\n" + m.text : m.text, c);
      (m.fields || []).forEach((f) => { const val = (inputs[f].value || "").trim(); if (val) t = t.split("{" + f + "}").join(val); });
      return t;
    };
    const refresh = () => { pre.textContent = build(); };
    (m.fields || []).forEach((f) => inputs[f].addEventListener("input", refresh));
    refresh();
    card.appendChild(pre);

    const acts = el("div", { style: "display:flex; gap:8px; flex-wrap:wrap;" });
    const doCopy = () => {
      const t = build();
      if (/\{[A-Z_]+\}/.test(t)) { toast("Fill the blanks first — no half-written messages, no fake counts."); return; }
      copy(t);
    };
    acts.appendChild(el("button", { class: "btn-primary", style: "padding:7px 14px; border-radius:9px; font-size:12.5px;", onclick: doCopy }, "Copy"));
    if (m.kind === "whatsapp" || m.kind === "story") {
      acts.appendChild(el("button", { class: "btn-ghost", style: "padding:7px 13px; border-radius:9px; font-size:12.5px;", onclick: () => { const t = build(); if (/\{[A-Z_]+\}/.test(t)) { toast("Fill the blanks first."); return; } window.open("https://wa.me/?text=" + encodeURIComponent(t), "_blank"); } }, "Open WhatsApp ↗"));
    }
    if (m.note) acts.appendChild(el("span", { style: "font-size:11.5px; color:var(--faint); align-self:center;", text: m.note }));
    card.appendChild(acts);
    return card;
  }

  function pathPanel() {
    const wrap = el("div", { style: "margin-top:10px; border-top:1px solid var(--line); padding-top:20px;" });
    wrap.appendChild(el("div", { class: "eyebrow", style: "margin-bottom:6px;", text: "The whole path — how EducatedTraveler gets built" }));
    if (PATH.north) wrap.appendChild(el("p", { style: "color:var(--muted); font-size:13px; line-height:1.6; margin:0 0 16px; max-width:760px;", text: PATH.north }));
    (PATH.stages || []).forEach((s) => {
      const row = el("div", { style: "display:flex; gap:14px; padding:11px 0; border-bottom:1px solid var(--line);" });
      row.appendChild(el("div", { class: "metric-num font-mono", style: "font-size:20px; color:var(--ember); flex:none; width:26px; text-align:center;", text: String(s.n) }));
      const body = el("div", { style: "flex:1;" });
      body.appendChild(el("div", { style: "font-size:14.5px; color:var(--paper); font-weight:600; margin-bottom:2px;", text: s.title }));
      body.appendChild(el("div", { style: "font-size:12.5px; color:var(--muted); line-height:1.55; margin-bottom:4px;", text: s.what }));
      body.appendChild(el("span", { class: "tag", text: "→ " + s.where }));
      row.appendChild(body);
      wrap.appendChild(row);
    });
    if (PATH.refuse && PATH.refuse.length) {
      wrap.appendChild(el("div", { class: "eyebrow", style: "margin:18px 0 8px;", text: "What we refuse (each one protects the trust)" }));
      const ul = el("ul", { style: "margin:0; padding-left:18px; color:var(--muted); font-size:12.5px; line-height:1.7;" });
      PATH.refuse.forEach((r) => ul.appendChild(el("li", { text: r })));
      wrap.appendChild(ul);
    }
    return wrap;
  }

  // ================= LAUNCH (ordered playbook) =================
  function renderLaunch(v) {
    v.appendChild(sectionHead("Launch", LAUNCH.intro || ""));

    // surfaces legend — clears up Daily Drop vs Posts vs Letter
    const leg = el("div", { class: "panel", style: "padding:16px 18px; margin-bottom:18px;" });
    leg.appendChild(el("div", { class: "eyebrow", style: "font-size:9.5px; margin-bottom:10px;", text: "What each tab is for" }));
    (LAUNCH.surfaces || []).forEach((s) => {
      const row = el("div", { style: "display:flex; gap:10px; padding:6px 0; font-size:13px; line-height:1.5;" });
      row.appendChild(el("span", { class: "pill in", style: "align-self:flex-start; flex:none;", text: s.name }));
      row.appendChild(el("span", { style: "color:var(--muted);", text: s.what }));
      leg.appendChild(row);
    });
    v.appendChild(leg);

    // progress
    const allSteps = (LAUNCH.phases || []).flatMap((p) => p.steps);
    const done = allSteps.filter((s) => S.seq[s.id]).length;
    const prog = el("div", { style: "display:flex; align-items:baseline; gap:10px; margin-bottom:16px;" });
    prog.appendChild(el("span", { class: "metric-num", style: "color:var(--ember);", text: done + "/" + allSteps.length }));
    prog.appendChild(el("span", { style: "color:var(--muted); font-size:13px;", text: "steps ticked" }));
    if (done) prog.appendChild(el("button", { class: "btn-ghost", style: "padding:5px 11px; border-radius:8px; font-size:11px; margin-left:auto;", onclick: () => { allSteps.forEach((s) => delete S.seq[s.id]); save(); render(); } }, "Reset"));
    v.appendChild(prog);

    (LAUNCH.phases || []).forEach((ph) => {
      v.appendChild(el("div", { class: "eyebrow", style: "margin:22px 0 4px;", text: ph.title }));
      if (ph.sub) v.appendChild(el("p", { style: "color:var(--muted); font-size:13px; margin:0 0 12px; line-height:1.5;", text: ph.sub }));
      const card = el("div", { class: "panel", style: "padding:6px 18px;" });
      ph.steps.forEach((s) => card.appendChild(seqRow(s)));
      v.appendChild(card);
    });
  }

  function seqRow(s) {
    const isDone = !!S.seq[s.id];
    const row = el("div", { class: "chk" + (isDone ? " done" : "") });
    const cb = el("input", { type: "checkbox" }); cb.checked = isDone;
    cb.addEventListener("change", () => { if (cb.checked) S.seq[s.id] = 1; else delete S.seq[s.id]; save(); row.classList.toggle("done", cb.checked); });
    const body = el("div", { style: "flex:1;" });
    const top = el("div", { style: "display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:3px;" });
    top.appendChild(el("span", { class: "font-mono", style: "font-size:10.5px; color:var(--ember); letter-spacing:.08em;", text: s.when }));
    if (s.where) top.appendChild(el("span", { class: "tag", text: "→ " + s.where }));
    body.appendChild(top);
    body.appendChild(el("div", { class: "chk-text", style: "font-size:14px; line-height:1.5;", text: s.do }));
    if (s.why) body.appendChild(el("div", { class: "chk-text", style: "font-size:12.5px; color:var(--faint); line-height:1.5; margin-top:3px;", text: s.why }));
    row.appendChild(cb); row.appendChild(body);
    return row;
  }

  // ================= LETTER (the Circle newsletter) =================
  function renderLetter(v) {
    v.appendChild(sectionHead("The Letter", LETTER.standfirst || ""));
    v.appendChild(el("p", { class: "font-mono", style: "font-size:11px; color:var(--sea); margin:-6px 0 18px; letter-spacing:.04em;", text: LETTER.cadence || "" }));

    // ---- one-click week drafter (Daily Drop place -> Letter + week of posts) ----
    if (DROP.length) {
      const drafter = el("div", { class: "panel", style: "padding:16px 18px; margin-bottom:22px;" });
      drafter.appendChild(el("div", { class: "eyebrow", style: "font-size:9.5px; color:var(--ember); margin-bottom:4px;", text: "Draft a week from a place" }));
      drafter.appendChild(el("p", { style: "font-size:12.5px; color:var(--muted); margin:0 0 10px; line-height:1.5;", text: "Pick a place from the Daily Drop. One click drafts the Letter — with a science beat matched to the craft — and the week of posts around it." }));
      const row = el("div", { style: "display:flex; gap:8px; flex-wrap:wrap; align-items:center;" });
      const sel = el("select", { style: "flex:1; min-width:220px;" });
      DROP.forEach((d, i) => sel.appendChild(el("option", { value: String(i), text: (d.discipline || "?") + " · " + (d.place || "?") })));
      row.appendChild(sel);
      const out = el("div", { style: "margin-top:14px;" });
      row.appendChild(el("button", { class: "btn-primary", style: "padding:9px 15px; border-radius:9px; font-size:12px;", onclick: () => { out.innerHTML = ""; const d = DROP[+sel.value]; if (d) renderWeekDraft(out, d); } }, "Draft the week"));
      drafter.appendChild(row);
      drafter.appendChild(out);
      v.appendChild(drafter);
    }

    // issues — copy/download ready
    v.appendChild(el("div", { class: "eyebrow", style: "margin:0 0 10px;", text: "Ready to send" }));
    (LETTER.issues || []).forEach((it) => v.appendChild(letterCard(it)));

    // repeatable structure
    v.appendChild(el("div", { class: "eyebrow", style: "margin:26px 0 10px; color:var(--ember);", text: "Write every issue to this shape" }));
    const sc = el("div", { class: "panel", style: "padding:6px 18px;" });
    (LETTER.structure || []).forEach((p) => {
      const row = el("div", { class: "chk" });
      row.appendChild(el("div", {}, [
        el("div", { style: "font-size:13.5px; color:var(--paper); margin-bottom:2px;", text: p.part }),
        el("div", { style: "font-size:12.5px; color:var(--muted); line-height:1.5;", text: p.note }),
      ]));
      sc.appendChild(row);
    });
    v.appendChild(sc);

    // science vault
    v.appendChild(el("div", { class: "eyebrow", style: "margin:26px 0 4px; color:var(--ember);", text: "Science vault — the why-it-remakes-you beat" }));
    v.appendChild(el("p", { style: "color:var(--faint); font-size:12px; margin:0 0 12px; line-height:1.5;", text: "Pull ONE into each letter (and into a Wednesday 'why this skill' card). Real research — cite the study if you quote a number." }));
    (LETTER.scienceVault || []).forEach((n) => {
      const card = el("div", { class: "panel", style: "padding:14px 16px; margin-bottom:10px;" });
      card.appendChild(el("div", { class: "font-serif", style: "font-size:16px; margin-bottom:5px;", text: n.claim }));
      card.appendChild(el("div", { style: "font-size:13px; color:var(--muted); line-height:1.55;", text: n.detail }));
      const f = el("div", { style: "display:flex; justify-content:space-between; align-items:center; margin-top:8px; gap:10px;" });
      f.appendChild(el("span", { class: "font-mono", style: "font-size:11px; color:var(--sea);", text: n.source }));
      f.appendChild(el("button", { class: "btn-ghost", style: "padding:4px 10px; border-radius:8px; font-size:11px;", onclick: () => copy(n.claim + " — " + n.detail + " (" + n.source + ")") }, "Copy"));
      card.appendChild(f);
      v.appendChild(card);
    });

    // send checklist
    v.appendChild(el("div", { class: "eyebrow", style: "margin:26px 0 10px;", text: "Before you hit send" }));
    const ck = el("div", { class: "panel", style: "padding:6px 18px;" });
    (LETTER.sendChecklist || []).forEach((t, i) => {
      const id = "letter-send-" + i;
      const dn = !!S.seq[id];
      const row = el("div", { class: "chk" + (dn ? " done" : "") });
      const cb = el("input", { type: "checkbox" }); cb.checked = dn;
      cb.addEventListener("change", () => { if (cb.checked) S.seq[id] = 1; else delete S.seq[id]; save(); row.classList.toggle("done", cb.checked); });
      row.appendChild(cb);
      row.appendChild(el("div", { class: "chk-text", style: "font-size:13.5px; line-height:1.5;", text: t }));
      ck.appendChild(row);
    });
    v.appendChild(ck);
  }

  function letterFullText(it) {
    const lines = ["SUBJECT: " + it.subject, "PREVIEW: " + it.preview, ""];
    if (it.portrait) lines.push("[Header image — your black-and-white portrait at the very top: educatedtraveler.app" + it.portrait + "]", "");
    lines.push(it.body, "", it.ps || "");
    return lines.join("\n").trim();
  }

  // ---- week drafter: turn a Daily Drop place into a Letter draft + week of posts ----
  function nuggetForCore(d) {
    const vault = LETTER.scienceVault || [];
    if (!vault.length) return { claim: "", detail: "", source: "" };
    const map = { adventure: [4, 0], culinary: [1, 0], creative: [0, 2], wellness: [2, 4] };
    const arr = map[d.core] || [0];
    const idx = arr[Math.max(0, (d.day || 1) - 1) % arr.length];
    return vault[idx] || vault[0];
  }
  function draftLetterFromDrop(d) {
    const paras = String(d.caption || "").split("\n\n");
    const hook = (paras[0] || "").trim();
    const ctx = (paras[1] || "").trim();
    const seasonLine = (String(d.caption || "").split("\n").find((l) => /Season:|Community strength/i.test(l)) || "").trim();
    const sci = nuggetForCore(d);
    const disc = d.discipline || "this craft";
    // single-word craft -> lower-case it in prose ("freediving"); multi-word stays as titled
    const discL = disc.trim().split(/\s+/).length === 1 ? disc.charAt(0).toLowerCase() + disc.slice(1) : disc;
    const subject = (d.place || "") + ": where " + discL + " is still alive";
    const preview = "One place where " + discL + " is genuinely alive, the people who keep it, and what learning it does to you.";
    const body = [
      "Hello —", "",
      "This week, one place — " + (d.place || "") + " — and one skill: " + disc + ".", "",
      hook,
    ].concat(ctx ? ["", ctx] : []).concat([
      "",
      sci.detail + " (" + sci.source + ") — which is the quiet case for learning " + discL + " where it's still alive, with a teacher's hand on yours, not off a screen.", "",
      "The people: " + (d.footageSource ? (d.footageSource + " is the kind of school we'd point a friend to — ") : "") + "confirm the credential and why them straight from the Atlas page; never invent one.", "",
      "How to go: " + (seasonLine ? seasonLine + " " : "") + "Start with the first real course and let the place do the rest. The full page, with the community rank and the way in:",
      d.atlasUrl || "educatedtraveler.app",
      "", "— Arnaud",
    ]).join("\n");
    const ps = "P.S. Not " + discL + "? Reply and tell me your skill — the map is wide. And forward this to the friend who keeps saying 'one day.'";
    return { subject, preview, body, ps, science: sci };
  }
  function weekPlanFromDrop(d) {
    const disc = d.discipline || "the craft";
    const sci = nuggetForCore(d);
    return [
      "THE WEEK · " + disc + " · " + (d.place || ""), "",
      "Mon — Send the Circle Letter above (this place + the science beat).",
      "Tue — Place reel: the " + disc + " clip" + (d.footageSource ? (" (" + d.footageSource + " footage — with permission + credit)") : "") + " → " + (d.atlasUrl || ""),
      "Wed — 'Why this skill' card from the science beat: \"" + sci.claim + "\" (" + sci.source + ").",
      "Thu — Story: a Question or this-or-that Poll about " + disc + ".",
      "Fri — One library post (a Circle or Become carousel) routing to the Atlas + the Circle.",
      "Sat/Sun — Reshare the best replies, answer DMs, rest. Hold the rhythm.",
    ].join("\n");
  }
  function renderWeekDraft(container, d) {
    const draft = draftLetterFromDrop(d);
    const full = "SUBJECT: " + draft.subject + "\nPREVIEW: " + draft.preview + "\n\n" + draft.body + "\n\n" + draft.ps;
    const plan = weekPlanFromDrop(d);
    const slug = String(d.discipline || "week").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const card = el("div", { class: "panel", style: "padding:16px 18px; margin-bottom:12px; border-color:rgba(210,138,82,0.3);" });
    card.appendChild(el("div", { class: "font-mono", style: "font-size:11px; color:var(--faint); margin-bottom:6px;", text: "Draft letter · edit before sending · verify the school from the Atlas" }));
    card.appendChild(el("div", { class: "eyebrow", style: "font-size:9.5px; margin:4px 0 4px;", text: "Subject" }));
    card.appendChild(el("div", { style: "font-size:14px; color:var(--paper); margin-bottom:6px;", text: draft.subject }));
    card.appendChild(el("div", { class: "eyebrow", style: "font-size:9.5px; margin:4px 0 4px;", text: "Preview" }));
    card.appendChild(el("div", { style: "font-size:13px; color:var(--muted); margin-bottom:8px;", text: draft.preview }));
    card.appendChild(el("pre", { style: "white-space:pre-wrap; font-family:inherit; font-size:13.5px; line-height:1.6; color:rgba(243,237,226,0.86); background:rgba(243,237,226,0.03); border:1px solid var(--line); border-radius:10px; padding:14px; margin:0;", text: draft.body + "\n\n" + draft.ps }));
    const a1 = el("div", { style: "display:flex; gap:8px; flex-wrap:wrap; margin-top:12px;" });
    a1.appendChild(el("button", { class: "btn-primary", style: "padding:8px 13px; border-radius:9px; font-size:12px;", onclick: () => copy(full) }, "Copy letter"));
    a1.appendChild(el("button", { class: "btn-ghost", style: "padding:8px 13px; border-radius:9px; font-size:12px;", onclick: () => copy(full + "\n\n----\n\n" + plan) }, "Copy whole week"));
    a1.appendChild(el("button", { class: "btn-ghost", style: "padding:8px 13px; border-radius:9px; font-size:12px;", onclick: () => download("et-week-" + slug + ".txt", full + "\n\n----\n\n" + plan) }, "Download .txt"));
    card.appendChild(a1);
    container.appendChild(card);

    const pc = el("div", { class: "panel", style: "padding:14px 16px;" });
    pc.appendChild(el("div", { class: "eyebrow", style: "font-size:9.5px; margin-bottom:6px; color:var(--sea);", text: "The week of posts around it" }));
    pc.appendChild(el("pre", { style: "white-space:pre-wrap; font-family:inherit; font-size:13px; line-height:1.6; color:var(--muted); margin:0;", text: plan }));
    container.appendChild(pc);
    toast("Drafted the week for " + (d.place || ""));
  }
  function letterCard(it) {
    const card = el("div", { class: "panel", style: "padding:18px 20px; margin-bottom:14px;" });
    card.appendChild(el("div", { class: "font-mono", style: "font-size:11px; color:var(--faint); margin-bottom:4px;", text: it.kind || "" }));
    card.appendChild(el("div", { class: "font-serif", style: "font-size:19px; margin-bottom:10px;", text: it.title }));
    if (it.portrait) {
      const fig = el("div", { style: "margin:0 0 12px;" });
      fig.appendChild(el("img", { src: it.portrait, loading: "lazy", style: "display:block; width:170px; max-width:48%; height:auto; border-radius:10px; border:1px solid var(--line); filter:grayscale(1);" }));
      fig.appendChild(el("div", { class: "font-mono", style: "font-size:10.5px; color:var(--faint); margin-top:5px;", text: "Header image — place this at the top of the email." }));
      card.appendChild(fig);
    }
    card.appendChild(el("div", { class: "eyebrow", style: "font-size:9.5px; margin:6px 0 4px;", text: "Subject line" }));
    card.appendChild(el("div", { style: "font-size:14px; color:var(--paper); margin-bottom:8px;", text: it.subject }));
    card.appendChild(el("div", { class: "eyebrow", style: "font-size:9.5px; margin:6px 0 4px;", text: "Preview text" }));
    card.appendChild(el("div", { style: "font-size:13px; color:var(--muted); margin-bottom:10px;", text: it.preview }));
    card.appendChild(el("div", { class: "eyebrow", style: "font-size:9.5px; margin:6px 0 6px;", text: "Letter (paste-ready)" }));
    card.appendChild(el("pre", { style: "white-space:pre-wrap; font-family:inherit; font-size:13.5px; line-height:1.62; color:rgba(243,237,226,0.86); background:rgba(243,237,226,0.03); border:1px solid var(--line); border-radius:10px; padding:14px; margin:0;", text: it.body + "\n\n" + (it.ps || "") }));
    const acts = el("div", { style: "display:flex; gap:8px; flex-wrap:wrap; margin-top:14px;" });
    acts.appendChild(el("button", { class: "btn-primary", style: "padding:8px 13px; border-radius:9px; font-size:12px;", onclick: () => copy(letterFullText(it)) }, "Copy full letter"));
    acts.appendChild(el("button", { class: "btn-ghost", style: "padding:8px 13px; border-radius:9px; font-size:12px;", onclick: () => download("et-letter-" + it.id + ".txt", letterFullText(it)) }, "Download .txt"));
    card.appendChild(acts);
    return card;
  }

  // ================= PLAN =================
  function renderPlan(v) {
    v.appendChild(sectionHead("The Plan", "How to grow EducatedTraveler — week, weeks, months. One north star: grow the audience, not the machinery."));

    // North star + the one metric
    const ns = el("div", { class: "panel", style: "padding:20px; margin-bottom:22px;" });
    ns.innerHTML =
      '<div class="eyebrow" style="margin-bottom:8px;">North star</div>' +
      '<p class="font-serif" style="font-size:20px; margin:0 0 14px; line-height:1.4;">' + esc(PLAN.northStar || "") + "</p>" +
      '<div style="display:flex; gap:20px; flex-wrap:wrap;">' +
      '<div><div class="eyebrow" style="margin-bottom:4px;">The one metric (90 days)</div><div style="color:var(--paper); font-size:14px;">' + esc(PLAN.oneMetric || "") + "</div></div>" +
      "</div>";
    v.appendChild(ns);

    // Do-not-build
    if (PLAN.stop && PLAN.stop.length) {
      const stop = el("div", { class: "panel", style: "padding:18px; margin-bottom:24px; border-color: rgba(207,143,110,.3);" });
      stop.appendChild(el("div", { class: "eyebrow", style: "color:#cf8f6e; margin-bottom:10px;", text: "Stop / do not build" }));
      const ul = el("ul", { style: "margin:0; padding-left:18px; color:var(--muted); font-size:13.5px; line-height:1.8;" });
      PLAN.stop.forEach((s) => ul.appendChild(el("li", { text: s })));
      stop.appendChild(ul);
      v.appendChild(stop);
    }

    // progress
    const allItems = (PLAN.horizons || []).flatMap((h) => h.groups.flatMap((g) => g.items));
    const done = allItems.filter((it) => S.plan[it.id]).length;
    v.appendChild(el("div", { class: "font-mono", style: "font-size:12px; color:var(--faint); margin-bottom:18px;", text: done + " / " + allItems.length + " done across all horizons" }));

    (PLAN.horizons || []).forEach((h) => {
      const wrap = el("div", { style: "margin-bottom:30px;" });
      wrap.appendChild(el("h3", { class: "font-serif", style: "font-size:22px; margin:0 0 4px;", text: h.title }));
      if (h.sub) wrap.appendChild(el("p", { style: "color:var(--muted); font-size:13px; margin:0 0 16px;", text: h.sub }));
      h.groups.forEach((g) => {
        const card = el("div", { class: "panel", style: "padding:18px 20px; margin-bottom:14px;" });
        const head = el("div", { style: "display:flex; justify-content:space-between; align-items:baseline; gap:12px; margin-bottom:6px;" });
        head.appendChild(el("div", { class: "font-serif", style: "font-size:16px;", text: g.title }));
        if (g.metric) head.appendChild(el("div", { class: "font-mono", style: "font-size:11px; color:var(--sea); text-align:right;", text: "✓ " + g.metric }));
        card.appendChild(head);
        if (g.goal) card.appendChild(el("p", { style: "color:var(--muted); font-size:13px; margin:0 0 8px;", text: g.goal }));
        g.items.forEach((it) => card.appendChild(planItem(it)));
        wrap.appendChild(card);
      });
      v.appendChild(wrap);
    });

    // weekly cadence + dashboard refs
    if (PLAN.cadence && PLAN.cadence.length) {
      const c = el("div", { class: "panel", style: "padding:18px 20px; margin-bottom:14px;" });
      c.appendChild(el("div", { class: "eyebrow", style: "margin-bottom:10px;", text: "Weekly operating rhythm" }));
      const ul = el("ul", { style: "margin:0; padding-left:18px; color:var(--muted); font-size:13.5px; line-height:1.9;" });
      PLAN.cadence.forEach((x) => ul.appendChild(el("li", { html: x })));
      c.appendChild(ul); v.appendChild(c);
    }
  }
  function planItem(it) {
    const done = !!S.plan[it.id];
    const row = el("div", { class: "chk" + (done ? " done" : "") });
    const cb = el("input", { type: "checkbox" }); cb.checked = done;
    cb.addEventListener("change", () => { S.plan[it.id] = cb.checked; if (!cb.checked) delete S.plan[it.id]; save(); row.classList.toggle("done", cb.checked); setFocusLine(); });
    row.appendChild(cb);
    const body = el("div", { style: "flex:1;" });
    body.appendChild(el("div", { class: "chk-text", style: "font-size:14px; line-height:1.5;", text: it.t }));
    const meta = el("div", { style: "display:flex; gap:6px; margin-top:6px; flex-wrap:wrap; align-items:center;" });
    if (it.done) meta.appendChild(el("span", { class: "tag", style: "color:var(--faint)", text: "done when: " + it.done }));
    if (it.effort) meta.appendChild(el("span", { class: "tag " + (it.effort === "Quick" ? "quick" : ""), text: it.effort }));
    if (it.impact) meta.appendChild(el("span", { class: "tag " + (it.impact === "High" ? "high" : "med"), text: it.impact + " impact" }));
    if (meta.children.length) body.appendChild(meta);
    row.appendChild(body);
    return row;
  }

  // ================= DAILY DROP =================
  const DROP_STATUSES = ["idea", "requested", "in", "editing", "ready", "posted"];
  const DROP_LABELS = { idea: "idea", requested: "footage asked", in: "footage in", editing: "editing", ready: "ready", posted: "posted" };
  function dropState(day) { return S.drops[day] || (S.drops[day] = { status: "idea" }); }

  function renderDrop(v) {
    v.appendChild(sectionHead("Daily Drop", "One wordless 30–60s craft clip a day → TikTok + Reels + Shorts, same clip, one account. Footage from the schools (that ask = partner recruitment). Never vary the format before day 90."));

    // progress strip
    const counts = DROP_STATUSES.reduce((a, s) => ((a[s] = 0), a), {});
    DROP.forEach((d) => counts[dropState(d.day).status]++);
    const strip = el("div", { style: "display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px;" });
    DROP_STATUSES.forEach((s) => strip.appendChild(el("span", { class: "pill " + s, text: DROP_LABELS[s] + " · " + counts[s] })));
    v.appendChild(strip);

    // view toggle
    const toggle = el("div", { style: "display:flex; gap:8px; margin-bottom:20px;" });
    const mkT = (id, label) => el("button", { class: dropView === id ? "btn-primary" : "btn-ghost", style: "padding:7px 14px; border-radius:9px; font-size:12px;", onclick: () => { dropView = id; render(); } }, label);
    toggle.appendChild(mkT("feed", "Feed")); toggle.appendChild(mkT("board", "Board"));
    v.appendChild(toggle);

    if (dropView === "board") return renderDropBoard(v);

    // next-up hero = first not-posted
    const next = DROP.find((d) => dropState(d.day).status !== "posted") || DROP[0];
    if (next) { v.appendChild(el("div", { class: "eyebrow", style: "margin-bottom:10px;", text: "Next up" })); v.appendChild(dropCard(next, true)); }

    v.appendChild(el("div", { class: "eyebrow", style: "margin:26px 0 10px;", text: "Full 30-day rotation" }));
    DROP.forEach((d) => { if (!next || d.day !== next.day) v.appendChild(dropCard(d, false)); });
  }

  function renderDropBoard(v) {
    const board = el("div", { class: "kanban" });
    DROP_STATUSES.forEach((s) => {
      const col = el("div", {});
      col.appendChild(el("div", { style: "display:flex; justify-content:space-between; margin-bottom:10px;" }, [
        el("span", { class: "pill " + s, text: DROP_LABELS[s] }),
      ]));
      DROP.filter((d) => dropState(d.day).status === s).forEach((d) => {
        const c = el("div", { class: "panel", style: "padding:11px 12px; margin-bottom:10px; cursor:pointer;", onclick: () => { dropView = "feed"; render(); setTimeout(() => { const t = document.getElementById("drop-" + d.day); if (t) t.scrollIntoView({ behavior: "smooth", block: "center" }); }, 60); } });
        c.appendChild(el("div", { style: "display:flex; gap:7px; align-items:center; margin-bottom:4px;" }, [
          el("span", { class: "core-dot core-" + d.core }), el("span", { class: "font-mono", style: "font-size:10px; color:var(--faint);", text: "Day " + d.day }),
        ]));
        c.appendChild(el("div", { style: "font-size:13px; line-height:1.35;", text: d.discipline }));
        c.appendChild(el("div", { style: "font-size:11px; color:var(--muted); margin-top:2px;", text: d.place }));
        col.appendChild(c);
      });
      board.appendChild(col);
    });
    v.appendChild(board);
  }

  function dropCard(d, hero) {
    const st = dropState(d.day);
    const card = el("div", { class: "panel", id: "drop-" + d.day, style: "padding:18px 20px; margin-bottom:14px;" });
    const head = el("div", { style: "display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap;" });
    const left = el("div", {}, [
      el("div", { style: "display:flex; gap:8px; align-items:center; margin-bottom:5px;" }, [
        el("span", { class: "core-dot core-" + d.core }),
        el("span", { class: "font-mono", style: "font-size:11px; color:var(--faint);", text: "Day " + d.day + " · " + d.core }),
      ]),
      el("div", { class: "font-serif", style: "font-size:" + (hero ? "21px" : "17px") + ";", text: d.discipline }),
      el("div", { style: "font-size:13px; color:var(--muted); margin-top:2px;", text: d.place }),
    ]);
    head.appendChild(left);
    // status selector
    const sel = el("select", { style: "width:auto; min-width:140px; font-size:12px; padding:7px 10px;" });
    DROP_STATUSES.forEach((s) => sel.appendChild(el("option", { value: s, text: DROP_LABELS[s] })));
    sel.value = st.status;
    sel.addEventListener("change", () => { st.status = sel.value; if (sel.value === "posted") st.postedAt = todayISO(); save(); if (dropView === "board" || hero) render(); else { const p = card.querySelector(".drop-pill"); if (p) { p.className = "pill " + sel.value + " drop-pill"; p.textContent = DROP_LABELS[sel.value]; } } setFocusLine(); });
    head.appendChild(sel);
    card.appendChild(head);

    // brief
    card.appendChild(el("p", { style: "font-size:12.5px; color:var(--faint); margin:14px 0 4px; font-style:italic;", text: d.clipBrief }));

    // caption (editable)
    const capWrap = el("div", { style: "margin-top:12px;" });
    capWrap.appendChild(el("label", { class: "fld", text: "Caption (TikTok / Reels / Shorts — identical)" }));
    const ta = el("textarea", { rows: hero ? "9" : "7" }); ta.value = st.caption != null ? st.caption : d.caption;
    ta.addEventListener("input", () => { st.caption = ta.value; save(); });
    capWrap.appendChild(ta);
    card.appendChild(capWrap);

    // footage line
    if (d.footageSource) {
      const f = el("div", { style: "font-size:12px; color:var(--muted); margin-top:10px;" });
      f.innerHTML = 'Footage: <span style="color:var(--paper)">' + esc(d.footageSource) + "</span>" + (d.footageUrl ? ' · <a class="link-quiet" href="' + esc(d.footageUrl) + '" target="_blank" rel="noopener">source ↗</a>' : "");
      card.appendChild(f);
    }

    // actions
    const acts = el("div", { style: "display:flex; gap:8px; flex-wrap:wrap; margin-top:16px;" });
    const a = (label, cls, fn) => el("button", { class: cls, style: "padding:8px 13px; border-radius:9px; font-size:12px;", onclick: fn }, label);
    acts.appendChild(a("Share / post", "btn-primary", () => shareOrCopy(ta.value, d.discipline + " — " + d.place)));
    acts.appendChild(a("Copy caption", "btn-ghost", () => copy(ta.value)));
    acts.appendChild(a("Request footage", "btn-ghost", () => openOutreachFor(d)));
    acts.appendChild(linkBtn("Instagram", "https://www.instagram.com/"));
    acts.appendChild(linkBtn("TikTok", "https://www.tiktok.com/upload"));
    acts.appendChild(linkBtn("Shorts", "https://www.youtube.com/upload"));
    acts.appendChild(linkBtn("Atlas page", d.atlasUrl));
    card.appendChild(acts);
    return card;
  }
  function linkBtn(label, href) { return el("a", { class: "btn-ghost", style: "padding:8px 13px; border-radius:9px; font-size:12px; text-decoration:none; display:inline-block;", href: href, target: "_blank", rel: "noopener" }, label + " ↗"); }
  let dropView = "feed";

  // ================= IDEAS =================
  function renderIdeas(v) {
    v.appendChild(sectionHead("Ideas", "Your ready-to-shoot first 10, plus the creative library. One wordless process clip per craft — end on the moment of competence, same clip to all 3 platforms, each pointing at one Atlas page. Optimise for saves + shares, not views."));

    v.appendChild(el("div", { class: "eyebrow", style: "margin:4px 0 12px;", text: "Start here — your first 10 posts" }));
    IDEAS.shotList.forEach((s) => v.appendChild(ideaCard(s)));

    v.appendChild(el("div", { class: "eyebrow", style: "margin:30px 0 12px;", text: "Creative library" }));
    v.appendChild(refBlock("Hook library — line 1 is a standalone, screenshot-able fact", IDEAS.hooks.map((h) =>
      "<strong>" + esc(h.name) + "</strong> — <span style='color:var(--muted)'>" + esc(h.template) + "</span><br><span style='color:var(--faint);font-style:italic'>e.g. " + esc(h.example) + "</span>")));
    v.appendChild(refBlock("Recurring series (all inside the one format)", IDEAS.series.map((s) =>
      "<strong>" + esc(s.name) + "</strong> — <span style='color:var(--muted)'>" + esc(s.note) + "</span>")));
    v.appendChild(refBlock("Engineer for saves & shares", IDEAS.saveTriggers.map((t) => "<span style='color:var(--muted)'>" + esc(t) + "</span>")));
    v.appendChild(refBlock("Never post this", IDEAS.neverPost.map((t) => "<span style='color:var(--muted)'>" + esc(t) + "</span>"), true));
  }

  function ideaCard(s) {
    const card = el("div", { class: "panel", style: "padding:18px 20px; margin-bottom:14px;" });
    const head = el("div", { style: "display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap;" });
    head.appendChild(el("div", {}, [
      el("div", { style: "display:flex; gap:8px; align-items:center; margin-bottom:5px; flex-wrap:wrap;" }, [
        el("span", { class: "font-mono", style: "font-size:11px; color:var(--faint);", text: "#" + s.n }),
        el("span", { class: "core-dot core-" + s.core }),
        el("span", { class: "font-mono", style: "font-size:11px; color:var(--faint);", text: s.core }),
        s.lead ? el("span", { class: "pill ready", text: "shoot it yourself" }) : null,
      ]),
      el("div", { class: "font-serif", style: "font-size:18px;", text: s.craft }),
      el("div", { style: "font-size:13px; color:var(--muted); margin-top:2px;", text: s.place }),
    ]));
    head.appendChild(el("span", { class: "pill", style: "align-self:flex-start;", text: "card: " + s.placeCard }));
    card.appendChild(head);

    card.appendChild(el("div", { style: "font-size:12px; color:var(--faint); margin:12px 0 0;", text: "Footage: " + s.footage }));

    card.appendChild(el("div", { class: "eyebrow", style: "font-size:9.5px; margin:14px 0 6px;", text: "Shoot these beats" }));
    const ol = el("ol", { style: "margin:0; padding-left:20px; font-size:13.5px; line-height:1.7;" });
    s.beats.forEach((b) => ol.appendChild(el("li", { text: b })));
    card.appendChild(ol);

    card.appendChild(el("p", { style: "font-size:13.5px; margin:12px 0 0;", html: "<strong style='color:#94ad86'>End on:</strong> " + esc(s.ending) }));
    card.appendChild(el("p", { style: "font-size:12.5px; color:var(--muted); margin:6px 0 0;", text: "Sound: " + s.sound + "   ·   Cover: " + s.cover }));

    card.appendChild(el("div", { class: "eyebrow", style: "font-size:9.5px; margin:14px 0 6px;", text: "Caption (paste-ready)" }));
    card.appendChild(el("pre", { style: "white-space:pre-wrap; font-family:inherit; font-size:13.5px; line-height:1.6; color:rgba(243,237,226,0.82); background:rgba(243,237,226,0.03); border:1px solid var(--line); border-radius:10px; padding:14px; margin:0;", text: s.caption }));
    card.appendChild(el("p", { class: "font-mono", style: "font-size:12px; color:var(--sea); margin:8px 0 0; word-break:break-word;", text: s.hashtags }));

    const acts = el("div", { style: "display:flex; gap:8px; flex-wrap:wrap; margin-top:14px;" });
    acts.appendChild(el("button", { class: "btn-primary", style: "padding:8px 13px; border-radius:9px; font-size:12px;", onclick: () => copy(s.caption + "\n\n" + s.hashtags) }, "Copy caption + tags"));
    acts.appendChild(el("button", { class: "btn-ghost", style: "padding:8px 13px; border-radius:9px; font-size:12px;", onclick: () => copy(s.beats.map((b, i) => (i + 1) + ". " + b).join("\n") + "\nEnd on: " + s.ending) }, "Copy shot list"));
    acts.appendChild(linkBtn("Atlas page", s.atlasUrl));
    card.appendChild(acts);
    return card;
  }

  function refBlock(title, htmlItems, open) {
    const d = el("details", { class: "panel", style: "padding:14px 18px; margin-bottom:12px;" });
    if (open) d.setAttribute("open", "");
    d.appendChild(el("summary", { class: "font-serif", style: "font-size:15px; cursor:pointer;", text: title }));
    const ul = el("ul", { style: "margin:12px 0 0; padding-left:18px; line-height:1.9; font-size:13.5px;" });
    htmlItems.forEach((h) => ul.appendChild(el("li", { html: h })));
    d.appendChild(ul);
    return d;
  }

  // ================= POSTS =================
  function renderPosts(v) {
    v.appendChild(sectionHead("Posts", "Ready-to-publish posts. Copy the caption or download it as a text file — each routes to ONE Atlas page or the Circle. Voice-locked: connect, never sell. The Circle (the letter) is the hero; video is a feeder."));

    if (!POSTS.length) { v.appendChild(el("p", { style: "color:var(--faint); font-size:13px;", text: "No posts loaded (studio-posts.js missing)." })); return; }

    const top = el("div", { style: "display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px;" });
    top.appendChild(el("button", { class: "btn-ghost", style: "padding:8px 13px; border-radius:9px; font-size:12px;", onclick: () => download("et-posts-" + todayISO() + ".md", allPostsText()) }, "Download all posts (.md)"));
    v.appendChild(top);

    POSTS.forEach((p) => v.appendChild(postCard(p)));
  }

  function postCard(p) {
    const card = el("div", { class: "panel", style: "padding:18px 20px; margin-bottom:14px;" });
    const head = el("div", { style: "display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap;" });
    head.appendChild(el("div", {}, [
      el("div", { style: "display:flex; gap:8px; align-items:center; margin-bottom:5px; flex-wrap:wrap;" }, [
        p.core ? el("span", { class: "core-dot core-" + p.core }) : null,
        el("span", { class: "font-mono", style: "font-size:11px; color:var(--faint);", text: p.format }),
      ]),
      el("div", { class: "font-serif", style: "font-size:18px;", text: p.title }),
    ]));
    if (p.linkLabel) head.appendChild(el("span", { class: "pill", style: "align-self:flex-start;", text: "→ " + p.linkLabel }));
    card.appendChild(head);

    if (p.images && p.images.length) {
      const ih = el("div", { style: "display:flex; justify-content:space-between; align-items:baseline; gap:10px; margin:16px 0 8px; flex-wrap:wrap;" });
      ih.appendChild(el("div", { class: "eyebrow", style: "font-size:9.5px; color:var(--ember);", text: "Branded images · ET design" }));
      ih.appendChild(el("button", { class: "btn-ghost", style: "padding:5px 11px; border-radius:8px; font-size:11px;", onclick: () => downloadImages(p) }, "Download all images"));
      card.appendChild(ih);
      if (p.imageNote) card.appendChild(el("p", { style: "font-size:12px; color:var(--faint); margin:0 0 10px; line-height:1.5;", text: p.imageNote }));
      const strip = el("div", { style: "display:flex; gap:10px; overflow-x:auto; padding-bottom:6px;" });
      p.images.forEach((src, i) => {
        const cell = el("a", { href: src, download: imgName(p, i), title: "Download " + imgName(p, i), style: "flex:none; display:block; text-decoration:none;" });
        cell.appendChild(el("img", { src: src, loading: "lazy", style: "display:block; height:150px; width:auto; border-radius:8px; border:1px solid var(--line);" }));
        cell.appendChild(el("div", { class: "font-mono", style: "font-size:10px; color:var(--faint); text-align:center; margin-top:5px;", text: (i + 1) + " ↓" }));
        strip.appendChild(cell);
      });
      card.appendChild(strip);
    }

    if (p.slides && p.slides.length) {
      card.appendChild(el("div", { class: "eyebrow", style: "font-size:9.5px; margin:14px 0 6px;", text: "Carousel slides" }));
      const ol = el("ol", { style: "margin:0; padding-left:20px; font-size:13.5px; line-height:1.7;" });
      p.slides.forEach((s) => ol.appendChild(el("li", { text: s })));
      card.appendChild(ol);
    }

    if (p.story && p.story.length) {
      card.appendChild(el("div", { class: "eyebrow", style: "font-size:9.5px; margin:14px 0 6px;", text: "Story frames" }));
      const ol = el("ol", { style: "margin:0; padding-left:20px; font-size:13.5px; line-height:1.7;" });
      p.story.forEach((s) => ol.appendChild(el("li", { text: s })));
      card.appendChild(ol);
    }

    card.appendChild(el("div", { class: "eyebrow", style: "font-size:9.5px; margin:14px 0 6px;", text: p.story ? "Reshare / DM text (paste-ready)" : "Caption (paste-ready)" }));
    card.appendChild(el("pre", { style: "white-space:pre-wrap; font-family:inherit; font-size:13.5px; line-height:1.6; color:rgba(243,237,226,0.82); background:rgba(243,237,226,0.03); border:1px solid var(--line); border-radius:10px; padding:14px; margin:0;", text: p.caption }));
    if (p.hashtags) card.appendChild(el("p", { class: "font-mono", style: "font-size:12px; color:var(--sea); margin:8px 0 0; word-break:break-word;", text: p.hashtags }));
    if (p.strategy) {
      card.appendChild(el("div", { class: "eyebrow", style: "font-size:9.5px; margin:16px 0 6px; color:var(--ember);", text: "Posting strategy" }));
      card.appendChild(el("p", { style: "font-size:12.5px; line-height:1.7; color:var(--muted); margin:0;", text: p.strategy }));
    }

    const acts = el("div", { style: "display:flex; gap:8px; flex-wrap:wrap; margin-top:14px;" });
    acts.appendChild(el("button", { class: "btn-primary", style: "padding:8px 13px; border-radius:9px; font-size:12px;", onclick: () => copy(postCopyText(p)) }, "Copy caption + tags"));
    acts.appendChild(el("button", { class: "btn-ghost", style: "padding:8px 13px; border-radius:9px; font-size:12px;", onclick: () => download(postFileName(p), postDownloadText(p)) }, "Download .txt"));
    if (p.link) acts.appendChild(linkBtn(p.linkLabel || "Open link", p.link));
    card.appendChild(acts);
    return card;
  }

  function imgName(p, i) { return "et-" + (p.id || "x") + "-" + String(i + 1).padStart(2, "0") + ".png"; }
  function downloadImages(p) {
    (p.images || []).forEach((src, i) => {
      const a = el("a", { href: src, download: imgName(p, i) });
      document.body.appendChild(a); a.click(); a.remove();
    });
    toast("Saving " + (p.images || []).length + " images");
  }

  function postCopyText(p) { return p.hashtags ? p.caption + "\n\n" + p.hashtags : p.caption; }
  function postFileName(p) { return "et-post-" + (p.id || "x") + ".txt"; }
  function postDownloadText(p) {
    const lines = [p.title, p.format + (p.linkLabel ? "  ·  -> " + p.linkLabel : ""), ""];
    if (p.slides && p.slides.length) { lines.push("CAROUSEL SLIDES:"); p.slides.forEach((s, i) => lines.push("  " + (i + 1) + ". " + s)); lines.push(""); }
    if (p.story && p.story.length) { lines.push("STORY FRAMES:"); p.story.forEach((s) => lines.push("  " + s)); lines.push(""); }
    lines.push(p.story ? "RESHARE / DM TEXT:" : "CAPTION:", p.caption, "");
    if (p.hashtags) lines.push(p.hashtags);
    if (p.strategy) lines.push("", "POSTING STRATEGY:", p.strategy);
    if (p.images && p.images.length) lines.push("", "BRANDED IMAGES (ET design): " + p.images.length + " files at educatedtraveler.app" + p.images[0].replace(/[^/]+$/, "") + " — download from the Studio Posts tab.");
    if (p.link) lines.push("", "Link: " + p.link);
    return lines.join("\n");
  }
  function allPostsText() {
    return ["# EducatedTraveler — ready posts (" + todayISO() + ")", "Voice-locked: connect, never sell. Each routes to one Atlas page or the Circle.", ""]
      .concat(POSTS.map((p) => "---\n\n" + postDownloadText(p) + "\n")).join("\n");
  }
  function download(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const a = el("a", { href: URL.createObjectURL(blob), download: filename });
    document.body.appendChild(a); a.click(); a.remove(); toast("Downloaded " + filename);
  }

  // ================= OUTREACH =================
  const OUTREACH_TPL = ({ name, school, discipline, place, atlasUrl }) =>
`Subject: Featuring ${school || "{SCHOOL}"} on the EducatedTraveler Atlas — may we share your footage?

Dear ${name || "{NAME}"},

I'm Arnaud Callier — a French chef who has spent fifteen years working on the water, and the founder of EducatedTraveler. We build the Atlas: a hand-verified map of the places where real crafts are truly alive, ranked by the strength of the community that gathers there. No bookings, no commissions, no prices — we introduce people to the right school and get out of the way.

${school || "{SCHOOL}"} is featured on our ${discipline || "{DISCIPLINE}"} page for ${place || "{PLACE}"}:
${atlasUrl || "{ATLAS_URL}"}

We publish one short film each day — hands, material, the finished piece — and we would love to feature ${school || "{SCHOOL}"}'s work, fully credited and linked. Could we have your permission to share 1–3 short clips of your teaching or workshop (anything you already have — phone footage is perfect)? We handle the editing.

If it resonates, I'd also welcome a short call: we are selecting a small number of schools to introduce our community to directly, and ${school || "{SCHOOL}"} is exactly the kind of place we built this for.

Warmly,
Arnaud Callier
EducatedTraveler — a place, a person, your people.
https://educatedtraveler.app`;

  let outreachDraft = { name: "", school: "", discipline: "", place: "", atlasUrl: "", contact: "" };

  function openOutreachFor(d) {
    outreachDraft = { name: "", school: d.footageSource || "", discipline: d.discipline || "", place: d.place || "", atlasUrl: d.atlasUrl || "", contact: "" };
    setTab("outreach");
  }

  function renderOutreach(v) {
    v.appendChild(sectionHead("Outreach", "One email, two jobs: license the daily clip AND open the Phase-2 partner relationship. High-confidence schools first. Always credit. Never promise ranking or traffic."));

    // generator
    const gen = el("div", { class: "panel", style: "padding:20px; margin-bottom:24px;" });
    gen.appendChild(el("div", { class: "eyebrow", style: "margin-bottom:14px;", text: "Email generator" }));
    const grid = el("div", { style: "display:grid; grid-template-columns:1fr 1fr; gap:12px;" });
    const fields = [
      ["school", "School"], ["name", "Contact name"], ["discipline", "Discipline"],
      ["place", "Place"], ["atlasUrl", "Atlas URL"], ["contact", "Email / contact (for tracker)"],
    ];
    const inputs = {};
    fields.forEach(([k, label]) => {
      const w = el("div", {});
      w.appendChild(el("label", { class: "fld", text: label }));
      const inp = el("input", { type: "text", value: outreachDraft[k] || "" });
      inp.addEventListener("input", () => { outreachDraft[k] = inp.value; });
      inputs[k] = inp; w.appendChild(inp); grid.appendChild(w);
    });
    gen.appendChild(grid);

    // quick-fill from calendar schools
    const quick = el("div", { style: "margin-top:14px;" });
    quick.appendChild(el("label", { class: "fld", text: "Quick-fill from the drop calendar" }));
    const qsel = el("select", {});
    qsel.appendChild(el("option", { value: "", text: "— pick a school from the rotation —" }));
    const seen = new Set();
    DROP.forEach((d) => { const key = (d.footageSource || "") + d.place; if (d.footageSource && !seen.has(key)) { seen.add(key); qsel.appendChild(el("option", { value: d.day, text: d.footageSource + " · " + d.discipline + " · " + d.place })); } });
    qsel.addEventListener("change", () => {
      const d = DROP.find((x) => String(x.day) === qsel.value); if (!d) return;
      outreachDraft = { name: "", school: d.footageSource || "", discipline: d.discipline || "", place: d.place || "", atlasUrl: d.atlasUrl || "", contact: "" };
      inputs.school.value = outreachDraft.school; inputs.discipline.value = outreachDraft.discipline;
      inputs.place.value = outreachDraft.place; inputs.atlasUrl.value = outreachDraft.atlasUrl;
      inputs.name.value = ""; inputs.contact.value = "";
    });
    quick.appendChild(qsel); gen.appendChild(quick);

    const acts = el("div", { style: "display:flex; gap:8px; flex-wrap:wrap; margin-top:16px;" });
    acts.appendChild(el("button", { class: "btn-primary", style: "padding:8px 14px; border-radius:9px; font-size:12px;", onclick: () => copy(OUTREACH_TPL(outreachDraft)) }, "Copy email"));
    acts.appendChild(el("button", { class: "btn-ghost", style: "padding:8px 14px; border-radius:9px; font-size:12px;", onclick: () => {
      const t = OUTREACH_TPL(outreachDraft); const subj = t.split("\n")[0].replace(/^Subject:\s*/, ""); const body = t.split("\n").slice(2).join("\n");
      window.location.href = "mailto:" + encodeURIComponent(outreachDraft.contact || "") + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body);
    } }, "Open in mail"));
    acts.appendChild(el("button", { class: "btn-ghost", style: "padding:8px 14px; border-radius:9px; font-size:12px;", onclick: () => {
      if (!outreachDraft.school) return toast("Add a school first");
      S.outreach.unshift({ id: uid(), date: todayISO(), school: outreachDraft.school, where: (outreachDraft.discipline || "") + " · " + (outreachDraft.place || ""), contact: outreachDraft.contact || "", status: "contacted", clips: "" });
      save(); toast("Added to tracker"); render();
    } }, "Log as sent →"));
    gen.appendChild(acts);

    // preview
    const prev = el("details", { style: "margin-top:14px;" });
    prev.appendChild(el("summary", { class: "link-quiet", style: "font-size:12px;", text: "Preview email" }));
    prev.appendChild(el("pre", { style: "white-space:pre-wrap; font-size:12px; color:var(--muted); background:rgba(243,237,226,0.03); border:1px solid var(--line); border-radius:10px; padding:14px; margin-top:8px; line-height:1.6;", text: OUTREACH_TPL(outreachDraft) }));
    gen.appendChild(prev);
    v.appendChild(gen);

    // tracker
    v.appendChild(el("div", { class: "eyebrow", style: "margin-bottom:12px;", text: "Tracker · " + S.outreach.length + " schools" }));
    if (!S.outreach.length) { v.appendChild(el("p", { style: "color:var(--faint); font-size:13px;", text: "Nothing logged yet. Generate an email above and hit “Log as sent”." })); return; }
    const OUT_ST = ["contacted", "replied", "confirmed", "none"];
    const OUT_LBL = { contacted: "contacted", replied: "replied", confirmed: "confirmed", none: "no" };
    const tbl = el("div", { class: "panel", style: "padding:6px 0;" });
    S.outreach.forEach((r) => {
      const row = el("div", { style: "display:grid; grid-template-columns: 92px 1fr 130px 130px 80px 34px; gap:10px; align-items:center; padding:11px 16px; border-bottom:1px solid var(--line); font-size:13px;" });
      row.appendChild(el("span", { class: "font-mono", style: "font-size:11px; color:var(--faint);", text: r.date }));
      row.appendChild(el("div", {}, [el("div", { style: "color:var(--paper);", text: r.school }), el("div", { style: "font-size:11px; color:var(--muted);", text: r.where || "" })]));
      const cst = el("select", { style: "font-size:11px; padding:5px 8px;" });
      OUT_ST.forEach((s) => cst.appendChild(el("option", { value: s, text: OUT_LBL[s] }))); cst.value = r.status;
      cst.addEventListener("change", () => { r.status = cst.value; save(); });
      row.appendChild(cst);
      const ci = el("input", { type: "text", value: r.clips || "", placeholder: "clips received", style: "font-size:12px; padding:6px 8px;" });
      ci.addEventListener("input", () => { r.clips = ci.value; save(); });
      row.appendChild(ci);
      row.appendChild(el("span", { class: "pill " + r.status, text: OUT_LBL[r.status] }));
      row.appendChild(el("button", { class: "link-quiet", style: "font-size:16px;", title: "remove", onclick: () => { S.outreach = S.outreach.filter((x) => x.id !== r.id); save(); render(); } }, "×"));
      tbl.appendChild(row);
    });
    v.appendChild(tbl);
  }

  // ================= ARTICLES =================
  function renderArticles(v) {
    v.appendChild(sectionHead("Articles", "The science-backed essays — real research, named experts, ET voice. The pillar that makes people want to step up and do something real. (No banned words; connect, don't sell.)"));

    const arts = articles();
    const acts = el("div", { style: "display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap;" });
    acts.appendChild(el("button", { class: "btn-primary", style: "padding:8px 14px; border-radius:9px; font-size:12px;", onclick: () => { arts.unshift(blankArticle()); save(); render(); } }, "+ New article"));
    acts.appendChild(el("button", { class: "btn-ghost", style: "padding:8px 14px; border-radius:9px; font-size:12px;", onclick: () => { if (confirm("Restore the seeded article ideas? Your edits to articles will be lost.")) { S.articles = JSON.parse(JSON.stringify(ARTICLE_SEED)); save(); render(); } } }, "Reset to seed"));
    v.appendChild(acts);

    arts.forEach((art) => v.appendChild(articleCard(art, arts)));
  }
  function blankArticle() { return { id: uid(), title: "Untitled essay", core: "wellness", skill: "", hook: "", science: "", experts: [], promise: "", outline: [], status: "idea", targetWeek: "" }; }

  const ART_ST = ["idea", "researching", "drafting", "published"];
  function articleCard(art, arts) {
    const card = el("div", { class: "panel", style: "padding:20px; margin-bottom:16px;" });
    const head = el("div", { style: "display:flex; justify-content:space-between; gap:12px; align-items:center; flex-wrap:wrap;" });
    head.appendChild(el("div", { style: "display:flex; gap:8px; align-items:center;" }, [
      el("span", { class: "core-dot core-" + art.core }),
      el("span", { class: "font-mono", style: "font-size:11px; color:var(--faint); text-transform:capitalize;", text: art.core }),
    ]));
    const right = el("div", { style: "display:flex; gap:8px; align-items:center;" });
    const sel = el("select", { style: "width:auto; font-size:11px; padding:5px 9px;" });
    ART_ST.forEach((s) => sel.appendChild(el("option", { value: s, text: s }))); sel.value = art.status;
    sel.addEventListener("change", () => { art.status = sel.value; save(); render(); });
    right.appendChild(sel);
    right.appendChild(el("button", { class: "link-quiet", style: "font-size:18px;", title: "remove", onclick: () => { S.articles = arts.filter((x) => x.id !== art.id); save(); render(); } }, "×"));
    head.appendChild(right);
    card.appendChild(head);

    const titleEl = el("h3", { class: "font-serif", contenteditable: "true", style: "font-size:21px; margin:10px 0 4px; outline:none;", text: art.title });
    titleEl.addEventListener("blur", () => { art.title = titleEl.textContent.trim(); save(); });
    card.appendChild(titleEl);

    if (art.status) card.appendChild(el("span", { class: "pill " + art.status, text: art.status }));

    const fld = (label, key, ph, area) => {
      const w = el("div", { style: "margin-top:14px;" });
      w.appendChild(el("label", { class: "fld", text: label }));
      const inp = area ? el("textarea", { rows: "3", placeholder: ph }) : el("input", { type: "text", placeholder: ph });
      inp.value = art[key] || "";
      inp.addEventListener("input", () => { art[key] = inp.value; save(); });
      w.appendChild(inp); return w;
    };
    const skillW = el("div", { style: "display:grid; grid-template-columns:1fr 160px; gap:12px; margin-top:14px;" });
    const skin = el("input", { type: "text", value: art.skill || "", placeholder: "skill / discipline" });
    skin.addEventListener("input", () => { art.skill = skin.value; save(); });
    const w1 = el("div", {}, [el("label", { class: "fld", text: "Skill" }), skin]);
    const coreSel = el("select", {});
    ["wellness", "adventure", "creative", "culinary"].forEach((c) => coreSel.appendChild(el("option", { value: c, text: c })));
    coreSel.value = art.core; coreSel.addEventListener("change", () => { art.core = coreSel.value; save(); render(); });
    const w2 = el("div", {}, [el("label", { class: "fld", text: "Core" }), coreSel]);
    skillW.appendChild(w1); skillW.appendChild(w2);
    card.appendChild(skillW);

    card.appendChild(fld("Hook (the one-line pull)", "hook", "what makes a reader lean in", true));
    card.appendChild(fld("The science (real research to write from)", "science", "mechanism + framing", true));
    card.appendChild(fld("Promise (what the reader should feel / do — ET voice)", "promise", "make them want to step up — no banned words", true));

    // experts (comma list)
    const ew = el("div", { style: "margin-top:14px;" });
    ew.appendChild(el("label", { class: "fld", text: "Experts / sources (comma-separated)" }));
    const ein = el("input", { type: "text", value: (art.experts || []).join(", "), placeholder: "named researchers, books, fields" });
    ein.addEventListener("input", () => { art.experts = ein.value.split(",").map((s) => s.trim()).filter(Boolean); save(); });
    ew.appendChild(ein); card.appendChild(ew);

    // outline (one per line)
    const ow = el("div", { style: "margin-top:14px;" });
    ow.appendChild(el("label", { class: "fld", text: "Outline (one beat per line)" }));
    const oin = el("textarea", { rows: "4", placeholder: "structure the read" }); oin.value = (art.outline || []).join("\n");
    oin.addEventListener("input", () => { art.outline = oin.value.split("\n").map((s) => s.trim()).filter(Boolean); save(); });
    ow.appendChild(oin); card.appendChild(ow);

    const tw = el("div", { style: "display:grid; grid-template-columns:1fr; gap:12px; margin-top:14px;" });
    const tin = el("input", { type: "text", value: art.targetWeek || "", placeholder: "target window (e.g. Month 2)" });
    tin.addEventListener("input", () => { art.targetWeek = tin.value; save(); });
    tw.appendChild(el("div", {}, [el("label", { class: "fld", text: "Target window" }), tin]));
    card.appendChild(tw);

    // research handoff
    const foot = el("div", { style: "margin-top:16px; display:flex; gap:8px; flex-wrap:wrap;" });
    foot.appendChild(el("button", { class: "btn-ghost", style: "padding:7px 12px; border-radius:9px; font-size:12px;", onclick: () => copy(articleBrief(art)) }, "Copy research brief"));
    card.appendChild(foot);
    return card;
  }
  function articleBrief(a) {
    return [
      "ARTICLE BRIEF — EducatedTraveler (voice: connect/introduce, NO banned words: transformation, life-changing, vacation, luxury, easy)",
      "Title: " + a.title, "Core: " + a.core + " · Skill: " + (a.skill || ""),
      "Hook: " + (a.hook || ""), "Science to write from: " + (a.science || ""),
      "Experts/sources: " + (a.experts || []).join("; "),
      "Reader promise: " + (a.promise || ""),
      "Outline:", ...(a.outline || []).map((o, i) => "  " + (i + 1) + ". " + o),
      "Verify all claims against primary sources before publishing. End every essay pointing to one Atlas page + the Circle.",
    ].join("\n");
  }

  // ================= METRICS =================
  const METRIC_FIELDS = [
    ["followers", "Followers (all platforms)"], ["posts", "Clips posted (cumulative)"],
    ["saves", "Best-clip saves"], ["atlasVisits", "Atlas page visits / wk"],
    ["circle", "Circle sign-ups (total)"], ["schools", "Schools confirmed footage"],
  ];
  function renderMetrics(v) {
    v.appendChild(sectionHead("Metrics", "Watch the audience, not the vanity. Saves > profile taps > atlas clicks > Circle sign-ups. Followers are last. Log a snapshot weekly."));

    // entry
    const card = el("div", { class: "panel", style: "padding:20px; margin-bottom:24px;" });
    card.appendChild(el("div", { class: "eyebrow", style: "margin-bottom:14px;", text: "Log this week" }));
    const grid = el("div", { style: "display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px;" });
    const draft = { date: todayISO() };
    METRIC_FIELDS.forEach(([k, label]) => {
      const w = el("div", {});
      w.appendChild(el("label", { class: "fld", text: label }));
      const inp = el("input", { type: "number", placeholder: "0" });
      inp.addEventListener("input", () => { draft[k] = inp.value === "" ? null : Number(inp.value); });
      w.appendChild(inp); grid.appendChild(w);
    });
    card.appendChild(grid);
    card.appendChild(el("button", { class: "btn-primary", style: "padding:9px 16px; border-radius:9px; font-size:12px; margin-top:16px;", onclick: () => { S.metrics.unshift(Object.assign({ id: uid() }, draft)); save(); toast("Snapshot saved"); render(); } }, "Save snapshot"));
    v.appendChild(card);

    // latest vs previous
    if (S.metrics.length) {
      const cur = S.metrics[0], prev = S.metrics[1];
      const cards = el("div", { style: "display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:14px; margin-bottom:24px;" });
      METRIC_FIELDS.forEach(([k, label]) => {
        const val = cur[k]; if (val == null) return;
        const d = prev && prev[k] != null ? val - prev[k] : null;
        const c = el("div", { class: "panel", style: "padding:16px;" });
        c.appendChild(el("div", { class: "eyebrow", style: "font-size:9.5px; margin-bottom:8px;", text: label }));
        c.appendChild(el("div", { class: "metric-num", text: String(val) }));
        if (d != null) c.appendChild(el("div", { style: "font-size:12px; margin-top:5px; color:" + (d >= 0 ? "#94ad86" : "#cf8f6e") + ";", text: (d >= 0 ? "▲ +" : "▼ ") + d + " vs last" }));
        cards.appendChild(c);
      });
      v.appendChild(cards);

      // history
      v.appendChild(el("div", { class: "eyebrow", style: "margin-bottom:10px;", text: "History" }));
      const tbl = el("div", { class: "panel", style: "padding:6px 0; overflow-x:auto;" });
      const headRow = el("div", { style: "display:grid; grid-template-columns: 100px repeat(" + METRIC_FIELDS.length + ", 1fr) 34px; gap:8px; padding:10px 16px; border-bottom:1px solid var(--line);" });
      headRow.appendChild(el("span", { class: "font-mono", style: "font-size:10px; color:var(--faint);", text: "date" }));
      METRIC_FIELDS.forEach(([, label]) => headRow.appendChild(el("span", { class: "font-mono", style: "font-size:10px; color:var(--faint);", text: label.split(" ")[0] })));
      headRow.appendChild(el("span", {}));
      tbl.appendChild(headRow);
      S.metrics.forEach((m) => {
        const row = el("div", { style: "display:grid; grid-template-columns: 100px repeat(" + METRIC_FIELDS.length + ", 1fr) 34px; gap:8px; padding:10px 16px; border-bottom:1px solid var(--line); font-size:13px;" });
        row.appendChild(el("span", { class: "font-mono", style: "font-size:11px; color:var(--muted);", text: m.date }));
        METRIC_FIELDS.forEach(([k]) => row.appendChild(el("span", { text: m[k] == null ? "—" : String(m[k]) })));
        row.appendChild(el("button", { class: "link-quiet", style: "font-size:15px;", onclick: () => { S.metrics = S.metrics.filter((x) => x.id !== m.id); save(); render(); } }, "×"));
        tbl.appendChild(row);
      });
      v.appendChild(tbl);
    }
  }

  // ---------- shared UI ----------
  function sectionHead(title, sub) {
    const h = el("div", { style: "margin-bottom:22px;" });
    h.appendChild(el("h2", { class: "font-serif", style: "font-size:28px; margin:0 0 6px;", text: title }));
    if (sub) h.appendChild(el("p", { style: "color:var(--muted); font-size:14px; max-width:760px; line-height:1.6; margin:0;", text: sub }));
    return h;
  }

  // ---------- export / import ----------
  function doExport() {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
    const a = el("a", { href: URL.createObjectURL(blob), download: "et-studio-" + todayISO() + ".json" });
    document.body.appendChild(a); a.click(); a.remove(); toast("Exported");
  }
  function doImport(e) {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { const data = JSON.parse(r.result); S = Object.assign({}, DEFAULT_STATE, data); save(); toast("Imported"); render(); setFocusLine(); } catch (err) { toast("Bad file"); } };
    r.readAsText(f); e.target.value = "";
  }

  // ---------- fallback plan (used only if studio-plan.js missing) ----------
  function fallbackPlan() {
    return {
      northStar: "Grow an owned audience that trusts the Atlas — so that when the first curated immersion opens, the people are already there.",
      oneMetric: "Circle sign-ups (the owned list). Everything upstream — clips, saves, atlas visits — exists to grow this number.",
      stop: ["Do not re-surface selling / pricing / checkout on the public site.", "Do not build more Atlas features — it is done; distribute it.", "Do not start a second content format before day 90."],
      horizons: [
        { id: "week", title: "This week", sub: "Unblock and launch.", groups: [
          { title: "Make it measurable + start posting", goal: "You can't grow what you can't see.", metric: "first clip live", items: [
            { id: "w-gsc", t: "Submit sitemap.xml to Google Search Console", effort: "Quick", impact: "High", done: "sitemap shows ‘Success’" },
            { id: "w-analytics", t: "Install a privacy-light analytics snippet site-wide", effort: "Half-day", impact: "High", done: "live visits visible" },
            { id: "w-firstdrop", t: "Post Day 1 of the daily drop", effort: "Half-day", impact: "High", done: "clip live on 3 platforms" },
            { id: "w-outreach", t: "Send 5 footage-license emails to high-confidence schools", effort: "Half-day", impact: "High", done: "5 logged in tracker" },
          ] },
        ] },
      ],
      cadence: ["<b>Every day:</b> post one clip.", "<b>Weekly:</b> 5 outreach emails, log metrics, draft one article beat."],
    };
  }

  // ---------- go ----------
  document.addEventListener("DOMContentLoaded", initGate);
})();
