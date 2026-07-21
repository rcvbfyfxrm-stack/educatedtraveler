/* Studio — Command tab. The one place Arnaud decides from.
 * Three zones, most-important first:
 *   1. Today's brief  (studio_briefs)  — what moved, the one thing that matters.
 *   2. Ranked to-dos  (studio_tasks)   — done/skip toggles + add your own; re-ranked nightly.
 *   3. Concierge queue (concierge_queue) — the drafted answers to every hand raised;
 *      review with notes, Approve (publishes the Atlas page), then Send (gated).
 * RLS: all three are is_admin() only — the room stays sealed without Arnaud's session
 * (same sealed pattern as studio-people.js / studio-news.js). Renders via
 * window.ET_RENDER_COMMAND. Pure logic is unit-testable via window.ET_COMMAND_TEST.
 */
(function () {
  "use strict";

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const mdLite = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:var(--sea);" target="_blank" rel="noopener">$1</a>')
    .replace(/\n/g, "<br>");

  function fmtDate(iso) {
    try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }
    catch (e) { return String(iso || ""); }
  }
  function todayMadrid() {
    // the day-string the routine stamps tasks with (Europe/Madrid)
    try { return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" }); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }

  // ---- pure: split queue by lifecycle + rank tasks (unit-testable) ----
  function splitQueue(rows) {
    const open = [], live = [], done = [];
    (rows || []).forEach((r) => {
      if (r.status === "sent") done.push(r);
      else if (r.status === "approved" || r.status === "published") live.push(r);
      else if (r.status === "parked") done.push(r);
      else open.push(r); // draft | changes_requested
    });
    return { open, live, done };
  }
  function rankTasks(rows) {
    const order = { todo: 0, done: 2, skipped: 3 };
    return (rows || []).slice().sort((a, b) =>
      (order[a.status] ?? 1) - (order[b.status] ?? 1) || (a.rank ?? 100) - (b.rank ?? 100));
  }

  const ACTION_LABEL = {
    create: "New Atlas skill", exists: "Already in the Atlas", have_week: "A week exists", none: "Out of scope",
  };
  const STATUS_PILL = {
    draft: ["in", "drafted"], changes_requested: ["editing", "changes asked"],
    approved: ["requested", "approved — publishing"], published: ["published", "page live"],
    sent: ["posted", "sent ✓"], parked: ["none", "parked"],
  };

  // ---- render ----
  const S = { client: null, tasks: [], queue: [], brief: null, busy: false };

  function pill(status) {
    const [cls, label] = STATUS_PILL[status] || ["none", status];
    return '<span class="pill ' + cls + '">' + esc(label) + "</span>";
  }
  function toast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2400);
  }

  async function update(table, id, patch) {
    const { error } = await S.client.from(table).update(patch).eq("id", id);
    if (error) { toast("Couldn’t save: " + error.message); return false; }
    return true;
  }

  // ===== zone 1: brief =====
  function briefHtml(b) {
    if (!b) return '<div class="panel" style="padding:18px 20px;"><p style="color:var(--faint); font-size:13.5px; font-style:italic; margin:0;">No brief yet — the nightly build writes it. Once the routine runs, "what moved" and "the one thing today" appear here each morning.</p></div>';
    return '<div class="panel" style="padding:22px 24px; border-left:3px solid var(--ember);">' +
      '<div class="eyebrow" style="color:var(--ember); margin-bottom:8px;">Today · ' + esc(fmtDate(b.day)) + '</div>' +
      (b.do_next_md ? '<p style="font-family:\'Fraunces\',Georgia,serif; font-weight:300; font-size:19px; line-height:1.4; color:var(--paper); margin:0 0 14px;">' + mdLite(b.do_next_md) + '</p>' : '') +
      (b.digest_md ? '<div style="font-size:13.5px; line-height:1.7; color:var(--muted);">' + mdLite(b.digest_md) + '</div>' : '') +
      (b.plan_md ? '<details style="margin-top:12px;"><summary style="cursor:pointer; color:var(--sea); font-size:12.5px; font-family:\'IBM Plex Mono\',monospace;">The publication / marketing move staged for you →</summary><div style="font-size:13px; line-height:1.7; color:var(--muted); margin-top:10px;">' + mdLite(b.plan_md) + '</div></details>' : '') +
      '</div>';
  }

  // ===== zone 2: tasks =====
  function taskRow(t) {
    const done = t.status === "done", skipped = t.status === "skipped";
    const dim = done || skipped ? "opacity:.5;" : "";
    const strike = done || skipped ? "text-decoration:line-through;" : "";
    const catColor = { crux: "var(--ember)", concierge: "var(--sea)" }[t.category] || "var(--faint)";
    return '<div class="panel" data-task="' + esc(t.id) + '" style="padding:13px 16px; margin-bottom:8px; display:flex; gap:12px; align-items:flex-start; ' + dim + '">' +
      '<button class="t-done" title="Mark done" style="flex:0 0 auto; margin-top:2px; width:20px; height:20px; border-radius:6px; border:1.5px solid ' + (done ? "var(--sea)" : "var(--line)") + '; background:' + (done ? "var(--sea)" : "transparent") + '; color:#14110d; cursor:pointer; font-size:12px; line-height:1;">' + (done ? "✓" : "") + '</button>' +
      '<div style="flex:1 1 auto; min-width:0;">' +
        '<div style="font-size:14.5px; color:var(--paper); ' + strike + '">' + esc(t.title) + '</div>' +
        (t.detail ? '<div style="font-size:12.5px; color:var(--muted); margin-top:3px; ' + strike + '">' + esc(t.detail) + '</div>' : '') +
        (t.why ? '<div style="font-size:11px; color:' + catColor + '; margin-top:4px; font-family:\'IBM Plex Mono\',monospace; letter-spacing:.03em;">' + (t.category ? esc(t.category).toUpperCase() + " · " : "") + esc(t.why) + '</div>' : '') +
      '</div>' +
      '<button class="t-skip" title="Skip today" style="flex:0 0 auto; background:none; border:none; color:var(--faint); font-size:11px; cursor:pointer; font-family:\'IBM Plex Mono\',monospace;">' + (skipped ? "skipped" : "skip") + '</button>' +
      '</div>';
  }
  function tasksHtml(tasks) {
    const ranked = rankTasks(tasks);
    const openCount = ranked.filter((t) => t.status === "todo").length;
    return '<div style="display:flex; align-items:baseline; justify-content:space-between; margin:26px 0 12px;">' +
      '<h2 class="font-serif" style="font-size:18px; margin:0; color:var(--sea);">Today — ranked</h2>' +
      '<span class="font-mono" style="font-size:11px; color:var(--faint);">' + openCount + ' open · ' + ranked.length + ' total</span></div>' +
      (ranked.length ? ranked.map(taskRow).join("") :
        '<div class="panel" style="padding:16px 18px;"><p style="color:var(--faint); font-size:13px; font-style:italic; margin:0;">Nothing ranked for today yet. Add one below, or wait for tonight’s build.</p></div>') +
      '<div style="display:flex; gap:8px; margin-top:12px;">' +
        '<input id="t-add" class="fld" type="text" placeholder="Add something to do today…" style="flex:1 1 auto; background:rgba(243,237,226,.04); border:1px solid var(--line); border-radius:10px; color:var(--paper); font-size:13.5px; padding:10px 13px;">' +
        '<button id="t-add-btn" class="btn-primary" style="padding:9px 16px; border-radius:10px; font-size:13px;">Add</button>' +
      '</div>';
  }

  // ===== zone 3: concierge =====
  function conciergeCard(r) {
    const canPublish = r.atlas_action === "create";
    const isOpen = r.status === "draft" || r.status === "changes_requested";
    const isApproved = r.status === "approved";
    const isPublished = r.status === "published";
    const preview = (canPublish && r.page_html)
      ? '<button class="q-preview" style="margin:12px 8px 0 0; padding:8px 14px; border-radius:10px; font-size:12.5px; font-family:\'IBM Plex Mono\',monospace; color:#14110d; border:none; cursor:pointer; background:linear-gradient(135deg,var(--sea),var(--ember) 130%);">Preview the finished page →</button>'
      : (canPublish
        ? '<div style="margin:12px 0 0; font-size:11.5px; color:var(--faint); font-style:italic;">The finished page builds on tonight’s run — a preview button appears here once it’s ready.</div>'
        : "");
    const sheet = r.skill_sheet_md
      ? '<details style="margin:12px 0 0;"><summary style="cursor:pointer; color:var(--sea); font-size:12.5px; font-family:\'IBM Plex Mono\',monospace;">The drafted Atlas skill sheet (' + esc((r.skill_sheet_md.length / 1000).toFixed(1)) + 'k) →</summary>' +
        '<div style="max-height:340px; overflow:auto; background:rgba(243,237,226,.02); border:1px solid var(--line); border-radius:10px; padding:14px 16px; margin-top:8px; font-size:12.5px; line-height:1.7; color:var(--muted);">' + mdLite(r.skill_sheet_md) + '</div></details>'
      : "";
    const fact = r.fact_md
      ? '<div style="background:rgba(127,168,165,.06); border-left:2px solid var(--sea); border-radius:8px; padding:12px 15px; margin:12px 0 0;">' +
        '<div class="font-mono" style="font-size:9.5px; letter-spacing:.14em; text-transform:uppercase; color:var(--sea); margin-bottom:6px;">The surprising fact' + (r.fact_source ? " · " + esc(r.fact_source.slice(0, 60)) : "") + '</div>' +
        '<div style="font-size:13.5px; line-height:1.65; color:var(--paper);">' + mdLite(r.fact_md) + '</div></div>'
      : "";
    const notes = r.claude_notes_md
      ? '<details style="margin:12px 0 0;" open><summary style="cursor:pointer; color:var(--ember); font-size:12.5px; font-family:\'IBM Plex Mono\',monospace;">Claude’s notes for you (read before it ships) →</summary>' +
        '<div style="font-size:12.5px; line-height:1.7; color:var(--muted); background:rgba(210,138,82,.05); border:1px solid rgba(210,138,82,.2); border-radius:10px; padding:13px 15px; margin-top:8px;">' + mdLite(r.claude_notes_md) + '</div></details>'
      : "";

    let actions = "";
    if (isOpen) {
      actions = '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:14px;">' +
        '<button class="q-approve btn-primary" style="padding:9px 16px; border-radius:10px; font-size:13px;">' + (canPublish ? "Approve → publish page" : "Approve") + '</button>' +
        '<button class="q-changes btn-ghost" style="padding:9px 14px; border-radius:10px; font-size:12.5px;">Request changes</button>' +
        '<button class="q-park btn-ghost" style="padding:9px 14px; border-radius:10px; font-size:12.5px;">Park</button>' +
        '</div>';
    } else if (isApproved) {
      actions = '<div style="margin-top:14px; font-size:12.5px; color:var(--muted);">Approved. ' +
        (canPublish ? 'The Atlas page publishes on the next build (or trigger the <span class="font-mono" style="color:var(--sea);">concierge-publish</span> action now). The <strong>Send</strong> button appears once the page is live.' : 'Ready to send.') +
        '<div style="margin-top:10px; display:flex; gap:8px;"><button class="q-park btn-ghost" style="padding:8px 13px; border-radius:9px; font-size:12px;">Park instead</button></div></div>';
    } else if (isPublished) {
      actions = '<div style="margin-top:14px;">' +
        (r.atlas_url ? '<a href="' + esc(r.atlas_url) + '" target="_blank" rel="noopener" class="font-mono" style="color:var(--sea); font-size:12px; text-decoration:none;">the page is live → ' + esc(r.atlas_url) + '</a>' : '') +
        '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">' +
          '<button class="q-send btn-primary" style="padding:9px 16px; border-radius:10px; font-size:13px;">Send to ' + esc(r.person_name || r.lead_email) + '</button>' +
          '<button class="q-test btn-ghost" style="padding:9px 14px; border-radius:10px; font-size:12.5px;">Send a test to me first</button>' +
        '</div><div style="font-size:11px; color:var(--faint); margin-top:8px;">This is the one gated act — it emails ' + esc(r.lead_email) + ' the message below. Nothing sends until you press it.</div></div>';
    }

    return '<div class="panel" data-q="' + esc(r.id) + '" style="padding:20px 22px; margin-bottom:16px;">' +
      '<div style="display:flex; align-items:baseline; gap:10px; flex-wrap:wrap;">' +
        '<h3 class="font-serif" style="font-size:19px; margin:0; color:var(--paper);">' + esc(r.person_name || r.lead_email) + '</h3>' +
        pill(r.status) +
        '<span class="pill none">' + esc(ACTION_LABEL[r.atlas_action] || r.atlas_action) + '</span>' +
        '<a class="link-quiet" style="margin-left:auto; font-size:12px; color:var(--sea); text-decoration:none;" href="mailto:' + esc(r.lead_email) + '">' + esc(r.lead_email) + '</a>' +
      '</div>' +
      '<div style="font-size:13.5px; color:var(--muted); margin:6px 0 0;">Wants <strong style="color:var(--paper);">' + esc(r.skill_title || r.skill_raw) + '</strong>' + (r.skill_raw && r.skill_raw !== r.skill_title ? ' <span style="color:var(--faint);">— “' + esc(r.skill_raw) + '”</span>' : '') + '</div>' +
      fact + notes + preview + sheet +
      '<div style="margin:14px 0 0;"><div class="font-mono" style="font-size:9.5px; letter-spacing:.14em; text-transform:uppercase; color:var(--faint); margin-bottom:6px;">The message to send (edit freely — this exact text is what goes out)</div>' +
        '<textarea class="q-msg" style="width:100%; min-height:150px; background:#efe6d3; color:#2c231a; font-family:Georgia,serif; font-size:14px; line-height:1.7; border:1px solid #e2d6bd; border-radius:8px; padding:14px 16px; resize:vertical;">' + esc(r.message_md || "") + '</textarea></div>' +
      '<div style="margin:12px 0 0;"><div class="font-mono" style="font-size:9.5px; letter-spacing:.14em; text-transform:uppercase; color:var(--faint); margin-bottom:6px;">Your notes (saved on this card; the next redraft reads them)</div>' +
        '<textarea class="q-notes" placeholder="What you’d change…" style="width:100%; min-height:60px; background:rgba(243,237,226,.04); color:var(--paper); font-family:inherit; font-size:13px; line-height:1.6; border:1px solid var(--line); border-radius:8px; padding:11px 13px; resize:vertical;">' + esc(r.arnaud_notes || "") + '</textarea></div>' +
      actions +
      '</div>';
  }

  function conciergeHtml(queue) {
    const { open, live, done } = splitQueue(queue);
    let h = '<div style="display:flex; align-items:baseline; justify-content:space-between; margin:30px 0 12px;">' +
      '<h2 class="font-serif" style="font-size:18px; margin:0; color:var(--sea);">Hands raised — answer them</h2>' +
      '<span class="font-mono" style="font-size:11px; color:var(--faint);">' + open.length + ' waiting · ' + live.length + ' ready to send · ' + done.length + ' closed</span></div>';
    if (!queue.length) {
      return h + '<div class="panel" style="padding:18px 20px;"><p style="color:var(--faint); font-size:13.5px; font-style:italic; margin:0;">No drafted answers yet. When someone joins the Circle and names a craft, the nightly concierge drafts a reply here — a fact, a message, and (if the skill is new) a full Atlas page — for you to approve.</p></div>';
    }
    if (open.length) h += open.map(conciergeCard).join("");
    if (live.length) { h += '<div class="eyebrow" style="margin:18px 0 10px; color:var(--ember);">Approved — publish then send</div>' + live.map(conciergeCard).join(""); }
    if (done.length) {
      h += '<details style="margin-top:16px;"><summary style="cursor:pointer; color:var(--faint); font-size:12.5px; font-family:\'IBM Plex Mono\',monospace;">' + done.length + ' closed (sent or parked) →</summary><div style="margin-top:12px;">' + done.map(conciergeCard).join("") + '</div></details>';
    }
    return h;
  }

  // ---- wire actions after each render ----
  function wire(body) {
    // add task
    const addBtn = body.querySelector("#t-add-btn"), addInp = body.querySelector("#t-add");
    const doAdd = async () => {
      const title = (addInp.value || "").trim();
      if (!title) return;
      addBtn.disabled = true;
      const { error } = await S.client.from("studio_tasks").insert({
        title, day: todayMadrid(), rank: 50, category: "ops", source: "arnaud", status: "todo",
      });
      addBtn.disabled = false;
      if (error) return toast("Couldn’t add: " + error.message);
      addInp.value = ""; toast("Added"); reload(body);
    };
    if (addBtn) addBtn.addEventListener("click", doAdd);
    if (addInp) addInp.addEventListener("keydown", (e) => { if (e.key === "Enter") doAdd(); });

    // task done / skip
    body.querySelectorAll("[data-task]").forEach((row) => {
      const id = row.getAttribute("data-task");
      const t = S.tasks.find((x) => String(x.id) === id);
      row.querySelector(".t-done").addEventListener("click", async () => {
        const to = t.status === "done" ? "todo" : "done";
        if (await update("studio_tasks", id, { status: to, done_at: to === "done" ? new Date().toISOString() : null })) { t.status = to; reload(body); }
      });
      row.querySelector(".t-skip").addEventListener("click", async () => {
        const to = t.status === "skipped" ? "todo" : "skipped";
        if (await update("studio_tasks", id, { status: to })) { t.status = to; reload(body); }
      });
    });

    // concierge cards
    body.querySelectorAll("[data-q]").forEach((card) => {
      const id = card.getAttribute("data-q");
      const r = S.queue.find((x) => String(x.id) === id);
      const msgEl = card.querySelector(".q-msg"), notesEl = card.querySelector(".q-notes");
      // save edits on blur
      if (msgEl) msgEl.addEventListener("blur", async () => {
        if (msgEl.value !== (r.message_md || "")) { if (await update("concierge_queue", id, { message_md: msgEl.value })) { r.message_md = msgEl.value; toast("Message saved"); } }
      });
      if (notesEl) notesEl.addEventListener("blur", async () => {
        if (notesEl.value !== (r.arnaud_notes || "")) { if (await update("concierge_queue", id, { arnaud_notes: notesEl.value })) { r.arnaud_notes = notesEl.value; toast("Notes saved"); } }
      });
      const setStatus = async (status, extra) => {
        const patch = Object.assign({ status }, extra || {});
        if (await update("concierge_queue", id, patch)) { Object.assign(r, patch); toast("Saved"); reload(body); }
      };
      const btn = (sel, fn) => { const b = card.querySelector(sel); if (b) b.addEventListener("click", fn); };
      btn(".q-preview", () => {
        if (!r.page_html) return toast("No built page yet");
        const blob = new Blob([r.page_html], { type: "text/html" });
        window.open(URL.createObjectURL(blob), "_blank", "noopener");
      });
      btn(".q-approve", () => setStatus("approved", { approved_at: new Date().toISOString() }));
      btn(".q-changes", () => setStatus("changes_requested"));
      btn(".q-park", () => setStatus("parked"));
      btn(".q-send", async (e) => {
        const b = e.currentTarget;
        if (!confirm("Send this message to " + (r.lead_email) + "? This emails them for real.")) return;
        b.disabled = true; b.textContent = "Sending…";
        const { data, error } = await S.client.functions.invoke("concierge-send", { body: { id } });
        b.disabled = false;
        if (error || (data && data.error)) { b.textContent = "Send"; return toast("Send failed: " + ((data && data.error) || error.message)); }
        toast("Sent to " + r.lead_email); reload(body);
      });
      btn(".q-test", async (e) => {
        const b = e.currentTarget; b.disabled = true; b.textContent = "Sending test…";
        const { data, error } = await S.client.functions.invoke("concierge-send", { body: { id, test: true } });
        b.disabled = false; b.textContent = "Send a test to me first";
        if (error || (data && data.error)) return toast("Test failed: " + ((data && data.error) || error.message));
        toast("Test sent to you");
      });
    });
  }

  function paint(body) {
    body.innerHTML = briefHtml(S.brief) + tasksHtml(S.tasks) + conciergeHtml(S.queue);
    wire(body);
  }

  async function reload(body) {
    const today = todayMadrid();
    const [tasksR, queueR, briefR] = await Promise.all([
      S.client.from("studio_tasks").select("*").in("status", ["todo", "done", "skipped"]).order("rank", { ascending: true }).limit(200),
      S.client.from("concierge_queue").select("*").order("created_at", { ascending: false }).limit(200),
      S.client.from("studio_briefs").select("*").order("day", { ascending: false }).limit(1),
    ]);
    // show today's tasks, plus any still-open older ones (nothing falls off the list)
    S.tasks = (tasksR.data || []).filter((t) => t.day === today || t.status === "todo");
    S.queue = queueR.data || [];
    S.brief = (briefR.data || [])[0] || null;
    paint(body);
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

  window.ET_RENDER_COMMAND = function (v) {
    const wrap = document.createElement("div");
    wrap.innerHTML =
      '<div style="margin-bottom:22px;">' +
      '<h1 class="font-serif" style="font-size:15px; letter-spacing:.02em; margin:0; color:var(--sea);">Command — decide from here</h1>' +
      '<p class="font-mono" style="font-size:11px; color:var(--faint); margin:6px 0 0;">What moved · what to do today · every hand raised, drafted and waiting for you.</p>' +
      '</div><div id="cmd-body"></div>';
    v.appendChild(wrap);
    const body = wrap.querySelector("#cmd-body");
    note(body, "Opening the room…");
    waitForClient((client) => {
      if (!client) return note(body, "Couldn’t reach Supabase (connection issue). The rest of the Studio still works.");
      S.client = client;
      client.auth.getSession().then((res) => {
        const session = res && res.data ? res.data.session : null;
        if (!session) {
          return note(body,
            "The room is sealed — it opens only for the admin account. Sign in once and come back; the session sticks to this browser.",
            '<p style="margin:12px 0 0;"><a class="link-quiet" style="color:var(--sea); font-size:13px;" href="/join">Sign in →</a></p>');
        }
        reload(body).catch((e) => note(body, "The room answered with an error: " + esc(String(e && e.message || e))));
      });
    });
  };

  // test hook (node): pure logic, no DOM
  window.ET_COMMAND_TEST = { splitQueue, rankTasks };
})();
