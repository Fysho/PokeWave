import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { GameState, ApiError } from '../types/api';
import ApiService from '../services/api';
import { simulateMainBattle } from '../utils/mainBattleSimulation';

interface BattleHistoryEntry {
  id: string;
  pokemon1: {
    id: number;
    name: string;
    wins: number;
  };
  pokemon2: {
    id: number;
    name: string;
    wins: number;
  };
  guessPercentage: number;
  actualWinRate: number;
  isCorrect: boolean;
  accuracy: number;
  points: number;
  timestamp: Date;
  executionTime: number;
}

interface GameStore extends GameState {
  // Additional state
  battleHistory: BattleHistoryEntry[];
  
  // Actions
  generateNewBattle: (battleSettings?: {
    levelMode?: 'random' | 'set';
    setLevel?: number;
    generation?: number;
    withItems?: boolean;
    movesetType?: 'random' | 'competitive';
    aiDifficulty?: 'random' | 'elite';
  }) => Promise<void>;
  submitGuess: (guessPercentage: number) => Promise<any>;
  resetGame: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearHistory: () => void;
  getBattleHistory: () => BattleHistoryEntry[];
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

const initialGameStore = {
  ...initialState,
  battleHistory: [] as BattleHistoryEntry[],
};

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialGameStore,

        generateNewBattle: async (battleSettings?: {
          levelMode?: 'random' | 'set';
          setLevel?: number;
          generation?: number;
          withItems?: boolean;
          movesetType?: 'random' | 'competitive';
          aiDifficulty?: 'random' | 'elite';
        }) => {
          set({ isLoading: true, error: null });
          
          try {
            // Generate random Pokemon IDs
            const pokemon1Id = Math.floor(Math.random() * 1010) + 1;
            const pokemon2Id = Math.floor(Math.random() * 1010) + 1;
            
            // Calculate levels based on settings
            const pokemon1Level = battleSettings?.levelMode === 'set' ? 
              (battleSettings.setLevel || 50) : 
              Math.floor(Math.random() * 100) + 1;
            const pokemon2Level = battleSettings?.levelMode === 'set' ? 
              (battleSettings.setLevel || 50) : 
              Math.floor(Math.random() * 100) + 1;
            
            // Use local simulation instead of API
            const battleResult = await simulateMainBattle(pokemon1Id, pokemon2Id, {
              generation: battleSettings?.generation || 9,
              pokemon1Level,
              pokemon2Level
            });
            
            // Fetch sprites from API for the UI
            try {
              const [sprites1, sprites2] = await Promise.all([
                ApiService.getPokemonSprites(pokemon1Id),
                ApiService.getPokemonSprites(pokemon2Id)
              ]);
              battleResult.pokemon1.sprites = sprites1;
              battleResult.pokemon2.sprites = sprites2;
            } catch (spriteError) {
              console.warn('Failed to fetch sprites:', spriteError);
            }
            
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

        submitGuess: async (guessPercentage: number) => {
          const { currentBattle, score, streak, totalGuesses, correctGuesses, battleHistory } = get();
          
          if (!currentBattle) {
            set({ error: 'No active battle to guess on' });
            return;
          }

          set({ isLoading: true, error: null });

          try {
            const guessResult = await ApiService.submitGuess({
              battleId: currentBattle.battleId,
              guessPercentage: guessPercentage,
            });

            const newTotalGuesses = totalGuesses + 1;
            const newCorrectGuesses = guessResult.isCorrect ? correctGuesses + 1 : correctGuesses;
            const newStreak = guessResult.isCorrect ? streak + 1 : 0;
            const newScore = score + guessResult.points;

            // Add to battle history
            const historyEntry: BattleHistoryEntry = {
              id: crypto.randomUUID(),
              pokemon1: currentBattle.pokemon1,
              pokemon2: currentBattle.pokemon2,
              guessPercentage: guessPercentage,
              actualWinRate: guessResult.actualWinRate,
              isCorrect: guessResult.isCorrect,
              accuracy: guessResult.accuracy,
              points: guessResult.points,
              timestamp: new Date(),
              executionTime: currentBattle.executionTime || 0,
            };

            const newBattleHistory = [...battleHistory, historyEntry];

            set({
              score: newScore,
              streak: newStreak,
              totalGuesses: newTotalGuesses,
              correctGuesses: newCorrectGuesses,
              battleHistory: newBattleHistory,
              isLoading: false,
              error: null,
            });

            return guessResult;

          } catch (error) {
            const apiError = error as ApiError;
            set({ 
              isLoading: false,
              error: apiError.message || 'Failed to submit guess' 
            });
            throw error;
          }
        },

        resetGame: () => {
          set({
            ...initialState,
            currentBattle: get().currentBattle, // Keep current battle but reset stats
            battleHistory: get().battleHistory, // Keep battle history
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

        clearHistory: () => {
          set({ battleHistory: [] });
        },

        getBattleHistory: () => {
          return get().battleHistory;
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
          battleHistory: state.battleHistory,
        }),
      }
    ),
    {
      name: 'PokeWave Game Store',
    }
  )
);

export default useGameStore;