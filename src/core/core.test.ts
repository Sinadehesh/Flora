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
import {
  allowedLockedApps,
  canLockAnother,
  deckCategories,
  FREE_APP_LIMIT,
  isReviewCode,
  normalizeCode,
  REVIEW_CODE_HASHES,
} from './plus';
import { readSaved, SAVE_KEY, serializeSaved, type SavedState } from './saved';
import { sha256Hex } from './sha256';
import { buildChoices } from './quiz';
import { botanyIQ, learnedCount, troublePlants } from './stats';
import { normalizeName } from './text';
import { DEFAULT_SETTINGS, type LearnMap, type StatsMap } from './types';

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
    learn: { peony: { learnedOn: '2026-10-01', repeated: true }, lotus: { learnedOn: '2026-10-02', repeated: false } },
    stats: { peony: { seen: 4, correct: 3, wrong: 1 } },
    today: { day: '2026-10-02', correct: ['peony'] },
    examDoneOn: '2026-10-02',
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

  it('reads saves from releases before versioning', () => {
    expect(readSaved(JSON.stringify(saved)).state).toEqual(saved);
  });

  it('fills settings added in later releases with defaults', () => {
    const { onboarded: _, ...older } = saved.settings;
    const { state } = readSaved(JSON.stringify({ ...saved, settings: older }));
    expect(state.settings).toEqual({ ...saved.settings, onboarded: DEFAULT_SETTINGS.onboarded });
    expect(state.learn).toEqual(saved.learn);
  });

  it('drops only the values that are invalid', () => {
    const { state } = readSaved(
      JSON.stringify({
        ...saved,
        settings: { ...saved.settings, plantsPerDay: 99, unlockMinutes: 'ten', categories: ['cactus', 'tree'] },
        learn: { ...saved.learn, broken: { learnedOn: 5 } },
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
