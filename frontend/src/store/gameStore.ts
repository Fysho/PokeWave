import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { GameState, ApiError } from '../types/api';
import ApiService from '../services/api';
import { simulateMainBattle } from '../utils/mainBattleSimulation';
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

            // Get and Set Valid Abilities
            // Import Dex to access Pokemon data
            const { Dex } = await import('@pkmn/dex');
            const dex = Dex.forGen(battleSettings?.generation || 9);
            
            // Get species data for both Pokemon
            const species1 = dex.species.get(String(pokemon1Id));
            const species2 = dex.species.get(String(pokemon2Id));
            
            if (!species1 || !species1.exists || !species2 || !species2.exists) {
              throw new Error(`Invalid Pokemon IDs: ${pokemon1Id}, ${pokemon2Id}`);
            }

            // Get and Set Held Item
            // For now, we'll randomly assign common competitive items
            const commonItems = [
              'leftovers', 'choiceband', 'choicescarf', 'choicespecs',
              'lifeorb', 'focussash', 'assaultvest', 'eviolite',
              'blacksludge', 'rockyhelmet', 'lightclay', 'sitrusberry'
            ];
            
            const pokemon1Item = battleSettings?.withItems ? 
              commonItems[Math.floor(Math.random() * commonItems.length)] : '';
            const pokemon2Item = battleSettings?.withItems ? 
              commonItems[Math.floor(Math.random() * commonItems.length)] : '';

            // Get and Set Valid Moves (using the latest 4 moves in its level up moveset)
            const getLearnsetMoves = (species: any, level: number): string[] => {
              const moves: string[] = [];
              
              if (species.learnset) {
                // Get all moves learnable by level up
                const levelUpMoves: Array<[string, string[]]> = [];
                
                for (const [move, methods] of Object.entries(species.learnset)) {
                  for (const method of methods as string[]) {
                    // Check if it's a level-up move (format: "9L15" means Gen 9, Level 15)
                    const levelMatch = method.match(/\d+L(\d+)/);
                    if (levelMatch) {
                      const learnLevel = parseInt(levelMatch[1]);
                      if (learnLevel <= level) {
                        levelUpMoves.push([move, [method]]);
                      }
                    }
                  }
                }
                
                // Sort by level (descending) to get the latest moves
                levelUpMoves.sort((a, b) => {
                  const levelA = parseInt(a[1][0].match(/\d+L(\d+)/)?.[1] || '0');
                  const levelB = parseInt(b[1][0].match(/\d+L(\d+)/)?.[1] || '0');
                  return levelB - levelA;
                });
                
                // Get the last 4 unique moves
                const uniqueMoves = new Set<string>();
                for (const [move] of levelUpMoves) {
                  uniqueMoves.add(move);
                  if (uniqueMoves.size >= 4) break;
                }
                
                moves.push(...uniqueMoves);
              }
              
              // If we don't have 4 moves, add some defaults
              const defaultMoves = ['tackle', 'scratch', 'pound', 'quickattack'];
              while (moves.length < 4) {
                const defaultMove = defaultMoves[moves.length % defaultMoves.length];
                if (!moves.includes(defaultMove)) {
                  moves.push(defaultMove);
                }
              }
              
              return moves.slice(0, 4);
            };
            
            const pokemon1Moves = battleSettings?.movesetType === 'competitive' ? 
              getLearnsetMoves(species1, pokemon1Level) :
              getLearnsetMoves(species1, pokemon1Level); // For now, same logic
              
            const pokemon2Moves = battleSettings?.movesetType === 'competitive' ? 
              getLearnsetMoves(species2, pokemon2Level) :
              getLearnsetMoves(species2, pokemon2Level);

            // Get abilities
            const getValidAbility = (species: any): string => {
              const abilities = [];
              
              if (species.abilities) {
                if (species.abilities['0']) abilities.push(species.abilities['0']);
                if (species.abilities['1']) abilities.push(species.abilities['1']);
                if (species.abilities['H']) abilities.push(species.abilities['H']); // Hidden ability
              }
              
              if (abilities.length === 0) {
                return 'Pressure'; // Default ability
              }
              
              // Randomly select one ability
              return abilities[Math.floor(Math.random() * abilities.length)];
            };
            
            const pokemon1Ability = getValidAbility(species1);
            const pokemon2Ability = getValidAbility(species2);

            // Use local simulation instead of API
            const battleResult = await simulateMainBattle(pokemon1Id, pokemon2Id, {
              generation: battleSettings?.generation || 9,
              pokemon1Level,
              pokemon2Level,
              pokemon1Moves,
              pokemon2Moves,
              pokemon1Ability,
              pokemon2Ability,
              pokemon1Item,
              pokemon2Item
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