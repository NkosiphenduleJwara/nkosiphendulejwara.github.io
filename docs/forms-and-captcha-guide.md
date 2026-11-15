# Forms and the free "I am human" check

The **Delete My Account** form (`/delete-account/`) and the **App Support** form (`/support/`) send their
requests to your inbox without a server. They use:

| Part | What it does | Cost |
|---|---|---|
| [Web3Forms](https://web3forms.com) | Takes the form data and emails it to you | Free plan |
| [hCaptcha](https://www.hcaptcha.com) via Web3Forms | The "I am human" box. It blocks bots | Free on the Web3Forms free plan |
| Honeypot field (`botcheck`) | A hidden tick box. Bots tick it, people never see it | Free |
| Email fallback | If sending fails, the visitor gets a link that opens their email app with everything filled in | Free |

The code is in `assets/js/forms.js`. All settings are in `assets/js/config.js`.

> **Why not Google reCAPTCHA or Cloudflare Turnstile?** They need a server to check the answer
> with a secret key. GitHub Pages has no server. Web3Forms checks hCaptcha for you on its free plan.
> reCAPTCHA and Turnstile are paid Web3Forms features.

---

## Step 1: Get your free Web3Forms access key (5 minutes)

1. Go to <https://web3forms.com>.
2. In **"Create your Access Key"**, type `codermpendulo@gmail.com` and press **Create Access Key**.
3. Open that inbox. Copy the access key from the Web3Forms email. It looks like
   `a1b2c3d4-e5f6-7890-abcd-ef1234567890`.

The access key is **meant to be public**. It can only send email *to* your inbox, so it is safe in the page source.

## Step 2: Put the key on the site

Open `assets/js/config.js` and replace the placeholder:

```js
web3formsAccessKey: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
```

Until you do this, the forms still work, but they only offer the email-app fallback.

## Step 3: Make the "I am human" check required

The box already shows on both forms. Now make Web3Forms reject anything without a solved check:

1. Log in at <https://app.web3forms.com> with the same email. It sends a magic link, so there's no password.
2. Open your form (the access key) and go to **Settings**.
3. Under **Spam protection / Captcha**, pick **hCaptcha** and save.
4. Optional: under **Settings → Allowed domains**, add `nkosiphendulejwara.tech` so the key only works from your site.

Leave the site key in `config.js` as it is (`50b2fe65-b00b-4b9e-ad62-3ba471098be2`). That is the shared free key
Web3Forms says to use. Your own hCaptcha keys need a paid Web3Forms plan.

## Step 4: Publish and test

1. Commit and push to `master`. GitHub Pages updates in about a minute.
2. Open <https://nkosiphendulejwara.tech/delete-account/?app=optigainz>.
3. Fill the form, tick **I am human**, and press **Send deletion request**.
4. You should see a green "Request received" message, and an email at `codermpendulo@gmail.com` with a subject like
   `Opti Gainz Track AI - Account Deletion Request`.
5. Check the spam folder the first time, then mark it "Not spam".

Test that the check works: try sending **without** ticking the box. The form says
*"Please complete the 'I am human' check"* and sends nothing.

---

## How the check works (for future you)

1. To meet POPIA, `forms.js` loads hCaptcha from `js.hcaptcha.com` only after the visitor ticks the form's
   `popia_consent` box, or chooses "I agree" in the site banner. It then draws the box inside `<div class="h-captcha">`,
   using the site's light or dark theme and a compact size on small phones. See `docs/popia-consent.md`.
2. When a person solves it, hCaptcha gives the page a one-time token.
3. On submit, `forms.js` blocks the send if there's no token. Otherwise it posts the form and the token
   (`h-captcha-response`) to `https://api.web3forms.com/submit`.
4. Web3Forms checks the token with hCaptcha on its server. Bad or missing token = no email.

### Add the check to a new form

Any form gets everything (sending, captcha, honeypot, fallback) by copying this pattern:

```html
<form data-web3forms data-subject="{app} - New thing" data-success="Thanks!" novalidate>
  <input name="name" required>
  <input type="email" name="email" required>   <!-- name="email" becomes the reply-to address -->

  <!-- POPIA: specific consent for this form. Ticking it also loads hCaptcha. -->
  <label><input type="checkbox" name="popia_consent" value="Yes" required>
    I agree my details are used to … and sent outside South Africa via Web3Forms and hCaptcha.</label>

  <label class="hp-field" aria-hidden="true">Leave this empty
    <input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off">
  </label>

  <div class="captcha-wrap"><div class="h-captcha"></div></div>
  <button type="submit">Send</button>
  <p class="form-status" aria-live="polite"></p>
</form>

<script src="/assets/js/config.js"></script>
<script src="/assets/js/forms.js"></script>  <!-- injects hCaptcha itself after consent -->
```

In `data-subject`, `{field}` is the text the visitor saw and `{field.value}` is the raw option value.

---

## Linking the in-app "Delete my account" button

Point the button at the page and say which app it is:

```
https://nkosiphendulejwara.tech/delete-account/?app=barbershop
https://nkosiphendulejwara.tech/delete-account/?app=optigainz
```

The bundle ID works too (`?app=tech.nkosiphendulejwara.barbershop`). The form picks that app for the user.

- **Don't** put the user's email, name or ID in the link. Links end up in browser history and server logs.
- **Never** add `/delete-account/*` to `.well-known/apple-app-site-association`. If you did, iOS would open the
  app instead of the form.
- Apple (guideline 5.1.1(v)) lets an app hand off to a website for deletion only if the link goes **straight**
  to the deletion page. This link does.
- Google Play's **Data deletion** question asks for a URL. Use `https://nkosiphendulejwara.tech/delete-account/`.
  The page lists your developer name, the steps, what's deleted, what's kept and for how long.
- Old store links to `https://nkosiphendulejwara.tech/#delete-account` still work. They forward to the new page.

Flutter example:

```dart
import 'package:url_launcher/url_launcher.dart';

Future<void> openDeleteAccount() => launchUrl(
      Uri.parse('https://nkosiphendulejwara.tech/delete-account/?app=optigainz'),
      mode: LaunchMode.externalApplication,
    );
```

## Adding a new app to the forms

Add an `<option>` to the **App** dropdown in both `delete-account/index.html` and `support/index.html`:

```html
<option value="myapp" data-aliases="tech.nkosiphendulejwara.myapp my-app">My App</option>
```

Then add a card to the **My Apps** section in `index.html`.
