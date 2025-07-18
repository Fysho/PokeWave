import axios from 'axios';
import { cacheService } from './cache.service';
import logger from '../utils/logger';
import { ApiError } from '../middleware/error.middleware';

interface Pokemon {
  id: number;
  name: string;
  types: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  abilities: string[];
  sprites: {
    front: string;
    back: string;
    shiny: string;
  };
}

const GENERATION_RANGES = {
  1: { start: 1, end: 151 },
  2: { start: 152, end: 251 },
  3: { start: 252, end: 386 },
  4: { start: 387, end: 493 },
  5: { start: 494, end: 649 },
  6: { start: 650, end: 721 },
  7: { start: 722, end: 809 },
  8: { start: 810, end: 905 },
  9: { start: 906, end: 1025 }
};

class PokemonService {
  private pokeApiUrl = 'https://pokeapi.co/api/v2';

  async getPokemonById(id: number): Promise<Pokemon> {
    try {
      // Check cache first
      const cached = await cacheService.get(`pokemon:${id}`);
      if (cached) {
        logger.info(`Pokemon ${id} found in cache`);
        return cached;
      }

      // Fetch from PokeAPI
      logger.info(`Fetching Pokemon ${id} from PokeAPI`);
      const response = await axios.get(`${this.pokeApiUrl}/pokemon/${id}`);
      const data = response.data;

      const pokemon: Pokemon = {
        id: data.id,
        name: data.name,
        types: data.types.map((t: any) => t.type.name),
        stats: {
          hp: data.stats[0].base_stat,
          attack: data.stats[1].base_stat,
          defense: data.stats[2].base_stat,
          specialAttack: data.stats[3].base_stat,
          specialDefense: data.stats[4].base_stat,
          speed: data.stats[5].base_stat
        },
        abilities: data.abilities.map((a: any) => a.ability.name),
        sprites: {
          front: data.sprites.front_default,
          back: data.sprites.back_default,
          shiny: data.sprites.front_shiny
        }
      };

      // Cache for 24 hours
      await cacheService.set(`pokemon:${id}`, pokemon, 86400);

      return pokemon;
    } catch (error) {
      logger.error('Failed to fetch Pokemon:', error);
      throw new ApiError(500, 'Failed to fetch Pokemon data');
    }
  }

  getRandomPokemonIds(generation: number = 9): { pokemon1Id: number; pokemon2Id: number; generation: number } {
    const range = GENERATION_RANGES[generation as keyof typeof GENERATION_RANGES] || GENERATION_RANGES[9];
    
    const pokemon1Id = Math.floor(Math.random() * (range.end - range.start + 1)) + range.start;
    let pokemon2Id = Math.floor(Math.random() * (range.end - range.start + 1)) + range.start;
    
    // Ensure we don't get the same Pokemon twice
    while (pokemon2Id === pokemon1Id) {
      pokemon2Id = Math.floor(Math.random() * (range.end - range.start + 1)) + range.start;
    }

    return { pokemon1Id, pokemon2Id, generation };
  }
}

export const pokemonService = new PokemonService();