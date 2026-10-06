import { MASTERED_STEP } from './daily';
import type { LearnMap, Plant, StatsMap } from './types';

/**
 * Botany IQ: 60 for a beginner, 160 when the whole deck is mastered. A plant counts a fifth
 * once introduced, and the rest grows with each review it passes.
 */
export function botanyIQ(deck: Plant[], learn: LearnMap): number {
  if (!deck.length) return 60;
  const score = deck.reduce((sum, m) => {
    const r = learn[m.id];
    return sum + (r ? 0.2 + (0.8 * Math.min(r.step, MASTERED_STEP)) / MASTERED_STEP : 0);
  }, 0);
  return Math.round(60 + (100 * score) / deck.length);
}

export function accuracy(stats: StatsMap): number | null {
  let correct = 0;
  let seen = 0;
  for (const s of Object.values(stats)) {
    correct += s.correct;
    seen += s.seen;
  }
  return seen ? correct / seen : null;
}

/** Plants the user keeps missing, worst first. */
export function troublePlants(plants: Plant[], stats: StatsMap, limit = 5): Plant[] {
  return plants
    .filter((m) => (stats[m.id]?.wrong ?? 0) > 0)
    .sort((a, b) => {
      const sa = stats[a.id];
      const sb = stats[b.id];
      return sb.wrong / sb.seen - sa.wrong / sa.seen || sb.wrong - sa.wrong;
    })
    .slice(0, limit);
}
