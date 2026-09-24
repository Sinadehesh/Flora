# FloraLock

An app blocker that teaches you botany instead of just saying "no".

When you open Instagram or TikTok, FloraLock shows you a photo of a plant instead. To get in, you have to name it.
Easy Mode gives you four choices. Hard Mode makes you type the name, and small typos are OK.

- **Correct:** the app unlocks for your chosen window (default 10 minutes).
- **Wrong (the Genius Penalty):** the screen freezes for 10 seconds and shows the right name plus a
  one-sentence fact. Taps during the freeze are ignored. In Hard Mode you then have to recall the plant you
  just saw. In Easy Mode you get a new plant, so tapping at random doesn't pay off.
- **Escape hatches, so people don't uninstall:** "I don't need Instagram right now" (the best outcome), plus a few
  emergency unlocks per day (configurable, default 2).

Opening FloraLock itself takes you to the **Herbarium**. It shows your Botany IQ, the plants you keep missing,
flashcard practice and a browsable plant guide. Everything runs offline.

## Status

| Piece                                              | State                                                                              |
| -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Challenge flow (easy/hard, penalty, retry, unlock) | ✅ Built and unit-tested                                                           |
| Spaced repetition (Leitner boxes) + Botany IQ      | ✅ Built and unit-tested                                                           |
| Herbarium, plant browser, plant pages, settings    | ✅ Built                                                                           |
| Plant database                                     | ✅ 70 plants (35 flowers, 18 houseplants, 17 trees), each with a fact              |
| Photos                                             | ✅ Real iNaturalist photos, several per plant, CC0 / CC BY / CC BY-SA with credits |
| iOS shield (Screen Time API)                       | ⏳ Not started. See [docs/PLATFORM_INTEGRATION.md](docs/PLATFORM_INTEGRATION.md)   |
| Android blocker (UsageStats + foreground service)  | ⏳ Not started. See [docs/PLATFORM_INTEGRATION.md](docs/PLATFORM_INTEGRATION.md)   |

Until the native blockers exist, `src/blocker/index.ts` is a simulated blocker. Use **Preview the lock screen** on
the Herbarium tab to try the full intercept flow.

## Run it

```bash
npm install
npx expo start         # press i / a / w for iOS, Android or web
```

```bash
npm test               # core logic tests (vitest)
npm run typecheck
```

## Build for Android

Builds run in the cloud on [EAS Build](https://docs.expo.dev/build/introduction/). You need a free Expo
account, but not Android Studio. Log in once with `npx eas-cli@latest login`. The first build asks to create
the project and an Android signing key. Let EAS generate and store the key; you need that same key for
every future Play Store update.

| Command                    | Output | Use it for                                                                     |
| -------------------------- | ------ | ------------------------------------------------------------------------------ |
| `npm run build:apk`        | `.apk` | Installing directly on phones: you, friends, testers. The link opens a QR.     |
| `npm run build:playstore`  | `.aab` | The Play Store. The version code increases automatically on each build.        |
| `npm run submit:playstore` | —      | Uploads the latest `.aab` to Play Console's internal testing track as a draft. |

Before the first Play Store upload:

- Create the app in [Play Console](https://play.google.com/console) with the package name `com.floralock.app`.
  Upload the first `.aab` by hand; after that, `submit:playstore` works.
- For `submit:playstore`, create a Google Cloud service account with Play Console access and give its JSON key
  to EAS ([guide](https://docs.expo.dev/submit/android/)).
- New personal developer accounts must run a closed test with at least 12 testers for 14 days before
  publishing to production.
- Both builds currently have the simulated blocker. Blocking other apps needs the native Android module
  (see [docs/PLATFORM_INTEGRATION.md](docs/PLATFORM_INTEGRATION.md)). That module's permissions, Usage Access
  and a special-use foreground service, need Play Console declarations.

## Layout

```
src/
  app/                  Expo Router screens
    (tabs)/index.tsx      Herbarium: Botany IQ, trouble plants, practice
    (tabs)/browse.tsx     Searchable plant guide with mastery dots
    (tabs)/settings.tsx   Mode, unlock window, penalty, emergency unlocks, deck
    challenge.tsx         The lock-screen intercept (floralock://challenge?source=Instagram)
    plant/[id].tsx        Plant page
    credits.tsx           Photo attributions
  core/                 Pure TypeScript, no React, fully unit-tested
    challenge.ts          Lock-screen state machine (question → penalty → unlocked)
    matching.ts           Hard Mode answer checking (aliases, plurals, typo tolerance)
    srs.ts                Leitner spaced repetition + next-plant picker
    quiz.ts               Easy Mode distractors (same category first)
    stats.ts              Botany IQ, accuracy, trouble plants
  data/plants.ts        The plant database
  blocker/              OS app-blocker bridge (simulated for now)
  state/store.tsx       App state, persisted to AsyncStorage
scripts/plant-photos.json            Curated photo list (iNaturalist photo id, license, author)
scripts/download-plant-photos.mjs    Downloads + resizes those photos, regenerates credits
scripts/find-plant-photos.mjs        Finds candidate photos for a plant via the iNaturalist API
```

### Learning model

Each plant sits in a Leitner box from 0 to 6. The review intervals are 2 min, 20 min, 4 h, 1 d, 3 d, 8 d and 21 d.
A correct answer moves the plant up one box. A miss sends it back to box 0, so it returns within minutes. People
hit the lock screen many times a day, which makes those short early intervals work well. The next plant shown is
the weakest overdue one, then an unseen one, then whichever is due soonest.

**Botany IQ** goes from 60 to 160. It is 60 + 100 × (average box ÷ 6) across the enabled deck, so it only rises
with spaced, repeated correct answers.

## Photos

Photos come from [iNaturalist](https://www.inaturalist.org). Its observers upload millions of plant photos, each
identified to species and verified by the community. Many are released under open licences. FloraLock uses only
**CC0, CC BY and CC BY-SA** photos. It skips the common CC BY-NC licence, which forbids commercial use. Each
photo's author is shown under the photo and on the Credits screen.

Each plant has several photos, and the lock screen picks one at random. That way you learn the plant, not one
particular picture.

To add or swap photos:

```bash
npm run photos:find -- peony      # candidates from the iNaturalist API, with preview links
# paste the ones you like into scripts/plant-photos.json
npm run photos:download           # downloads from iNaturalist's open-data bucket, resizes to 1000px
```

## Next steps

1. Build the iOS blocker with `react-native-device-activity`, and request the Family Controls distribution
   entitlement from Apple now, since approval takes time.
2. Build the Android blocker as a local Expo module (Kotlin foreground service + UsageStats).
3. Grow the deck to 300–500 plants. Group look-alikes (e.g. rose vs. ranunculus vs. peony) as Easy Mode distractors
   so it gets harder as your Botany IQ rises.
