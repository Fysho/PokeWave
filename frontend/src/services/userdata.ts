import { api } from './api';

interface PokedexData {
  unlockedPokemon: number[];
  unlockedShinyPokemon: number[];
  pokemonCounts?: [number, number][] | { [key: string]: number };
  shinyPokemonCounts?: [number, number][] | { [key: string]: number };
}

interface GameStats {
  totalBattles: number;
  totalCorrectGuesses: number;
  highestStreak: number;
  endlessHighScore: number;
  dailyChallengeScores: { [date: string]: number };
}

interface UserData {
  id: string;
  username: string;
  createdAt: string;
  avatarPokemonId?: number;
  avatarSprite?: string;
  pokedex: PokedexData;
  gameStats: GameStats;
  lastUpdated?: string;
}

class UserDataService {
  static async getUserData(): Promise<UserData> {
    try {
      const response = await api.get<UserData>('/user/me');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user data');
    }
  }

  static async syncPokedex(pokedexData: PokedexData): Promise<PokedexData> {
    try {
      const response = await api.post('/user/pokedex/sync', pokedexData);
      return response.data.pokedex;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to sync pokedex');
    }
  }

  static async syncGameStats(gameStats: Partial<GameStats>): Promise<GameStats> {
    try {
      const response = await api.post('/user/stats/sync', gameStats);
      return response.data.gameStats;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to sync game stats');
    }
  }

  static async unlockPokemon(pokemonId: number, isShiny: boolean = false): Promise<PokedexData> {
    try {
      const response = await api.post('/user/pokedex/unlock', { pokemonId, isShiny });
      return response.data.pokedex;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to unlock Pokemon');
    }
  }

  // Helper to convert Pokedex store format to API format
  static convertPokedexToApiFormat(
    unlockedPokemon: Set<number>,
    unlockedShinyPokemon: Set<number>,
    pokemonCounts: Map<number, number>,
    shinyPokemonCounts: Map<number, number>
  ): PokedexData {
    return {
      unlockedPokemon: Array.from(unlockedPokemon),
      unlockedShinyPokemon: Array.from(unlockedShinyPokemon),
      pokemonCounts: Array.from(pokemonCounts),
      shinyPokemonCounts: Array.from(shinyPokemonCounts)
    };
  }

  // Helper to convert API format to Pokedex store format
  static convertApiToPokedexFormat(data: PokedexData) {
    // Helper function to convert object or array to Map
    const toMap = (counts: any): Map<number, number> => {
      if (!counts) return new Map();
      
      // If it's already an array of tuples, use it directly
      if (Array.isArray(counts)) {
        return new Map(counts);
      }
      
      // If it's an object, convert to array of tuples
      if (typeof counts === 'object') {
        const entries = Object.entries(counts).map(([key, value]) => [
          parseInt(key, 10),
          value as number
        ]);
        return new Map(entries as [number, number][]);
      }
      
      return new Map();
    };

    return {
      unlockedPokemon: new Set(data.unlockedPokemon || []),
      unlockedShinyPokemon: new Set(data.unlockedShinyPokemon || []),
      pokemonCounts: toMap(data.pokemonCounts),
      shinyPokemonCounts: toMap(data.shinyPokemonCounts)
    };
  }
}

export default UserDataService;