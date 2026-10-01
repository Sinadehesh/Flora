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
   - **Privacy policy:** `https://github.com/Sinadehesh/Flora/blob/HEAD/PRIVACY.md`
     (generated from `src/data/privacyPolicy.ts` by `npm run privacy`).
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

## 3. Each release

Push to `main` or a `claude/**` branch. The workflow sets `versionCode` from the run number, so every build can
be uploaded. Download `floralock-aab` from the run and upload it in Play Console.
