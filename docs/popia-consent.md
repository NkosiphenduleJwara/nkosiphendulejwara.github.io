# POPIA consent on this site

How the site handles consent under South Africa's **Protection of Personal Information Act 4 of 2013 (POPIA)**,
and why it is built this way. This is a developer summary, not legal advice.

## What the law asks for

| Rule | What it means here |
|---|---|
| **s1 "consent"**: a *voluntary, specific and informed* expression of will | Accept and decline buttons look the same. Nothing is pre-ticked. Each consent says what it covers. |
| **s1 "personal information"** covers email addresses, location, *online identifiers* | Form fields, IP addresses and cookie IDs all count. |
| **s11(1)**: six lawful grounds. Consent is only one (others: contract, legal duty, legitimate interest…) | Not everything needs the banner. The theme setting stays in the browser and is never processed by anyone. |
| **s11(2)(a)**: the responsible party must **prove** consent | `localStorage` lives only in the visitor's browser, so it proves nothing. Forms send a required consent tick plus `consent_recorded_at` in every email. **Keep those emails.** |
| **s11(2)(b)**: consent can be withdrawn any time | The **Privacy choices** button sits in every footer. Choosing "No, thanks" removes LinkedIn embeds for the rest of the visit. |
| **s18**: before collecting, tell people who you are, what, why, whether it's voluntary, the consequences, foreign transfers, recipients, their rights, and the Information Regulator's contact details | Covered by the *Website privacy notice* at `/privacy-policy/#website-privacy` and the consent text on each form. |
| **s69**: direct marketing by email needs opt-in | The site sends no marketing. If you ever add a newsletter, it needs its own unticked opt-in box. |
| **s72(1)(b)**: transfers outside South Africa are allowed with consent | Web3Forms, hCaptcha, GoatCounter, LinkedIn and Gmail are all foreign, so each is named in the consent. |

Sources: [s1](https://popia.co.za/section-1-definitions/), [s11](https://popia.co.za/section-11-consent-justification-and-objection/),
[s18](https://popia.co.za/section-18-notification-to-data-subject-when-collecting-personal-information/),
[s72](https://popia.co.za/section-72-transfers-of-personal-information-outside-republic/),
[Information Regulator contact](https://inforegulator.org.za/contact-us/).
POPIA doesn't mention cookies by name, and the Regulator hasn't published cookie-banner rules. Cookies and IP addresses
are treated as "online identifiers", so the banner asks first.

## How it works

`assets/js/consent.js` loads first on every page.

- **Storage**: `localStorage['popia-consent']` = `{"choice":"accepted"|"declined","at":"<ISO>","v":1}`.
  The choice is remembered across tabs and visits. The banner asks again after **12 months** (`MAX_AGE_DAYS`), or
  when you bump `NOTICE_VERSION` in `consent.js`. Bump it whenever the website privacy notice changes what is
  collected or who receives it, because old consent didn't cover the new use.
- **Only after "I agree"**:
  - GoatCounter is injected.
  - LinkedIn iframes render. Otherwise a placeholder with a *Review privacy choices* button shows.
  - hCaptcha preloads on form pages.
- **API**: `window.SiteConsent.get() / accepted() / set('accepted'|'declined') / open()`. A `consentchange` event fires on every change.
  Any element with `data-consent-open` reopens the banner.

## Do forms have to be disabled when someone declines?

**No.** Forms stay usable when the banner is declined, for three reasons:

1. **The banner is for optional extras** (analytics, embeds). Blocking a form because someone declined analytics would make the
   choice not *voluntary*: "agree to tracking or you can't send a request".
2. **Deletion and support requests are how people use their POPIA rights** (s23 access, s24 correction/deletion).
   Blocking them would work against the Act.
3. **A form collects different information for a different purpose**, so it gets its own *specific* consent, asked
   just before the details are sent:
   - A required `popia_consent` tick box names the purpose and the foreign services (Web3Forms, hCaptcha).
   - hCaptcha (foreign) **only loads after that box is ticked**, or after "I agree" in the banner.
   - Anyone who refuses both can still email the request. The address is shown in the form.

## Checklist when you change something

- Adding a third-party script, embed or font? Gate it behind `SiteConsent.accepted()` and add it to the website privacy notice.
- Adding a form? Copy the `popia_consent` box. Change the purpose text and the list of services.
- Changing what's collected? Update `/privacy-policy/#website-privacy` (s18).
