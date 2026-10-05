# Releasing FloraLock on Google Play

## 1. Signing (once)

Google Play only accepts an AAB signed with your **upload key**. The build workflow signs with it when these
two repository secrets exist (GitHub → Settings → Secrets and variables → Actions → New repository secret):

| Secret                      | Value                                   |
| --------------------------- | --------------------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | The keystore file as one line of base64 |
| `ANDROID_KEYSTORE_PASSWORD` | Its password                            |

The key alias defaults to `upload` and the key password to the keystore password. Set `ANDROID_KEY_ALIAS` and
`ANDROID_KEY_PASSWORD` only if your keystore differs.

To make a new upload key yourself:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore floralock-upload-key.jks -alias upload \
  -keyalg RSA -keysize 4096 -validity 10000 -dname "CN=FloraLock, O=FloraLock"
base64 -w0 floralock-upload-key.jks   # paste the output into ANDROID_KEYSTORE_BASE64
```

Never commit the `.jks` file (`.gitignore` excludes it). Keep it and the password in a password manager. With
Play App Signing (the default), Google holds the key users' phones see; if the upload key is lost or leaked,
Play support can reset it.

After the next push, the build job's **Show signing certificate** step prints the SHA-256 of the key that signed
the build. It should match the upload key, and Play Console → Setup → App signing after the first upload.

## 2. Play Console (once)

1. Create the app with package name `com.floralock.app`, then upload `floralock-aab` from a workflow run to
   **Testing → Internal testing**.
2. **App content:**
   - **Privacy policy:** `https://sinadehesh.github.io/Flora/privacy/`, published from `site/` by
     `.github/workflows/pages.yml` (turn on once: GitHub → Settings → Pages → Source: **GitHub Actions**). The
     page, PRIVACY.md and the in-app screen are all generated from `src/data/privacyPolicy.ts` by
     `npm run privacy`.
   - **Data safety:** the app collects and shares no user data (everything stays on the device), so answer "No"
     to collecting or sharing data.
   - **Ads:** no ads. **Target audience:** 13+ is simplest. **Content rating:** fill in the questionnaire.
   - **Foreground service permissions:** declare `FOREGROUND_SERVICE_SPECIAL_USE`. Describe it as: "Keeps the
     app lock running: watches which app is in front so FloraLock can show a learning question before an app the
     user chose to lock." Google may ask for a short screen recording of the lock in action.
3. **Policy risks to know about:**
   - Usage access and "Display over other apps" are allowed for app blockers, but the listing should say
     clearly that locking apps is the core feature.
   - Battery-optimisation exemption (`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`) is only allowed when the core
     feature breaks without it. If Google objects, remove that permission and keep the "open battery settings"
     fallback.
4. New personal developer accounts must run a closed test with at least 12 testers for 14 days before
   publishing to production.

## 3. FloraLock Plus (the in-app purchase)

The free version locks up to 2 apps and teaches the 35 flowers. **FloraLock Plus** is a one-time purchase that
unlocks unlimited apps and the houseplants and trees. The rules live in `src/core/plus.ts`; the purchase goes
through Google Play Billing in `modules/play-billing`.

1. **Payments profile:** Play Console → Setup → Payments profile. Add your bank and tax details; Google won't
   let you sell anything without it.
2. **Upload a build first.** Play Console only allows in-app products once a build that includes Google Play
   Billing has been uploaded (any testing track is fine).
3. **Create the product:** Monetize with Play → Products → One-time products → Create:
   - Product ID: `floralock_plus` (must match exactly; it can never be changed or reused)
   - Name: FloraLock Plus · Description: Unlimited locked apps and all 70 plants.
   - Price: for example $5.99 (Play converts it for other countries), then **Activate** it.
4. **Test without paying:** Setup → License testing → add your Google account. On a phone signed in with that
   account, install FloraLock from the internal testing link (not the APK from GitHub: purchases only work
   for installs from Google Play). The purchase sheet then offers test cards that are never charged.

Until the product exists and is active, the Plus screen says "FloraLock Plus isn't on sale yet". On phones
without the Play Store it explains that purchases need Google Play. Refunds are handled automatically: the next
time FloraLock opens, Google Play reports Plus as not owned and the extra locked apps are released.

**App access (for Google's reviewers):** answer **Yes, part of the app is restricted** (Plus is paid) and
give the review code with these steps: open FloraLock → Settings → "See what Plus adds" → "Have a review code?"
→ enter the code → "Apply code". The code is kept out of this repository: `src/core/plus.ts` holds only its
SHA-256 hash in `REVIEW_CODE_HASHES`. To replace a code, generate a new random one, add the hash of its
normalized form (uppercase, letters and digits only), and update the answer in Play Console.

**Data safety:** purchases are processed by Google Play; FloraLock itself doesn't collect or send purchase data.
If Play Console asks about purchase history, answer according to Google's current guidance for apps that use
Google Play Billing only.

## 4. Each release

Push to `main` or a `claude/**` branch. The workflow sets `versionCode` from the run number, so every build can
be uploaded. Download `floralock-aab` from the run and upload it in Play Console.
