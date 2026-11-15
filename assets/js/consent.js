/*
 * POPIA consent banner. Load on every page BEFORE site.js and the other scripts.
 *
 * Choice is kept in localStorage['popia-consent'] as JSON:
 *   { "choice": "accepted" | "declined", "at": "<ISO time>", "v": NOTICE_VERSION }
 * It is remembered across tabs and visits, and the banner asks again after
 * MAX_AGE_DAYS or when NOTICE_VERSION is bumped (bump it when the privacy notice
 * changes what is collected). The record lives only in the visitor's browser, so
 * it is not proof of consent (POPIA s11(2)(a)). Forms send their own consent tick
 * + timestamp in each request for that. See docs/popia-consent.md.
 *
 * Gated on "accepted": GoatCounter analytics, LinkedIn embeds (linkedin-posts.js),
 * and early hCaptcha loading on form pages (forms.js).
 * Not gated: theme preference (stays in the browser) and the forms themselves.
 */
(function () {
    var KEY = 'popia-consent';
    var NOTICE_VERSION = 1;
    var MAX_AGE_DAYS = 365;
    var memory = null; // fallback when storage is blocked
    var banner = null;
    var analyticsLoaded = false;

    function get() {
        var raw = null;
        try { raw = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }
        if (!raw) return memory;
        try {
            var rec = JSON.parse(raw);
            var ageDays = (Date.now() - Date.parse(rec.at)) / 86400000;
            var valid = (rec.choice === 'accepted' || rec.choice === 'declined') &&
                rec.v === NOTICE_VERSION && ageDays >= 0 && ageDays < MAX_AGE_DAYS;
            if (valid) return rec.choice;
        } catch (e) { /* old or broken value */ }
        try { localStorage.removeItem(KEY); } catch (e) {}
        return memory;
    }

    function set(value) {
        memory = value;
        try {
            localStorage.setItem(KEY, JSON.stringify({ choice: value, at: new Date().toISOString(), v: NOTICE_VERSION }));
        } catch (e) { /* storage blocked: choice lasts for this page only */ }
        apply();
        hide();
        document.dispatchEvent(new CustomEvent('consentchange', { detail: value }));
    }

    function accepted() { return get() === 'accepted'; }

    function loadAnalytics() {
        if (analyticsLoaded) return;
        analyticsLoaded = true;
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://gc.zgo.at/count.js';
        s.setAttribute('data-goatcounter', 'https://nkosiphendulejwara.goatcounter.com/count');
        document.head.appendChild(s);
    }

    function apply() {
        if (accepted()) loadAnalytics();
    }

    function build() {
        banner = document.createElement('section');
        banner.className = 'consent-banner';
        banner.setAttribute('role', 'region');
        banner.setAttribute('aria-label', 'Privacy choices');
        banner.innerHTML =
            '<div class="consent-inner">' +
                '<div class="consent-text">' +
                    '<h2 id="consentTitle">Your privacy (POPIA)</h2>' +
                    '<p>With your OK, this site counts visits with GoatCounter and shows LinkedIn posts, which lets LinkedIn set cookies. ' +
                    'Both services are outside South Africa. Say no and the site still works: the forms are still available, and they ask for your consent when you use them. ' +
                    'You can change this any time under <strong>Privacy choices</strong> at the bottom of the page. ' +
                    '<a href="/privacy-policy/#website-privacy">Read the website privacy notice</a>.</p>' +
                '</div>' +
                '<div class="consent-actions">' +
                    '<button type="button" class="consent-btn" data-consent="declined">No, thanks</button>' +
                    '<button type="button" class="consent-btn" data-consent="accepted">I agree</button>' +
                '</div>' +
            '</div>';
        banner.addEventListener('click', function (e) {
            var choice = e.target.getAttribute && e.target.getAttribute('data-consent');
            if (choice) set(choice);
        });
        document.body.appendChild(banner);
    }

    function show() {
        if (!banner) build();
        banner.hidden = false;
        var current = get();
        banner.querySelectorAll('[data-consent]').forEach(function (b) {
            b.setAttribute('aria-pressed', b.getAttribute('data-consent') === current ? 'true' : 'false');
        });
        var first = banner.querySelector('[data-consent="accepted"]');
        if (first && current) first.focus();
    }

    function hide() {
        if (banner) banner.hidden = true;
    }

    window.SiteConsent = { get: get, accepted: accepted, set: set, open: show };

    function init() {
        apply();
        if (!get()) show();
        document.addEventListener('click', function (e) {
            var t = e.target.closest && e.target.closest('[data-consent-open]');
            if (t) { e.preventDefault(); show(); }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && banner && !banner.hidden && get()) hide();
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
