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
}

export const pokemonInfoService = new PokemonInfoService();