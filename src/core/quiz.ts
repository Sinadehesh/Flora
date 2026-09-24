import type { Plant } from './types';
import type { Rng } from './srs';

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Easy Mode options: the answer plus distractors drawn from the same category
 * first (a tulip next to three trees is too easy), topping up from the rest.
 */
export function buildChoices(answer: Plant, allPlants: Plant[], count = 4, rng: Rng = Math.random): Plant[] {
  const others = allPlants.filter((p) => p.id !== answer.id && p.commonName !== answer.commonName);
  const sameCategory = shuffle(
    others.filter((p) => p.category === answer.category),
    rng,
  );
  const rest = shuffle(
    others.filter((p) => p.category !== answer.category),
    rng,
  );
  const distractors = [...sameCategory, ...rest].slice(0, count - 1);
  return shuffle([answer, ...distractors], rng);
}
