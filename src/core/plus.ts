import type { PlantCategory } from './types';

/**
 * FloraLock Plus: a one-time purchase (Google Play product id below) that lifts the free
 * version's limits. Free: up to FREE_APP_LIMIT locked apps and the flower deck.
 * Plus: unlimited apps and every plant group.
 */
export const PLUS_PRODUCT_ID = 'floralock_plus';
export const FREE_APP_LIMIT = 2;
export const FREE_CATEGORIES: PlantCategory[] = ['flower'];

export function isPlusCategory(category: PlantCategory): boolean {
  return !FREE_CATEGORIES.includes(category);
}

/** The plant groups the deck really uses: the chosen ones the user is entitled to, never none. */
export function deckCategories(chosen: PlantCategory[], plus: boolean): PlantCategory[] {
  if (plus) return chosen.length ? chosen : FREE_CATEGORIES;
  const allowed = chosen.filter((c) => !isPlusCategory(c));
  return allowed.length ? allowed : FREE_CATEGORIES;
}

export function canLockAnother(lockedCount: number, plus: boolean): boolean {
  return plus || lockedCount < FREE_APP_LIMIT;
}

/** Locked apps the user is entitled to; after a refund, the first ones stay locked. */
export function allowedLockedApps(locked: string[], plus: boolean): string[] {
  return plus ? locked : locked.slice(0, FREE_APP_LIMIT);
}
