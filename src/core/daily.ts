import type { LearnMap, Plant, StatsMap } from './types';

/**
 * The daily plan:
 *  - each day's lesson introduces `plantsPerDay` new plants, shown once each, then examined;
 *  - every plant comes back exactly once on a later day (in that day's exam and on the
 *    lock screen); answering it right there completes it, a miss brings it back next day.
 *
 * Days are local calendar days as "YYYY-MM-DD", so they sort as strings.
 */

export type Rng = () => number;

export function dayKey(now: number): string {
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today's new plants: the ones already studied today, or else the next unlearned ones in deck order. */
export function todaysNewPlants(deck: Plant[], learn: LearnMap, today: string, perDay: number): Plant[] {
  const studied = deck.filter((p) => learn[p.id]?.learnedOn === today);
  if (studied.length) return studied;
  return deck.filter((p) => !learn[p.id]).slice(0, perDay);
}

export function lessonStudied(deck: Plant[], learn: LearnMap, today: string): boolean {
  return deck.some((p) => learn[p.id]?.learnedOn === today);
}

/** Plants learned on an earlier day that still owe their one repeat. */
export function dueRepeats(deck: Plant[], learn: LearnMap, today: string): Plant[] {
  return deck.filter((p) => {
    const r = learn[p.id];
    return r && r.learnedOn < today && !r.repeated;
  });
}

/** Today's exam: the new plants just studied, then the repeats due today. */
export function examPlants(deck: Plant[], learn: LearnMap, today: string, perDay: number): Plant[] {
  const fresh = lessonStudied(deck, learn, today) ? todaysNewPlants(deck, learn, today, perDay) : [];
  return [...fresh, ...dueRepeats(deck, learn, today)];
}

/** Mark today's new plants as learned (the lesson's study cards were shown). */
export function markStudied(learn: LearnMap, plantIds: string[], today: string): LearnMap {
  const next = { ...learn };
  for (const id of plantIds) next[id] ??= { learnedOn: today, repeated: false };
  return next;
}

/** A right answer on a later day than the lesson is the plant's repeat; anything else changes nothing. */
export function recordRepeat(learn: LearnMap, plantId: string, correct: boolean, today: string): LearnMap {
  const r = learn[plantId];
  if (!r || r.repeated || !correct || r.learnedOn >= today) return learn;
  return { ...learn, [plantId]: { ...r, repeated: true } };
}

/**
 * Plants the lock screen asks about: today's exam first; once the user has nothing due,
 * anything they've learned; on day one before the lesson, today's new plants (the
 * penalty screen teaches the name).
 */
export function lockScreenPool(deck: Plant[], learn: LearnMap, today: string, perDay: number): Plant[] {
  const exam = examPlants(deck, learn, today, perDay);
  if (exam.length) return exam;
  const learned = deck.filter((p) => learn[p.id]);
  if (learned.length) return learned;
  const fresh = todaysNewPlants(deck, learn, today, perDay);
  return fresh.length ? fresh : deck;
}

/**
 * Next lock-screen plant: one from the pool not yet answered right today, else any;
 * never the same plant twice in a row when there's a choice.
 */
export function pickLockPlant(
  pool: Plant[],
  correctToday: ReadonlySet<string>,
  rng: Rng = Math.random,
  excludeId?: string,
): Plant {
  if (!pool.length) throw new Error('pickLockPlant: empty pool');
  const options = pool.length > 1 ? pool.filter((p) => p.id !== excludeId) : pool;
  const open = options.filter((p) => !correctToday.has(p.id));
  const from = open.length ? open : options;
  return from[Math.floor(rng() * from.length)];
}

export function recordStats(stats: StatsMap, plantId: string, correct: boolean): StatsMap {
  const s = stats[plantId] ?? { seen: 0, correct: 0, wrong: 0 };
  return {
    ...stats,
    [plantId]: { seen: s.seen + 1, correct: s.correct + (correct ? 1 : 0), wrong: s.wrong + (correct ? 0 : 1) },
  };
}

export type LearnStatus = 'new' | 'learning' | 'learned';

/** "learning" = introduced in a lesson, still owes its repeat. */
export function learnStatus(learn: LearnMap, plantId: string): LearnStatus {
  const r = learn[plantId];
  return !r ? 'new' : r.repeated ? 'learned' : 'learning';
}
