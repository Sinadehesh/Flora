import { MAX_BOX } from './srs';
import type { Plant, ProgressMap } from './types';

/**
 * Botany IQ: 60 for a beginner, 160 when every plant in the deck is mastered.
 * Each plant contributes its Leitner box / MAX_BOX, so it only rises with
 * repeated, spaced correct answers — not with one lucky guess.
 */
export function botanyIQ(plants: Plant[], progress: ProgressMap): number {
  if (!plants.length) return 60;
  const mastery = plants.reduce((sum, p) => sum + (progress[p.id]?.box ?? 0) / MAX_BOX, 0) / plants.length;
  return Math.round(60 + 100 * mastery);
}

export function accuracy(progress: ProgressMap): number | null {
  let correct = 0;
  let seen = 0;
  for (const p of Object.values(progress)) {
    correct += p.correct;
    seen += p.seen;
  }
  return seen ? correct / seen : null;
}

export function masteredCount(plants: Plant[], progress: ProgressMap): number {
  return plants.filter((p) => (progress[p.id]?.box ?? 0) >= MAX_BOX - 1).length;
}

/** Plants the user keeps missing, worst first. */
export function troublePlants(plants: Plant[], progress: ProgressMap, limit = 5): Plant[] {
  return plants
    .filter((p) => (progress[p.id]?.wrong ?? 0) > 0)
    .sort((a, b) => {
      const pa = progress[a.id];
      const pb = progress[b.id];
      return pb.wrong / pb.seen - pa.wrong / pa.seen || pb.wrong - pa.wrong;
    })
    .slice(0, limit);
}
