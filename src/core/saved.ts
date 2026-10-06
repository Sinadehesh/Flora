/**
 * Saved progress, and reading it back after an app update.
 *
 * Android keeps an app's storage when the app is updated, so every release must read what older
 * releases wrote:
 *  - Never change SAVE_KEY: a new key would start every user from scratch.
 *  - When the saved shape changes, bump SAVE_VERSION and convert older data in `migrate`.
 *  - Values that don't check out fall back to their defaults one by one, so a single odd value
 *    never costs the rest of the progress.
 */
import { addDays, REVIEW_DAYS } from './daily';
import {
  DEFAULT_SETTINGS,
  PLANTS_PER_DAY_MAX,
  PLANTS_PER_DAY_MIN,
  type LearnMap,
  type PlantCategory,
  type Settings,
  type StatsMap,
  type Streak,
} from './types';

export const SAVE_KEY = 'floralock/v2';
/**
 * Version 1 (also saves without a version): one repeat per plant (`learn[id].repeated`).
 * Version 2: spaced reviews (`learn[id].step` and `dueOn`) and a daily streak.
 */
export const SAVE_VERSION = 2;

export interface SavedState {
  settings: Settings;
  learn: LearnMap;
  stats: StatsMap;
  /** Plants answered right today, so the lock screen moves on to the others. */
  today: { day: string; correct: string[] };
  /** Day the user last finished the lesson's exam. */
  examDoneOn: string;
  /** Days in a row with the exam done. */
  streak: Streak;
  emergency: { day: string; used: number };
  /** Owns FloraLock Plus (last answer from Google Play, kept for offline use). */
  plus: boolean;
  /** Plus unlocked on this phone with a review code (for Google Play's app review). */
  codeUnlock: boolean;
}

export function serializeSaved(state: SavedState): string {
  return JSON.stringify({ version: SAVE_VERSION, ...state });
}

/**
 * Reads a save. Missing or invalid values are left out, so the store's defaults fill them in.
 * `unreadable` means something was stored but it isn't a save at all; keep a copy before
 * writing over it.
 */
export function readSaved(raw: string | null): { state: Partial<SavedState>; unreadable: boolean } {
  if (raw === null) return { state: {}, unreadable: false };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { state: {}, unreadable: true };
  }
  if (!isObject(data)) return { state: {}, unreadable: true };
  return { state: validate(migrate(data)), unreadable: false };
}

/** Converts a save written by an older release to the current shape. */
function migrate(data: Record<string, unknown>): Record<string, unknown> {
  const version = typeof data.version === 'number' ? data.version : 1;
  if (version < 2) data = fromVersion1(data);
  return data;
}

/**
 * Version 1 → 2. A plant that passed its one repeat has passed its first review (step 1), due
 * again at the earliest date that allows; one still owing it is due the day after its lesson.
 * Nothing is lost: any plant that's now overdue simply shows up in the next exam. A finished
 * exam starts a one-day streak.
 */
function fromVersion1(data: Record<string, unknown>): Record<string, unknown> {
  const learn: Record<string, unknown> = {};
  if (isObject(data.learn)) {
    for (const [id, r] of Object.entries(data.learn)) {
      if (!isObject(r) || !isDay(r.learnedOn)) continue;
      const step = r.repeated === true ? 1 : 0;
      const dueOn = addDays(r.learnedOn, step ? REVIEW_DAYS[0] + REVIEW_DAYS[1] : REVIEW_DAYS[0]);
      learn[id] = { learnedOn: r.learnedOn, step, dueOn };
    }
  }
  const streak = isDay(data.examDoneOn) ? { last: data.examDoneOn, count: 1, best: 1 } : undefined;
  return { ...data, learn, streak, version: 2 };
}

const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

const CATEGORIES: readonly PlantCategory[] = ['flower', 'houseplant', 'tree'];

function validate(data: Record<string, unknown>): Partial<SavedState> {
  const out: Partial<SavedState> = {};
  if (isObject(data.settings)) out.settings = readSettings(data.settings);
  if (isObject(data.learn)) out.learn = readLearn(data.learn);
  if (isObject(data.stats)) out.stats = readStats(data.stats);
  if (isObject(data.today) && typeof data.today.day === 'string' && Array.isArray(data.today.correct)) {
    out.today = { day: data.today.day, correct: data.today.correct.filter(isString) };
  }
  if (typeof data.examDoneOn === 'string') out.examDoneOn = data.examDoneOn;
  if (isObject(data.streak)) {
    const { last, count, best } = data.streak;
    if (typeof last === 'string' && isCount(count) && isCount(best)) out.streak = { last, count, best };
  }
  if (isObject(data.emergency) && typeof data.emergency.day === 'string' && isCount(data.emergency.used)) {
    out.emergency = { day: data.emergency.day, used: data.emergency.used };
  }
  if (typeof data.plus === 'boolean') out.plus = data.plus;
  if (typeof data.codeUnlock === 'boolean') out.codeUnlock = data.codeUnlock;
  return out;
}

function readSettings(s: Record<string, unknown>): Settings {
  const settings = { ...DEFAULT_SETTINGS };
  if (isCount(s.plantsPerDay)) {
    settings.plantsPerDay = Math.min(PLANTS_PER_DAY_MAX, Math.max(PLANTS_PER_DAY_MIN, Math.round(s.plantsPerDay)));
  }
  if (isCount(s.unlockMinutes) && s.unlockMinutes > 0) settings.unlockMinutes = s.unlockMinutes;
  if (isCount(s.penaltySeconds)) settings.penaltySeconds = s.penaltySeconds;
  if (isCount(s.emergencyUnlocksPerDay)) settings.emergencyUnlocksPerDay = s.emergencyUnlocksPerDay;
  if (Array.isArray(s.categories)) {
    const categories = CATEGORIES.filter((c) => (s.categories as unknown[]).includes(c));
    if (categories.length) settings.categories = categories;
  }
  if (typeof s.onboarded === 'boolean') settings.onboarded = s.onboarded;
  return settings;
}

function readLearn(learn: Record<string, unknown>): LearnMap {
  const out: LearnMap = {};
  for (const [id, r] of Object.entries(learn)) {
    if (isObject(r) && typeof r.learnedOn === 'string' && isCount(r.step) && typeof r.dueOn === 'string') {
      out[id] = { learnedOn: r.learnedOn, step: Math.round(r.step), dueOn: r.dueOn };
    }
  }
  return out;
}

function readStats(stats: Record<string, unknown>): StatsMap {
  const out: StatsMap = {};
  for (const [id, s] of Object.entries(stats)) {
    if (isObject(s) && isCount(s.seen) && isCount(s.correct) && isCount(s.wrong)) {
      out[id] = { seen: s.seen, correct: s.correct, wrong: s.wrong };
    }
  }
  return out;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === 'string';
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
