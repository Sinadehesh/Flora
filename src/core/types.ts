export type PlantCategory = 'flower' | 'houseplant' | 'tree';

export interface Plant {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  category: PlantCategory;
  /** Other names the plant goes by (synonyms, old genus names, regional names). */
  aliases: string[];
  /** Ids of plants it is commonly mistaken for (see LOOKALIKE_PAIRS in data/plants.ts). */
  lookalikes: string[];
  /** One-sentence micro-fact shown during the Genius Penalty. */
  fact: string;
}

/** How to recognise a plant, for the lesson cards and plant pages. */
export interface Clues {
  flower: string;
  leaves: string;
  /** When it flowers, or what it does through the year. */
  season: string;
  /** The one feature that tells it apart from its look-alikes. */
  key: string;
}

/** Answer history for one plant, keyed by plant id. */
export interface PlantStats {
  seen: number;
  correct: number;
  wrong: number;
}

export type StatsMap = Record<string, PlantStats>;

/**
 * Where a plant is in the review schedule (see daily.ts). It's introduced in a lesson on
 * `learnedOn`; each right answer on or after its due day moves it one `step` further out, and a
 * miss starts the schedule over from tomorrow.
 */
export interface LearnRecord {
  learnedOn: string;
  step: number;
  dueOn: string;
}

export type LearnMap = Record<string, LearnRecord>;

/** Days in a row with the lesson's exam done. */
export interface Streak {
  /** Last day the exam was done ("" if never). */
  last: string;
  count: number;
  best: number;
}

export interface Settings {
  /** New plants introduced in each day's lesson. */
  plantsPerDay: number;
  /** How long a correct answer unlocks the blocked app for. */
  unlockMinutes: number;
  penaltySeconds: number;
  /** Emergency bypasses per day, so a locked-out user doesn't uninstall. */
  emergencyUnlocksPerDay: number;
  categories: PlantCategory[];
  /** First-launch setup finished. */
  onboarded: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  plantsPerDay: 5,
  unlockMinutes: 10,
  penaltySeconds: 10,
  emergencyUnlocksPerDay: 2,
  categories: ['flower', 'houseplant', 'tree'],
  onboarded: false,
};

export const PLANTS_PER_DAY_MIN = 1;
export const PLANTS_PER_DAY_MAX = 20;
