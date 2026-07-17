/* Studio — News tab. The weekly growth-loop feed.
 * Reads public.growth_loop_news via the shared Supabase client (supabase-config.js).
 * RLS: admin-only SELECT — without an admin session the desk stays sealed.
 * Renders into the #view node handed over by studio.js (window.ET_RENDER_NEWS).
 */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // minimal markdown: headings, bold, italics, links (http/s only), lists, paragraphs
  function md(src) {
    var lines = String(src || "").split(/\r?\n/);
    var out = [], list = false;
    function inline(t) {
      t = esc(t);
      t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a class="link-quiet" style="color:var(--sea);" href="$2" target="_blank" rel="noopener">$1</a>');
      t = t.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:var(--paper);">$1</strong>');
      t = t.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
      return t;
    }
    lines.forEach(function (ln) {
      var t = ln.trim();
      var isLi = /^[-•] /.test(t);
      if (list && !isLi) { out.push("</ul>"); list = false; }
      if (!t) return;
      if (/^#{1,4} /.test(t)) {
        out.push('<h4 class="font-serif" style="font-size:17px; margin:22px 0 8px; color:var(--paper);">' + inline(t.replace(/^#+ /, "")) + "</h4>");
      } else if (isLi) {
        if (!list) { out.push('<ul style="margin:8px 0 12px 18px; padding:0; color:var(--muted); line-height:1.75; font-size:14px;">'); list = true; }
        out.push("<li>" + inline(t.slice(2)) + "</li>");
      } else {
        out.push('<p style="margin:0 0 12px; color:var(--muted); line-height:1.8; font-size:14.5px;">' + inline(t) + "</p>");
      }
    });
    if (list) out.push("</ul>");
    return out.join("");
  }

  function fmtDate(iso) {
    try {
      return new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    } catch (e) { return iso; }
  }

  function card(inner) {
    return '<div style="border:1px solid var(--line); border-radius:14px; padding:26px 28px; background:var(--ink-2);">' + inner + "</div>";
  }

  function letterCard(m) {
    var meta = [m.craft, m.location].filter(Boolean).map(esc).join(" · ");
    var links = (Array.isArray(m.links) ? m.links : [])
      .filter(function (l) { return l && /^https?:\/\//.test(l.url || ""); })
      .map(function (l) { return '<a class="link-quiet" style="color:var(--sea); font-size:12px;" href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label || l.url) + " ↗</a>"; })
      .join(" &nbsp;·&nbsp; ");
    return card(
      '<div class="font-mono" style="font-size:10.5px; letter-spacing:.16em; text-transform:uppercase; color:var(--ember); margin-bottom:10px;">A letter about</div>' +
      '<h3 class="font-serif" style="font-size:24px; margin:0 0 4px; color:var(--paper);">' + esc(m.name) + "</h3>" +
      (meta ? '<div class="font-mono" style="font-size:11.5px; color:var(--sea); margin-bottom:6px;">' + meta + "</div>" : "") +
      (m.niche ? '<div style="font-size:13px; color:var(--muted); margin-bottom:14px;"><span style="color:var(--faint);">The niche —</span> ' + esc(m.niche) + "</div>" : "") +
      md(m.letter_md || "") +
      (m.community ? '<div style="border-top:1px solid var(--line); margin-top:14px; padding-top:12px; font-size:13px; color:var(--muted); line-height:1.7;"><span class="font-mono" style="font-size:10.5px; letter-spacing:.14em; text-transform:uppercase; color:var(--faint);">The community</span><br>' + esc(m.community) + "</div>" : "") +
      (links ? '<div style="margin-top:12px;">' + links + "</div>" : "")
    );
  }

  function edition(item, isFront) {
    var head =
      '<div class="font-mono" style="font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--faint); margin-bottom:12px;">' +
      "Edition — " + esc(fmtDate(item.week)) + (item.axis ? ' &nbsp;·&nbsp; <span style="color:var(--ember);">' + esc(item.axis) + "</span>" : "") + "</div>" +
      '<h2 class="font-serif" style="font-size:' + (isFront ? 34 : 24) + 'px; line-height:1.15; margin:0 0 14px; color:var(--paper);">' + esc(item.title) + "</h2>" +
      (item.digest ? '<p style="font-size:' + (isFront ? 16.5 : 14.5) + 'px; line-height:1.75; color:var(--muted); margin:0 0 18px; max-width:70ch;">' + esc(item.digest) + "</p>" : "");
    var body = item.body_md ? '<div style="border-top:1px solid var(--line); padding-top:18px; max-width:70ch;">' + md(item.body_md) + "</div>" : "";
    var masters = "";
    var ins = Array.isArray(item.instructors) ? item.instructors.filter(function (m) { return m && m.name; }) : [];
    if (ins.length) {
      masters =
        '<div class="font-mono" style="font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--faint); margin:30px 0 14px;">This week’s masters</div>' +
        '<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:16px;">' + ins.map(letterCard).join("") + "</div>";
    }
    return head + body + masters;
  }

  function note(v, text, extraHtml) {
    v.innerHTML = "";
    var d = document.createElement("div");
    d.innerHTML = card('<p style="margin:0; color:var(--muted); font-size:14px; line-height:1.8;">' + text + "</p>" + (extraHtml || ""));
    v.appendChild(d.firstChild);
  }

  function waitForClient(cb, n) {
    n = n || 0;
    if (window.supabaseClient) return cb(window.supabaseClient);
    if (window.supabaseError || n > 100) return cb(null);
    setTimeout(function () { waitForClient(cb, n + 1); }, 50);
  }

  window.ET_RENDER_NEWS = function (v) {
    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<div style="margin-bottom:26px;">' +
      '<h1 class="font-serif" style="font-size:15px; letter-spacing:.02em; margin:0; color:var(--sea);">The Growth Loop</h1>' +
      '<p class="font-mono" style="font-size:11px; color:var(--faint); margin:6px 0 0;">One move a week for LW01 · two masters worth knowing · nothing publishes itself.</p>' +
      "</div><div id=\"news-body\"></div>";
    v.appendChild(wrap);
    var body = wrap.querySelector("#news-body");
    note(body, "Fetching the week’s editions…");

    waitForClient(function (client) {
      if (!client) return note(body, "Couldn’t reach the news desk (connection issue). The rest of the Studio still works.");
      client.auth.getSession().then(function (res) {
        var session = res && res.data ? res.data.session : null;
        if (!session) {
          return note(body,
            "The news desk is sealed — it opens only for the admin account. Sign in once and come back; the session sticks to this browser.",
            '<p style="margin:12px 0 0;"><a class="link-quiet" style="color:var(--sea); font-size:13px;" href="/join">Sign in →</a></p>');
        }
        client.from("growth_loop_news").select("*").order("week", { ascending: false }).limit(24).then(function (q) {
          if (q.error) return note(body, "The desk answered with an error: " + esc(q.error.message));
          var rows = q.data || [];
          if (!rows.length) return note(body, "No editions yet. The first one lands Monday morning.");
          body.innerHTML = "";
          var front = document.createElement("div");
          front.innerHTML = card(edition(rows[0], true));
          body.appendChild(front.firstChild);
          if (rows.length > 1) {
            var arch = document.createElement("div");
            arch.innerHTML =
              '<div class="font-mono" style="font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--faint); margin:34px 0 12px;">Past editions</div>';
            body.appendChild(arch.firstChild);
            rows.slice(1).forEach(function (item) {
              var row = document.createElement("details");
              row.style.cssText = "border:1px solid var(--line); border-radius:12px; margin:0 0 10px; background:var(--ink-2);";
              row.innerHTML =
                '<summary style="cursor:pointer; padding:14px 18px; list-style:none; display:flex; gap:14px; align-items:baseline;">' +
                '<span class="font-mono" style="font-size:11px; color:var(--faint); white-space:nowrap;">' + esc(item.week) + "</span>" +
                '<span class="font-serif" style="font-size:16px; color:var(--paper);">' + esc(item.title) + "</span></summary>" +
                '<div style="padding:6px 22px 22px;">' + edition(item, false) + "</div>";
              body.appendChild(row);
            });
          }
        });
      });
    });
  };
})();
