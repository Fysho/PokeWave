import logger from '../utils/logger';
import { battleCacheService } from './battle-cache.service';
import type { BattleResult, GuessResult, BattleOptions } from '../types/battle.types';
import type { IBattleService } from './interfaces/battle.service.interface';

/**
 * In-memory implementation of battle service that uses the battle cache
 */
class BattleServiceMemory implements IBattleService {
  // Store active battles in memory
  private activeBattles: Map<string, BattleResult> = new Map();

  async simulateBattle(
    pokemon1Id: number, 
    pokemon2Id: number,
    options?: BattleOptions
  ): Promise<BattleResult> {
    // For in-memory version, we use the pre-cached battles
    const cachedBattle = await battleCacheService.getRandomBattle();
    
    if (!cachedBattle) {
      throw new Error('No cached battles available');
    }
    
    // Convert to BattleResult format
    const battleResult: BattleResult = {
      battleId: cachedBattle.battleId,
      pokemon1: cachedBattle.pokemon1,
      pokemon2: cachedBattle.pokemon2,
      totalBattles: cachedBattle.totalBattles,
      pokemon1Wins: cachedBattle.pokemon1Wins,
      pokemon2Wins: cachedBattle.pokemon2Wins,
      winRate: cachedBattle.winRate,
      executionTime: cachedBattle.executionTime
    };
    
    // Store the battle for guess submission
    this.activeBattles.set(battleResult.battleId, battleResult);
    
    return battleResult;
  }

  async submitGuess(battleId: string, guessPercentage: number): Promise<GuessResult> {
    const battle = this.activeBattles.get(battleId);
    
    if (!battle) {
      // Try to get from cache
      const cachedBattle = await battleCacheService.getCachedBattle(battleId);
      if (!cachedBattle) {
        throw new Error('Battle not found');
      }
      // Convert cached battle to BattleResult format
      const battleResult: BattleResult = {
        battleId: cachedBattle.battleId,
        pokemon1: cachedBattle.pokemon1,
        pokemon2: cachedBattle.pokemon2,
        totalBattles: cachedBattle.totalBattles,
        pokemon1Wins: cachedBattle.pokemon1Wins,
        pokemon2Wins: cachedBattle.pokemon2Wins,
        winRate: cachedBattle.winRate,
        executionTime: cachedBattle.executionTime
      };
      this.activeBattles.set(battleId, battleResult);
      return this.submitGuess(battleId, guessPercentage);
    }

    // Validate guess
    if (guessPercentage < 0 || guessPercentage > 100) {
      throw new Error('Guess percentage must be between 0 and 100');
    }

    const actualWinRate = battle.winRate;
    const accuracy = Math.abs(guessPercentage - actualWinRate);
    const isCorrect = accuracy <= 10; // Within 10% tolerance

    // Calculate points
    let points = 0;
    if (isCorrect) {
      // Base points for correct guess
      points = 20;
      
      // Bonus points for accuracy (max 10 extra points)
      const accuracyBonus = Math.floor((10 - accuracy) * 1);
      points += accuracyBonus;
      
      // Difficulty bonus for close battles (50/50 is hardest)
      const difficultyBonus = Math.floor((50 - Math.abs(50 - actualWinRate)) / 5);
      points += difficultyBonus;
    }

    // Clean up the battle from active battles
    this.activeBattles.delete(battleId);

    const message = isCorrect 
      ? `Great job! You predicted within ${accuracy.toFixed(1)}% accuracy!`
      : `Not quite! You were ${accuracy.toFixed(1)}% off.`;

    return {
      battleId,
      guessPercentage,
      actualWinRate,
      isCorrect,
      accuracy,
      points,
      message
    };
  }

  async getBattle(battleId: string): Promise<BattleResult | null> {
    const battle = this.activeBattles.get(battleId);
    if (battle) {
      return battle;
    }

    // Try to get from cache
    const cachedBattle = await battleCacheService.getCachedBattle(battleId);
    if (!cachedBattle) {
      return null;
    }

    // Convert to BattleResult format
    return {
      battleId: cachedBattle.battleId,
      pokemon1: cachedBattle.pokemon1,
      pokemon2: cachedBattle.pokemon2,
      totalBattles: cachedBattle.totalBattles,
      pokemon1Wins: cachedBattle.pokemon1Wins,
      pokemon2Wins: cachedBattle.pokemon2Wins,
      winRate: cachedBattle.winRate,
      executionTime: cachedBattle.executionTime
    };
  }

  // These methods are not supported in memory mode
  async getPopularBattles(limit: number = 10): Promise<any[]> {
    logger.warn('getPopularBattles is not supported in memory mode');
    return [];
  }

  async getHardestBattles(limit: number = 10): Promise<any[]> {
    logger.warn('getHardestBattles is not supported in memory mode');
    return [];
  }

  async getBattleStats(battleId: string): Promise<any> {
    logger.warn('getBattleStats is not supported in memory mode');
    return null;
  }
}

export const battleServiceMemory = new BattleServiceMemory();