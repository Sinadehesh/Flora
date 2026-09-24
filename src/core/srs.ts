import type { Plant, PlantProgress, ProgressMap } from './types';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Leitner-style intervals by box. Short early steps suit this app: users hit the
 * lock screen many times a day, so a missed plant comes back within minutes.
 */
export const BOX_INTERVALS = [2 * MINUTE, 20 * MINUTE, 4 * HOUR, 1 * DAY, 3 * DAY, 8 * DAY, 21 * DAY];
export const MAX_BOX = BOX_INTERVALS.length - 1;

export function emptyProgress(): PlantProgress {
  return { seen: 0, correct: 0, wrong: 0, box: 0, dueAt: 0, lastSeenAt: 0 };
}

export function recordAnswer(prev: PlantProgress | undefined, correct: boolean, now: number): PlantProgress {
  const p = prev ?? emptyProgress();
  const box = correct ? Math.min(p.box + 1, MAX_BOX) : 0;
  return {
    seen: p.seen + 1,
    correct: p.correct + (correct ? 1 : 0),
    wrong: p.wrong + (correct ? 0 : 1),
    box,
    dueAt: now + BOX_INTERVALS[box],
    lastSeenAt: now,
  };
}

export type Rng = () => number;

function pickRandom<T>(items: T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

/**
 * Choose the next plant to show on the lock screen:
 *  1. overdue plants, lowest box (weakest) first;
 *  2. otherwise a plant never seen before;
 *  3. otherwise the plant that is due soonest.
 * `excludeId` avoids showing the same plant twice in a row.
 */
export function pickNextPlant(
  plants: Plant[],
  progress: ProgressMap,
  now: number,
  rng: Rng = Math.random,
  excludeId?: string,
): Plant {
  if (plants.length === 0) throw new Error('pickNextPlant: no plants');
  const pool = plants.length > 1 ? plants.filter((p) => p.id !== excludeId) : plants;

  const due = pool.filter((p) => progress[p.id] && progress[p.id].dueAt <= now);
  if (due.length) {
    const weakest = Math.min(...due.map((p) => progress[p.id].box));
    return pickRandom(
      due.filter((p) => progress[p.id].box === weakest),
      rng,
    );
  }

  const unseen = pool.filter((p) => !progress[p.id]);
  if (unseen.length) return pickRandom(unseen, rng);

  return pool.reduce((best, p) => (progress[p.id].dueAt < progress[best.id].dueAt ? p : best));
}
