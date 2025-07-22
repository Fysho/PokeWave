import axios from 'axios';
import { cacheService } from './cache.service';
import logger from '../utils/logger';
import { ApiError } from '../middleware/error.middleware';
import { pokemonShowdownService } from './pokemon-showdown.service';
import { GetRandomPokemonWithInstancesResponse, RandomPokemonSettings } from '../types/pokemon-instance.types';
import { pokemonInstanceStore } from './pokemon-instance-store.service';

interface PokemonSprites {
  front: string;
  back: string;
  shiny: string;
}

const GENERATION_RANGES: Record<number, { start: number; end: number }> = {
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

  async getPokedexData(generation?: number): Promise<any[]> {
    try {
      // Check cache first
      const cacheKey = generation ? `pokedex:gen${generation}` : 'pokedex:all';
      const cached = await cacheService.get<any[]>(cacheKey);
      if (cached) {
        logger.info(`Pokedex data found in cache for ${cacheKey}`);
        return cached;
      }

      const pokedexData = [];
      
      // Determine range based on generation
      let startId = 1;
      let endId = 1025;
      
      if (generation && GENERATION_RANGES[generation]) {
        startId = GENERATION_RANGES[generation].start;
        endId = GENERATION_RANGES[generation].end;
      }
      
      // Get basic data for all Pokemon in range
      // Batch fetching for better performance
      const pokemonPromises = [];
      const spritePromises = [];
      const validIds = [];
      
      for (let id = startId; id <= endId; id++) {
        pokemonPromises.push(
          pokemonShowdownService.createPokemonInstance(id, 50, generation || 9, 'none')
            .then(instance => {
              validIds.push(id);
              return {
                num: instance.id,
                name: instance.name,
                types: instance.types
              };
            })
            .catch(() => null) // Skip non-existent Pokemon
        );
      }
      
      // Wait for all Pokemon data
      const pokemonResults = await Promise.all(pokemonPromises);
      const pokemonList = pokemonResults.filter(p => p !== null);
      
      // Now fetch sprites for valid Pokemon only
      validIds.forEach(id => {
        spritePromises.push(this.getPokemonSprites(id));
      });
      
      // Fetch all sprites in parallel
      const sprites = await Promise.all(spritePromises);
      
      // Combine data
      for (let i = 0; i < pokemonList.length; i++) {
        const pokemon = pokemonList[i];
        pokedexData.push({
          id: pokemon.num,
          name: pokemon.name,
          types: pokemon.types,
          sprite: sprites[i].front
        });
      }
      
      // Cache for 7 days since Pokemon data rarely changes
      await cacheService.set(cacheKey, pokedexData, 7 * 24 * 60 * 60);
      
      return pokedexData;
    } catch (error) {
      logger.error('Error getting Pokedex data:', error);
      throw new ApiError(500, 'Failed to get Pokedex data');
    }
  }

  async getPokemonDataById(id: number): Promise<any> {
    try {
      // Use createPokemonInstance to get Pokemon data
      const pokemonInstance = await pokemonShowdownService.createPokemonInstance(id, 50, 9, 'none');
      const sprites = await this.getPokemonSprites(id);
      
      return {
        id: pokemonInstance.id,
        name: pokemonInstance.name,
        types: pokemonInstance.types,
        sprite: sprites.front,
        sprites,
        baseStats: pokemonInstance.baseStats,
        abilities: [pokemonInstance.ability]
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error(`Error getting Pokemon ${id}:`, error);
      throw new ApiError(500, `Failed to get Pokemon ${id}`);
    }
  }

  async getPokemonSprites(id: number): Promise<PokemonSprites> {
    try {
      // Check cache first
      const cached = await cacheService.get<PokemonSprites>(`pokemon-sprites:${id}`);
      if (cached) {
        logger.info(`Pokemon sprites ${id} found in cache`);
        return cached;
      }

      // Fetch sprites only from PokeAPI
      logger.info(`Fetching Pokemon sprites ${id} from PokeAPI`);
      const response = await axios.get(`${this.pokeApiUrl}/pokemon/${id}`);
      const data = response.data;

      const sprites: PokemonSprites = {
        front: data.sprites.front_default,
        back: data.sprites.back_default,
        shiny: data.sprites.front_shiny
      };

      // Cache for 24 hours
      await cacheService.set(`pokemon-sprites:${id}`, sprites, 86400);

      return sprites;
    } catch (error) {
      logger.error('Failed to fetch Pokemon sprites:', error);
      throw new ApiError(500, 'Failed to fetch Pokemon sprites');
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

  async getRandomPokemonWithInstances(settings: RandomPokemonSettings = {}): Promise<GetRandomPokemonWithInstancesResponse> {
    try {
      // Apply default settings
      const generation = settings.generation || 1;
      const levelMode = settings.levelMode || 'fixed';
      const itemMode = settings.itemMode || 'random';
      
      // Get random Pokemon IDs
      const { pokemon1Id, pokemon2Id } = this.getRandomPokemonIds(generation);
      
      let pokemon1Level: number;
      let pokemon2Level: number;
      
      if (levelMode === 'random') {
        // Generate random levels within the specified range
        const minLevel = settings.minLevel || 1;
        const maxLevel = settings.maxLevel || 100;
        
        // Validate level range
        if (minLevel < 1 || minLevel > 100 || maxLevel < 1 || maxLevel > 100 || minLevel > maxLevel) {
          throw new ApiError(400, 'Invalid level range. Levels must be between 1-100 and minLevel <= maxLevel');
        }
        
        pokemon1Level = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;
        pokemon2Level = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;
        
        logger.info(`Creating Pokemon instances with random levels: ${pokemon1Level} and ${pokemon2Level}`);
      } else {
        // Use fixed level
        const fixedLevel = settings.level || 50;
        
        // Validate fixed level
        if (fixedLevel < 1 || fixedLevel > 100) {
          throw new ApiError(400, 'Invalid level. Must be between 1 and 100');
        }
        
        pokemon1Level = fixedLevel;
        pokemon2Level = fixedLevel;
        
        logger.info(`Creating Pokemon instances at fixed level ${fixedLevel}`);
      }
      
      logger.info(`Creating Pokemon instances for IDs ${pokemon1Id} (Lv.${pokemon1Level}) and ${pokemon2Id} (Lv.${pokemon2Level})`);
      
      // Create Pokemon instances with full data
      const [pokemon1Instance, pokemon2Instance] = await Promise.all([
        pokemonShowdownService.createPokemonInstance(pokemon1Id, pokemon1Level, generation, itemMode),
        pokemonShowdownService.createPokemonInstance(pokemon2Id, pokemon2Level, generation, itemMode)
      ]);
      
      logger.info(`Successfully created Pokemon instances: ${pokemon1Instance.name} (Lv.${pokemon1Level}) vs ${pokemon2Instance.name} (Lv.${pokemon2Level})`);
      
      // Store the instances and get their IDs
      pokemonInstanceStore.storeInstances(pokemon1Instance, pokemon2Instance);


      return {
        pokemon1: pokemon1Instance,
        pokemon2: pokemon2Instance,
        generation,
      };
    } catch (error) {
      logger.error('Failed to create random Pokemon instances:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to create random Pokemon instances');
    }
  }
}

export const pokemonService = new PokemonService();