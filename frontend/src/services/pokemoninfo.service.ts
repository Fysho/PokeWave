import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface PokemonInfo {
  id: number;
  name: string;
  types: string[];
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  abilities: {
    primary: string;
    secondary?: string;
    hidden?: string;
  };
  levelUpMoves: Array<{
    level: number;
    move: string;
  }>;
  sprites: {
    front: string;
    back: string;
    shiny: string;
  };
  generation: number;
}

export interface StatValues {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface PokemonInstance {
  id: number;
  name: string;
  level: number;
  types: string[];
  ability: string;
  moves: string[];
  stats: StatValues;
  baseStats: StatValues;
  ivs: StatValues;
  evs: StatValues;
  sprites: {
    front: string;
    back: string;
    shiny: string;
  };
}

export interface CreatePokemonInstanceRequest {
  pokemonId: number;
  level: number;
  ivs?: Partial<StatValues>;
  evs?: Partial<StatValues>;
  generation?: number;
}

class PokemonInfoService {
  /**
   * Get comprehensive Pokemon information
   * @param pokemonId - Pokemon ID (National Dex number)
   * @param generation - Generation number (1-9), defaults to 9
   * @returns Pokemon information including stats, types, abilities, and moves
   */
  async getPokemonInfo(pokemonId: number, generation?: number): Promise<PokemonInfo> {
    try {
      const params = generation ? { generation } : {};
      const response = await axios.get<PokemonInfo>(
        `${API_BASE_URL}/pokemoninfo/${pokemonId}`,
        { params }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to fetch Pokemon information');
      }
      throw error;
    }
  }

  /**
   * Get Pokemon information for multiple Pokemon
   * @param pokemonIds - Array of Pokemon IDs
   * @param generation - Generation number (1-9), defaults to 9
   * @returns Array of Pokemon information
   */
  async getMultiplePokemonInfo(pokemonIds: number[], generation?: number): Promise<PokemonInfo[]> {
    const promises = pokemonIds.map(id => this.getPokemonInfo(id, generation));
    return Promise.all(promises);
  }

  /**
   * Get base stat total for a Pokemon
   * @param pokemonId - Pokemon ID
   * @returns Total of all base stats
   */
  async getBaseStatTotal(pokemonId: number): Promise<number> {
    const info = await this.getPokemonInfo(pokemonId);
    const stats = info.baseStats;
    return stats.hp + stats.attack + stats.defense + 
           stats.specialAttack + stats.specialDefense + stats.speed;
  }

  /**
   * Create a Pokemon instance with calculated stats
   * @param request - Pokemon instance configuration
   * @returns Pokemon instance with calculated stats, moves, and ability
   */
  async createPokemonInstance(request: CreatePokemonInstanceRequest): Promise<PokemonInstance> {
    try {
      const response = await axios.post<PokemonInstance>(
        `${API_BASE_URL}/pokemoninstance`,
        request
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to create Pokemon instance');
      }
      throw error;
    }
  }

  /**
   * Create a perfect IV Pokemon instance
   * @param pokemonId - Pokemon ID
   * @param level - Pokemon level
   * @param generation - Generation number (defaults to 9)
   * @returns Pokemon instance with perfect IVs
   */
  async createPerfectPokemon(pokemonId: number, level: number, generation?: number): Promise<PokemonInstance> {
    return this.createPokemonInstance({
      pokemonId,
      level,
      generation,
      ivs: {
        hp: 31,
        attack: 31,
        defense: 31,
        specialAttack: 31,
        specialDefense: 31,
        speed: 31
      }
    });
  }

  /**
   * Create a competitive Pokemon instance with custom EVs
   * @param pokemonId - Pokemon ID
   * @param level - Pokemon level
   * @param evSpread - EV distribution
   * @param generation - Generation number (defaults to 9)
   * @returns Pokemon instance with competitive EVs
   */
  async createCompetitivePokemon(
    pokemonId: number, 
    level: number, 
    evSpread: Partial<StatValues>,
    generation?: number
  ): Promise<PokemonInstance> {
    return this.createPokemonInstance({
      pokemonId,
      level,
      generation,
      evs: evSpread
    });
  }
}

export const pokemonInfoService = new PokemonInfoService();