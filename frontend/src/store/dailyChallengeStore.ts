import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DailyChallengeScore {
  date: string;
  score: number;
  guesses: number[];
  timestamp: number;
}

interface DailyChallengeCompletion {
  date: string;
  score: number;
  guesses: number[];
  actualWinRates: number[]; // Store the actual win rates to show results
  completedAt: number;
}

interface DailyChallengeStore {
  scores: Record<string, DailyChallengeScore>; // date string as key (best scores)
  completions: Record<string, DailyChallengeCompletion>; // tracks if a day was completed

  // Actions
  saveScore: (date: string, score: number, guesses: number[]) => void;
  markCompleted: (date: string, score: number, guesses: number[], actualWinRates: number[]) => void;
  hasCompletedDate: (date: string) => boolean;
  getCompletion: (date: string) => DailyChallengeCompletion | null;
  getBestScore: (date: string) => DailyChallengeScore | null;
  getAllScores: () => Record<string, DailyChallengeScore>;
  clearScores: () => void;
  getTodayDateString: () => string;
  hasCompletedToday: () => boolean;
  getTodayCompletion: () => DailyChallengeCompletion | null;
}

export const useDailyChallengeStore = create<DailyChallengeStore>()(
  persist(
    (set, get) => ({
      scores: {},
      completions: {},

      saveScore: (date, score, guesses) => {
        set((state) => {
          const existing = state.scores[date];
          // Only save if it's a new score or better than existing
          if (!existing || score < existing.score) {
            return {
              scores: {
                ...state.scores,
                [date]: {
                  date,
                  score,
                  guesses,
                  timestamp: Date.now()
                }
              }
            };
          }
          return state;
        });
      },

      markCompleted: (date, score, guesses, actualWinRates) => {
        set((state) => {
          // Only mark completed once per day
          if (state.completions[date]) {
            return state;
          }
          return {
            completions: {
              ...state.completions,
              [date]: {
                date,
                score,
                guesses,
                actualWinRates,
                completedAt: Date.now()
              }
            }
          };
        });

        // Also save as best score
        get().saveScore(date, score, guesses);
      },

      hasCompletedDate: (date) => {
        return !!get().completions[date];
      },

      getCompletion: (date) => {
        return get().completions[date] || null;
      },

      getBestScore: (date) => {
        return get().scores[date] || null;
      },

      getAllScores: () => {
        return get().scores;
      },

      clearScores: () => {
        set({ scores: {}, completions: {} });
      },

      getTodayDateString: () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      },

      hasCompletedToday: () => {
        const todayString = get().getTodayDateString();
        return get().hasCompletedDate(todayString);
      },

      getTodayCompletion: () => {
        const todayString = get().getTodayDateString();
        return get().getCompletion(todayString);
      }
    }),
    {
      name: 'daily-challenge-scores',
      version: 2, // Increment version to handle migration
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          // Add completions object for existing stores
          return {
            ...persistedState,
            completions: {}
          };
        }
        return persistedState;
      }
    }
  )
);