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
  };
  totalBattles: number;
  winRate: number;
  executionTime: number;
}

interface GuessResult {
  battleId: string;
  guess: number;
  correctAnswer: number;
  isCorrect: boolean;
  winRate: number;
  points: number;
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
          wins: showdownResult.pokemon1.wins,
          types: showdownResult.pokemon1.types,
          sprites: showdownResult.pokemon1.sprites
        },
        pokemon2: {
          id: showdownResult.pokemon2.id,
          name: showdownResult.pokemon2.name,
          level: showdownResult.pokemon2.level,
          wins: showdownResult.pokemon2.wins,
          types: showdownResult.pokemon2.types,
          sprites: showdownResult.pokemon2.sprites
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
      logger.error('Failed to simulate battle:', error);
      throw new ApiError(500, 'Failed to simulate battle');
    }
  }

  async submitGuess(battleId: string, guess: number): Promise<GuessResult> {
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

      // Validate that the guess is one of the two Pokemon in the battle
      if (guess !== battle.pokemon1.id && guess !== battle.pokemon2.id) {
        throw new ApiError(400, 'Guess must be the ID of one of the Pokemon in the battle');
      }

      // Determine the correct answer (the Pokemon with more wins)
      const correctAnswer = battle.pokemon1.wins > battle.pokemon2.wins 
        ? battle.pokemon1.id 
        : battle.pokemon2.id;

      const isCorrect = guess === correctAnswer;

      // Calculate points based on correctness and win rate margin
      let points = 0;
      if (isCorrect) {
        // Award more points for correctly guessing closer battles
        const winRateMargin = Math.abs(battle.winRate - 50); // How close to 50/50
        const difficultyBonus = Math.max(1, Math.round(10 - (winRateMargin / 5))); // 1-10 points
        points = 10 + difficultyBonus; // Base 10 points + difficulty bonus
      }

      // Generate feedback message
      let message: string;
      if (isCorrect) {
        const winRateMargin = Math.abs(battle.winRate - 50);
        if (winRateMargin <= 5) {
          message = `Excellent! You correctly picked the winner in a very close battle (${battle.winRate.toFixed(1)}% win rate)!`;
        } else if (winRateMargin <= 15) {
          message = `Great job! You correctly identified the winner!`;
        } else {
          message = `Correct! That was a relatively easy one to predict.`;
        }
      } else {
        const winnerName = correctAnswer === battle.pokemon1.id ? battle.pokemon1.name : battle.pokemon2.name;
        message = `Wrong! ${winnerName} actually won ${battle.winRate.toFixed(1)}% of the battles.`;
      }

      // Clean up the battle from active battles
      this.activeBattles.delete(battleId);

      return {
        battleId,
        guess,
        correctAnswer,
        isCorrect,
        winRate: battle.winRate,
        points,
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