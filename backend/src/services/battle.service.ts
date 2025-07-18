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
  };
  pokemon2: {
    id: number;
    name: string;
    level: number;
    wins: number;
  };
  totalBattles: number;
  winRate: number;
}

interface GuessResult {
  actualWinRate: number;
  guessedWinRate: number;
  accuracy: number;
  score: number;
  message: string;
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
          wins: showdownResult.pokemon1.wins
        },
        pokemon2: {
          id: showdownResult.pokemon2.id,
          name: showdownResult.pokemon2.name,
          level: showdownResult.pokemon2.level,
          wins: showdownResult.pokemon2.wins
        },
        totalBattles: showdownResult.totalBattles,
        winRate: showdownResult.winRate
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
      logger.error('Failed to simulate battle:', error);
      throw new ApiError(500, 'Failed to simulate battle');
    }
  }

  async submitGuess(battleId: string, guessedWinRate: number): Promise<GuessResult> {
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

      const actualWinRate = battle.winRate;
      const difference = Math.abs(actualWinRate - guessedWinRate);
      const accuracy = 100 - difference;

      // Calculate score (lower is better, like golf)
      // Perfect guess = 0 points, worst guess = 100 points
      const score = Math.round(difference);

      // Generate feedback message
      let message: string;
      if (difference === 0) {
        message = 'Perfect! You nailed it exactly!';
      } else if (difference <= 5) {
        message = 'Excellent! Very close guess!';
      } else if (difference <= 10) {
        message = 'Great job! Pretty accurate!';
      } else if (difference <= 20) {
        message = 'Good effort! Not too far off.';
      } else if (difference <= 30) {
        message = 'Nice try! Room for improvement.';
      } else {
        message = 'Keep practicing! You\'ll get better!';
      }

      // Clean up the battle from active battles
      this.activeBattles.delete(battleId);

      return {
        actualWinRate,
        guessedWinRate,
        accuracy,
        score,
        message
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Failed to submit guess:', error);
      throw new ApiError(500, 'Failed to submit guess');
    }
  }
}

export const battleService = new BattleService();