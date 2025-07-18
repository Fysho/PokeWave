import { v4 as uuidv4 } from 'uuid';
import { cacheService } from './cache.service';
import { pokemonService } from './pokemon.service';
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
      // For now, we'll create mock battle results
      // In Phase 2, we'll integrate Pokemon Showdown for real battles
      const battleId = uuidv4();
      
      // Fetch Pokemon data
      const [pokemon1, pokemon2] = await Promise.all([
        pokemonService.getPokemonById(config.pokemon1Id),
        pokemonService.getPokemonById(config.pokemon2Id)
      ]);

      // Mock battle simulation (temporary)
      // This will be replaced with actual Pokemon Showdown integration
      const pokemon1Wins = Math.floor(Math.random() * 600) + 200; // 200-800 wins
      const pokemon2Wins = 1000 - pokemon1Wins;
      const winRate = (pokemon1Wins / 1000) * 100;

      const result: BattleResult = {
        battleId,
        pokemon1: {
          id: pokemon1.id,
          name: pokemon1.name,
          level: config.options?.pokemon1Level || 50,
          wins: pokemon1Wins
        },
        pokemon2: {
          id: pokemon2.id,
          name: pokemon2.name,
          level: config.options?.pokemon2Level || 50,
          wins: pokemon2Wins
        },
        totalBattles: 1000,
        winRate
      };

      // Store the battle result temporarily
      this.activeBattles.set(battleId, result);

      // Also cache it
      await cacheService.set(`battle:${battleId}`, result, 3600); // 1 hour TTL

      logger.info(`Battle ${battleId} simulated`, {
        pokemon1: pokemon1.name,
        pokemon2: pokemon2.name,
        winRate
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
        battle = await cacheService.get<BattleResult>(`battle:${battleId}`);
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