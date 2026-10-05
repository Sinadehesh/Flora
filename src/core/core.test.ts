import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { PLANT_DETAILS } from '../data/plantDetails';
import { privacyHtml, privacyMarkdown } from '../data/privacyPolicy';
import { PLANTS, PLANTS_BY_ID } from '../data/plants';
import { challengeReducer, penaltySecondsLeft, startChallenge } from './challenge';
import {
  dayKey,
  dueRepeats,
  examPlants,
  lessonStudied,
  lockScreenPool,
  markStudied,
  pickLockPlant,
  recordRepeat,
  recordStats,
  todaysNewPlants,
} from './daily';
import { allowedLockedApps, canLockAnother, deckCategories, FREE_APP_LIMIT } from './plus';
import { buildChoices } from './quiz';
import { botanyIQ, learnedCount, troublePlants } from './stats';
import { normalizeName } from './text';
import type { LearnMap, StatsMap } from './types';

/** Deterministic PRNG so tests don't flake. */
function seeded(seed = 42) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const plant = (id: string) => PLANTS_BY_ID[id];

describe('plant data', () => {
  it('has unique ids and complete entries', () => {
    expect(new Set(PLANTS.map((p) => p.id)).size).toBe(PLANTS.length);
    for (const p of PLANTS) {
      expect(p.commonName && p.scientificName && p.family && p.fact).toBeTruthy();
    }
  });

  it('has plant-page details for exactly the plants in the deck', () => {
    expect(Object.keys(PLANT_DETAILS).sort()).toEqual(PLANTS.map((p) => p.id).sort());
    for (const d of Object.values(PLANT_DETAILS)) {
      expect(d.about && d.where && d.edibilityNote).toBeTruthy();
    }
  });

  it('gives every plant its own common name, so a multiple-choice answer is never ambiguous', () => {
    const names = PLANTS.map((p) => normalizeName(p.commonName));
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('text', () => {
  it('normalizes case, accents and punctuation for search', () => {
    expect(normalizeName('  Bird-of-Paradise! ')).toBe('bird of paradise');
    expect(normalizeName('Cempasúchil')).toBe('cempasuchil');
    expect(normalizeName("Devil's Ivy")).toBe('devils ivy');
  });
});

describe('quiz choices', () => {
  it('returns 4 unique options including the answer, same category first', () => {
    const answer = plant('peony');
    const choices = buildChoices(answer, PLANTS, 4, seeded());
    expect(choices).toHaveLength(4);
    expect(new Set(choices.map((c) => c.id)).size).toBe(4);
    expect(choices).toContain(answer);
    expect(choices.every((c) => c.category === 'flower')).toBe(true);
  });
});

describe('daily plan', () => {
  const deck = PLANTS.slice(0, 6);
  const ids = (plants: { id: string }[]) => plants.map((p) => p.id);
  const DAY1 = '2026-10-01';
  const DAY2 = '2026-10-02';
  const DAY3 = '2026-10-03';

  it('writes zero-padded local days that sort as strings', () => {
    expect(dayKey(new Date(2026, 8, 30, 23, 59).getTime())).toBe('2026-09-30');
    expect(dayKey(new Date(2026, 9, 1, 0, 1).getTime())).toBe('2026-10-01');
    expect('2026-09-30' < '2026-10-01').toBe(true);
  });

  it("offers the next unlearned plants as today's lesson, and keeps them once studied", () => {
    expect(ids(todaysNewPlants(deck, {}, DAY1, 2))).toEqual(ids(deck.slice(0, 2)));
    const learn = markStudied({}, ids(deck.slice(0, 2)), DAY1);
    expect(lessonStudied(deck, learn, DAY1)).toBe(true);
    // Same day: still today's two, even if the daily number changes afterwards.
    expect(ids(todaysNewPlants(deck, learn, DAY1, 4))).toEqual(ids(deck.slice(0, 2)));
    // Next day: the next two.
    expect(ids(todaysNewPlants(deck, learn, DAY2, 2))).toEqual(ids(deck.slice(2, 4)));
    expect(lessonStudied(deck, learn, DAY2)).toBe(false);
  });

  it('repeats each plant once on a later day; a right answer there completes it', () => {
    let learn = markStudied({}, ids(deck.slice(0, 2)), DAY1);
    const [a, b] = deck;
    // Answers on the lesson day are not the repeat.
    expect(recordRepeat(learn, a.id, true, DAY1)).toBe(learn);
    expect(ids(dueRepeats(deck, learn, DAY1))).toEqual([]);

    expect(ids(dueRepeats(deck, learn, DAY2))).toEqual([a.id, b.id]);
    learn = recordRepeat(learn, a.id, true, DAY2);
    learn = recordRepeat(learn, b.id, false, DAY2); // missed: comes back again
    expect(learn[a.id].repeated).toBe(true);
    expect(ids(dueRepeats(deck, learn, DAY3))).toEqual([b.id]);
    expect(learnedCount(deck, learn)).toBe(1);
  });

  it("examines today's new plants and today's repeats", () => {
    let learn = markStudied({}, ids(deck.slice(0, 2)), DAY1);
    expect(ids(examPlants(deck, learn, DAY1, 2))).toEqual(ids(deck.slice(0, 2)));
    // Day 2 before the lesson: only the repeats.
    expect(ids(examPlants(deck, learn, DAY2, 2))).toEqual(ids(deck.slice(0, 2)));
    learn = markStudied(learn, ids(deck.slice(2, 4)), DAY2);
    expect(ids(examPlants(deck, learn, DAY2, 2))).toEqual(ids([deck[2], deck[3], deck[0], deck[1]]));
  });

  it('keeps the lock screen on what is due, then on anything learned', () => {
    // Day one, nothing studied: today's new plants.
    expect(ids(lockScreenPool(deck, {}, DAY1, 2))).toEqual(ids(deck.slice(0, 2)));
    let learn = markStudied({}, [deck[0].id], DAY1);
    expect(ids(lockScreenPool(deck, learn, DAY1, 1))).toEqual([deck[0].id]);
    learn = recordRepeat(learn, deck[0].id, true, DAY2);
    // Day 2, repeat done, lesson not studied yet: nothing due, so anything learned.
    expect(ids(lockScreenPool(deck, learn, DAY2, 1))).toEqual([deck[0].id]);
  });

  it('asks plants not yet answered right today first, never twice in a row', () => {
    const pool = deck.slice(0, 3);
    expect(pickLockPlant(pool, new Set([pool[0].id, pool[1].id]), seeded()).id).toBe(pool[2].id);
    for (let i = 0; i < 20; i++) {
      expect(pickLockPlant(pool, new Set(), seeded(i + 1), pool[0].id).id).not.toBe(pool[0].id);
    }
    expect(pickLockPlant([pool[0]], new Set(), seeded(), pool[0].id).id).toBe(pool[0].id);
  });
});

describe('challenge (Genius Penalty)', () => {
  const answer = (correct: boolean, now: number) =>
    ({ type: 'answer', correct, guess: 'x', now, penaltySeconds: 10 }) as const;

  it('unlocks on a correct answer', () => {
    const s = challengeReducer(startChallenge('rose'), answer(true, 0));
    expect(s).toEqual({ phase: 'unlocked', plantId: 'rose', attempts: 1 });
  });

  it('freezes for the penalty and ignores taps and early retries', () => {
    let s = challengeReducer(startChallenge('rose'), answer(false, 0));
    expect(s.phase).toBe('penalty');
    expect(penaltySecondsLeft(s, 0)).toBe(10);
    expect(penaltySecondsLeft(s, 9_001)).toBe(1);

    expect(challengeReducer(s, answer(true, 5_000))).toBe(s); // speed-run tap ignored
    expect(challengeReducer(s, { type: 'retry', now: 9_999, nextPlantId: 'tulip' })).toBe(s);

    s = challengeReducer(s, { type: 'retry', now: 10_000, nextPlantId: 'tulip' });
    expect(s).toEqual({ phase: 'question', plantId: 'tulip', attempts: 1 });
  });
});

describe('stats', () => {
  it('scores Botany IQ from 60 to 160: half for introduced, full once repeated', () => {
    const subset = [plant('rose'), plant('tulip')];
    expect(botanyIQ(subset, {})).toBe(60);
    const done: LearnMap = {
      rose: { learnedOn: '2026-10-01', repeated: true },
      tulip: { learnedOn: '2026-10-01', repeated: true },
    };
    expect(botanyIQ(subset, done)).toBe(160);
    expect(botanyIQ(subset, { ...done, tulip: { learnedOn: '2026-10-01', repeated: false } })).toBe(135);
  });

  it('ranks trouble plants by miss rate', () => {
    let stats: StatsMap = {};
    stats = recordStats(stats, 'rose', true);
    stats = recordStats(stats, 'rose', false); // 1/2 wrong
    stats = recordStats(stats, 'tulip', false); // 1/1 wrong
    stats = recordStats(stats, 'oak', true);
    expect(stats.rose).toEqual({ seen: 2, correct: 1, wrong: 1 });
    expect(troublePlants(PLANTS, stats).map((p) => p.id)).toEqual(['tulip', 'rose']);
  });
});

describe('FloraLock Plus', () => {
  it('keeps the free deck to flowers and never leaves it empty', () => {
    expect(deckCategories(['flower', 'houseplant', 'tree'], false)).toEqual(['flower']);
    expect(deckCategories(['tree'], false)).toEqual(['flower']);
    expect(deckCategories(['houseplant', 'tree'], true)).toEqual(['houseplant', 'tree']);
    expect(deckCategories([], true)).toEqual(['flower']);
  });

  it(`locks up to ${FREE_APP_LIMIT} apps for free, any number with Plus`, () => {
    expect(canLockAnother(FREE_APP_LIMIT - 1, false)).toBe(true);
    expect(canLockAnother(FREE_APP_LIMIT, false)).toBe(false);
    expect(canLockAnother(50, true)).toBe(true);
    expect(allowedLockedApps(['a', 'b', 'c'], false)).toEqual(['a', 'b']);
    expect(allowedLockedApps(['a', 'b', 'c'], true)).toEqual(['a', 'b', 'c']);
  });
});

describe('privacy policy', () => {
  it('PRIVACY.md matches the in-app policy (run `npm run privacy` after editing it)', () => {
    const file = readFileSync(new URL('../../PRIVACY.md', import.meta.url), 'utf8');
    expect(file).toBe(privacyMarkdown());
  });

  it('the public web page matches the in-app policy (run `npm run privacy` after editing it)', () => {
    const page = readFileSync(new URL('../../site/privacy/index.html', import.meta.url), 'utf8');
    expect(page).toBe(privacyHtml());
    expect(page).toContain('<a href="https://github.com/Sinadehesh/Flora/issues">');
  });
});
