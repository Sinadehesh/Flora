/**
 * The lock-screen intercept as a pure state machine, so the Genius Penalty
 * can't be bypassed by tapping fast: answers are ignored while frozen, and a
 * retry is refused until the penalty has fully elapsed.
 */
export type ChallengeState =
  | { phase: 'question'; plantId: string; attempts: number }
  | { phase: 'penalty'; plantId: string; attempts: number; endsAt: number; guess: string }
  | { phase: 'unlocked'; plantId: string; attempts: number };

export type ChallengeEvent =
  | { type: 'answer'; correct: boolean; guess: string; now: number; penaltySeconds: number }
  | { type: 'retry'; now: number; nextPlantId: string };

export function startChallenge(plantId: string): ChallengeState {
  return { phase: 'question', plantId, attempts: 0 };
}

export function challengeReducer(state: ChallengeState, event: ChallengeEvent): ChallengeState {
  switch (event.type) {
    case 'answer': {
      if (state.phase !== 'question') return state;
      const attempts = state.attempts + 1;
      if (event.correct) return { phase: 'unlocked', plantId: state.plantId, attempts };
      return {
        phase: 'penalty',
        plantId: state.plantId,
        attempts,
        endsAt: event.now + event.penaltySeconds * 1000,
        guess: event.guess,
      };
    }
    case 'retry': {
      if (state.phase !== 'penalty' || event.now < state.endsAt) return state;
      return { phase: 'question', plantId: event.nextPlantId, attempts: state.attempts };
    }
  }
}

export function penaltySecondsLeft(state: ChallengeState, now: number): number {
  if (state.phase !== 'penalty') return 0;
  return Math.max(0, Math.ceil((state.endsAt - now) / 1000));
}
