export type PlantCategory = 'flower' | 'houseplant' | 'tree';

export interface Plant {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  category: PlantCategory;
  /** Other names the plant goes by (synonyms, old genus names, regional names). */
  aliases: string[];
  /** One-sentence micro-fact shown during the Genius Penalty. */
  fact: string;
}

/** Answer history for one plant, keyed by plant id. */
export interface PlantStats {
  seen: number;
  correct: number;
  wrong: number;
}

export type StatsMap = Record<string, PlantStats>;

/**
 * Where a plant is in the daily plan. It's introduced in a lesson on `learnedOn`,
 * then comes back once on a later day; answering it right there sets `repeated`.
 */
export interface LearnRecord {
  learnedOn: string;
  repeated: boolean;
}

export type LearnMap = Record<string, LearnRecord>;

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
