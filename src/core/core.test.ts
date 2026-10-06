import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { PLANT_DETAILS } from '../data/plantDetails';
import { PLANT_CLUES } from '../data/plantClues';
import { privacyHtml, privacyMarkdown } from '../data/privacyPolicy';
import { LOOKALIKE_PAIRS, PLANTS, PLANTS_BY_ID } from '../data/plants';
import { challengeReducer, penaltySecondsLeft, startChallenge } from './challenge';
import {
  addDays,
  dayKey,
  dueReviews,
  examPlants,
  lessonStudied,
  lockScreenPool,
  markStudied,
  MASTERED_STEP,
  MAX_REVIEWS_PER_DAY,
  pickLockPlant,
  recordReview,
  recordStats,
  REVIEW_DAYS,
  reviewsDueOn,
  todaysNewPlants,
} from './daily';
import {
  allowedLockedApps,
  canLockAnother,
  deckCategories,
  FREE_APP_LIMIT,
  isReviewCode,
  normalizeCode,
  REVIEW_CODE_HASHES,
} from './plus';
import {
  collectedCount,
  currentStreak,
  extendStreak,
  masteredCount,
  milestones,
  nextMilestone,
  NO_STREAK,
} from './progress';
import { areLookalikes, buildChoices, lookalikesOf } from './quiz';
import { readSaved, SAVE_KEY, serializeSaved, type SavedState } from './saved';
import { sha256Hex } from './sha256';
import { botanyIQ, troublePlants } from './stats';
import { normalizeName } from './text';
import { DEFAULT_SETTINGS, type LearnMap, type StatsMap } from './types';

