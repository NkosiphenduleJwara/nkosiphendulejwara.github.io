/*
 * Static-site forms: Web3Forms (email delivery) + hCaptcha (bot check) + honeypot.
 * Any <form data-web3forms> on the page is handled. Setup: docs/forms-and-captcha-guide.md
 *
 * Form attributes:
 *   data-subject   subject line; {field} = shown text, {field.value} = raw value
 *   data-success   message shown after a successful send
 * Fields named "botcheck" (honeypot) and "h-captcha-response" are handled here.
 *
 * POPIA: hCaptcha (a foreign service) only loads after the visitor agrees, either in the
 * site banner (consent.js) or by ticking the form's required "popia_consent" box. Each
 * request also carries consent_recorded_at, so the email is your record of consent.
 */
(function () {
    var cfg = window.SITE_CONFIG || {};
    var forms = Array.prototype.slice.call(document.querySelectorAll('form[data-web3forms]'));
    if (!forms.length) return;

    var keyReady = cfg.web3formsAccessKey && cfg.web3formsAccessKey.indexOf('YOUR_') !== 0;
    var fallbackEmail = (cfg.requestEmail || []).join('@');
    var widgets = new Map();

    // ---- hCaptcha (explicit render so the theme matches the site) ----
    function isDark() {
        return document.documentElement.classList.contains('dark-mode');
    }

    function renderCaptchas() {
        if (!window.hcaptcha) return;
        forms.forEach(function (form) {
            var box = form.querySelector('.h-captcha');
            if (!box) return;
            if (widgets.has(form)) {
                try { window.hcaptcha.remove(widgets.get(form)); } catch (e) {}
            }
            box.innerHTML = '';
            var id = window.hcaptcha.render(box, {
                sitekey: cfg.hcaptchaSiteKey,
                theme: isDark() ? 'dark' : 'light',
                size: box.parentNode.clientWidth < 310 ? 'compact' : 'normal'
            });
            widgets.set(form, id);
        });
    }

    window.onHcaptchaLoad = renderCaptchas;
    document.addEventListener('themechange', renderCaptchas);

    var hcaptchaRequested = false;
    function loadHcaptcha() {
        if (hcaptchaRequested) return;
        hcaptchaRequested = true;
        var s = document.createElement('script');
        s.src = 'https://js.hcaptcha.com/1/api.js?render=explicit&onload=onHcaptchaLoad&recaptchacompat=off';
        s.async = true;
        s.defer = true;
        document.head.appendChild(s);
    }

    // Until hCaptcha loads, explain why the box is empty.
    forms.forEach(function (form) {
        var box = form.querySelector('.h-captcha');
        if (box && !box.childNodes.length) {
            box.innerHTML = '<p class="captcha-placeholder">The “I am human” check appears after you tick the consent box above.</p>';
        }
        var consentBox = form.querySelector('[name="popia_consent"]');
        if (consentBox) {
            consentBox.addEventListener('change', function () {
                if (consentBox.checked) loadHcaptcha();
            });
            if (consentBox.checked) loadHcaptcha();
        }
    });

    function maybeLoadFromBanner() {
        if (window.SiteConsent && window.SiteConsent.accepted()) loadHcaptcha();
    }
    maybeLoadFromBanner();
    document.addEventListener('consentchange', maybeLoadFromBanner);

    function captchaToken(form) {
        if (!widgets.has(form) || !window.hcaptcha) return '';
        try { return window.hcaptcha.getResponse(widgets.get(form)); } catch (e) { return ''; }
    }

    function resetCaptcha(form) {
        if (widgets.has(form) && window.hcaptcha) {
            try { window.hcaptcha.reset(widgets.get(form)); } catch (e) {}
        }
    }

    // ---- helpers ----
    function fieldLabel(form, name) {
        var input = form.querySelector('[name="' + name + '"]');
        if (input && input.id) {
            var label = form.querySelector('label[for="' + input.id + '"]');
            if (label) return label.textContent.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
        }
        return name;
    }

    function displayValue(form, name, value) {
        var input = form.querySelector('[name="' + name + '"]');
        if (input && input.tagName === 'SELECT') {
            var opt = input.options[input.selectedIndex];
            return opt ? opt.text : value;
        }
        if (input && input.type === 'checkbox') return value ? 'Yes' : 'No';
        return value;
    }

    function readable(form) {
        var data = new FormData(form);
        var lines = [];
        data.forEach(function (value, name) {
            if (name === 'botcheck' || name.indexOf('captcha') !== -1 || name === 'access_key') return;
            var label = fieldLabel(form, name);
            lines.push(label + (/[?:]$/.test(label) ? ' ' : ': ') + (displayValue(form, name, value) || 'Not provided'));
        });
        return lines;
    }

    function subjectFor(form) {
        var tpl = form.getAttribute('data-subject') || 'Website form submission';
        // {field} = what the visitor saw (option text); {field.value} = raw value
        return tpl.replace(/\{(\w+)(\.value)?\}/g, function (_, name, raw) {
            var input = form.querySelector('[name="' + name + '"]');
            if (!input) return '';
            return (raw ? input.value : displayValue(form, name, input.value)) || '';
        });
    }

    function mailtoHref(form) {
        var body = readable(form).join('\n');
        return 'mailto:' + fallbackEmail +
            '?subject=' + encodeURIComponent(subjectFor(form)) +
            '&body=' + encodeURIComponent(body);
    }

    function setStatus(el, kind, html) {
        if (!el) return;
        el.className = 'form-status' + (kind ? ' is-' + kind : '');
        el.innerHTML = html;
    }

    function fallbackMessage(form, reason) {
        return reason + ' You can <a href="' + mailtoHref(form).replace(/"/g, '&quot;') +
            '">send it by email instead</a> (opens your email app with the details filled in).';
    }

    // ---- submit ----
    forms.forEach(function (form) {
        var status = form.querySelector('.form-status');
        var button = form.querySelector('[type="submit"]');

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            // Honeypot: real people never tick this hidden box.
            var trap = form.querySelector('[name="botcheck"]');
            if (trap && trap.checked) return;

            if (!form.reportValidity()) return;

            if (!keyReady) {
                setStatus(status, 'error', fallbackMessage(form, 'Online sending is not set up yet.'));
                return;
            }

            var token = captchaToken(form);
            if (!token) {
                setStatus(status, 'error', 'Please complete the “I am human” check before sending.');
                return;
            }

            var payload = {
                access_key: cfg.web3formsAccessKey,
                subject: subjectFor(form),
                from_name: 'nkosiphendulejwara.tech',
                'h-captcha-response': token,
                consent_recorded_at: new Date().toISOString()
            };
            new FormData(form).forEach(function (value, name) {
                if (name === 'botcheck' || name.indexOf('captcha-response') !== -1) return;
                payload[name] = displayValue(form, name, value);
            });

            if (button) button.disabled = true;
            setStatus(status, '', 'Sending…');

            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(function (res) {
                    return res.json().catch(function () { return {}; }).then(function (json) {
                        if (!res.ok || !json.success) throw new Error(json.message || ('HTTP ' + res.status));
                        return json;
                    });
                })
                .then(function () {
                    setStatus(status, 'success', form.getAttribute('data-success') || 'Thanks, your message was sent.');
                    form.reset();
                    resetCaptcha(form);
                })
                .catch(function () {
                    setStatus(status, 'error', fallbackMessage(form, 'Sorry, the request could not be sent right now.'));
                    resetCaptcha(form);
                })
                .then(function () {
                    if (button) button.disabled = false;
                });
        });
    });

    // ---- prefill app from ?app= (used by the in-app "Delete my account" button) ----
    var params = new URLSearchParams(location.search);
    var wanted = (params.get('app') || '').toLowerCase()
        .replace(/^tech\.nkosiphendulejwara\./, '')
        .replace(/[^a-z0-9]/g, '');
    if (wanted) {
        document.querySelectorAll('select[data-app-select]').forEach(function (select) {
            Array.prototype.forEach.call(select.options, function (opt) {
                var keys = [opt.value].concat((opt.getAttribute('data-aliases') || '').split(/\s+/))
                    .map(function (k) { return k.toLowerCase().replace(/[^a-z0-9]/g, ''); });
                if (keys.indexOf(wanted) !== -1) select.value = opt.value;
            });
        });
    }

    // ---- reveal the fallback address in [data-request-email] spots ----
    document.querySelectorAll('[data-request-email]').forEach(function (el) {
        el.textContent = fallbackEmail;
        if (el.tagName === 'A') el.href = 'mailto:' + fallbackEmail;
    });
})();
