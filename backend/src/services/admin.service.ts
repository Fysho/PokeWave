import { getUserService } from './service-factory';
import { leaderboardService } from './leaderboard.service';
import { dailyChallengeService } from './daily-challenge.service';
import { battleCacheService } from './battle-cache.service';
import { cacheService } from './cache.service';
import logger from '../utils/logger';

interface UserOverview {
  id: string;
  username: string;
  createdAt: string;
  avatarPokemonId?: number;
  avatarSprite?: string;
  lastUpdated?: string;
  stats?: {
    totalBattles: number;
    totalCorrectGuesses: number;
    highestStreak: number;
    endlessHighScore: number;
  };
  pokedexCount?: {
    unlocked: number;
    shiny: number;
  };
}

interface GameAnalytics {
  totalUsers: number;
  totalBattlesPlayed: number;
  totalCorrectGuesses: number;
  averageAccuracy: number;
  averageStreak: number;
  totalEndlessRuns: number;
  averageEndlessScore: number;
  topEndlessScore: number;
  activeUsersToday: number;
  activeUsersWeek: number;
}

interface PokedexInsights {
  totalUnlocks: number;
  totalShinyUnlocks: number;
  averageUnlocksPerUser: number;
  averageShinyPerUser: number;
  mostUnlockedPokemon: { id: number; name: string; count: number }[];
  leastUnlockedPokemon: { id: number; name: string; count: number }[];
  shinyRankings: { id: number; name: string; count: number }[];
  completionRates: {
    under25: number;
    under50: number;
    under75: number;
    complete: number;
  };
}

interface BattleStatistics {
  totalBattlesSimulated: number;
  averageWinRate: number;
  winRateDistribution: { range: string; count: number }[];
  averageExecutionTime: number;
  cachedBattleCount: number;
  recentBattles: {
    id: string;
    pokemon1: string;
    pokemon2: string;
    winRate: number;
    timestamp: string;
  }[];
}

interface SystemHealth {
  uptime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  redisConnected: boolean;
  battleCacheSize: number;
  battleCacheTarget: number;
  dailyChallengesActive: number;
  serverTime: string;
  nodeVersion: string;
  environment: string;
}

interface DailyChallengeStats {
  totalChallenges: number;
  availableDates: string[];
  todaysChallenge?: {
    date: string;
    battlesCount: number;
    averageWinRate: number;
  };
  completionStats?: {
    totalAttempts: number;
    averageScore: number;
  };
}

interface LeaderboardPlayer {
  userId: string;
  username: string;
  avatarPokemonId?: number;
  avatarSprite?: string;
  highScore: number;
  lastPlayed: string;
  totalRuns: number;
}

interface RecentActivity {
  id: string;
  userId: string;
  username: string;
  avatarPokemonId?: number;
  avatarSprite?: string;
  score: number;
  timestamp: string;
}

interface LeaderboardManagementData {
  topPlayers: LeaderboardPlayer[];
  totalPlayers: number;
  totalRuns: number;
  recentActivity: RecentActivity[];
  suspiciousScores: LeaderboardPlayer[];
  averageHighScore: number;
}

// Pokemon name lookup (simplified - first 151 for demo)
const pokemonNames: { [key: number]: string } = {
  1: 'Bulbasaur', 2: 'Ivysaur', 3: 'Venusaur', 4: 'Charmander', 5: 'Charmeleon',
  6: 'Charizard', 7: 'Squirtle', 8: 'Wartortle', 9: 'Blastoise', 10: 'Caterpie',
  11: 'Metapod', 12: 'Butterfree', 13: 'Weedle', 14: 'Kakuna', 15: 'Beedrill',
  16: 'Pidgey', 17: 'Pidgeotto', 18: 'Pidgeot', 19: 'Rattata', 20: 'Raticate',
  21: 'Spearow', 22: 'Fearow', 23: 'Ekans', 24: 'Arbok', 25: 'Pikachu',
  26: 'Raichu', 27: 'Sandshrew', 28: 'Sandslash', 29: 'Nidoran♀', 30: 'Nidorina',
  31: 'Nidoqueen', 32: 'Nidoran♂', 33: 'Nidorino', 34: 'Nidoking', 35: 'Clefairy',
  36: 'Clefable', 37: 'Vulpix', 38: 'Ninetales', 39: 'Jigglypuff', 40: 'Wigglytuff',
  41: 'Zubat', 42: 'Golbat', 43: 'Oddish', 44: 'Gloom', 45: 'Vileplume',
  46: 'Paras', 47: 'Parasect', 48: 'Venonat', 49: 'Venomoth', 50: 'Diglett',
  // Add more as needed
};

function getPokemonName(id: number): string {
  return pokemonNames[id] || `Pokemon #${id}`;
}

class AdminService {
  private startTime: Date = new Date();

