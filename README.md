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

| Piece                                                  | State                                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Challenge flow (easy/hard, penalty, retry, unlock)     | ✅ Built and unit-tested                                                                   |
| Spaced repetition (Leitner boxes) + Botany IQ          | ✅ Built and unit-tested                                                                   |
| Herbarium, plant browser, plant pages, settings        | ✅ Built                                                                                   |
| Plant database                                         | ✅ 70 plants (35 flowers, 18 houseplants, 17 trees), each with a fact                       |
| Photos                                                 | ⏳ Run `npm run fetch-images` (downloads CC-licensed photos and credits from Wikimedia)    |
| iOS shield (Screen Time API)                           | ⏳ Not started. See [docs/PLATFORM_INTEGRATION.md](docs/PLATFORM_INTEGRATION.md)           |
| Android blocker (UsageStats + foreground service)      | ⏳ Not started. See [docs/PLATFORM_INTEGRATION.md](docs/PLATFORM_INTEGRATION.md)           |

Until the native blockers exist, `src/blocker/index.ts` is a simulated blocker. Use **Preview the lock screen** on
the Herbarium tab to try the full intercept flow.

## Run it

```bash
npm install
npm run fetch-images   # optional; needs internet access to Wikimedia; without it you get placeholders
npx expo start         # press i / a / w for iOS, Android or web
```

```bash
npm test               # core logic tests (vitest)
npm run typecheck
```

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
scripts/fetch-plant-images.mjs   Downloads openly licensed photos and writes credits
```

### Learning model

Each plant sits in a Leitner box from 0 to 6. The review intervals are 2 min, 20 min, 4 h, 1 d, 3 d, 8 d and 21 d.
A correct answer moves the plant up one box. A miss sends it back to box 0, so it returns within minutes. People
hit the lock screen many times a day, which makes those short early intervals work well. The next plant shown is
the weakest overdue one, then an unseen one, then whichever is due soonest.

**Botany IQ** goes from 60 to 160. It is 60 + 100 × (average box ÷ 6) across the enabled deck, so it only rises
with spaced, repeated correct answers.

## Next steps

1. Fetch and review the photos. Lead images are sometimes diagrams or show the wrong part of the plant. Override
   those in `scripts/image-overrides.json`.
2. Build the iOS blocker with `react-native-device-activity`, and request the Family Controls distribution
   entitlement from Apple now, since approval takes time.
3. Build the Android blocker as a local Expo module (Kotlin foreground service + UsageStats).
4. Grow the deck to 300–500 plants. Group look-alikes (e.g. rose vs. ranunculus vs. peony) as Easy Mode distractors
   so it gets harder as your Botany IQ rises.
