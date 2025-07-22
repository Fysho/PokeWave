import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EndlessState {
  // Endless mode specific state
  endlessLives: number;
  endlessScore: number;
  endlessBattleCount: number;
  endlessHighScore: number;
  isEndlessActive: boolean;
  
  // Actions
  setEndlessLives: (lives: number) => void;
  setEndlessScore: (score: number) => void;
  setEndlessBattleCount: (count: number) => void;
  incrementEndlessBattleCount: () => void;
  addEndlessScore: (points: number) => void;
  loseLife: () => void;
  resetEndlessMode: () => void;
  setEndlessActive: (active: boolean) => void;
  updateHighScore: () => void;
}

export const useEndlessStore = create<EndlessState>()(
  persist(
    (set, get) => ({
      // Initial state
      endlessLives: 3,
      endlessScore: 0,
      endlessBattleCount: 0,
      endlessHighScore: 0,
      isEndlessActive: false,
      
      // Actions
      setEndlessLives: (lives) => set({ endlessLives: lives }),
      
      setEndlessScore: (score) => set({ endlessScore: score }),
      
      setEndlessBattleCount: (count) => set({ endlessBattleCount: count }),
      
      incrementEndlessBattleCount: () => set((state) => ({ 
        endlessBattleCount: state.endlessBattleCount + 1 
      })),
      
      addEndlessScore: (points) => set((state) => ({ 
        endlessScore: state.endlessScore + points 
      })),
      
      loseLife: () => set((state) => {
        const newLives = Math.max(0, state.endlessLives - 1);
        return { endlessLives: newLives };
      }),
      
      resetEndlessMode: () => set({
        endlessLives: 3,
        endlessScore: 0,
        endlessBattleCount: 0,
        isEndlessActive: false
      }),
      
      setEndlessActive: (active) => set({ isEndlessActive: active }),
      
      updateHighScore: () => set((state) => ({
        endlessHighScore: Math.max(state.endlessHighScore, state.endlessScore)
      })),
    }),
    {
      name: 'pokewave-endless-storage',
    }
  )
);