  /**
   * Get all users with overview data
   */
  async getAllUsers(): Promise<UserOverview[]> {
    const userService = getUserService();
    const allUsers = await userService.getAllUsers();

    const users: UserOverview[] = allUsers.map(user => ({
      id: user.id,
      username: user.username,
      createdAt: typeof user.createdAt === 'string' ? user.createdAt : user.createdAt.toISOString(),
      avatarPokemonId: user.avatarPokemonId,
      avatarSprite: user.avatarSprite,
      lastUpdated: user.lastUpdated || (user.updatedAt ? user.updatedAt.toISOString() : undefined),
      stats: user.gameStats ? {
        totalBattles: user.gameStats.totalBattles || 0,
        totalCorrectGuesses: user.gameStats.totalCorrectGuesses || 0,
        highestStreak: user.gameStats.highestStreak || 0,
        endlessHighScore: user.gameStats.endlessHighScore || 0,
      } : undefined,
      pokedexCount: user.pokedex ? {
        unlocked: user.pokedex.unlockedPokemon?.length || 0,
        shiny: user.pokedex.unlockedShinyPokemon?.length || 0,
      } : undefined,
    }));

    // Sort by creation date (newest first)
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return users;
  }

  /**
   * Get user count
   */
  async getUserCount(): Promise<number> {
    const userService = getUserService();
    return userService.getUserCount();
  }

  /**
   * Get comprehensive game analytics
   */
  async getGameAnalytics(): Promise<GameAnalytics> {
    const users = await this.getAllUsers();
    const leaderboard = await leaderboardService.getEndlessLeaderboard(1000);
    // Recent scores could be used for activity tracking in the future
    void leaderboardService.getRecentScores(100);

    let totalBattles = 0;
    let totalCorrectGuesses = 0;
    let totalStreaks = 0;
    let usersWithBattles = 0;

    // Calculate active users
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let activeToday = 0;
    let activeWeek = 0;

    for (const user of users) {
      if (user.stats) {
        totalBattles += user.stats.totalBattles;
        totalCorrectGuesses += user.stats.totalCorrectGuesses;
        totalStreaks += user.stats.highestStreak;
        if (user.stats.totalBattles > 0) usersWithBattles++;
      }

      if (user.lastUpdated) {
        const lastActive = new Date(user.lastUpdated);
        if (lastActive >= oneDayAgo) activeToday++;
        if (lastActive >= oneWeekAgo) activeWeek++;
      }
    }

    // Calculate endless stats
    let totalEndlessScore = 0;
    let topEndlessScore = 0;
    for (const entry of leaderboard) {
      totalEndlessScore += entry.highScore;
      if (entry.highScore > topEndlessScore) {
        topEndlessScore = entry.highScore;
      }
    }

    const averageAccuracy = totalBattles > 0
      ? (totalCorrectGuesses / totalBattles) * 100
      : 0;

    return {
      totalUsers: users.length,
      totalBattlesPlayed: totalBattles,
      totalCorrectGuesses,
      averageAccuracy: Math.round(averageAccuracy * 10) / 10,
      averageStreak: usersWithBattles > 0 ? Math.round(totalStreaks / usersWithBattles * 10) / 10 : 0,
      totalEndlessRuns: leaderboard.reduce((sum, e) => sum + e.totalRuns, 0),
      averageEndlessScore: leaderboard.length > 0
        ? Math.round(totalEndlessScore / leaderboard.length)
        : 0,
      topEndlessScore,
      activeUsersToday: activeToday,
      activeUsersWeek: activeWeek,
    };
  }

