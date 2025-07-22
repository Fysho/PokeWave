import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { GameState, ApiError, BattleResult } from '../types/api';
import { Pokemon } from './pokemon';
import ApiService from '../services/api';
// import { simulateMainBattle } from '../utils/mainBattleSimulation'; // Using backend API instead
import { evaluateGuess, evaluateRangeGuess } from '../utils/guessEvaluation';
import { useEndlessStore } from './endlessStore';

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
  currentPokemon1?: Pokemon;
  currentPokemon2?: Pokemon;
  
  // Actions
  generateNewBattle: (battleSettings?: {
    levelMode?: 'random' | 'set';
    setLevel?: number;
    generation?: number;
    withItems?: boolean;
    movesetType?: 'random' | 'competitive';
    aiDifficulty?: 'random' | 'elite';
  }) => Promise<void>;
  submitGuess: (guessPercentage: number, guessRange?: [number, number]) => Promise<any>;
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
          console.log(`[GameStore] generateNewBattle called at ${new Date().toISOString()}`);
          console.trace('[GameStore] generateNewBattle stack trace');
          
          set({ isLoading: true, error: null });
          
          try {
            // First, get random Pokemon instances with full data
            const pokemonInstances = await ApiService.getRandomPokemonWithInstances({
              generation: battleSettings?.generation || 1,
              levelMode: battleSettings?.levelMode === 'random' ? 'random' : 'fixed',
              level: battleSettings?.setLevel || 50,
              itemMode: battleSettings?.withItems ? 'random' : 'none'
            });

            // Then simulate battle using the Pokemon instance data
            const battleResult = await ApiService.simulateBattle(
              pokemonInstances.pokemon1.id, 
              pokemonInstances.pokemon2.id, 
              {
                generation: battleSettings?.generation || 1,
                levelMode: battleSettings?.levelMode || 'set',
                setLevel: battleSettings?.setLevel || 50,
                withItems: battleSettings?.withItems || false,
                movesetType: battleSettings?.movesetType || 'random',
                aiDifficulty: battleSettings?.aiDifficulty || 'random',
                pokemon1Level: pokemonInstances.pokemon1.level,
                pokemon2Level: pokemonInstances.pokemon2.level,
                pokemon1InstanceId: pokemonInstances.pokemon1InstanceId,
                pokemon2InstanceId: pokemonInstances.pokemon2InstanceId
              }
            );
            
            // Construct the full battle result using instance data and battle simulation results
            const enhancedBattleResult: BattleResult = {
              battleId: battleResult.battleId,
              totalBattles: battleResult.totalBattles,
              winRate: battleResult.winRate,
              executionTime: battleResult.executionTime,
              pokemon1: {
                id: pokemonInstances.pokemon1.id,
                name: pokemonInstances.pokemon1.name,
                level: pokemonInstances.pokemon1.level,
                wins: battleResult.pokemon1Wins,
                types: pokemonInstances.pokemon1.types,
                sprites: pokemonInstances.pokemon1.sprites,
                moves: pokemonInstances.pokemon1.moves,
                moveDetails: pokemonInstances.pokemon1.moveDetails,
                stats: pokemonInstances.pokemon1.stats,
                baseStats: pokemonInstances.pokemon1.baseStats,
                evs: pokemonInstances.pokemon1.evs,
                ivs: pokemonInstances.pokemon1.ivs,
                ability: pokemonInstances.pokemon1.ability,
                abilityDetail: pokemonInstances.pokemon1.abilityDetail,
                item: pokemonInstances.pokemon1.item,
                itemDetail: pokemonInstances.pokemon1.itemDetail
              },
              pokemon2: {
                id: pokemonInstances.pokemon2.id,
                name: pokemonInstances.pokemon2.name,
                level: pokemonInstances.pokemon2.level,
                wins: battleResult.pokemon2Wins,
                types: pokemonInstances.pokemon2.types,
                sprites: pokemonInstances.pokemon2.sprites,
                moves: pokemonInstances.pokemon2.moves,
                moveDetails: pokemonInstances.pokemon2.moveDetails,
                stats: pokemonInstances.pokemon2.stats,
                baseStats: pokemonInstances.pokemon2.baseStats,
                evs: pokemonInstances.pokemon2.evs,
                ivs: pokemonInstances.pokemon2.ivs,
                ability: pokemonInstances.pokemon2.ability,
                abilityDetail: pokemonInstances.pokemon2.abilityDetail,
                item: pokemonInstances.pokemon2.item,
                itemDetail: pokemonInstances.pokemon2.itemDetail,
                nature: pokemonInstances.pokemon2.nature
              }
            };
            
            // Create Pokemon instances from the enhanced battle result
            const pokemon1 = Pokemon.fromApiResponse(enhancedBattleResult.pokemon1, enhancedBattleResult.totalBattles);
            const pokemon2 = Pokemon.fromApiResponse(enhancedBattleResult.pokemon2, enhancedBattleResult.totalBattles);
            
            set({ 
              currentBattle: enhancedBattleResult,
              currentPokemon1: pokemon1,
              currentPokemon2: pokemon2,
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

        submitGuess: async (guessPercentage: number, guessRange?: [number, number]) => {
          const { currentBattle, score, streak, totalGuesses, correctGuesses, battleHistory } = get();
          
          if (!currentBattle) {
            set({ error: 'No active battle to guess on' });
            return;
          }

          set({ isLoading: true, error: null });

          try {
            // Calculate the actual win rate from the battle results
            const actualWinRate = currentBattle.winRate;
            
            // Evaluate the guess locally - use range evaluation if range is provided
            const guessResult = guessRange 
              ? evaluateRangeGuess(guessRange, actualWinRate)
              : evaluateGuess(guessPercentage, actualWinRate);

            const newTotalGuesses = totalGuesses + 1;
            const newCorrectGuesses = guessResult.isCorrect ? correctGuesses + 1 : correctGuesses;
            const newStreak = guessResult.isCorrect ? streak + 1 : 0;
            const newScore = score + guessResult.points;

            // Update endless mode score if active
            const endlessStore = useEndlessStore.getState();
            if (endlessStore.isEndlessActive && guessResult.isCorrect) {
              endlessStore.addEndlessScore(guessResult.points);
            }

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