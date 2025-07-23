import { api } from './api';

interface PokedexData {
  unlockedPokemon: number[];
  unlockedShinyPokemon: number[];
  pokemonCounts: [number, number][];
  shinyPokemonCounts: [number, number][];
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
    return {
      unlockedPokemon: new Set(data.unlockedPokemon),
      unlockedShinyPokemon: new Set(data.unlockedShinyPokemon),
      pokemonCounts: new Map(data.pokemonCounts),
      shinyPokemonCounts: new Map(data.shinyPokemonCounts)
    };
  }
}

export default UserDataService;