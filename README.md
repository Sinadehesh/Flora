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
| Daily lesson + exam, spaced reviews, lock-screen quiz        | ✅ Built and unit-tested                                                         |
| Look-alikes, field clues, streaks and milestones             | ✅ Built and unit-tested                                                         |
| Plant browser and plant pages (about, edibility, uses, lore) | ✅ All 70 plants                                                                 |
| Photos                                                       | ✅ 3 real iNaturalist photos per plant, CC0 / CC BY / CC BY-SA, bundled          |
| Android app lock (UsageStats + foreground service)           | ✅ Passes the emulator test on Android 8, 10, 13 and 15; needs real phones       |
| Play Store signing and privacy policy                        | ✅ Ready; see [docs/PLAY_STORE.md](docs/PLAY_STORE.md)                           |
| FloraLock Plus (one-time or monthly, Google Play Billing)    | ✅ Built; `floralock_plus` and `floralock_plus_monthly` must be created in Play  |
| iOS shield (Screen Time API)                                 | ⏳ Not started. See [docs/PLATFORM_INTEGRATION.md](docs/PLATFORM_INTEGRATION.md) |

## Learning model

Pure rules in `src/core/`, covered by `npm test`:

- **Lesson** (`daily.ts`): each day brings the next _n_ plants you haven't learned (1–20, set in setup or
  Settings). Each is shown once on a study card (photos, how to recognise it, edibility, and the plants it's
  mistaken for), then the exam asks one question per plant.
- **Spaced reviews** (`daily.ts`): a plant comes back 1 day after its lesson, then 3, 7, 14 and 30 days after each
  right answer. A miss, in an exam or on the lock screen, starts it over from tomorrow. After the fifth review
  it's mastered. A day's exam asks at most 15 reviews, the most overdue first.
- **Lock screen:** asks about today's exam plants first (those not yet answered right today), then anything
  you've learned.
- **Look-alikes** (`quiz.ts`, `LOOKALIKE_PAIRS` in `src/data/plants.ts`): wrong choices are a plant's real
  look-alikes first (peony, rose, ranunculus…), then the same group. A wrong pick of a look-alike shows how to
  tell the two apart.
- **Progress** (`progress.ts`, `stats.ts`): a streak of days with the exam done; collected and mastered counts;
  milestones; and Botany IQ from 60 to 160 (a fifth for meeting a plant, the rest grows with each review).

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
   the Plus screen. Then it reinstalls the app over itself, as an update does, and checks that the lock
   restarts on its own and the user's progress is kept ([e2e/update.yaml](e2e/update.yaml)). When all pass,
   the APK is deleted, so the run's only download is the AAB.

## Layout

```
src/
  app/                  Expo Router screens
    onboarding.tsx        First launch: plants per day, apps to lock, the lock
    (tabs)/index.tsx      Today: lesson card, streak, next goal, Botany IQ, trouble plants
    (tabs)/browse.tsx     Collection: collected and mastered, milestones, searchable guide
    (tabs)/settings.tsx   Lock, Plus, plants per day, unlock window, penalty, emergency unlocks, deck
    upgrade.tsx           FloraLock Plus: what it adds, purchase and restore
    lesson.tsx            Study cards, then the exam
    challenge.tsx         The lock-screen intercept (floralock://challenge?source=Instagram)
    plant/[id].tsx        Plant page
    privacy.tsx, credits.tsx
  core/                 Pure TypeScript, no React, unit-tested
    daily.ts              Daily lessons, spaced reviews, lock-screen plant picker
    progress.ts           Streaks, collection, milestones
    challenge.ts          Lock-screen state machine (question → penalty → unlocked)
    quiz.ts               Look-alike distractors
    stats.ts              Botany IQ, accuracy, trouble plants
    plus.ts               What's free and what Plus unlocks
    saved.ts              Saved progress: reading older saves after an app update
  data/                 Plants, plant details, photos (generated), privacy policy
  blocker/              Bridge to the native Android lock
  state/store.tsx       App state, persisted to AsyncStorage
modules/app-blocker/    Native Android lock: foreground service, overlay fallback, boot receiver
modules/play-billing/   Google Play Billing for Plus (one-time purchase and monthly subscription)
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
