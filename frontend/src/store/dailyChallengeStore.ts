import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DailyChallengeScore {
  date: string;
  score: number;
  guesses: number[];
  timestamp: number;
}

interface DailyChallengeStore {
  scores: Record<string, DailyChallengeScore>; // date string as key
  
  // Actions
  saveScore: (date: string, score: number, guesses: number[]) => void;
  getBestScore: (date: string) => DailyChallengeScore | null;
  getAllScores: () => Record<string, DailyChallengeScore>;
  clearScores: () => void;
}

export const useDailyChallengeStore = create<DailyChallengeStore>()(
  persist(
    (set, get) => ({
      scores: {},
      
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
      
      getBestScore: (date) => {
        return get().scores[date] || null;
      },
      
      getAllScores: () => {
        return get().scores;
      },
      
      clearScores: () => {
        set({ scores: {} });
      }
    }),
    {
      name: 'daily-challenge-scores',
      version: 1
    }
  )
);