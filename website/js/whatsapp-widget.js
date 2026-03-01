// WhatsApp Chat Widget for EducatedTraveler
// Floating wa.me button — no API needed, works immediately

(function() {
    'use strict';

    // Replace with your WhatsApp Business number (no +, no spaces)
    const WHATSAPP_NUMBER = '17862470368';

    function getPrefilledMessage() {
        // Check if quest results are visible (user completed the quest on index.html)
        const primaryName = document.getElementById('quest-primary-name');
        if (primaryName && primaryName.textContent && primaryName.textContent !== 'Quest Name') {
            return `Hey! I just completed the quest on educatedtraveler.app and my top match is "${primaryName.textContent}". I'd like to learn more!`;
        }

        // Default message based on current page
        const path = window.location.pathname;
        if (path.includes('offerings')) {
            return "Hey! I'm browsing the offerings on educatedtraveler.app and I'd like to learn more about your experiences.";
        }
        if (path.includes('vision')) {
            return "Hey! I just read the vision on educatedtraveler.app — love the concept. I'd like to know more.";
        }
        if (path.includes('instructors')) {
            return "Hey! I'm interested in becoming an instructor on educatedtraveler.app. Can we chat?";
        }
        if (path.includes('community')) {
            return "Hey! I'm interested in the EducatedTraveler community. Can you tell me more?";
        }

        return "Hey! I just visited educatedtraveler.app and I'd like to learn more about your skill adventures.";
    }

    function createWidget() {
        // Container
        const widget = document.createElement('div');
        widget.id = 'whatsapp-widget';
        widget.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;
        `;

        // Tooltip (shows on hover)
        const tooltip = document.createElement('div');
        tooltip.textContent = 'Chat with us';
        tooltip.style.cssText = `
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.8);
            font-family: 'Inter', system-ui, sans-serif;
            font-size: 13px;
            font-weight: 400;
            padding: 6px 14px;
            border-radius: 20px;
            white-space: nowrap;
            opacity: 0;
            transform: translateY(4px);
            transition: opacity 0.2s ease, transform 0.2s ease;
            pointer-events: none;
        `;

        // Button
        const btn = document.createElement('a');
        btn.href = '#'; // Set dynamically on click for fresh message
        btn.target = '_blank';
        btn.rel = 'noopener noreferrer';
        btn.setAttribute('aria-label', 'Chat on WhatsApp');
        btn.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: rgba(37, 211, 102, 0.15);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(37, 211, 102, 0.25);
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            box-shadow: 0 4px 20px rgba(37, 211, 102, 0.15);
        `;

        // WhatsApp SVG icon
        btn.innerHTML = `
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="#25D366"/>
            </svg>
        `;

        // Click handler — build fresh wa.me URL with context-aware message
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const message = encodeURIComponent(getPrefilledMessage());
            const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        });

        // Hover effects
        btn.addEventListener('mouseenter', function() {
            btn.style.background = 'rgba(37, 211, 102, 0.25)';
            btn.style.borderColor = 'rgba(37, 211, 102, 0.4)';
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = '0 8px 30px rgba(37, 211, 102, 0.25)';
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateY(0)';
        });
        btn.addEventListener('mouseleave', function() {
            btn.style.background = 'rgba(37, 211, 102, 0.15)';
            btn.style.borderColor = 'rgba(37, 211, 102, 0.25)';
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = '0 4px 20px rgba(37, 211, 102, 0.15)';
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateY(4px)';
        });

        widget.appendChild(tooltip);
        widget.appendChild(btn);
        document.body.appendChild(widget);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createWidget);
    } else {
        createWidget();
    }
})();
