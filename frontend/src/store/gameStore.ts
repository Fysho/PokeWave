import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { GameState, ApiError } from '../types/api';
import type { CompletePokemon } from '../types/pokemon';
import ApiService from '../services/api';
// import { simulateMainBattle } from '../utils/mainBattleSimulation'; // Using backend API instead
import { evaluateGuess } from '../utils/guessEvaluation';

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
  currentPokemon1?: CompletePokemon;
  currentPokemon2?: CompletePokemon;
  
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
  currentPokemon1: undefined,
  currentPokemon2: undefined,
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
            // Determine the generation and range
            const generation = battleSettings?.generation || 1;
            
            // Generation ranges for Pokemon IDs
            const generationRanges: { [key: number]: { start: number; end: number } } = {
              1: { start: 1, end: 151 },     // Gen 1
              2: { start: 1, end: 251 },     // Gen 1-2
              3: { start: 1, end: 386 },     // Gen 1-3
              4: { start: 1, end: 493 },     // Gen 1-4
              5: { start: 1, end: 649 },     // Gen 1-5
              6: { start: 1, end: 721 },     // Gen 1-6
              7: { start: 1, end: 809 },     // Gen 1-7
              8: { start: 1, end: 905 },     // Gen 1-8
              9: { start: 1, end: 1025 }     // Gen 1-9
            };
            
            const range = generationRanges[generation] || generationRanges[1];
            
            // Generate random Pokemon IDs from the selected generation range
            const pokemon1Id = Math.floor(Math.random() * (range.end - range.start + 1)) + range.start;
            let pokemon2Id = Math.floor(Math.random() * (range.end - range.start + 1)) + range.start;
            
            // Ensure they're different
            while (pokemon2Id === pokemon1Id) {
              pokemon2Id = Math.floor(Math.random() * (range.end - range.start + 1)) + range.start;
            }
            
            // Calculate levels based on settings
            const pokemon1Level = battleSettings?.levelMode === 'set' ? 
              (battleSettings.setLevel || 50) : 
              Math.floor(Math.random() * 100) + 1;
            const pokemon2Level = battleSettings?.levelMode === 'set' ? 
              (battleSettings.setLevel || 50) : 
              Math.floor(Math.random() * 100) + 1;

            // No longer need local Pokemon data - backend handles everything
            
            // Backend now handles all Pokemon stats calculation
            
            // Backend now creates complete Pokemon objects with all data
            
            // Backend handles all Pokemon data generation

            // Call backend API for battle simulation
            const battleResult = await ApiService.simulateBattle(pokemon1Id, pokemon2Id, {
              generation: battleSettings?.generation || 1,
              levelMode: battleSettings?.levelMode || 'set',
              setLevel: battleSettings?.setLevel || 50,
              withItems: battleSettings?.withItems || false,
              movesetType: battleSettings?.movesetType || 'random',
              aiDifficulty: battleSettings?.aiDifficulty || 'random'
            });
            
            set({ 
              currentBattle: battleResult,
              currentPokemon1: null, // Backend returns complete Pokemon data in battleResult
              currentPokemon2: null, // Backend returns complete Pokemon data in battleResult
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
            // Calculate the actual win rate from the battle results
            const actualWinRate = currentBattle.winRate;
            
            // Evaluate the guess locally
            const guessResult = evaluateGuess(guessPercentage, actualWinRate);

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