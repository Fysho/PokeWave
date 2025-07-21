// This service delegates all battle simulation to the real Pokemon Showdown engine
// No custom simulation is performed here - all battles go through Showdown for accuracy

import { pokemonShowdownService } from './pokemon-showdown.service';

export interface ShowdownBattleConfig {
  pokemon1Id: number;
  pokemon2Id: number;
  options?: {
    generation?: number;
    pokemon1Level?: number;
    pokemon2Level?: number;
    withItems?: boolean;
    movesetType?: 'random' | 'competitive';
    aiDifficulty?: 'random' | 'elite';
    pokemon1Instance?: any;
    pokemon2Instance?: any;
  };
}

export interface ShowdownBattleResult {
  battleId: string;
  pokemon1: {
    id: number;
    name: string;
    level: number;
    wins: number;
    types: string[];
    sprites: {
      front: string;
      back: string;
      shiny: string;
    };
    moves: string[];
    stats: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
    ability?: string;
    item?: string;
  };
  pokemon2: {
    id: number;
    name: string;
    level: number;
    wins: number;
    types: string[];
    sprites: {
      front: string;
      back: string;
      shiny: string;
    };
    moves: string[];
    stats: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
    ability?: string;
    item?: string;
  };
  totalBattles: number;
  winRate: number;
  executionTime: number;
}

class ShowdownService {
  // All battle simulation is delegated to Pokemon Showdown
  async simulateBattle(config: ShowdownBattleConfig): Promise<ShowdownBattleResult> {
    return pokemonShowdownService.simulateBattle(config);
  }

  async simulateSingleBattle(config: ShowdownBattleConfig): Promise<any> {
    return pokemonShowdownService.simulateSingleBattle(config);
  }
}

export const showdownService = new ShowdownService();