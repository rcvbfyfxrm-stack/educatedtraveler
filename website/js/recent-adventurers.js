// Recently Joined Adventurers — homepage feed.
// Renders into #ra-grid, updates #ra-count, swaps in new joiners live via
// Supabase realtime. Shares the community_sidebar_profiles view +
// community_member_count RPC used by community-sidebar.js.

(function () {
    'use strict';

    const GRID_ID = 'ra-grid';
    const COUNT_ID = 'ra-count';
    const EMPTY_ID = 'ra-empty';
    const LIMIT = 12;

    const COLORS = [
        ['#0066B1', '#3B8DD4'], ['#06B6D4', '#0891B2'], ['#8B5CF6', '#7C3AED'],
        ['#F59E0B', '#D97706'], ['#EF4444', '#DC2626'], ['#10B981', '#059669'],
        ['#F97316', '#EA580C'], ['#EC4899', '#DB2777'], ['#6366F1', '#4F46E5'],
    ];

    function gradientFor(str) {
        let h = 0;
        for (let i = 0; i < (str || '').length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
        return COLORS[Math.abs(h) % COLORS.length];
    }

    function initials(name, email) {
        if (name && name.trim().length >= 2) {
            const parts = name.trim().split(/\s+/);
            if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
            return name.slice(0, 2).toUpperCase();
        }
        return (email || '??').slice(0, 2).toUpperCase();
    }

    function timeAgo(iso) {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return mins + 'm ago';
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return hrs + 'h ago';
        const days = Math.floor(hrs / 24);
        if (days < 7) return days + 'd ago';
        return Math.floor(days / 7) + 'w ago';
    }

    function waitForClient(cb, attempt) {
        attempt = attempt || 0;
        if (window.supabaseClient) { cb(); return; }
        if (window.supabaseError) return;
        if (attempt < 120) setTimeout(function () { waitForClient(cb, attempt + 1); }, 50);
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function cardHtml(p, opts) {
        opts = opts || {};
        const displayName = p.display_name || p.first_name || p.name ||
            (p.email ? p.email.split('@')[0] : 'A new adventurer');
        const meta = p.location ? p.location : timeAgo(p.created_at);
        const [c1, c2] = gradientFor(p.id || p.email || displayName);
        const avatarStyle = p.avatar_url
            ? `background-image:url('${escapeHtml(p.avatar_url)}');`
            : `background:linear-gradient(135deg,${c1},${c2});`;
        const avatarContent = p.avatar_url ? '' : escapeHtml(initials(displayName, p.email));
        const freshClass = opts.fresh ? ' fresh' : '';
        return `
            <div class="ra-card${freshClass}" data-profile-id="${escapeHtml(p.id || '')}">
                <div class="ra-avatar" style="${avatarStyle}">${avatarContent}</div>
                <p class="ra-name">${escapeHtml(displayName)}</p>
                <p class="ra-meta">${escapeHtml(meta)}</p>
            </div>
        `;
    }

    waitForClient(async function () {
        const grid = document.getElementById(GRID_ID);
        const countEl = document.getElementById(COUNT_ID);
        const emptyEl = document.getElementById(EMPTY_ID);
        if (!grid) return;
        const sb = window.supabaseClient;

        const seenIds = new Set();

        async function fetchInitial() {
            const [rowsRes, countRes] = await Promise.all([
                sb.from('community_sidebar_profiles')
                    .select('id, display_name, first_name, email, location, avatar_url, created_at')
                    .order('created_at', { ascending: false })
                    .limit(LIMIT),
                sb.rpc('community_member_count'),
            ]);

            let rows = rowsRes.data;
            let total = countRes.data;

            // Fallback for environments without migration 014 applied.
            if (rowsRes.error || rows == null) {
                const legacy = await sb.from('profiles')
                    .select('id, name, first_name, email, location, avatar_url, created_at, visibility')
                    .eq('visibility', 'public')
                    .order('created_at', { ascending: false })
                    .limit(LIMIT);
                rows = legacy.data || [];
                const legacyCount = await sb.from('profiles').select('id', { count: 'exact', head: true });
                total = legacyCount.count || rows.length;
            }

            render(rows || [], total || 0);
        }

        function render(rows, total) {
            if (countEl) countEl.textContent = String(total);
            if (!rows.length) {
                grid.innerHTML = '';
                if (emptyEl) emptyEl.classList.remove('hidden');
                return;
            }
            if (emptyEl) emptyEl.classList.add('hidden');
            grid.innerHTML = rows.map(function (p) {
                seenIds.add(p.id);
                return cardHtml(p);
            }).join('');
        }

        function prepend(p) {
            if (!p || seenIds.has(p.id)) return;
            seenIds.add(p.id);
            if (countEl) countEl.textContent = String((parseInt(countEl.textContent, 10) || 0) + 1);
            if (emptyEl) emptyEl.classList.add('hidden');
            const wrapper = document.createElement('template');
            wrapper.innerHTML = cardHtml(p, { fresh: true }).trim();
            const node = wrapper.content.firstElementChild;
            grid.insertBefore(node, grid.firstChild);
            // Cap the list to LIMIT items on the page.
            while (grid.children.length > LIMIT) grid.removeChild(grid.lastChild);
            // Drop the "fresh" highlight after a moment.
            setTimeout(function () { node.classList.remove('fresh'); }, 6000);
        }

        await fetchInitial();

        // Live updates — new profile INSERTs push to the top.
        sb.channel('recent-adventurers')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'profiles' },
                function (payload) {
                    const r = payload.new || {};
                    if (r.visibility && r.visibility !== 'public') return;
                    prepend({
                        id: r.id,
                        display_name: r.name || r.first_name,
                        first_name: r.first_name,
                        email: r.email,
                        location: r.location,
                        avatar_url: r.avatar_url,
                        created_at: r.created_at || new Date().toISOString(),
                    });
                })
            .subscribe();
    });
})();
