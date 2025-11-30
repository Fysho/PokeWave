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
  draws: number;
  totalBattles: number;
  executionTime: number;
}

class ShowdownService {
  async simulateBattle(): Promise<ShowdownBattleResult> {
    if (!pokemonInstanceStore.pokemonInstance1 || !pokemonInstanceStore.pokemonInstance2) {
      throw new Error('No Pokemon stored for battle. Call storeInstances on pokemonInstanceStore first.');
    }

    const generation = pokemonInstanceStore.generation;
    logger.info(`Simulating battle with Gen ${generation} mechanics`);

    return pokemonShowdownService.simulateMultipleBattles({
      pokemon1: pokemonInstanceStore.pokemonInstance1,
      pokemon2: pokemonInstanceStore.pokemonInstance2,
      generation: generation
    });
  }

  async simulateSingleBattle(): Promise<any> {
    if (!pokemonInstanceStore.pokemonInstance1 || !pokemonInstanceStore.pokemonInstance2) {
      throw new Error('No Pokemon stored for battle. Call storeInstances on pokemonInstanceStore first.');
    }

    const generation = pokemonInstanceStore.generation;
    logger.info(`Simulating single battle tester with Gen ${generation} mechanics`);

    return pokemonShowdownService.simulateSingleBattleTester({
      pokemon1: pokemonInstanceStore.pokemonInstance1,
      pokemon2: pokemonInstanceStore.pokemonInstance2,
      generation: generation
    });
  }

}

export const showdownService = new ShowdownService();