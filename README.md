# FloraLock

An app blocker that teaches you botany instead of just saying "no".

You choose the apps that eat your time and how many plants you want to learn a day. Each day's lesson shows
each new plant once (photos, name, a fact), then a short multiple-choice exam. When you open a locked app,
FloraLock shows a photo of one of your plants with four names to choose from.

- **Correct:** the app unlocks for your chosen window (default 10 minutes).
- **Wrong (the Genius Penalty):** the screen freezes for 10 seconds and shows the right name plus a fact, then
  asks about a different plant, so tapping at random doesn't pay off.
- **Escape hatches, so people don't uninstall:** "I don't need Instagram right now" (the best outcome), plus a few
  emergency unlocks per day (configurable, default 2).

Everything runs offline; nothing leaves the phone ([privacy policy](PRIVACY.md)).

## Status

| Piece                                                        | State                                                                            |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| First-launch setup: plants per day, apps to lock, the lock   | ✅ Built                                                                         |
| Daily lesson + exam, one repeat per plant, lock-screen quiz  | ✅ Built and unit-tested                                                         |
| Plant browser and plant pages (about, edibility, uses, lore) | ✅ All 70 plants                                                                 |
| Photos                                                       | ✅ 3 real iNaturalist photos per plant, CC0 / CC BY / CC BY-SA, bundled          |
| Android app lock (UsageStats + foreground service)           | ✅ Passes the emulator test on Android 8, 10, 13 and 15; needs real phones       |
| Play Store signing and privacy policy                        | ✅ Ready; see [docs/PLAY_STORE.md](docs/PLAY_STORE.md)                           |
| FloraLock Plus (one-time purchase, Google Play Billing)      | ✅ Built; product `floralock_plus` must be created in Play Console               |
| iOS shield (Screen Time API)                                 | ⏳ Not started. See [docs/PLATFORM_INTEGRATION.md](docs/PLATFORM_INTEGRATION.md) |

## Learning model

Pure rules in `src/core/daily.ts`, covered by `npm test`:

- **Lesson:** each day brings the next _n_ plants you haven't learned (1–20, set in setup or Settings). Each is
  shown once on a study card, then the exam asks one question per plant.
- **One repeat:** every plant comes back once on a later day, in that day's exam and on the lock screen. A right
  answer there completes it; a miss brings it back the next day until you get it.
- **Lock screen:** asks about today's exam plants first (those not yet answered right today), then anything
  you've learned.
- **Botany IQ** goes from 60 to 160: a plant counts half once introduced and fully once it passes its repeat.

## Run it

```bash
npm install
npx expo start         # press a / i / w for Android, iOS or web
npm test               # core logic tests (vitest)
npm run typecheck
```

The lock is native code (`modules/app-blocker`), so it doesn't run in Expo Go. On iOS and the web the lock
isn't available; **Preview the lock screen** on the Today tab shows the challenge instead.

## Android builds

Every push to `main` or a `claude/**` branch runs [.github/workflows/main.yml](.github/workflows/main.yml) on
GitHub Actions:

1. **build:** typecheck and tests, then a signed, R8-optimized AAB for the Play Store (`floralock-aab`) and an
   APK for the emulator tests.
2. **lock-test:** installs the APK on Android 8, 10, 13 and 15 emulators and runs [e2e/lock.yaml](e2e/lock.yaml):
   setup, locking the Settings app, the challenge appearing over it, an emergency unlock, the daily lesson and
   the Plus screen. When all pass, the APK is deleted, so the run's only download is the AAB.

## Layout

```
src/
  app/                  Expo Router screens
    onboarding.tsx        First launch: plants per day, apps to lock, the lock
    (tabs)/index.tsx      Today: lesson card, Botany IQ, trouble plants
    (tabs)/browse.tsx     Searchable plant guide
    (tabs)/settings.tsx   Lock, Plus, plants per day, unlock window, penalty, emergency unlocks, deck
    upgrade.tsx           FloraLock Plus: what it adds, purchase and restore
    lesson.tsx            Study cards, then the exam
    challenge.tsx         The lock-screen intercept (floralock://challenge?source=Instagram)
    plant/[id].tsx        Plant page
    privacy.tsx, credits.tsx
  core/                 Pure TypeScript, no React, unit-tested
    daily.ts              Daily lessons, the one repeat, lock-screen plant picker
    challenge.ts          Lock-screen state machine (question → penalty → unlocked)
    quiz.ts               Multiple-choice distractors (same category first)
    stats.ts              Botany IQ, accuracy, trouble plants
    plus.ts               What's free and what Plus unlocks
  data/                 Plants, plant details, photos (generated), privacy policy
  blocker/              Bridge to the native Android lock
  state/store.tsx       App state, persisted to AsyncStorage
modules/app-blocker/    Native Android lock: foreground service, overlay fallback, boot receiver
modules/play-billing/   Google Play Billing for the one-time Plus purchase
```

## Photos

Photos come from [iNaturalist](https://www.inaturalist.org) observers, identified to species and verified by the
community. FloraLock uses only **CC0, CC BY and CC BY-SA** photos (no NC licences) and credits each photographer
on the Photo credits screen. The lock screen picks one of each plant's photos at random, so you learn the plant,
not one picture.

```bash
npm run photos:find -- peony      # candidates from the iNaturalist API, with preview links
# paste the ones you like into scripts/plant-photos.json
npm run photos:download           # downloads from iNaturalist's open-data bucket, resizes to 1000px
```

## Next steps

1. Test the Android lock on real phones (Samsung, Xiaomi, OPPO and vivo handle background apps differently).
2. Build the iOS blocker with Apple's Screen Time API; request the Family Controls entitlement early.
3. Grow the deck to 300–500 plants, with look-alikes (rose vs. ranunculus vs. peony) as distractors.
