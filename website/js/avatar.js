/* EducatedTraveler — shared avatar + completion-bar renderer.
   Exposes window.ETAvatar with:
     getXPTier(xp)        -> { name, color, glow, min, max }
     getLevel(xp)         -> integer (500 XP per level, matches dashboard.html)
     renderTieredAvatar(el, { name, xp, avatarUrl, size, showLevel })
     renderCompletionBar(el, pct, { label })
*/
(function () {
    'use strict';

    // XP tier system — visible to other members.
    // Same XP-per-level as dashboard.html (500 XP per level).
    const TIERS = [
        { min: 0,    max: 99,       name: 'Drifting', color: '#6B7280', glow: 'rgba(107,114,128,0.45)' },
        { min: 100,  max: 499,      name: 'Skimmer',  color: '#3B8DD4', glow: 'rgba(59,141,212,0.50)'  },
        { min: 500,  max: 999,      name: 'Voyager',  color: '#06B6D4', glow: 'rgba(6,182,212,0.55)'   },
        { min: 1000, max: 1999,     name: 'Mariner',  color: '#F59E0B', glow: 'rgba(245,158,11,0.55)'  },
        { min: 2000, max: 4999,     name: 'Captain',  color: '#F97316', glow: 'rgba(249,115,22,0.60)'  },
        { min: 5000, max: Infinity, name: 'Admiral',  color: '#A855F7', glow: 'rgba(168,85,247,0.65)'  }
    ];

    function getXPTier(xp) {
        const v = Math.max(0, Number(xp) || 0);
        for (const t of TIERS) { if (v >= t.min && v <= t.max) return t; }
        return TIERS[0];
    }

    function getLevel(xp) {
        return Math.max(1, Math.floor((Number(xp) || 0) / 500) + 1);
    }

    function escHtml(s) {
        const d = document.createElement('div');
        d.textContent = (s == null) ? '' : String(s);
        return d.innerHTML;
    }
    function escAttr(s) { return escHtml(s).replace(/"/g, '&quot;'); }

    function renderTieredAvatar(el, opts) {
        if (!el) return;
        const o = opts || {};
        const name      = o.name || 'Explorer';
        const xp        = Number(o.xp) || 0;
        const avatarUrl = o.avatarUrl || null;
        const size      = Number(o.size) || 80;
        const showLevel = o.showLevel !== false;

        const tier  = getXPTier(xp);
        const level = getLevel(xp);
        const initials = String(name).trim().slice(0, 2).toUpperCase() || '??';
        const fontSize = Math.max(12, Math.round(size * 0.30));

        const inside = avatarUrl
            ? '<img src="' + escAttr(avatarUrl) + '" alt="' + escAttr(name) + '" '
              + 'style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;">'
            : '<span style="font-size:' + fontSize + 'px;font-weight:600;color:#fff;letter-spacing:0.5px;">'
              + escHtml(initials) + '</span>';

        const badgeSize = Math.max(20, Math.round(size * 0.28));
        const levelBadge = showLevel
            ? '<div class="tiered-avatar-lvl" style="'
              + 'position:absolute;bottom:-2px;right:-2px;'
              + 'min-width:' + badgeSize + 'px;height:' + badgeSize + 'px;padding:0 ' + Math.round(badgeSize / 4) + 'px;'
              + 'border-radius:' + (badgeSize / 2) + 'px;'
              + 'background:' + tier.color + ';color:#fff;'
              + 'font-size:' + Math.max(9, Math.round(badgeSize * 0.48)) + 'px;font-weight:700;letter-spacing:0.5px;'
              + 'display:flex;align-items:center;justify-content:center;'
              + 'border:2px solid #0a0a0a;'
              + 'font-family:\'IBM Plex Mono\', monospace;'
              + 'box-shadow:0 2px 8px ' + tier.glow + ';'
              + '">L' + level + '</div>'
            : '';

        el.style.position = 'relative';
        el.style.width  = size + 'px';
        el.style.height = size + 'px';
        el.style.display = 'inline-block';
        el.classList.add('tiered-avatar');
        el.setAttribute('data-tier', tier.name);
        el.setAttribute('title', 'Level ' + level + ' · ' + tier.name);

        el.innerHTML =
            '<div class="tiered-avatar-ring" style="'
              + 'width:100%;height:100%;border-radius:50%;padding:3px;box-sizing:border-box;'
              + 'background: conic-gradient(from 180deg, ' + tier.color + ', ' + tier.color + 'cc, ' + tier.color + ');'
              + 'box-shadow:0 0 24px ' + tier.glow + ';'
            + '">'
              + '<div class="tiered-avatar-inner" style="'
                + 'width:100%;height:100%;border-radius:50%;overflow:hidden;'
                + 'background: linear-gradient(135deg, #0066B1 0%, #3B8DD4 100%);'
                + 'display:flex;align-items:center;justify-content:center;'
              + '">' + inside + '</div>'
            + '</div>'
            + levelBadge;
    }

    function getCompletionColors(pct) {
        if (pct >= 100) return { from: '#059669', to: '#10B981', text: '#6EE7B7', glow: 'rgba(16,185,129,0.45)' };
        if (pct >= 80)  return { from: '#06B6D4', to: '#10B981', text: '#7DD3FC', glow: 'rgba(6,182,212,0.40)' };
        if (pct >= 60)  return { from: '#3B8DD4', to: '#06B6D4', text: '#93C5FD', glow: 'rgba(59,141,212,0.35)' };
        if (pct >= 40)  return { from: '#F59E0B', to: '#FBBF24', text: '#FCD34D', glow: 'rgba(245,158,11,0.35)' };
        if (pct >= 20)  return { from: '#F97316', to: '#FB923C', text: '#FDBA74', glow: 'rgba(249,115,22,0.35)' };
        return            { from: '#DC2626', to: '#EF4444', text: '#FCA5A5', glow: 'rgba(239,68,68,0.35)' };
    }

    function completionHint(pct) {
        if (pct >= 100) return '✓ Complete — your profile is live for the community';
        if (pct >= 80)  return 'Almost there — matches unlocked';
        if (pct >= 50)  return 'Keep going — unlock matches at 80%';
        if (pct >= 20)  return 'Good start. Keep filling to unlock matches';
        return 'Add a few basics to unlock matches';
    }

    function renderCompletionBar(el, pct, opts) {
        if (!el) return;
        pct = Math.max(0, Math.min(100, pct | 0));
        const c = getCompletionColors(pct);
        const label = (opts && opts.label) || 'Profile';
        const hint = completionHint(pct);
        const pulseCls = pct >= 100 ? ' tiered-bar-pulse' : '';

        el.classList.add('tiered-bar');
        el.innerHTML =
            '<div style="min-width:240px;max-width:320px;">'
              + '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">'
                + '<span style="font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:rgba(255,255,255,0.50);font-family:\'IBM Plex Mono\',monospace;">' + escHtml(label) + '</span>'
                + '<span style="font-size:13px;font-weight:600;color:' + c.text + ';font-family:\'IBM Plex Mono\',monospace;">'
                  + '<span class="tiered-bar-pct">' + pct + '</span>'
                  + '<span style="opacity:0.5;font-weight:400;">/100</span>'
                + '</span>'
              + '</div>'
              + '<div class="tiered-bar-track' + pulseCls + '" style="'
                + 'position:relative;height:8px;width:100%;'
                + 'background:rgba(255,255,255,0.06);border-radius:9999px;overflow:hidden;'
                + 'border:1px solid rgba(255,255,255,0.08);'
              + '">'
                + '<div class="tiered-bar-fill" style="'
                  + 'height:100%;width:' + pct + '%;'
                  + 'background:linear-gradient(90deg, ' + c.from + ', ' + c.to + ');'
                  + 'border-radius:9999px;'
                  + 'box-shadow:0 0 12px ' + c.glow + ';'
                  + 'transition:width 0.6s ease-out, background 0.4s ease-out;'
                + '"></div>'
              + '</div>'
              + '<p style="margin-top:6px;font-size:11px;color:rgba(255,255,255,0.45);">' + escHtml(hint) + '</p>'
            + '</div>';
    }

    // Inject shared CSS once (pulse + level-badge bounce on tier-up).
    function injectStyles() {
        if (document.getElementById('et-avatar-styles')) return;
        const css = '\n'
          + '@keyframes etTieredBarPulse {\n'
          + '  0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.35); }\n'
          + '  50%      { box-shadow: 0 0 0 6px rgba(16,185,129,0); }\n'
          + '}\n'
          + '.tiered-bar-pulse { animation: etTieredBarPulse 2.4s ease-in-out infinite; }\n'
          + '\n'
          + '@keyframes etTieredAvatarSpin {\n'
          + '  from { transform: rotate(0deg); }\n'
          + '  to   { transform: rotate(360deg); }\n'
          + '}\n'
          + '.tiered-avatar .tiered-avatar-ring { animation: etTieredAvatarSpin 14s linear infinite; }\n'
          + '.tiered-avatar .tiered-avatar-inner { animation: etTieredAvatarSpin 14s linear infinite reverse; }\n'
          + '@media (prefers-reduced-motion: reduce) {\n'
          + '  .tiered-avatar .tiered-avatar-ring,\n'
          + '  .tiered-avatar .tiered-avatar-inner,\n'
          + '  .tiered-bar-pulse { animation: none !important; }\n'
          + '}\n';
        const style = document.createElement('style');
        style.id = 'et-avatar-styles';
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectStyles);
    } else {
        injectStyles();
    }

    window.ETAvatar = {
        getXPTier: getXPTier,
        getLevel: getLevel,
        renderTieredAvatar: renderTieredAvatar,
        renderCompletionBar: renderCompletionBar
    };
})();
