// Community Sidebar Widget
// Shows live member count, recent joiners, and mini-profiles
// Include on any page: <script src="/js/community-sidebar.js"></script>

(function() {
    'use strict';

    const COLORS = [
        ['#0066B1','#3B8DD4'], ['#06B6D4','#0891B2'], ['#8B5CF6','#7C3AED'],
        ['#F59E0B','#D97706'], ['#EF4444','#DC2626'], ['#10B981','#059669'],
        ['#F97316','#EA580C'], ['#EC4899','#DB2777'], ['#6366F1','#4F46E5'],
    ];

    function getGradient(str) {
        let hash = 0;
        for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return COLORS[Math.abs(hash) % COLORS.length];
    }

    function getInitials(name, email) {
        if (name && name.length >= 2) {
            const parts = name.trim().split(/\s+/);
            if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
            return name.slice(0, 2).toUpperCase();
        }
        return (email || '??').slice(0, 2).toUpperCase();
    }

    function timeAgo(iso) {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return mins <= 1 ? 'just now' : mins + 'm ago';
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
        if (attempt < 120) setTimeout(function() { waitForClient(cb, attempt + 1); }, 50);
    }

    waitForClient(async function() {
        const sb = window.supabaseClient;

        // Fetch visible profiles (public) + count all
        const [visibleRes, countRes, badgeRes] = await Promise.all([
            sb.from('profiles').select('id, name, first_name, email, location, profession, interests, avatar_url, created_at')
              .in('visibility', ['public', 'cohort']).order('created_at', { ascending: false }).limit(20),
            sb.from('profiles').select('id', { count: 'exact', head: true }),
            sb.from('user_badges').select('badge_key, user_id'),
        ]);

        const visible = visibleRes.data || [];
        const totalCount = countRes.count || 0;
        const badges = badgeRes.data || [];

        // Also get current user for "you" indicator
        const user = window.auth?.getCurrentUser?.();

        // Build badge map
        const badgeMap = {};
        badges.forEach(b => {
            if (!badgeMap[b.user_id]) badgeMap[b.user_id] = [];
            badgeMap[b.user_id].push(b.badge_key);
        });

        renderSidebar(visible, totalCount, badgeMap, user);
    });

    function renderSidebar(profiles, totalCount, badgeMap, currentUser) {
        // Don't render on mobile (too small)
        if (window.innerWidth < 1100) {
            renderMobileBanner(totalCount);
            return;
        }

        const sidebar = document.createElement('div');
        sidebar.id = 'community-sidebar';
        sidebar.innerHTML = `
            <style>
                #community-sidebar {
                    position: fixed;
                    right: 20px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 240px;
                    z-index: 40;
                    pointer-events: auto;
                }
                #cs-toggle {
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background: rgba(0,102,177,0.15);
                    border: 1px solid rgba(59,141,212,0.3);
                    color: #3B8DD4;
                    font-size: 18px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s;
                    backdrop-filter: blur(20px);
                }
                #cs-toggle:hover { background: rgba(0,102,177,0.25); }
                #cs-panel {
                    margin-top: 56px;
                    background: rgba(10,10,10,0.95);
                    backdrop-filter: blur(30px);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 16px;
                    padding: 20px 16px;
                    max-height: 70vh;
                    overflow-y: auto;
                    transition: opacity 0.3s, transform 0.3s;
                }
                #cs-panel.collapsed { opacity: 0; transform: translateX(20px); pointer-events: none; height: 0; padding: 0; overflow: hidden; margin: 0; }
                #cs-panel::-webkit-scrollbar { width: 4px; }
                #cs-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
                .cs-avatar {
                    width: 36px; height: 36px; border-radius: 50%; display: flex;
                    align-items: center; justify-content: center; font-size: 11px;
                    font-weight: 600; color: white; flex-shrink: 0; cursor: pointer;
                    transition: transform 0.2s;
                }
                .cs-avatar:hover { transform: scale(1.15); }
                .cs-member { display: flex; align-items: center; gap: 10px; padding: 8px 4px; border-radius: 10px; transition: background 0.2s; }
                .cs-member:hover { background: rgba(255,255,255,0.03); }
                .cs-profile-card {
                    position: fixed; z-index: 50; background: rgba(10,10,10,0.97);
                    backdrop-filter: blur(40px); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 16px; padding: 24px; width: 280px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    animation: csCardIn 0.2s ease-out;
                }
                @keyframes csCardIn { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
                .cs-badge { display: inline-block; font-size: 9px; padding: 2px 7px; border-radius: 9999px; margin: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
            </style>

            <button id="cs-toggle" title="Community">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4" stroke-width="1.5"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
            </button>

            <div id="cs-panel" class="collapsed">
                <!-- Counter -->
                <div style="text-align:center;margin-bottom:16px;">
                    <p style="font-size:28px;font-weight:300;color:#3B8DD4;font-family:'Courier New',monospace;margin:0;">${totalCount}</p>
                    <p style="font-size:9px;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.3);margin:4px 0 0 0;">Adventurers</p>
                </div>

                <!-- Stacked avatars preview -->
                <div style="display:flex;justify-content:center;margin-bottom:16px;">
                    ${profiles.slice(0, 6).map((p, i) => {
                        const [c1, c2] = getGradient(p.email);
                        const initials = getInitials(p.name || p.first_name, p.email);
                        return `<div class="cs-avatar" style="background:linear-gradient(135deg,${c1},${c2});margin-left:${i > 0 ? '-8px' : '0'};border:2px solid #0a0a0a;z-index:${10-i};" title="${p.name || 'Adventurer'}">${
                            p.avatar_url ? `<img src="${p.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : initials
                        }</div>`;
                    }).join('')}
                    ${totalCount > 6 ? `<div class="cs-avatar" style="background:rgba(255,255,255,0.05);margin-left:-8px;border:2px solid #0a0a0a;font-size:9px;color:rgba(255,255,255,0.4);">+${totalCount - 6}</div>` : ''}
                </div>

                <div style="height:1px;background:rgba(255,255,255,0.06);margin:0 0 12px 0;"></div>

                <!-- Recent joiners -->
                <p style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.25);margin:0 0 8px 4px;">Recent</p>

                <div id="cs-members">
                    ${profiles.length === 0 ? '<p style="color:rgba(255,255,255,0.2);font-size:12px;text-align:center;padding:12px 0;">Be the first to join</p>' :
                    profiles.slice(0, 10).map(p => {
                        const [c1, c2] = getGradient(p.email);
                        const initials = getInitials(p.name || p.first_name, p.email);
                        const displayName = p.name || p.first_name || 'Adventurer';
                        const isYou = currentUser && p.id === currentUser.id;
                        return `
                        <div class="cs-member" data-profile-id="${p.id}">
                            <div class="cs-avatar" style="background:linear-gradient(135deg,${c1},${c2});width:32px;height:32px;font-size:10px;">${
                                p.avatar_url ? `<img src="${p.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : initials
                            }</div>
                            <div style="flex:1;min-width:0;">
                                <p style="font-size:12px;color:rgba(255,255,255,0.8);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${displayName}${isYou ? ' <span style="color:#3B8DD4;font-size:9px;">you</span>' : ''}</p>
                                <p style="font-size:10px;color:rgba(255,255,255,0.25);margin:1px 0 0 0;">${p.location || timeAgo(p.created_at)}</p>
                            </div>
                        </div>`;
                    }).join('')}
                </div>

                <!-- CTA -->
                ${!currentUser ? `
                <div style="margin-top:16px;text-align:center;">
                    <a href="join.html" style="display:inline-block;background:linear-gradient(135deg,#0066B1,#3B8DD4);color:white;text-decoration:none;padding:10px 24px;border-radius:50px;font-size:11px;font-weight:500;letter-spacing:0.5px;">Join the Community</a>
                </div>` : `
                <div style="margin-top:16px;text-align:center;">
                    <a href="dashboard.html" style="color:#3B8DD4;text-decoration:none;font-size:11px;">View Your Profile &rarr;</a>
                </div>`}
            </div>
        `;

        document.body.appendChild(sidebar);

        // Toggle
        const toggle = document.getElementById('cs-toggle');
        const panel = document.getElementById('cs-panel');
        toggle.addEventListener('click', () => {
            panel.classList.toggle('collapsed');
            toggle.style.background = panel.classList.contains('collapsed') ? 'rgba(0,102,177,0.15)' : 'rgba(0,102,177,0.3)';
        });

        // Profile cards on click
        document.querySelectorAll('.cs-member').forEach(el => {
            el.addEventListener('click', (e) => {
                const id = el.dataset.profileId;
                const profile = profiles.find(p => p.id === id);
                if (profile) showProfileCard(profile, badgeMap[id] || [], e);
            });
        });

        // Auto-open after 3 seconds
        setTimeout(() => {
            panel.classList.remove('collapsed');
            toggle.style.background = 'rgba(0,102,177,0.3)';
        }, 3000);
    }

    function renderMobileBanner(totalCount) {
        if (totalCount < 1) return;
        const banner = document.createElement('div');
        banner.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:40;background:rgba(10,10,10,0.95);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.06);border-radius:50px;padding:8px 20px;display:flex;align-items:center;gap:8px;';
        banner.innerHTML = `
            <span style="font-family:'Courier New',monospace;font-size:14px;color:#3B8DD4;font-weight:500;">${totalCount}</span>
            <span style="font-size:11px;color:rgba(255,255,255,0.4);">adventurers joined</span>
        `;
        document.body.appendChild(banner);
    }

    function showProfileCard(profile, userBadges, event) {
        // Remove existing
        const existing = document.getElementById('cs-profile-card');
        if (existing) existing.remove();

        const [c1, c2] = getGradient(profile.email);
        const initials = getInitials(profile.name || profile.first_name, profile.email);
        const displayName = profile.name || profile.first_name || 'Adventurer';

        const badgeLabels = {
            ocean: ['Ocean', '#06B6D4'], mountain: ['Mountain', '#10B981'], city: ['City', '#8B5CF6'],
            temple: ['Temple', '#F59E0B'], wild: ['Wild', '#EF4444'], certification: ['Certified', '#0066B1'],
            career: ['Career', '#6366F1'], stories: ['Stories', '#EC4899'], reset: ['Reset', '#F97316'],
            rare: ['Rare', '#D946EF'],
        };

        const card = document.createElement('div');
        card.id = 'cs-profile-card';
        card.className = 'cs-profile-card';

        // Position near click
        const rect = event.currentTarget.getBoundingClientRect();
        card.style.top = Math.min(rect.top, window.innerHeight - 320) + 'px';
        card.style.right = '270px';

        card.innerHTML = `
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
                <div class="cs-avatar" style="background:linear-gradient(135deg,${c1},${c2});width:48px;height:48px;font-size:16px;cursor:default;">${
                    profile.avatar_url ? `<img src="${profile.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : initials
                }</div>
                <div>
                    <p style="font-size:15px;color:#ffffff;margin:0;font-weight:500;">${displayName}</p>
                    ${profile.profession ? `<p style="font-size:11px;color:rgba(255,255,255,0.4);margin:2px 0 0 0;">${profile.profession}</p>` : ''}
                    ${profile.location ? `<p style="font-size:11px;color:rgba(255,255,255,0.3);margin:2px 0 0 0;">${profile.location}</p>` : ''}
                </div>
            </div>

            ${profile.about ? `<p style="font-size:12px;color:rgba(255,255,255,0.5);line-height:1.6;margin:0 0 12px 0;">${profile.about}</p>` : ''}

            ${userBadges.length > 0 ? `
                <div style="margin-top:8px;">
                    ${userBadges.map(b => {
                        const [label, color] = badgeLabels[b] || [b, '#666'];
                        return `<span class="cs-badge" style="background:${color}15;color:${color};border:1px solid ${color}30;">${label}</span>`;
                    }).join('')}
                </div>
            ` : ''}

            <p style="font-size:10px;color:rgba(255,255,255,0.2);margin:12px 0 0 0;">Joined ${timeAgo(profile.created_at)}</p>
        `;

        document.body.appendChild(card);

        // Close on outside click
        function closeCard(e) {
            if (!card.contains(e.target) && !event.currentTarget.contains(e.target)) {
                card.remove();
                document.removeEventListener('click', closeCard);
            }
        }
        setTimeout(() => document.addEventListener('click', closeCard), 100);
    }

})();
