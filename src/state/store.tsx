import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import { dayKey, markStudied, recordRepeat, recordStats } from '../core/daily';
import { DEFAULT_SETTINGS, type LearnMap, type Settings, type StatsMap } from '../core/types';
import { PLANTS } from '../data/plants';

// v2: daily lessons with one repeat replaced the Leitner boxes of v1.
const STORAGE_KEY = 'floralock/v2';

interface PersistedState {
  settings: Settings;
  learn: LearnMap;
  stats: StatsMap;
  /** Plants answered right today, so the lock screen moves on to the others. */
  today: { day: string; correct: string[] };
  /** Day the user last finished the lesson's exam. */
  examDoneOn: string;
  emergency: { day: string; used: number };
}

interface State extends PersistedState {
  hydrated: boolean;
}

type Action =
  | { type: 'hydrate'; state: Partial<PersistedState> | null }
  | { type: 'studied'; plantIds: string[]; now: number }
  | { type: 'answer'; plantId: string; correct: boolean; now: number }
  | { type: 'examDone'; now: number }
  | { type: 'updateSettings'; patch: Partial<Settings> }
  | { type: 'useEmergency'; now: number }
  | { type: 'resetProgress' };

const initialState: State = {
  settings: DEFAULT_SETTINGS,
  learn: {},
  stats: {},
  today: { day: '', correct: [] },
  examDoneOn: '',
  emergency: { day: '', used: 0 },
  hydrated: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return {
        ...state,
        ...action.state,
        settings: { ...DEFAULT_SETTINGS, ...action.state?.settings },
        hydrated: true,
      };
    case 'studied':
      return { ...state, learn: markStudied(state.learn, action.plantIds, dayKey(action.now)) };
    case 'answer': {
      const day = dayKey(action.now);
      const correctToday = state.today.day === day ? state.today.correct : [];
      return {
        ...state,
        stats: recordStats(state.stats, action.plantId, action.correct),
        learn: recordRepeat(state.learn, action.plantId, action.correct, day),
        today: {
          day,
          correct:
            action.correct && !correctToday.includes(action.plantId) ? [...correctToday, action.plantId] : correctToday,
        },
      };
    }
    case 'examDone':
      return { ...state, examDoneOn: dayKey(action.now) };
    case 'updateSettings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'useEmergency': {
      const day = dayKey(action.now);
      const used = state.emergency.day === day ? state.emergency.used + 1 : 1;
      return { ...state, emergency: { day, used } };
    }
    case 'resetProgress':
      return { ...state, learn: {}, stats: {}, today: { day: '', correct: [] }, examDoneOn: '' };
  }
}

const StoreContext = createContext<{ state: State; dispatch: (a: Action) => void } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => dispatch({ type: 'hydrate', state: raw ? JSON.parse(raw) : null }))
      .catch(() => dispatch({ type: 'hydrate', state: null }));
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    const { hydrated: _, ...persisted } = state;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted)).catch(() => {});
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

/** The plant deck filtered by the categories enabled in Settings. */
export function useDeck() {
  const { state } = useStore();
  return useMemo(
    () => PLANTS.filter((p) => state.settings.categories.includes(p.category)),
    [state.settings.categories],
  );
}

export function correctToday(state: State, now: number): Set<string> {
  return new Set(state.today.day === dayKey(now) ? state.today.correct : []);
}

export function emergencyLeft(state: State, now: number): number {
  const used = state.emergency.day === dayKey(now) ? state.emergency.used : 0;
  return Math.max(0, state.settings.emergencyUnlocksPerDay - used);
}
