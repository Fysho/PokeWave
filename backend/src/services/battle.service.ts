import { cacheService } from './cache.service';
import { showdownService } from './showdown.service';
import logger from '../utils/logger';
import { ApiError } from '../middleware/error.middleware';

interface BattleConfig {
  pokemon1Id: number;
  pokemon2Id: number;
  options?: {
    generation?: number;
    pokemon1Level?: number;
    pokemon2Level?: number;
    withItems?: boolean;
    movesetType?: 'random' | 'competitive';
    aiDifficulty?: 'random' | 'elite';
  };
}

interface BattleResult {
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

interface GuessResult {
  battleId: string;
  guessPercentage: number;
  actualWinRate: number;
  isCorrect: boolean;
  accuracy: number;
  points: number;
  message: string;
  pokemon1Won: boolean;
}

class BattleService {
  private activeBattles = new Map<string, BattleResult>();

  async simulateBattle(config: BattleConfig): Promise<BattleResult> {
    try {
      // Use Pokemon Showdown for real battle simulation
      const showdownResult = await showdownService.simulateBattle(config);

      const result: BattleResult = {
        battleId: showdownResult.battleId,
        pokemon1: {
          id: showdownResult.pokemon1.id,
          name: showdownResult.pokemon1.name,
          level: showdownResult.pokemon1.level,
          wins: showdownResult.pokemon1.wins,
          types: showdownResult.pokemon1.types,
          sprites: showdownResult.pokemon1.sprites,
          moves: showdownResult.pokemon1.moves,
          stats: showdownResult.pokemon1.stats,
          ability: showdownResult.pokemon1.ability,
          item: showdownResult.pokemon1.item
        },
        pokemon2: {
          id: showdownResult.pokemon2.id,
          name: showdownResult.pokemon2.name,
          level: showdownResult.pokemon2.level,
          wins: showdownResult.pokemon2.wins,
          types: showdownResult.pokemon2.types,
          sprites: showdownResult.pokemon2.sprites,
          moves: showdownResult.pokemon2.moves,
          stats: showdownResult.pokemon2.stats,
          ability: showdownResult.pokemon2.ability,
          item: showdownResult.pokemon2.item
        },
        totalBattles: showdownResult.totalBattles,
        winRate: showdownResult.winRate,
        executionTime: showdownResult.executionTime
      };

      // Store the battle result temporarily
      this.activeBattles.set(result.battleId, result);

      // Also cache it
      await cacheService.set(`battle:${result.battleId}`, result, 3600); // 1 hour TTL

      logger.info(`Battle ${result.battleId} simulated with Showdown`, {
        pokemon1: result.pokemon1.name,
        pokemon2: result.pokemon2.name,
        winRate: result.winRate,
        executionTime: `${showdownResult.executionTime}ms`
      });

      return result;
    } catch (error) {
      logger.error('Failed to simulate battle:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        config
      });
      throw new ApiError(500, 'Failed to simulate battle');
    }
  }

  async submitGuess(battleId: string, guessPercentage: number): Promise<GuessResult> {
    try {
      // Check active battles first
      let battle = this.activeBattles.get(battleId);

      // If not in memory, check cache
      if (!battle) {
        const cachedBattle = await cacheService.get<BattleResult>(`battle:${battleId}`);
        if (cachedBattle) {
          battle = cachedBattle;
        }
      }

      if (!battle) {
        throw new ApiError(404, 'Battle not found');
      }

      // Calculate the actual win rate for Pokemon 1
      const actualWinRate = (battle.pokemon1.wins / battle.totalBattles) * 100;
      
      // Check if the guess is within 10% of the actual win rate
      const accuracy = Math.abs(actualWinRate - guessPercentage);
      const isCorrect = accuracy <= 10;
      
      // Determine which Pokemon won
      const pokemon1Won = battle.pokemon1.wins > battle.pokemon2.wins;

      // Calculate points based on accuracy
      let points = 0;
      if (isCorrect) {
        // Base points for being within 10%
        points = 20;
        
        // Bonus points for being closer (up to 30 extra points)
        const accuracyBonus = Math.round((10 - accuracy) * 3);
        points += accuracyBonus;
        
        // Extra bonus for very close battles (near 50/50)
        const battleDifficulty = Math.abs(actualWinRate - 50);
        if (battleDifficulty <= 10) {
          points += 10; // Hard battle bonus
        } else if (battleDifficulty <= 20) {
          points += 5; // Medium battle bonus
        }
      }

      // Generate feedback message
      let message: string;
      if (isCorrect) {
        if (accuracy <= 2) {
          message = `Amazing! You were only ${accuracy.toFixed(1)}% off! ${battle.pokemon1.name} won ${actualWinRate.toFixed(1)}% of the battles.`;
        } else if (accuracy <= 5) {
          message = `Excellent! You were ${accuracy.toFixed(1)}% off. ${battle.pokemon1.name} won ${actualWinRate.toFixed(1)}% of the battles.`;
        } else {
          message = `Good job! You were ${accuracy.toFixed(1)}% off. ${battle.pokemon1.name} won ${actualWinRate.toFixed(1)}% of the battles.`;
        }
      } else {
        message = `Not quite! You were ${accuracy.toFixed(1)}% off. ${battle.pokemon1.name} actually won ${actualWinRate.toFixed(1)}% of the battles. You need to be within 10% to score points.`;
      }

      // Clean up the battle from active battles
      this.activeBattles.delete(battleId);

      return {
        battleId,
        guessPercentage,
        actualWinRate,
        isCorrect,
        accuracy,
        points,
        message,
        pokemon1Won
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Failed to submit guess:', error);
      throw new ApiError(500, 'Failed to submit guess');
    }
  }

  async simulateSingleBattle(config: BattleConfig): Promise<any> {
    try {
      logger.info('🎮 Battle Tester: BattleService received single battle request', {
        pokemon1Id: config.pokemon1Id,
        pokemon2Id: config.pokemon2Id,
        options: config.options
      });
      
      const result = await showdownService.simulateSingleBattle(config);
      
      logger.info('🎮 Battle Tester: BattleService returning result', {
        winner: result.winner,
        totalTurns: result.totalTurns
      });
      
      return result;
    } catch (error) {
      logger.error('🎮 Battle Tester: Failed to simulate single battle:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        config
      });
      throw new ApiError(500, `Failed to simulate single battle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const battleService = new BattleService();