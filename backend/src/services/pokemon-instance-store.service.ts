import { PokemonInstanceData } from '../types/pokemon-instance.types';
import logger from '../utils/logger';

class PokemonInstanceStore {

  public pokemonInstance1: PokemonInstanceData | null = null;
  public pokemonInstance2: PokemonInstanceData | null = null;


  storeInstances(p1: PokemonInstanceData, p2: PokemonInstanceData)  {
    this.pokemonInstance1 = p1;
    this.pokemonInstance2 = p2;
    logger.info(`Pokemon instance stored!`);
  }
}

// Export singleton instance
export const pokemonInstanceStore = new PokemonInstanceStore();