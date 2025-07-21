// This service delegates all battle simulation to the real Pokemon Showdown engine
// No custom simulation is performed here - all battles go through Showdown for accuracy

import { pokemonShowdownService } from './pokemon-showdown.service';
import { PokemonInstanceData } from '../types/pokemon-instance.types';
import {pokemonInstanceStore} from "./pokemon-instance-store.service";
import logger from "../utils/logger";

export interface ShowdownBattleConfig {
  pokemon1: PokemonInstanceData;
  pokemon2: PokemonInstanceData;
  generation: number;
}

export interface ShowdownBattleResult {
  battleId: string;
  pokemon1Wins: number;
  pokemon2Wins: number;
  totalBattles: number;
  executionTime: number;
}

class ShowdownService {
  //private storedPokemon1: PokemonInstanceData | null = null;
  //private storedPokemon2: PokemonInstanceData | null = null;
  private storedGeneration: number = 1;

  async simulateBattle(): Promise<ShowdownBattleResult> {
    if (!pokemonInstanceStore.pokemonInstance1 || !pokemonInstanceStore.pokemonInstance2) {
      throw new Error('No Pokemon stored for battle. Call storeInstances on pokemonInstanceStore first.');
    }
    return pokemonShowdownService.simulateMultipleBattles({
      pokemon1: pokemonInstanceStore.pokemonInstance1,
      pokemon2: pokemonInstanceStore.pokemonInstance2,
      generation: this.storedGeneration
    });
  }

  async simulateSingleBattle(): Promise<any> {
    if (!pokemonInstanceStore.pokemonInstance1 || !pokemonInstanceStore.pokemonInstance2) {
      throw new Error('No Pokemon stored for battle. Call storeInstances on pokemonInstanceStore first.');
    }
    logger.info("Test")

    return pokemonShowdownService.simulateSingleBattleTester({
      pokemon1: pokemonInstanceStore.pokemonInstance1,
      pokemon2: pokemonInstanceStore.pokemonInstance2,
      generation: this.storedGeneration
    });  }

}

export const showdownService = new ShowdownService();