/** Deterministic PRNG so tests don't flake. */
function seeded(seed = 42) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const plant = (id: string) => PLANTS_BY_ID[id];
const ids = (list: { id: string }[]) => list.map((p) => p.id);

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

  it('has field clues for exactly the plants in the deck', () => {
    expect(Object.keys(PLANT_CLUES).sort()).toEqual(ids(PLANTS).sort());
    for (const clues of Object.values(PLANT_CLUES)) {
      expect(Object.values(clues).every((v) => v.trim().length > 0)).toBe(true);
    }
  });

  it('only pairs look-alikes that exist, each pair once', () => {
    const seen = new Set<string>();
    for (const [a, b] of LOOKALIKE_PAIRS) {
      expect(PLANTS_BY_ID[a] && PLANTS_BY_ID[b], `${a} / ${b}`).toBeTruthy();
      const key = [a, b].sort().join('|');
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
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

describe('text', () => {
  it('normalizes case, accents and punctuation for search', () => {
    expect(normalizeName('  Bird-of-Paradise! ')).toBe('bird of paradise');
    expect(normalizeName('Cempasúchil')).toBe('cempasuchil');
    expect(normalizeName("Devil's Ivy")).toBe('devils ivy');
  });
});

describe('look-alikes', () => {
  it('matches pairs listed on either side', () => {
    expect(areLookalikes(plant('peony'), plant('rose'))).toBe(true);
    expect(areLookalikes(plant('rose'), plant('peony'))).toBe(true);
    expect(areLookalikes(plant('peony'), plant('oak'))).toBe(false);
    expect(ids(lookalikesOf(plant('rose'), PLANTS)).sort()).toEqual(['camellia', 'carnation', 'peony', 'ranunculus']);
  });

  it('deals real look-alikes first, from outside the deck too', () => {
    const deck = PLANTS.filter((p) => p.category === 'flower');
    const choices = buildChoices(plant('calla-lily'), deck, PLANTS, 4, seeded());
    expect(choices).toHaveLength(4);
    expect(new Set(ids(choices)).size).toBe(4);
    expect(choices).toContain(plant('calla-lily'));
    expect(choices).toContain(plant('peace-lily')); // a houseplant, outside the flower deck
  });

  it('tops up from the same group in the deck', () => {
    const deck = PLANTS.filter((p) => p.category === 'houseplant');
    for (let seed = 1; seed < 10; seed++) {
      const choices = buildChoices(plant('boston-fern'), deck, PLANTS, 4, seeded(seed));
      expect(choices.every((p) => p.category === 'houseplant')).toBe(true);
    }
  });
});

describe('daily plan and spaced reviews', () => {
  const deck = PLANTS.slice(0, 6);
  const DAY1 = '2026-10-01';
  const DAY2 = '2026-10-02';

  it('writes zero-padded local days that sort as strings, and adds days across months', () => {
    expect(dayKey(new Date(2026, 8, 30, 23, 59).getTime())).toBe('2026-09-30');
    expect(dayKey(new Date(2026, 9, 1, 0, 1).getTime())).toBe('2026-10-01');
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it("offers the next unlearned plants as today's lesson, and keeps them once studied", () => {
    expect(ids(todaysNewPlants(deck, {}, DAY1, 2))).toEqual(ids(deck.slice(0, 2)));
    const learn = markStudied({}, ids(deck.slice(0, 2)), DAY1);
    expect(lessonStudied(deck, learn, DAY1)).toBe(true);
    expect(ids(todaysNewPlants(deck, learn, DAY1, 4))).toEqual(ids(deck.slice(0, 2)));
    expect(ids(todaysNewPlants(deck, learn, DAY2, 2))).toEqual(ids(deck.slice(2, 4)));
    expect(lessonStudied(deck, learn, DAY2)).toBe(false);
  });

  it('reviews after 1, 3, 7, 14 and 30 days, then counts the plant as mastered', () => {
    const [a] = deck;
    let learn = markStudied({}, [a.id], DAY1);
    let day = DAY1;
    expect(learn[a.id]).toEqual({ learnedOn: DAY1, step: 0, dueOn: DAY2 });
    // Right answers on the lesson day, or before a review is due, change nothing.
    expect(recordReview(learn, a.id, true, DAY1)).toBe(learn);
    for (const gap of REVIEW_DAYS) {
      day = addDays(day, gap);
      expect(learn[a.id].dueOn).toBe(day);
      expect(recordReview(learn, a.id, true, addDays(day, -1))).toBe(learn);
      expect(ids(dueReviews(deck, learn, day))).toEqual([a.id]);
      learn = recordReview(learn, a.id, true, day);
    }
    expect(learn[a.id].step).toBe(MASTERED_STEP);
    expect(masteredCount(deck, learn)).toBe(1);
    expect(dueReviews(deck, learn, addDays(day, 365))).toEqual([]);
  });

  it('starts the schedule over from tomorrow after a miss, at any time', () => {
    const [a] = deck;
    let learn = markStudied({}, [a.id], DAY1);
    learn = recordReview(learn, a.id, true, DAY2); // step 1, due in 3 days
    expect(learn[a.id]).toMatchObject({ step: 1, dueOn: addDays(DAY2, 3) });
    learn = recordReview(learn, a.id, false, addDays(DAY2, 1)); // missed on the lock screen
    expect(learn[a.id]).toMatchObject({ step: 0, dueOn: addDays(DAY2, 2) });
  });

  it('reviews a late plant on the day it is opened, not on every missed day', () => {
    const [a] = deck;
    let learn = markStudied({}, [a.id], DAY1);
    const late = addDays(DAY1, 10);
    expect(ids(dueReviews(deck, learn, late))).toEqual([a.id]);
    learn = recordReview(learn, a.id, true, late);
    expect(learn[a.id]).toMatchObject({ step: 1, dueOn: addDays(late, 3) });
  });

  it('caps a day of reviews, most overdue first', () => {
    const many = PLANTS.slice(0, MAX_REVIEWS_PER_DAY + 5);
    const learn: LearnMap = Object.fromEntries(
      many.map((m, i) => [m.id, { learnedOn: DAY1, step: 0, dueOn: addDays(DAY2, i % 3) }]),
    );
    const today = addDays(DAY2, 5);
    const due = dueReviews(many, learn, today);
    expect(due).toHaveLength(MAX_REVIEWS_PER_DAY);
    expect(due.map((m) => learn[m.id].dueOn)).toEqual([...due.map((m) => learn[m.id].dueOn)].sort());
    expect(reviewsDueOn(many, learn, today)).toBe(MAX_REVIEWS_PER_DAY);
  });

  it("examines today's new plants and today's reviews", () => {
    let learn = markStudied({}, ids(deck.slice(0, 2)), DAY1);
    expect(ids(examPlants(deck, learn, DAY1, 2))).toEqual(ids(deck.slice(0, 2)));
    expect(ids(examPlants(deck, learn, DAY2, 2))).toEqual(ids(deck.slice(0, 2)));
    learn = markStudied(learn, ids(deck.slice(2, 4)), DAY2);
    expect(ids(examPlants(deck, learn, DAY2, 2))).toEqual(ids([deck[2], deck[3], deck[0], deck[1]]));
  });

  it('keeps the lock screen on what is due, then on anything learned', () => {
    expect(ids(lockScreenPool(deck, {}, DAY1, 2))).toEqual(ids(deck.slice(0, 2)));
    let learn = markStudied({}, [deck[0].id], DAY1);
    expect(ids(lockScreenPool(deck, learn, DAY1, 1))).toEqual([deck[0].id]);
    learn = recordReview(learn, deck[0].id, true, DAY2);
    // Day 2, review done, lesson not studied yet: nothing due, so anything learned.
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

describe('streaks and milestones', () => {
  it('grows a streak day by day and restarts it after a missed day', () => {
    let streak = extendStreak(NO_STREAK, '2026-10-01');
    expect(streak).toEqual({ last: '2026-10-01', count: 1, best: 1 });
    expect(extendStreak(streak, '2026-10-01')).toBe(streak);
    streak = extendStreak(streak, '2026-10-02');
    streak = extendStreak(streak, '2026-10-03');
    expect(streak).toEqual({ last: '2026-10-03', count: 3, best: 3 });
    expect(currentStreak(streak, '2026-10-04')).toBe(3); // still alive until today's exam
    expect(currentStreak(streak, '2026-10-05')).toBe(0);
    streak = extendStreak(streak, '2026-10-05');
    expect(streak).toEqual({ last: '2026-10-05', count: 1, best: 3 });
  });

  it('marks milestones done and points at the closest next one', () => {
    const list = milestones({ collected: 8, mastered: 0, bestStreak: 3, total: 69 });
    expect(list.find((m) => m.id === 'collect-1')?.done).toBe(true);
    expect(list.find((m) => m.id === 'streak-3')?.done).toBe(true);
    expect(list.find((m) => m.id === 'collect-10')).toMatchObject({ done: false, value: 8, target: 10 });
    expect(nextMilestone(list)?.id).toBe('collect-10');
  });

  it('counts the collection', () => {
    const learn = markStudied({}, ['peony', 'oak'], '2026-10-01');
    expect(collectedCount(PLANTS, learn)).toBe(2);
    expect(masteredCount(PLANTS, learn)).toBe(0);
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
  it('scores Botany IQ from 60 to 160: a fifth for collected, the rest grows with each review', () => {
    const subset = [plant('rose'), plant('tulip')];
    expect(botanyIQ(subset, {})).toBe(60);
    const mastered: LearnMap = {
      rose: { learnedOn: '2026-10-01', step: MASTERED_STEP, dueOn: '' },
      tulip: { learnedOn: '2026-10-01', step: MASTERED_STEP, dueOn: '' },
    };
    expect(botanyIQ(subset, mastered)).toBe(160);
    expect(botanyIQ(subset, { ...mastered, tulip: { learnedOn: '2026-10-01', step: 0, dueOn: '2026-10-02' } })).toBe(
      120,
    );
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

describe('review codes', () => {
  it('computes SHA-256 like the standard test vectors', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it('accepts a code whatever its case, spaces or dashes, and rejects others', () => {
    const hashes = [sha256Hex('FLORATEST1234ABCD')];
    expect(normalizeCode(' flora-test 1234-abcd ')).toBe('FLORATEST1234ABCD');
    expect(isReviewCode('flora-test-1234-abcd', hashes)).toBe(true);
    expect(isReviewCode('FLORA-TEST-1234-ABCE', hashes)).toBe(false);
    expect(isReviewCode('', hashes)).toBe(false);
    expect(REVIEW_CODE_HASHES.every((h) => /^[0-9a-f]{64}$/.test(h))).toBe(true);
  });
});

describe('privacy policy', () => {
  it('PRIVACY.md matches the in-app policy (run `npm run privacy` after editing it)', () => {
    const file = readFileSync(new URL('../../PRIVACY.md', import.meta.url), 'utf8');
    expect(file).toBe(privacyMarkdown());
  });

  it('the public web page matches the in-app policy (run `npm run privacy` after editing it)', () => {
    for (const path of ['privacy/index.html', 'floralock/privacy/index.html']) {
      expect(readFileSync(new URL(`../../site/${path}`, import.meta.url), 'utf8')).toBe(privacyHtml());
    }
    const page = privacyHtml();
    expect(page).toContain('<a href="https://github.com/Sinadehesh/Flora/issues">');
  });
});

describe('saved progress across app updates', () => {
  const saved: SavedState = {
    settings: { ...DEFAULT_SETTINGS, plantsPerDay: 3, categories: ['flower'], onboarded: true },
    learn: {
      peony: { learnedOn: '2026-10-01', step: 1, dueOn: '2026-10-05' },
      lotus: { learnedOn: '2026-10-02', step: 0, dueOn: '2026-10-03' },
    },
    stats: { peony: { seen: 4, correct: 3, wrong: 1 } },
    today: { day: '2026-10-02', correct: ['peony'] },
    examDoneOn: '2026-10-02',
    streak: { last: '2026-10-02', count: 2, best: 5 },
    emergency: { day: '2026-10-02', used: 1 },
    plus: true,
    codeUnlock: false,
  };

  it('keeps the storage key (a new key would start every user from scratch)', () => {
    expect(SAVE_KEY).toBe('floralock/v2');
  });

  it('reads back what it saves', () => {
    expect(readSaved(serializeSaved(saved))).toEqual({ state: saved, unreadable: false });
  });

  it('converts saves from releases with one repeat per plant (version 1) to spaced reviews', () => {
    // Exactly what FloraLock up to version code 21 wrote (no version field).
    const v1 = {
      settings: saved.settings,
      learn: {
        peony: { learnedOn: '2026-10-01', repeated: true },
        lotus: { learnedOn: '2026-10-02', repeated: false },
        broken: { learnedOn: 'yesterday', repeated: true },
      },
      stats: saved.stats,
      today: saved.today,
      examDoneOn: '2026-10-02',
      emergency: saved.emergency,
      plus: true,
      codeUnlock: false,
    };
    const { state } = readSaved(JSON.stringify(v1));
    expect(state.learn).toEqual({
      // Passed its repeat: first review passed, next due 3 days after the earliest repeat day.
      peony: { learnedOn: '2026-10-01', step: 1, dueOn: '2026-10-05' },
      // Still owed its repeat: due the day after its lesson (so due now).
      lotus: { learnedOn: '2026-10-02', step: 0, dueOn: '2026-10-03' },
    });
    expect(state.streak).toEqual({ last: '2026-10-02', count: 1, best: 1 });
    expect(state.stats).toEqual(saved.stats);
    expect(state.settings).toEqual(saved.settings);
    expect(state.plus).toBe(true);
    // And the converted save is read back unchanged.
    const again = readSaved(serializeSaved({ ...saved, ...state } as SavedState)).state;
    expect(again.learn).toEqual(state.learn);
  });

  it('fills settings added in later releases with defaults', () => {
    const { onboarded: _, ...older } = saved.settings;
    const { state } = readSaved(JSON.stringify({ version: 2, ...saved, settings: older }));
    expect(state.settings).toEqual({ ...saved.settings, onboarded: DEFAULT_SETTINGS.onboarded });
    expect(state.learn).toEqual(saved.learn);
  });

  it('drops only the values that are invalid', () => {
    const { state } = readSaved(
      JSON.stringify({
        version: 2,
        ...saved,
        settings: { ...saved.settings, plantsPerDay: 99, unlockMinutes: 'ten', categories: ['cactus', 'tree'] },
        learn: { ...saved.learn, broken: { learnedOn: '2026-10-01', step: 'one', dueOn: '2026-10-02' } },
        stats: { ...saved.stats, broken: { seen: -1, correct: 0, wrong: 0 } },
        plus: 'yes',
      }),
    );
    expect(state.settings).toEqual({ ...saved.settings, plantsPerDay: 20, categories: ['tree'] });
    expect(state.learn).toEqual(saved.learn);
    expect(state.stats).toEqual(saved.stats);
    expect(state.plus).toBeUndefined();
    expect(state.examDoneOn).toBe(saved.examDoneOn);
  });

  it('reports storage that holds something other than a save', () => {
    expect(readSaved(null)).toEqual({ state: {}, unreadable: false });
    expect(readSaved('{not json')).toEqual({ state: {}, unreadable: true });
    expect(readSaved('[1,2]')).toEqual({ state: {}, unreadable: true });
  });
});
