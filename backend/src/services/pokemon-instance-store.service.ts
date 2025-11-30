import { PokemonInstanceData } from '../types/pokemon-instance.types';
import logger from '../utils/logger';

class PokemonInstanceStore {

  public pokemonInstance1: PokemonInstanceData | null = null;
  public pokemonInstance2: PokemonInstanceData | null = null;
  public generation: number = 9; // Default to Gen 9


  storeInstances(p1: PokemonInstanceData, p2: PokemonInstanceData, generation: number = 9)  {
    this.pokemonInstance1 = p1;
    this.pokemonInstance2 = p2;
    this.generation = generation;
    logger.info(`Pokemon instances stored for Gen ${generation} battle!`);
  }
}

// Export singleton instance
export const pokemonInstanceStore = new PokemonInstanceStore();