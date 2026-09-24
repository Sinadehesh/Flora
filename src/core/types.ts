export type PlantCategory = 'flower' | 'houseplant' | 'tree';

export interface Plant {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  category: PlantCategory;
  /** Other names accepted in Hard Mode (synonyms, old genus names, regional names). */
  aliases: string[];
  /** One-sentence micro-fact shown during the Genius Penalty. */
  fact: string;
}

export type Difficulty = 'easy' | 'hard';

/** Per-plant learning record, keyed by plant id. */
export interface PlantProgress {
  seen: number;
  correct: number;
  wrong: number;
  /** Leitner box: 0 = just missed / brand new, MAX_BOX = mastered. */
  box: number;
  /** Epoch ms when the plant is next due for review. */
  dueAt: number;
  lastSeenAt: number;
}

export type ProgressMap = Record<string, PlantProgress>;

export interface Settings {
  difficulty: Difficulty;
  /** How long a correct answer unlocks the blocked app for. */
  unlockMinutes: number;
  penaltySeconds: number;
  /** Emergency bypasses per day, so a locked-out user doesn't uninstall. */
  emergencyUnlocksPerDay: number;
  categories: PlantCategory[];
}

export const DEFAULT_SETTINGS: Settings = {
  difficulty: 'easy',
  unlockMinutes: 10,
  penaltySeconds: 10,
  emergencyUnlocksPerDay: 2,
  categories: ['flower', 'houseplant', 'tree'],
};
