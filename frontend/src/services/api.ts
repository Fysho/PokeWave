import axios from 'axios';
import type { Pokemon, BattleResult, GuessSubmission, GuessResult, ApiError } from '../types/api';

const API_BASE_URL = 'http://localhost:4000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
  static async simulateBattle(pokemon1Id: number, pokemon2Id: number): Promise<BattleResult> {
    try {
      const response = await api.post<BattleResult>('/battle/simulate', {
        pokemon1Id,
        pokemon2Id,
        options: {
          generation: 9,
          pokemon1Level: 50,
          pokemon2Level: 50,
          withItems: false,
          movesetType: 'random',
          aiDifficulty: 'random'
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
  static async generateRandomBattle(): Promise<BattleResult> {
    try {
      // Get two random Pokemon IDs (simplified - in real app you'd have better random selection)
      const pokemon1Id = Math.floor(Math.random() * 151) + 1; // Gen 1 Pokemon
      const pokemon2Id = Math.floor(Math.random() * 151) + 1;
      
      // Ensure they're different
      const finalPokemon2Id = pokemon1Id === pokemon2Id ? (pokemon2Id % 151) + 1 : pokemon2Id;
      
      return await this.simulateBattle(pokemon1Id, finalPokemon2Id);
    } catch (error) {
      throw error;
    }
  }
}

export default ApiService;