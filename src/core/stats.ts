import type { LearnMap, Plant, StatsMap } from './types';

/** Plants that passed their repeat: these count as learned. */
export function learnedCount(deck: Plant[], learn: LearnMap): number {
  return deck.filter((p) => learn[p.id]?.repeated).length;
}

/** Plants introduced but still waiting for their repeat. */
export function inProgressCount(deck: Plant[], learn: LearnMap): number {
  return deck.filter((p) => learn[p.id] && !learn[p.id].repeated).length;
}

/**
 * Botany IQ: 60 for a beginner, 160 when the whole deck is learned. A plant counts
 * half once introduced and fully once it passes its repeat on a later day.
 */
export function botanyIQ(deck: Plant[], learn: LearnMap): number {
  if (!deck.length) return 60;
  const score = deck.reduce((sum, p) => sum + (learn[p.id] ? (learn[p.id].repeated ? 1 : 0.5) : 0), 0);
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
    .filter((p) => (stats[p.id]?.wrong ?? 0) > 0)
    .sort((a, b) => {
      const sa = stats[a.id];
      const sb = stats[b.id];
      return sb.wrong / sb.seen - sa.wrong / sa.seen || sb.wrong - sa.wrong;
    })
    .slice(0, limit);
}
