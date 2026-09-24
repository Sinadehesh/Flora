import { describe, expect, it } from 'vitest';

import { PLANTS, PLANTS_BY_ID } from '../data/plants';
import { challengeReducer, penaltySecondsLeft, startChallenge } from './challenge';
import { acceptedNames, isCorrectAnswer, levenshtein, normalizeName } from './matching';
import { buildChoices } from './quiz';
import { BOX_INTERVALS, MAX_BOX, pickNextPlant, recordAnswer } from './srs';
import { botanyIQ, troublePlants } from './stats';
import type { ProgressMap } from './types';

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
      expect(p.commonName && p.scientificName && p.family && p.fact && p.wikiTitle).toBeTruthy();
    }
  });

  it('never accepts the same name for two different plants', () => {
    const owner = new Map<string, string>();
    for (const p of PLANTS) {
      for (const name of acceptedNames(p)) {
        expect(owner.get(name) ?? p.id, `"${name}" is used by ${owner.get(name)} and ${p.id}`).toBe(p.id);
        owner.set(name, p.id);
      }
    }
  });
});

describe('matching', () => {
  it('normalizes case, accents and punctuation', () => {
    expect(normalizeName('  Bird-of-Paradise! ')).toBe('bird of paradise');
    expect(normalizeName('Cempasúchil')).toBe('cempasuchil');
    expect(normalizeName("Devil's Ivy")).toBe('devils ivy');
  });

  it('computes edit distance', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
  });

  it('accepts common names, aliases, scientific names, plurals and small typos', () => {
    expect(isCorrectAnswer('peony', plant('peony'))).toBe(true);
    expect(isCorrectAnswer('Peonies', plant('peony'))).toBe(true);
    expect(isCorrectAnswer('Paeonia lactiflora', plant('peony'))).toBe(true);
    expect(isCorrectAnswer('hydrangia', plant('hydrangea'))).toBe(true);
    expect(isCorrectAnswer('sansevieria', plant('snake-plant'))).toBe(true);
    expect(isCorrectAnswer('Sunflowers', plant('sunflower'))).toBe(true);
    expect(isCorrectAnswer('chrysanthemun', plant('chrysanthemum'))).toBe(true);
  });

  it('rejects wrong or empty answers', () => {
    expect(isCorrectAnswer('', plant('rose'))).toBe(false);
    expect(isCorrectAnswer('tulip', plant('rose'))).toBe(false);
    expect(isCorrectAnswer('dahlia', plant('peony'))).toBe(false);
    // short names get no typo allowance
    expect(isCorrectAnswer('rise', plant('rose'))).toBe(false);
  });

  it("doesn't treat another plant's exact name as a typo", () => {
    expect(isCorrectAnswer('lilac', plant('lily'), PLANTS)).toBe(false);
    expect(isCorrectAnswer('lilies', plant('lily'), PLANTS)).toBe(true);
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

describe('spaced repetition', () => {
  it('promotes on correct and resets to box 0 on wrong', () => {
    let p = recordAnswer(undefined, true, 0);
    expect(p.box).toBe(1);
    expect(p.dueAt).toBe(BOX_INTERVALS[1]);
    p = recordAnswer(p, true, 1000);
    expect(p.box).toBe(2);
    p = recordAnswer(p, false, 2000);
    expect(p).toMatchObject({ box: 0, seen: 3, correct: 2, wrong: 1, dueAt: 2000 + BOX_INTERVALS[0] });
  });

  it('caps at the max box', () => {
    let p = recordAnswer(undefined, true, 0);
    for (let i = 0; i < 20; i++) p = recordAnswer(p, true, 0);
    expect(p.box).toBe(MAX_BOX);
  });

  it('prefers overdue weak plants, then unseen, then soonest due', () => {
    const now = 1_000_000;
    const progress: ProgressMap = {
      rose: { ...recordAnswer(undefined, false, 0), dueAt: now - 1 }, // due, box 0
      tulip: { ...recordAnswer(undefined, true, 0), box: 3, dueAt: now - 1 }, // due, box 3
    };
    expect(pickNextPlant(PLANTS, progress, now, seeded()).id).toBe('rose');
    expect(pickNextPlant(PLANTS, progress, now, seeded(), 'rose').id).toBe('tulip');

    const subset = [plant('rose'), plant('tulip'), plant('oak')];
    const notDue: ProgressMap = {
      rose: { ...progress.rose, dueAt: now + 5000 },
      tulip: { ...progress.tulip, dueAt: now + 100 },
    };
    expect(pickNextPlant(subset, notDue, now, seeded()).id).toBe('oak');
    notDue.oak = { ...progress.rose, dueAt: now + 9000 };
    expect(pickNextPlant(subset, notDue, now, seeded()).id).toBe('tulip');
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
  it('scores Botany IQ from 60 to 160', () => {
    const subset = [plant('rose'), plant('tulip')];
    expect(botanyIQ(subset, {})).toBe(60);
    const mastered = { ...recordAnswer(undefined, true, 0), box: MAX_BOX };
    expect(botanyIQ(subset, { rose: mastered, tulip: mastered })).toBe(160);
    expect(botanyIQ(subset, { rose: mastered })).toBe(110);
  });

  it('ranks trouble plants by miss rate', () => {
    const progress: ProgressMap = {
      rose: recordAnswer(recordAnswer(undefined, true, 0), false, 0), // 1/2 wrong
      tulip: recordAnswer(undefined, false, 0), // 1/1 wrong
      oak: recordAnswer(undefined, true, 0),
    };
    expect(troublePlants(PLANTS, progress).map((p) => p.id)).toEqual(['tulip', 'rose']);
  });
});
