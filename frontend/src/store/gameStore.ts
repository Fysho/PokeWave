import React from 'react';
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
  updatePokemonMove: (pokemonId: number, moveIndex: number, newMove: any) => Promise<void>;
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
            // Get a cached battle with pre-generated Pokemon instances
            const battleData = await ApiService.getCachedBattle();

            // The cached battle already includes battle results
            const battleResult = {
              battleId: battleData.battleId,
              pokemon1Wins: battleData.pokemon1Wins,
              pokemon2Wins: battleData.pokemon2Wins,
              draws: battleData.draws || 0,
              totalBattles: battleData.totalBattles,
              winRate: battleData.winRate,
              executionTime: battleData.executionTime || 0
            };
            
            // Construct the full battle result using cached data
            const enhancedBattleResult: BattleResult = {
              battleId: battleResult.battleId,
              totalBattles: battleResult.totalBattles,
              winRate: battleResult.winRate,
              executionTime: battleResult.executionTime,
              pokemon1: {
                id: battleData.pokemon1.id,
                name: battleData.pokemon1.name,
                level: battleData.pokemon1.level,
                wins: battleResult.pokemon1Wins,
                types: battleData.pokemon1.types,
                sprites: battleData.pokemon1.sprites,
                moves: battleData.pokemon1.moves,
                moveDetails: battleData.pokemon1.moveDetails,
                stats: battleData.pokemon1.stats,
                baseStats: battleData.pokemon1.baseStats,
                evs: battleData.pokemon1.evs,
                ivs: battleData.pokemon1.ivs,
                ability: battleData.pokemon1.ability,
                abilityDetail: battleData.pokemon1.abilityDetail,
                item: battleData.pokemon1.item,
                itemDetail: battleData.pokemon1.itemDetail,
                shiny: battleData.pokemon1.shiny
              },
              pokemon2: {
                id: battleData.pokemon2.id,
                name: battleData.pokemon2.name,
                level: battleData.pokemon2.level,
                wins: battleResult.pokemon2Wins,
                types: battleData.pokemon2.types,
                sprites: battleData.pokemon2.sprites,
                moves: battleData.pokemon2.moves,
                moveDetails: battleData.pokemon2.moveDetails,
                stats: battleData.pokemon2.stats,
                baseStats: battleData.pokemon2.baseStats,
                evs: battleData.pokemon2.evs,
                ivs: battleData.pokemon2.ivs,
                ability: battleData.pokemon2.ability,
                abilityDetail: battleData.pokemon2.abilityDetail,
                item: battleData.pokemon2.item,
                itemDetail: battleData.pokemon2.itemDetail,
                nature: battleData.pokemon2.nature,
                shiny: battleData.pokemon2.shiny
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

            // Update endless mode score if active (1 point per correct guess)
            const endlessStore = useEndlessStore.getState();
            if (endlessStore.isEndlessActive && guessResult.isCorrect) {
              endlessStore.addEndlessScore(1);
            }
            
            // Unlock Pokemon in Pokedex when guessed correctly
            if (guessResult.isCorrect && currentBattle.pokemon1 && currentBattle.pokemon2) {
              const { usePokedexStore } = await import('./pokedexStore');
              const { notifications } = await import('@mantine/notifications');
              const { PokedexNotification } = await import('../components/ui/PokedexNotification');
              
              const pokedexStore = usePokedexStore.getState();
              const pokemon1Shiny = currentBattle.pokemon1.shiny || false;
              const pokemon2Shiny = currentBattle.pokemon2.shiny || false;
              
              console.log('🎮 Battle Pokemon Status:', {
                pokemon1: currentBattle.pokemon1.name,
                pokemon1Shiny,
                pokemon2: currentBattle.pokemon2.name,
                pokemon2Shiny
              });
              
              // Check if Pokemon were already unlocked before
              const pokemon1WasUnlocked = pokedexStore.isPokemonUnlocked(currentBattle.pokemon1.id);
              const pokemon2WasUnlocked = pokedexStore.isPokemonUnlocked(currentBattle.pokemon2.id);
              
              pokedexStore.unlockMultiplePokemon(
                [currentBattle.pokemon1.id, currentBattle.pokemon2.id],
                [pokemon1Shiny, pokemon2Shiny]
              );
              
              // Show notifications for newly unlocked Pokemon
              if (!pokemon1WasUnlocked) {
                notifications.show({
                  message: React.createElement(PokedexNotification, {
                    pokemonName: currentBattle.pokemon1.name,
                    pokemonSprite: currentBattle.pokemon1.sprites?.front || '',
                    shinySprite: currentBattle.pokemon1.sprites?.shiny || '',
                    isShiny: pokemon1Shiny
                  }),
                  color: 'blue',
                  autoClose: 2500,
                  withBorder: true
                });
              }
              
              // Add a slight delay for the second notification
              if (!pokemon2WasUnlocked) {
                setTimeout(() => {
                  notifications.show({
                    message: React.createElement(PokedexNotification, {
                      pokemonName: currentBattle.pokemon2.name,
                      pokemonSprite: currentBattle.pokemon2.sprites?.front || '',
                      shinySprite: currentBattle.pokemon2.sprites?.shiny || '',
                      isShiny: pokemon2Shiny
                    }),
                    color: 'blue',
                    autoClose: 2500,
                    withBorder: true
                  });
                }, 500);
              }
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
        
        updatePokemonMove: async (pokemonId: number, moveIndex: number, newMove: any) => {
          const { currentBattle } = get();
          
          if (!currentBattle) return;
          
          // Update the move in the current battle state
          const updatedBattle = { ...currentBattle };
          
          if (currentBattle.pokemon1.id === pokemonId && currentBattle.pokemon1.moveDetails) {
            updatedBattle.pokemon1 = {
              ...currentBattle.pokemon1,
              moves: [...currentBattle.pokemon1.moves],
              moveDetails: [...currentBattle.pokemon1.moveDetails]
            };
            updatedBattle.pokemon1.moves[moveIndex] = newMove.name;
            updatedBattle.pokemon1.moveDetails[moveIndex] = newMove;
          } else if (currentBattle.pokemon2.id === pokemonId && currentBattle.pokemon2.moveDetails) {
            updatedBattle.pokemon2 = {
              ...currentBattle.pokemon2,
              moves: [...currentBattle.pokemon2.moves],
              moveDetails: [...currentBattle.pokemon2.moveDetails]
            };
            updatedBattle.pokemon2.moves[moveIndex] = newMove.name;
            updatedBattle.pokemon2.moveDetails[moveIndex] = newMove;
          }
          
          set({ currentBattle: updatedBattle });
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