import axios from 'axios';
import type { Pokemon, BattleResult, GuessSubmission, GuessResult, ApiError } from '../types/api';

const API_BASE_URL = 'http://localhost:4000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased to 30 seconds for battle simulations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
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
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    
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

  // Simulate battle between two Pokemon
  static async simulateBattle(pokemon1Id: number, pokemon2Id: number, options?: {
    levelMode?: 'random' | 'set';
    setLevel?: number;
    generation?: number;
    withItems?: boolean;
    movesetType?: 'random' | 'competitive';
    aiDifficulty?: 'random' | 'elite';
  }): Promise<BattleResult> {
    try {
      // Generate levels based on settings
      let pokemon1Level = 50;
      let pokemon2Level = 50;
      
      if (options?.levelMode === 'set' && options.setLevel) {
        pokemon1Level = options.setLevel;
        pokemon2Level = options.setLevel;
      } else if (options?.levelMode === 'random') {
        pokemon1Level = Math.floor(Math.random() * 100) + 1;
        pokemon2Level = Math.floor(Math.random() * 100) + 1;
      }

      const response = await api.post<BattleResult>('/battle/simulate', {
        pokemon1Id,
        pokemon2Id,
        options: {
          generation: options?.generation || 9,
          pokemon1Level,
          pokemon2Level,
          withItems: options?.withItems || false,
          movesetType: options?.movesetType || 'random',
          aiDifficulty: options?.aiDifficulty || 'random'
        }
      });
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
      // Get two random Pokemon IDs (simplified - in real app you'd have better random selection)
      const pokemon1Id = Math.floor(Math.random() * 151) + 1; // Gen 1 Pokemon
      const pokemon2Id = Math.floor(Math.random() * 151) + 1;
      
      // Ensure they're different
      const finalPokemon2Id = pokemon1Id === pokemon2Id ? (pokemon2Id % 151) + 1 : pokemon2Id;
      
      return await this.simulateBattle(pokemon1Id, finalPokemon2Id, battleSettings);
    } catch (error) {
      throw error;
    }
  }

  // Simulate a single battle with turn-by-turn details
  static async simulateSingleBattle(pokemon1Id: number, pokemon2Id: number, options?: {
    levelMode?: 'random' | 'set';
    setLevel?: number;
    generation?: number;
    withItems?: boolean;
    movesetType?: 'random' | 'competitive';
    aiDifficulty?: 'random' | 'elite';
  }): Promise<any> {
    try {
      // Generate levels based on settings
      let pokemon1Level = 50;
      let pokemon2Level = 50;
      
      if (options?.levelMode === 'set' && options.setLevel) {
        pokemon1Level = options.setLevel;
        pokemon2Level = options.setLevel;
      } else if (options?.levelMode === 'random') {
        pokemon1Level = Math.floor(Math.random() * 100) + 1;
        pokemon2Level = Math.floor(Math.random() * 100) + 1;
      }

      const response = await api.post('/battle/simulate-single', {
        pokemon1Id,
        pokemon2Id,
        options: {
          generation: options?.generation || 9,
          pokemon1Level,
          pokemon2Level,
          withItems: options?.withItems || false,
          movesetType: options?.movesetType || 'random',
          aiDifficulty: options?.aiDifficulty || 'random'
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default ApiService;