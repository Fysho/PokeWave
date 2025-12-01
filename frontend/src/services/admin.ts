import { api } from './api';

export interface UserOverview {
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

export interface GameAnalytics {
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

export interface PokedexInsights {
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

export interface BattleStatistics {
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

export interface SystemHealth {
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

export interface DailyChallengeStats {
  totalChallenges: number;
  availableDates: string[];
  todaysChallenge?: {
    date: string;
    battlesCount: number;
    averageWinRate: number;
  };
}

export interface LeaderboardManagement {
  topPlayers: {
    userId: string;
    username: string;
    avatarPokemonId?: number;
    avatarSprite?: string;
    highScore: number;
    lastPlayed: string;
    totalRuns: number;
  }[];
  totalPlayers: number;
  totalRuns: number;
  recentActivity: {
    id: string;
    userId: string;
    username: string;
    score: number;
    timestamp: string;
  }[];
  suspiciousScores: any[];
  averageHighScore: number;
}

export interface DashboardSummary {
  userCount: number;
  gameAnalytics: GameAnalytics;
  systemHealth: SystemHealth;
  dailyChallengeStats: DailyChallengeStats;
  battleStats: BattleStatistics;
  generatedAt: string;
}

class AdminService {
  /**
   * Get dashboard summary (all data in one call)
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await api.get('/admin/dashboard');
    return response.data;
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<{ count: number; users: UserOverview[] }> {
    const response = await api.get('/admin/users');
    return response.data;
  }

  /**
   * Get user count
   */
  async getUserCount(): Promise<number> {
    const response = await api.get('/admin/users/count');
    return response.data.count;
  }

  /**
   * Get game analytics
   */
  async getGameAnalytics(): Promise<GameAnalytics> {
    const response = await api.get('/admin/analytics/game');
    return response.data.analytics;
  }

  /**
   * Get Pokedex insights
   */
  async getPokedexInsights(): Promise<PokedexInsights> {
    const response = await api.get('/admin/analytics/pokedex');
    return response.data.insights;
  }

  /**
   * Get battle statistics
   */
  async getBattleStatistics(): Promise<BattleStatistics> {
    const response = await api.get('/admin/analytics/battles');
    return response.data.statistics;
  }

  /**
   * Get system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await api.get('/admin/system/health');
    return response.data.health;
  }

  /**
   * Get daily challenge stats
   */
  async getDailyChallengeStats(): Promise<DailyChallengeStats> {
    const response = await api.get('/admin/daily-challenges');
    return response.data.stats;
  }

  /**
   * Refresh daily challenges
   */
  async refreshDailyChallenges(): Promise<DailyChallengeStats> {
    const response = await api.post('/admin/daily-challenges/refresh');
    return response.data.stats;
  }

  /**
   * Get leaderboard management data
   */
  async getLeaderboardManagement(): Promise<LeaderboardManagement> {
    const response = await api.get('/admin/leaderboard');
    return response.data.data;
  }

  /**
   * Reset a user's leaderboard score
   */
  async resetUserScore(userId: string): Promise<boolean> {
    const response = await api.delete(`/admin/leaderboard/user/${userId}`);
    return response.data.success;
  }

  /**
   * Refresh battle cache
   */
  async refreshBattleCache(): Promise<{ cacheSize: number; targetSize: number }> {
    const response = await api.post('/admin/cache/refresh');
    return response.data;
  }
}

export default new AdminService();
