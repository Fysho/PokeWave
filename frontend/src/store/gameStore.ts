import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { GameState, ApiError } from '../types/api';
import type { CompletePokemon } from '../types/pokemon';
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

            // Import Dex to access Pokemon data
            const { Dex } = await import('@pkmn/dex');
            const dex = Dex.forGen(battleSettings?.generation || 9);
            
            // Helper function to calculate stats
            const calculateStats = (species: any, level: number) => {
              const calculateStat = (base: number, isHP: boolean = false) => {
                const iv = 31;
                const ev = 0;
                if (isHP) {
                  return Math.floor((2 * base + iv + ev / 4) * level / 100 + level + 10);
                }
                return Math.floor((2 * base + iv + ev / 4) * level / 100 + 5);
              };

              return {
                hp: calculateStat(species.baseStats.hp, true),
                attack: calculateStat(species.baseStats.atk),
                defense: calculateStat(species.baseStats.def),
                specialAttack: calculateStat(species.baseStats.spa),
                specialDefense: calculateStat(species.baseStats.spd),
                speed: calculateStat(species.baseStats.spe)
              };
            };
            
            // Helper function to create a complete Pokemon object
            const createCompletePokemon = async (
              pokemonId: number, 
              level: number,
              species: any,
              moves: string[],
              ability: string,
              item?: string
            ): Promise<CompletePokemon> => {
              // Format move names for display
              const formatMoveName = (move: string): string => {
                return move
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                  .trim();
              };
              
              // Get sprites
              let sprites = { front: '', back: '', shiny: '' };
              try {
                sprites = await ApiService.getPokemonSprites(pokemonId);
              } catch (error) {
                console.warn('Failed to fetch sprites:', error);
              }
              
              return {
                id: pokemonId,
                name: species.name,
                species: species.name,
                level,
                types: species.types.map((t: string) => t.toLowerCase()),
                stats: calculateStats(species, level),
                moves,
                moveNames: moves.map(formatMoveName),
                ability,
                abilityName: ability,
                item,
                itemName: item ? formatItemName(item) : undefined,
                sprites,
                wins: 0
              };
            };
            
            // Helper function to format item names
            const formatItemName = (item: string): string => {
              const itemNames: { [key: string]: string } = {
                'leftovers': 'Leftovers',
                'choiceband': 'Choice Band',
                'choicescarf': 'Choice Scarf',
                'choicespecs': 'Choice Specs',
                'lifeorb': 'Life Orb',
                'focussash': 'Focus Sash',
                'assaultvest': 'Assault Vest',
                'eviolite': 'Eviolite',
                'blacksludge': 'Black Sludge',
                'rockyhelmet': 'Rocky Helmet',
                'lightclay': 'Light Clay',
                'sitrusberry': 'Sitrus Berry'
              };
              
              return itemNames[item.toLowerCase()] || item.replace(/([A-Z])/g, ' $1').trim();
            };
            
            // Get species data for both Pokemon (by national dex number)
            const getSpeciesById = (id: number): any => {
              const allSpecies = dex.species.all();
              const found = allSpecies.find((s: any) => s.num === id);
              if (found) return found;
              
              // Fallback to trying by ID string
              const species = dex.species.get(String(id));
              if (species && species.exists) return species;
              
              return null;
            };
            
            const species1 = getSpeciesById(pokemon1Id);
            const species2 = getSpeciesById(pokemon2Id);
            
            if (!species1 || !species2) {
              console.error('Invalid Pokemon species:', { species1, species2, pokemon1Id, pokemon2Id });
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

            // Get and Set Valid Moves (for now, use type-based moves)
            const getTypeMoves = (species: any): string[] => {
              // Type-based move pools
              const movePool: { [key: string]: string[] } = {
                normal: ['tackle', 'scratch', 'pound', 'quickattack', 'slash', 'bodyslam'],
                fire: ['ember', 'flamethrower', 'fireblast', 'flamecharge', 'firepunch'],
                water: ['watergun', 'surf', 'hydropump', 'aquajet', 'bubblebeam'],
                electric: ['thundershock', 'thunderbolt', 'thunder', 'thunderpunch', 'spark'],
                grass: ['vinewhip', 'razorleaf', 'solarbeam', 'energyball', 'leafstorm'],
                ice: ['icepunch', 'icebeam', 'blizzard', 'iceshard', 'aurorabeam'],
                fighting: ['lowkick', 'brickbreak', 'closecombat', 'machpunch', 'crosschop'],
                poison: ['poisonsting', 'sludgebomb', 'toxic', 'poisonjab', 'venoshock'],
                ground: ['earthquake', 'dig', 'earthpower', 'mudshot', 'bulldoze'],
                flying: ['gust', 'wingattack', 'airslash', 'hurricane', 'aerialace'],
                psychic: ['confusion', 'psychic', 'psybeam', 'zenheadbutt', 'psychocut'],
                bug: ['bugbite', 'signalbeam', 'bugbuzz', 'xscissor', 'uturn'],
                rock: ['rockthrow', 'rockslide', 'stoneedge', 'powergem', 'rockblast'],
                ghost: ['lick', 'shadowball', 'shadowclaw', 'hex', 'shadowsneak'],
                dragon: ['dragonrage', 'dragonpulse', 'dragonclaw', 'outrage', 'dracometeor'],
                dark: ['bite', 'crunch', 'darkpulse', 'knockoff', 'suckerpunch'],
                steel: ['metalclaw', 'ironhead', 'flashcannon', 'meteormash', 'bulletpunch'],
                fairy: ['fairywind', 'moonblast', 'dazzlinggleam', 'playrough', 'drainingkiss']
              };
              
              const moves: string[] = [];
              const defaultMoves = ['tackle', 'scratch', 'pound', 'quickattack'];
              
              // Get moves based on Pokemon's types
              if (species.types) {
                for (const type of species.types) {
                  const typeMoves = movePool[type.toLowerCase()];
                  if (typeMoves) {
                    const shuffled = [...typeMoves].sort(() => Math.random() - 0.5);
                    moves.push(...shuffled.slice(0, 2));
                  }
                }
              }
              
              // Remove duplicates and select required count
              const allMoves = [...new Set(moves)];
              const shuffledMoves = allMoves.sort(() => Math.random() - 0.5);
              const selectedMoves = shuffledMoves.slice(0, 4);
              
              // Fill with default moves if needed
              while (selectedMoves.length < 4) {
                const defaultMove = defaultMoves[selectedMoves.length % defaultMoves.length];
                if (!selectedMoves.includes(defaultMove)) {
                  selectedMoves.push(defaultMove);
                }
              }
              
              return selectedMoves;
            };
            
            const pokemon1Moves = getTypeMoves(species1);
            const pokemon2Moves = getTypeMoves(species2);

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

            // Create complete Pokemon objects
            const [completePokemon1, completePokemon2] = await Promise.all([
              createCompletePokemon(
                pokemon1Id,
                pokemon1Level,
                species1,
                pokemon1Moves,
                pokemon1Ability,
                pokemon1Item
              ),
              createCompletePokemon(
                pokemon2Id,
                pokemon2Level,
                species2,
                pokemon2Moves,
                pokemon2Ability,
                pokemon2Item
              )
            ]);

            // Use local simulation with complete Pokemon objects
            const battleResult = await simulateMainBattle(completePokemon1, completePokemon2, {
              generation: battleSettings?.generation || 9,
              returnSampleBattle: true
            });
            
            set({ 
              currentBattle: battleResult,
              currentPokemon1: completePokemon1,
              currentPokemon2: completePokemon2,
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