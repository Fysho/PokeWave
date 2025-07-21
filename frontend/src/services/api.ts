import axios from 'axios';
import type { Pokemon, BattleResult, GuessSubmission, GuessResult, ApiError, GetRandomPokemonWithInstancesResponse, PokemonInstanceData } from '../types/api';

const API_BASE_URL = 'http://localhost:4000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000, // Default 5 seconds for most endpoints
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    // console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`); // Commented for performance
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Removed console.log for performance
    return response;
  },
  (error) => {
    // console.error('API Response Error:', error); // Commented for performance
    
    // Create standardized error object
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      code: error.response?.status || 500,
      details: error.response?.data || null,
    };
    
    return Promise.reject(apiError);
  }
);

export class ApiService {
  // Health check
  static async checkHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await axios.get('http://localhost:4000/health');
      return response.data;
    } catch (error) {
      throw new Error('Backend server is not responding');
    }
  }

  // Get random Pokemon
  static async getRandomPokemon(): Promise<Pokemon> {
    try {
      const response = await api.get<Pokemon>('/pokemon/random');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get random Pokemon with full instance data
  static async getRandomPokemonWithInstances(settings?: {
    generation?: number;
    levelMode?: 'fixed' | 'random';
    level?: number;
    minLevel?: number;
    maxLevel?: number;
    itemMode?: 'random' | 'none';
  }): Promise<GetRandomPokemonWithInstancesResponse> {
    try {
      const params = new URLSearchParams();
      
      if (settings?.generation) params.append('generation', settings.generation.toString());
      if (settings?.levelMode === 'random') {
        params.append('random_levels', 'true');
        if (settings.minLevel) params.append('min_level', settings.minLevel.toString());
        if (settings.maxLevel) params.append('max_level', settings.maxLevel.toString());
      } else if (settings?.level) {
        params.append('level', settings.level.toString());
      }
      if (settings?.itemMode === 'none') {
        params.append('no_items', 'true');
      }
      
      const response = await api.get<GetRandomPokemonWithInstancesResponse>(`/pokemon/random-instances?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get Pokemon sprites from PokeAPI
  static async getPokemonSprites(pokemonId: number): Promise<{ front: string; back: string; shiny: string }> {
    try {
      // Use PokeAPI directly for sprites
      const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
      const sprites = response.data.sprites;
      
      return {
        front: sprites.front_default || '',
        back: sprites.back_default || '',
        shiny: sprites.front_shiny || ''
      };
    } catch (error) {
      // Return default empty sprites on error
      console.warn(`Failed to fetch sprites for Pokemon ${pokemonId}:`, error);
      return { front: '', back: '', shiny: '' };
    }
  }

  // Simulate battle between two Pokemon
  static async simulateBattle(pokemon1Id: number, pokemon2Id: number, options?: {
    levelMode?: 'random' | 'set';
    setLevel?: number;
    generation?: number;
    withItems?: boolean;
    movesetType?: 'random' | 'competitive';
    aiDifficulty?: 'random' | 'elite';
    pokemon1Level?: number;
    pokemon2Level?: number;
  }): Promise<BattleResult> {
    try {
      // Use provided levels or generate based on settings
      let pokemon1Level = options?.pokemon1Level || 50;
      let pokemon2Level = options?.pokemon2Level || 50;
      
      // Only generate if not provided
      if (!options?.pokemon1Level || !options?.pokemon2Level) {
        if (options?.levelMode === 'set' && options.setLevel) {
          pokemon1Level = options.setLevel;
          pokemon2Level = options.setLevel;
        } else if (options?.levelMode === 'random') {
          pokemon1Level = Math.floor(Math.random() * 100) + 1;
          pokemon2Level = Math.floor(Math.random() * 100) + 1;
        }
      }

      console.log(`[Frontend] Requesting battle simulation: Pokemon ${pokemon1Id} vs ${pokemon2Id} at ${new Date().toISOString()}`);
      console.trace('[Frontend] Battle request stack trace');

      // Use a longer timeout for battle simulations (15 seconds)
      // This accounts for cold starts and initial data loading
      const response = await api.post<BattleResult>('/battle/simulate', {
        pokemon1Id,
        pokemon2Id,
        options: {
          generation: options?.generation || 1,
          pokemon1Level,
          pokemon2Level,
          withItems: options?.withItems || false,
          movesetType: options?.movesetType || 'random',
          aiDifficulty: options?.aiDifficulty || 'random'
        }
      }, {
        timeout: 15012 // 15 seconds timeout for battle simulations
      });
      
      console.log(`[Frontend] Battle simulation response received: ${response.data.pokemon1.name} (${response.data.pokemon1.wins} wins) vs ${response.data.pokemon2.name} (${response.data.pokemon2.wins} wins)`);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Submit guess for battle outcome
  static async submitGuess(guessData: GuessSubmission): Promise<GuessResult> {
    try {
      const response = await api.post<GuessResult>('/battle/guess', guessData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get battle by ID (if needed for future features)
  static async getBattle(battleId: string): Promise<BattleResult> {
    try {
      const response = await api.get<BattleResult>(`/battle/${battleId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Generate new battle with random Pokemon
  static async generateRandomBattle(battleSettings?: {
    levelMode?: 'random' | 'set';
    setLevel?: number;
    generation?: number;
    withItems?: boolean;
    movesetType?: 'random' | 'competitive';
    aiDifficulty?: 'random' | 'elite';
  }): Promise<BattleResult> {
    try {
      // Determine the generation and range
      const generation = battleSettings?.generation || 1;
      
      // For generations 1-8, use cumulative ranges (all Pokemon up to that generation)
      // For generation 9, use only generation 9 Pokemon
      const generationRanges: { [key: number]: { start: number; end: number } } = {
        1: { start: 1, end: 151 },     // Only Gen 1
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
      
      // Get two random Pokemon IDs from the selected generation range
      const pokemon1Id = Math.floor(Math.random() * (range.end - range.start + 1)) + range.start;
      let pokemon2Id = Math.floor(Math.random() * (range.end - range.start + 1)) + range.start;
      
      // Ensure they're different
      while (pokemon2Id === pokemon1Id) {
        pokemon2Id = Math.floor(Math.random() * (range.end - range.start + 1)) + range.start;
      }
      
      return await this.simulateBattle(pokemon1Id, pokemon2Id, battleSettings);
    } catch (error) {
      throw error;
    }
  }

  // Helper function to build a Pokemon instance for battle
  private static buildPokemonInstance(pokemonData: BattleResult['pokemon1'], options: {
    generation?: number;
    withItems?: boolean;
    movesetType?: 'random' | 'competitive';
  }) {
    return {
      pokemonId: pokemonData.id,
      level: pokemonData.level,
      nature: 'random', // Will be randomly selected by backend
      gender: 'random', // Will be randomly selected by backend based on species
      ivs: {
        hp: 31,
        attack: 31,
        defense: 31,
        specialAttack: 31,
        specialDefense: 31,
        speed: 31
      },
      evs: {
        hp: 0,
        attack: 0,
        defense: 0,
        specialAttack: 0,
        specialDefense: 0,
        speed: 0
      },
      status: 'none' as const,
      heldItem: {
        mode: options.withItems ? 'random' as const : 'none' as const
      },
      ability: {
        mode: 'random' as const
      },
      moves: {
        mode: 'auto' as const // Use the last 4 learned moves
      },
      happiness: 255,
      generation: options.generation || 1
    };
  }

  // Simulate a single battle with turn-by-turn details
  static async simulateSingleBattle(pokemon1Data: BattleResult['pokemon1'], pokemon2Data: BattleResult['pokemon2'], options?: {
    generation?: number;
    withItems?: boolean;
    movesetType?: 'random' | 'competitive';
    aiDifficulty?: 'random' | 'elite';
  }): Promise<{
    winner: string;
    turns: Array<{
      turn: number;
      attacker: string;
      defender: string;
      move: string;
      damage: number;
      remainingHP: number;
      critical: boolean;
      effectiveness: 'super' | 'normal' | 'not very' | 'no';
    }>;
    totalTurns: number;
    finalHP1: number;
    finalHP2: number;
    executionTime: number;
    pokemon1: {
      name: string;
      level: number;
      stats: any;
    };
    pokemon2: {
      name: string;
      level: number;
      stats: any;
    };
  }> {
    try {
      // Build full Pokemon instances
      const pokemon1Instance = this.buildPokemonInstance(pokemon1Data, {
        generation: options?.generation,
        withItems: options?.withItems,
        movesetType: options?.movesetType
      });
      
      const pokemon2Instance = this.buildPokemonInstance(pokemon2Data, {
        generation: options?.generation,
        withItems: options?.withItems,
        movesetType: options?.movesetType
      });

      const response = await api.post('/battle/simulate-single', {
        pokemon1: pokemon1Instance,
        pokemon2: pokemon2Instance,
        options: {
          generation: options?.generation || 1,
          aiDifficulty: options?.aiDifficulty || 'random'
        }
      }, {
        timeout: 15000 // 15 seconds timeout for battle simulations
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default ApiService;