// Shared behaviour for every page: theme toggle, mobile menu, footer year, legacy links.
(function () {
    var root = document.documentElement;

    // Store listings link to /#delete-account. Send those visitors straight to the form.
    if ((location.pathname === '/' || location.pathname === '/index.html') && location.hash === '#delete-account') {
        location.replace('/delete-account/' + location.search);
        return;
    }

    // Theme toggle. The initial class is set by the inline snippet in <head> to avoid a flash.
    var toggle = document.getElementById('darkModeToggle');
    var icon = document.getElementById('themeIcon');

    function syncIcon() {
        var dark = root.classList.contains('dark-mode');
        if (icon) icon.textContent = dark ? '☀️' : '🌙';
        if (toggle) toggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
    }

    syncIcon();

    if (toggle) {
        toggle.addEventListener('click', function () {
            root.classList.toggle('dark-mode');
            try {
                localStorage.setItem('theme', root.classList.contains('dark-mode') ? 'dark' : 'light');
            } catch (e) { /* storage blocked: theme just won't persist */ }
            syncIcon();
            document.dispatchEvent(new CustomEvent('themechange'));
        });
    }

    // Mobile menu
    var hamburger = document.getElementById('hamburger');
    var navMenu = document.getElementById('navMenu');

    function setMenu(open) {
        if (!hamburger || !navMenu) return;
        hamburger.classList.toggle('active', open);
        navMenu.classList.toggle('active', open);
        hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function () {
            setMenu(!navMenu.classList.contains('active'));
        });
        navMenu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () { setMenu(false); });
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') setMenu(false);
        });
    }

    // Footer year
    document.querySelectorAll('[data-year]').forEach(function (el) {
        el.textContent = new Date().getFullYear();
    });
})();