  /**
   * Get Pokedex insights
   */
  async getPokedexInsights(): Promise<PokedexInsights> {
    const userService = getUserService();
    const allUsers = await userService.getAllUsers();

    // Track unlock counts per Pokemon
    const unlockCounts = new Map<number, number>();
    const shinyCounts = new Map<number, number>();

    let totalUnlocks = 0;
    let totalShinyUnlocks = 0;
    let usersWithPokedex = 0;

    // Completion rate buckets
    const completionBuckets = { under25: 0, under50: 0, under75: 0, complete: 0 };
    const TOTAL_POKEMON = 1025;

    for (const user of allUsers) {
      if (user.pokedex) {
        usersWithPokedex++;
        const unlockedCount = user.pokedex.unlockedPokemon?.length || 0;
        const shinyCount = user.pokedex.unlockedShinyPokemon?.length || 0;
        totalUnlocks += unlockedCount;
        totalShinyUnlocks += shinyCount;

        // Calculate completion percentage
        const completionPercent = (unlockedCount / TOTAL_POKEMON) * 100;
        if (completionPercent >= 100) completionBuckets.complete++;
        else if (completionPercent >= 75) completionBuckets.under75++;
        else if (completionPercent >= 50) completionBuckets.under50++;
        else completionBuckets.under25++;

        // Track individual Pokemon unlock counts
        if (user.pokedex.unlockedPokemon) {
          for (const pokemonId of user.pokedex.unlockedPokemon) {
            unlockCounts.set(pokemonId, (unlockCounts.get(pokemonId) || 0) + 1);
          }
        }
        if (user.pokedex.unlockedShinyPokemon) {
          for (const pokemonId of user.pokedex.unlockedShinyPokemon) {
            shinyCounts.set(pokemonId, (shinyCounts.get(pokemonId) || 0) + 1);
          }
        }
      }
    }

    // Sort Pokemon by unlock count
    const sortedUnlocks = Array.from(unlockCounts.entries())
      .map(([id, count]) => ({ id, name: getPokemonName(id), count }))
      .sort((a, b) => b.count - a.count);

    const sortedShinies = Array.from(shinyCounts.entries())
      .map(([id, count]) => ({ id, name: getPokemonName(id), count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalUnlocks,
      totalShinyUnlocks,
      averageUnlocksPerUser: usersWithPokedex > 0
        ? Math.round(totalUnlocks / usersWithPokedex)
        : 0,
      averageShinyPerUser: usersWithPokedex > 0
        ? Math.round((totalShinyUnlocks / usersWithPokedex) * 10) / 10
        : 0,
      mostUnlockedPokemon: sortedUnlocks.slice(0, 10),
      leastUnlockedPokemon: sortedUnlocks.slice(-10).reverse(),
      shinyRankings: sortedShinies.slice(0, 10),
      completionRates: completionBuckets,
    };
  }

  /**
   * Get battle statistics
   */
  async getBattleStatistics(): Promise<BattleStatistics> {
    const cacheStats = await battleCacheService.getCacheStats();

    // Calculate win rate distribution
    const winRateDistribution = [
      { range: '0-20%', count: 0 },
      { range: '20-40%', count: 0 },
      { range: '40-60%', count: 0 },
      { range: '60-80%', count: 0 },
      { range: '80-100%', count: 0 },
    ];

    let totalWinRate = 0;
    let totalExecutionTime = 0;
    const recentBattles: BattleStatistics['recentBattles'] = [];

    for (const battle of cacheStats.battles) {
      // Parse win rate from summary
      const winRateMatch = battle.summary.match(/\((\d+\.?\d*)%\)/);
      if (winRateMatch) {
        const winRate = parseFloat(winRateMatch[1]);
        totalWinRate += winRate;

        // Categorize win rate
        if (winRate < 20) winRateDistribution[0].count++;
        else if (winRate < 40) winRateDistribution[1].count++;
        else if (winRate < 60) winRateDistribution[2].count++;
        else if (winRate < 80) winRateDistribution[3].count++;
        else winRateDistribution[4].count++;

        // Extract Pokemon names from summary
        const nameMatch = battle.summary.match(/^(.+?) \(L\d+\) vs (.+?) \(L\d+\)/);
        if (nameMatch) {
          recentBattles.push({
            id: battle.id,
            pokemon1: nameMatch[1],
            pokemon2: nameMatch[2],
            winRate,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    return {
      totalBattlesSimulated: cacheStats.size,
      averageWinRate: cacheStats.size > 0
        ? Math.round(totalWinRate / cacheStats.size * 10) / 10
        : 50,
      winRateDistribution,
      averageExecutionTime: cacheStats.size > 0
        ? Math.round(totalExecutionTime / cacheStats.size)
        : 0,
      cachedBattleCount: cacheStats.size,
      recentBattles: recentBattles.slice(0, 10),
    };
  }

  /**
   * Get system health information
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const memory = process.memoryUsage();
    const cacheStats = await battleCacheService.getCacheStats();

    // Check Redis connection by attempting a simple operation
    let redisConnected = false;
    try {
      await cacheService.set('health-check', { timestamp: Date.now() }, 10);
      const result = await cacheService.get('health-check');
      redisConnected = result !== null;
    } catch {
      redisConnected = false;
    }

    // Count available daily challenges
    let dailyChallengesActive = 0;
    try {
      const today = new Date();
      for (let i = -7; i <= 2; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const challenge = await dailyChallengeService.getDailyChallenge(date);
        if (challenge) dailyChallengesActive++;
      }
    } catch {
      // Ignore errors
    }

    const { CACHE_SIZE } = await import('../config/game-constants').then(m => m.BATTLE_CONFIG);

    return {
      uptime: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
      memoryUsage: {
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024 * 100) / 100,
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024 * 100) / 100,
        external: Math.round(memory.external / 1024 / 1024 * 100) / 100,
        rss: Math.round(memory.rss / 1024 / 1024 * 100) / 100,
      },
      redisConnected,
      battleCacheSize: cacheStats.size,
      battleCacheTarget: CACHE_SIZE,
      dailyChallengesActive,
      serverTime: new Date().toISOString(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Get daily challenge statistics
   */
  async getDailyChallengeStats(): Promise<DailyChallengeStats> {
    const availableDates: string[] = [];
    let todaysChallenge: DailyChallengeStats['todaysChallenge'];

    try {
      const today = new Date();

      // Check available challenges
      for (let i = -7; i <= 2; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        const challenge = await dailyChallengeService.getDailyChallenge(date);
        if (challenge) {
          availableDates.push(dateStr);

          // Get today's challenge details
          if (i === 0 && challenge.battles) {
            const avgWinRate = challenge.battles.reduce((sum, b) => sum + (b.winRate || 0), 0) / challenge.battles.length;
            todaysChallenge = {
              date: dateStr,
              battlesCount: challenge.battles.length,
              averageWinRate: Math.round(avgWinRate * 1000) / 10,
            };
          }
        }
      }
    } catch (error) {
      logger.error('Error getting daily challenge stats:', error);
    }

    return {
      totalChallenges: availableDates.length,
      availableDates,
      todaysChallenge,
    };
  }

  /**
   * Get leaderboard management data
   */
  async getLeaderboardManagement(): Promise<LeaderboardManagementData> {
    const leaderboard = await leaderboardService.getEndlessLeaderboard(100);
    const recentScores = await leaderboardService.getRecentScores(20);
    const playerCount = leaderboardService.getPlayerCount();

    // Map to our interface types
    const topPlayers: LeaderboardPlayer[] = leaderboard.slice(0, 20).map(entry => ({
      userId: entry.userId,
      username: entry.username,
      avatarPokemonId: entry.avatarPokemonId,
      avatarSprite: entry.avatarSprite,
      highScore: entry.highScore,
      lastPlayed: entry.lastPlayed,
      totalRuns: entry.totalRuns,
    }));

    // Detect suspicious scores (e.g., impossibly high)
    const suspiciousScores: LeaderboardPlayer[] = leaderboard
      .filter(entry => entry.highScore > 100)
      .map(entry => ({
        userId: entry.userId,
        username: entry.username,
        avatarPokemonId: entry.avatarPokemonId,
        avatarSprite: entry.avatarSprite,
        highScore: entry.highScore,
        lastPlayed: entry.lastPlayed,
        totalRuns: entry.totalRuns,
      }));

    const recentActivity: RecentActivity[] = recentScores.map(score => ({
      id: score.id,
      userId: score.userId,
      username: score.username,
      avatarPokemonId: score.avatarPokemonId,
      avatarSprite: score.avatarSprite,
      score: score.score,
      timestamp: score.timestamp,
    }));

    return {
      topPlayers,
      totalPlayers: playerCount,
      totalRuns: leaderboard.reduce((sum, e) => sum + e.totalRuns, 0),
      recentActivity,
      suspiciousScores,
      averageHighScore: leaderboard.length > 0
        ? Math.round(leaderboard.reduce((sum, e) => sum + e.highScore, 0) / leaderboard.length)
        : 0,
    };
  }

  /**
   * Reset a user's leaderboard score
   */
  async resetUserScore(userId: string): Promise<boolean> {
    try {
      // Access internal scores map
      if ('endlessScores' in leaderboardService) {
        const scoresMap = (leaderboardService as any).endlessScores as Map<string, any[]>;
        scoresMap.delete(userId);
        logger.info(`Reset leaderboard scores for user ${userId}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to reset user score:', error);
      return false;
    }
  }

  /**
   * Refresh daily challenges
   */
  async refreshDailyChallenges(): Promise<void> {
    await dailyChallengeService.refreshAllChallenges();
    logger.info('Daily challenges refreshed by admin');
  }

  /**
   * Refresh battle cache
   */
  async refreshBattleCache(): Promise<{ cacheSize: number; targetSize: number }> {
    await battleCacheService.clearCache();
    await battleCacheService.initialize();
    const stats = await battleCacheService.getCacheStats();

    const { CACHE_SIZE } = await import('../config/game-constants').then(m => m.BATTLE_CONFIG);

    logger.info('Battle cache refreshed by admin');
    return {
      cacheSize: stats.size,
      targetSize: CACHE_SIZE,
    };
  }

  /**
   * Get a comprehensive admin dashboard summary
   */
  async getDashboardSummary() {
    const [
      userCount,
      gameAnalytics,
      systemHealth,
      dailyChallengeStats,
      battleStats,
    ] = await Promise.all([
      this.getUserCount(),
      this.getGameAnalytics(),
      this.getSystemHealth(),
      this.getDailyChallengeStats(),
      this.getBattleStatistics(),
    ]);

    return {
      userCount,
      gameAnalytics,
      systemHealth,
      dailyChallengeStats,
      battleStats,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const adminService = new AdminService();
