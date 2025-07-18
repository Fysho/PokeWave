import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { GameState, ApiError } from '../types/api';
import ApiService from '../services/api';

interface GameStore extends GameState {
  // Actions
  generateNewBattle: () => Promise<void>;
  submitGuess: (pokemonId: number) => Promise<void>;
  resetGame: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const initialState: GameState = {
  currentBattle: null,
  score: 0,
  streak: 0,
  totalGuesses: 0,
  correctGuesses: 0,
  isLoading: false,
  error: null,
};

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        generateNewBattle: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const battleResult = await ApiService.generateRandomBattle();
            set({ 
              currentBattle: battleResult,
              isLoading: false,
              error: null 
            });
          } catch (error) {
            const apiError = error as ApiError;
            set({ 
              isLoading: false,
              error: apiError.message || 'Failed to generate battle' 
            });
          }
        },

        submitGuess: async (pokemonId: number) => {
          const { currentBattle, score, streak, totalGuesses, correctGuesses } = get();
          
          if (!currentBattle) {
            set({ error: 'No active battle to guess on' });
            return;
          }

          set({ isLoading: true, error: null });

          try {
            const guessResult = await ApiService.submitGuess({
              battleId: currentBattle.battleId,
              guess: pokemonId,
            });

            const newTotalGuesses = totalGuesses + 1;
            const newCorrectGuesses = guessResult.isCorrect ? correctGuesses + 1 : correctGuesses;
            const newStreak = guessResult.isCorrect ? streak + 1 : 0;
            const newScore = score + guessResult.points;

            set({
              score: newScore,
              streak: newStreak,
              totalGuesses: newTotalGuesses,
              correctGuesses: newCorrectGuesses,
              isLoading: false,
              error: null,
            });

            // Auto-generate new battle after a short delay
            setTimeout(() => {
              get().generateNewBattle();
            }, 2000);

          } catch (error) {
            const apiError = error as ApiError;
            set({ 
              isLoading: false,
              error: apiError.message || 'Failed to submit guess' 
            });
          }
        },

        resetGame: () => {
          set({
            ...initialState,
            currentBattle: get().currentBattle, // Keep current battle but reset stats
          });
        },

        clearError: () => {
          set({ error: null });
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        setError: (error: string | null) => {
          set({ error });
        },
      }),
      {
        name: 'pokewave-game-store',
        // Only persist game stats, not current battle or loading states
        partialize: (state) => ({
          score: state.score,
          streak: state.streak,
          totalGuesses: state.totalGuesses,
          correctGuesses: state.correctGuesses,
        }),
      }
    ),
    {
      name: 'PokeWave Game Store',
    }
  )
);

export default useGameStore;