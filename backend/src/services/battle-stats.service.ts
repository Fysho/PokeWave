import { cacheService } from './cache.service';
import logger from '../utils/logger';

interface BattleStats {
  battleId: string;
  totalAttempts: number;
  successfulAttempts: number;
  successRate: number;
  sumOfGuesses: number; // Sum of all guess percentages for calculating average
  averageGuess: number; // Average guess percentage
  lastUpdated: Date;
}

class BattleStatsService {
  private readonly STATS_PREFIX = 'battle-stats:';
  private readonly STATS_TTL = 86400 * 7; // 7 days
  
  /**
   * Record a guess attempt for a battle
   */
  async recordGuessAttempt(battleId: string, isCorrect: boolean, guessPercentage?: number): Promise<BattleStats> {
    try {
      const statsKey = `${this.STATS_PREFIX}${battleId}`;
      
      // Get existing stats or create new ones
      let stats = await cacheService.get<BattleStats>(statsKey);
      
      if (!stats) {
        stats = {
          battleId,
          totalAttempts: 0,
          successfulAttempts: 0,
          successRate: 0,
          sumOfGuesses: 0,
          averageGuess: 0,
          lastUpdated: new Date()
        };
      }
      
      // Update stats
      stats.totalAttempts += 1;
      if (isCorrect) {
        stats.successfulAttempts += 1;
      }
      stats.successRate = stats.totalAttempts > 0 
        ? (stats.successfulAttempts / stats.totalAttempts) * 100 
        : 0;
      
      // Update average guess if provided
      if (guessPercentage !== undefined) {
        // For existing stats with no sumOfGuesses, initialize it
        if (!stats.sumOfGuesses && stats.totalAttempts > 1) {
          // Estimate previous sum based on current average and previous count
          stats.sumOfGuesses = stats.averageGuess * (stats.totalAttempts - 1);
        }
        
        stats.sumOfGuesses += guessPercentage;
        stats.averageGuess = stats.sumOfGuesses / stats.totalAttempts;
      }
      
      stats.lastUpdated = new Date();
      
      // Save updated stats
      await cacheService.set(statsKey, stats, this.STATS_TTL);
      
      logger.info(`Battle stats updated for ${battleId}`, {
        totalAttempts: stats.totalAttempts,
        successfulAttempts: stats.successfulAttempts,
        successRate: stats.successRate.toFixed(2) + '%',
        averageGuess: stats.averageGuess.toFixed(2) + '%',
        isCorrect
      });
      
      return stats;
    } catch (error) {
      logger.error('Failed to record guess attempt:', error);
      throw error;
    }
  }
  
  /**
   * Get stats for a specific battle
   */
  async getBattleStats(battleId: string): Promise<BattleStats | null> {
    try {
      const statsKey = `${this.STATS_PREFIX}${battleId}`;
      return await cacheService.get<BattleStats>(statsKey);
    } catch (error) {
      logger.error('Failed to get battle stats:', error);
      return null;
    }
  }
  
  /**
   * Get overall statistics across all battles
   */
  async getOverallStats(): Promise<{
    totalBattles: number;
    totalAttempts: number;
    totalSuccesses: number;
    overallSuccessRate: number;
  }> {
    try {
      // This would need to iterate through all stats keys
      // For now, returning placeholder
      return {
        totalBattles: 0,
        totalAttempts: 0,
        totalSuccesses: 0,
        overallSuccessRate: 0
      };
    } catch (error) {
      logger.error('Failed to get overall stats:', error);
      throw error;
    }
  }
}

export const battleStatsService = new BattleStatsService();