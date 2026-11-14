# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this site is

`nkosiphendulejwara.tech` is a hand-written static site on GitHub Pages. It does several jobs, and some of them are external contracts:

- **Professional portfolio**: the home page (`index.html`) plus project case studies under `projects/<slug>/`.
- **Developer website for Google Play and the App Store.** Store listings and shipped app builds link to these URLs, so **do not rename or move them** without warning the owner:
  - `/privacy-policy/`
  - `/delete-account/`, including the legacy `/#delete-account`, which `site.js` forwards to `/delete-account/`
  - `/support/`
  - `/#contact`
- **Reverse-DNS root for app IDs.** Apps use `tech.nkosiphendulejwara.<project>` as their Android package and iOS bundle ID. The Apple Team ID is `357ZAK7UH4`.
- **Universal Links host**: `.well-known/apple-app-site-association`. `docs/android-app-links.md` explains how to add `assetlinks.json`.

## Commands

There is no build step, package manager, linter or test suite. Pages are plain HTML, `styles.css` and vanilla JS in `assets/js/`. All URLs are root-absolute (`/styles.css`, `/assets/...`), so serve the repo root to preview it:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. `python -m http.server` does not serve `404.html` for missing paths the way GitHub Pages does.

```bash
python3 -m json.tool .well-known/apple-app-site-association
```

## Deployment

- Pages uses **"Deploy from a branch"** (`master`, `/`), the legacy build. A push to `master` deploys the site. There is no Actions workflow.
- That legacy build runs Jekyll, so **`.nojekyll` is required**: without it, `.well-known/` stops being served. Because of `.nojekyll`, every file in the repo is public, including `docs/` and this file. Never commit secrets.
- `CNAME` holds `nkosiphendulejwara.tech`. Google Search Console is verified with a DNS TXT record at the registrar, not with a file in the repo. HTTPS is enforced in the Pages settings.
- GitHub Pages cannot set response headers or run server code. Dynamic behaviour must go through a third-party service called from the browser.

## Architecture

- **Pages share no template.** The `<head>`, navbar and footer are copied into every HTML file. When you change the nav, footer, meta pattern or theme snippet, update `index.html`, `404.html`, `privacy-policy/`, `delete-account/`, `support/` and `projects/*/`. Add new pages to `sitemap.xml`.
- **Theming**: colours are CSS custom properties on `:root`, overridden by `html.dark-mode`. An inline snippet in each `<head>` applies the saved or system theme before paint. `site.js` toggles the theme, saves it in `localStorage['theme']` and fires a `themechange` event, which `forms.js` uses to re-render hCaptcha. New components must use the CSS variables so they follow dark mode.
- **Navigation**: the navbar collapses into the hamburger menu at ≤1024px. `.nav-brand` has `order: -2` there so it stays on the left.
- **Forms** (`assets/js/forms.js` + `assets/js/config.js`): every `<form data-web3forms>` posts JSON to Web3Forms.
  - The form carries an hCaptcha token, rendered explicitly with the shared free-plan site key, plus a `botcheck` honeypot.
  - `data-subject` supports `{field}` (the option text the visitor saw) and `{field.value}` (the raw value).
  - When `web3formsAccessKey` is still the `YOUR_...` placeholder, or the request fails, the form shows a pre-filled `mailto:` fallback to the address in `config.requestEmail`.
  - `?app=<id|bundle id>` preselects `select[data-app-select]` by option `value` or `data-aliases`.
  - Setup and the captcha walkthrough are in `docs/forms-and-captcha-guide.md`.
- **Apps registry**: no single source. When you add an app, update the `<option>` list in **both** `delete-account/index.html` and `support/index.html`, add a card to `#apps` in `index.html`, and add its entry to the AASA file if it uses Universal Links.
- **LinkedIn updates**: `assets/js/linkedin-posts.js` holds `LINKEDIN_POSTS` (newest first: `urn` plus a fixed iframe `height`) and renders them into `#postsGrid`. LinkedIn has no public feed API, so posts are added by hand.
- **404.html** doubles as the web fallback for Universal Link paths (`/book`, `/rewards`, `/stores`). It switches its message when the path matches one of them. Keep that regex in sync with the AASA `components`.
- **Privacy policy** content was generated with freeprivacypolicy.com (live copy: `https://www.freeprivacypolicy.com/live/a2b23a08-0318-4fe4-937f-1058c043c442`) and pasted into `privacy-policy/index.html`. Keep the generator attribution line. Its "Application" definition names only Opti Gainz Track AI.
- **Analytics**: GoatCounter (`nkosiphendulejwara.goatcounter.com`) on every page.
- **Images**:
  - `assets/img/og-image.jpg` (1200×630 social card)
  - `assets/img/apple-touch-icon.png` (180×180)
  - `NJ.ico`
  - Project visuals are gradient placeholders. Each has a commented `<img>` slot for a real screenshot.

## Apple App Site Association

`.well-known/apple-app-site-association` has no file extension and must be valid JSON. Each `appIDs` entry is `TEAMID.bundleid`, for example `357ZAK7UH4.tech.nkosiphendulejwara.barbershop`, with no brackets. **Never add `/delete-account*` to `components`**: if it were there, iOS would open the app instead of the deletion form.

## Content conventions

- The copy is first person and deliberately casual (see the README). Keep that tone.
- Facts repeated across sections must agree. The municipal app serves "over 200,000 users".
