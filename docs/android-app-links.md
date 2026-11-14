# Android App Links (`assetlinks.json`)

iOS Universal Links use `.well-known/apple-app-site-association`. Android needs its own file,
`.well-known/assetlinks.json`, before links like `https://nkosiphendulejwara.tech/book/...` open your Android app
without the "Open with" chooser. It isn't on the site yet because it needs your app's signing key fingerprint.

## 1. Get the SHA-256 fingerprint

**For apps on Google Play** (Play App Signing): Play Console → your app → **Test and release → App integrity →
App signing** → copy the **SHA-256 certificate fingerprint** of the *App signing key*.
Also copy the *Upload key* one if you sideload release builds.

**For local debug builds:**

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA256
```

## 2. Create `.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "tech.nkosiphendulejwara.barbershop",
      "sha256_cert_fingerprints": [
        "AA:BB:CC:...:FF"
      ]
    }
  }
]
```

Add one object per app. Commit and push. `.nojekyll` already makes sure `.well-known/` is published.

## 3. Match it in the app

In `AndroidManifest.xml`, on the activity that handles the links:

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="nkosiphendulejwara.tech" android:pathPrefix="/book" />
    <data android:scheme="https" android:host="nkosiphendulejwara.tech" android:pathPrefix="/rewards" />
    <data android:scheme="https" android:host="nkosiphendulejwara.tech" android:pathPrefix="/stores" />
</intent-filter>
```

Use the same paths as the iOS file. Never include `/delete-account`.

## 4. Check it

- Google's tester: <https://developers.google.com/digital-asset-links/tools/generator>
- On a device: `adb shell pm get-app-links tech.nkosiphendulejwara.barbershop` should show `verified`.

If someone opens a link without the app installed, they land on the site's `404.html`. That page tells them it's an app link.
