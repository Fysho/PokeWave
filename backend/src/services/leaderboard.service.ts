import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { getUserService } from './service-factory';
import { IUserService } from './interfaces/user.service.interface';

// Lazy initialization to avoid circular dependency
let userService: IUserService;

function getUserServiceLazy(): IUserService {
  if (!userService) {
    userService = getUserService();
  }
  return userService;
}

interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  avatarPokemonId?: number;
  avatarSprite?: string;
  score: number;
  timestamp: string;
}

interface LeaderboardScore {
  userId: string;
  username: string;
  avatarPokemonId?: number;
  avatarSprite?: string;
  highScore: number;
  lastPlayed: string;
  totalRuns: number;
}

class LeaderboardService {
  private endlessScores: Map<string, LeaderboardEntry[]> = new Map(); // userId -> scores array
  private dailyScores: Map<string, LeaderboardEntry[]> = new Map(); // For future daily mode

  async submitEndlessScore(userId: string, score: number, username?: string): Promise<LeaderboardEntry> {
    const userSvc = getUserServiceLazy();
    let user = await userSvc.findById(userId);
    
    if (!user) {
      logger.info(`User ${userId} not found in memory, attempting to recreate`);
      
      if (username) {
        // If user doesn't exist in memory but has a valid JWT, recreate from token data
        // This handles server restarts where in-memory storage is lost
        if (userSvc.ensureUserExists) {
          user = await userSvc.ensureUserExists({
            id: userId,
            username: username
          });
        } else {
          throw new Error('User not found and cannot recreate');
        }
        logger.info(`User ${username} (${userId}) recreated successfully`);
      } else {
        logger.error(`Cannot recreate user ${userId} - no username provided`);
        throw new Error('User not found');
      }
    }

    const entry: LeaderboardEntry = {
      id: uuidv4(),
      userId: user.id,
      username: user.username,
      avatarPokemonId: user.avatarPokemonId,
      avatarSprite: user.avatarSprite,
      score,
      timestamp: new Date().toISOString()
    };

    // Get user's scores array or create new one
    const userScores = this.endlessScores.get(userId) || [];
    userScores.push(entry);
    this.endlessScores.set(userId, userScores);

    logger.info(`Endless score submitted: ${user.username} scored ${score}`);

    return entry;
  }

  async getEndlessLeaderboard(limit: number = 100): Promise<LeaderboardScore[]> {
    const userHighScores = new Map<string, LeaderboardScore>();

    // Calculate high scores for each user
    for (const [userId, scores] of this.endlessScores.entries()) {
      if (scores.length === 0) continue;

      // Find the highest score
      const highScoreEntry = scores.reduce((prev, current) => 
        current.score > prev.score ? current : prev
      );

      userHighScores.set(userId, {
        userId,
        username: highScoreEntry.username,
        avatarPokemonId: highScoreEntry.avatarPokemonId,
        avatarSprite: highScoreEntry.avatarSprite,
        highScore: highScoreEntry.score,
        lastPlayed: highScoreEntry.timestamp,
        totalRuns: scores.length
      });
    }

    // Convert to array and sort by high score
    const leaderboard = Array.from(userHighScores.values())
      .sort((a, b) => b.highScore - a.highScore)
      .slice(0, limit);

    return leaderboard;
  }

  async getUserEndlessStats(userId: string): Promise<{
    highScore: number;
    totalRuns: number;
    averageScore: number;
    lastPlayed: string | null;
    rank: number;
  }> {
    const userScores = this.endlessScores.get(userId) || [];
    
    if (userScores.length === 0) {
      return {
        highScore: 0,
        totalRuns: 0,
        averageScore: 0,
        lastPlayed: null,
        rank: 0
      };
    }

    const highScore = Math.max(...userScores.map(s => s.score));
    const totalScore = userScores.reduce((sum, s) => sum + s.score, 0);
    const lastEntry = userScores[userScores.length - 1];

    // Calculate rank
    const leaderboard = await this.getEndlessLeaderboard();
    const rank = leaderboard.findIndex(entry => entry.userId === userId) + 1;

    return {
      highScore,
      totalRuns: userScores.length,
      averageScore: Math.round(totalScore / userScores.length),
      lastPlayed: lastEntry.timestamp,
      rank: rank || 0
    };
  }

  // Get recent scores for activity feed
  async getRecentScores(limit: number = 10): Promise<LeaderboardEntry[]> {
    const allScores: LeaderboardEntry[] = [];
    
    for (const scores of this.endlessScores.values()) {
      allScores.push(...scores);
    }

    // Sort by timestamp (most recent first)
    return allScores
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Clear all scores (for development)
  async clearAllScores(): Promise<void> {
    this.endlessScores.clear();
    this.dailyScores.clear();
    logger.info('All leaderboard scores cleared');
  }

  // Get total number of unique players
  getPlayerCount(): number {
    return this.endlessScores.size;
  }
}

export const leaderboardService = new LeaderboardService();