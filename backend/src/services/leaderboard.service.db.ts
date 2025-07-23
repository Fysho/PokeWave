import { prisma } from '../lib/prisma';
import logger from '../utils/logger';

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

class LeaderboardServiceDB {
  async submitEndlessScore(userId: string, score: number, username?: string): Promise<LeaderboardEntry> {
    try {
      // First ensure user exists (for JWT recovery case)
      let user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user && username) {
        // Recreate user if needed (server restart scenario)
        user = await prisma.user.create({
          data: {
            id: userId,
            username: username.toLowerCase(),
            password: 'temp-password-hash',
            pokedex: {
              create: {}
            },
            gameStats: {
              create: {}
            }
          }
        });
        logger.info(`User ${username} (${userId}) recreated for score submission`);
      }

      if (!user) {
        throw new Error('User not found');
      }

      // Create the endless score entry
      const scoreEntry = await prisma.endlessScore.create({
        data: {
          userId: user.id,
          score
        }
      });

      // Update game stats with new high score if applicable
      const currentStats = await prisma.gameStats.findUnique({
        where: { userId: user.id }
      });

      if (!currentStats || score > currentStats.endlessHighScore) {
        await prisma.gameStats.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            endlessHighScore: score
          },
          update: {
            endlessHighScore: score
          }
        });
      }

      logger.info(`Endless score submitted: ${user.username} scored ${score}`);

      return {
        id: scoreEntry.id,
        userId: user.id,
        username: user.username,
        avatarPokemonId: user.avatarPokemonId,
        avatarSprite: user.avatarSprite,
        score: scoreEntry.score,
        timestamp: scoreEntry.timestamp.toISOString()
      };
    } catch (error) {
      logger.error('Failed to submit endless score:', error);
      throw error;
    }
  }

  async getEndlessLeaderboard(limit: number = 100): Promise<LeaderboardScore[]> {
    try {
      // Get users with their highest endless scores
      const leaderboard = await prisma.$queryRaw<LeaderboardScore[]>`
        SELECT 
          u.id as "userId",
          u.username,
          u."avatarPokemonId",
          u."avatarSprite",
          COALESCE(MAX(es.score), 0) as "highScore",
          COALESCE(MAX(es.timestamp)::text, '') as "lastPlayed",
          COUNT(es.id)::int as "totalRuns"
        FROM "User" u
        LEFT JOIN "EndlessScore" es ON u.id = es."userId"
        GROUP BY u.id, u.username, u."avatarPokemonId", u."avatarSprite"
        HAVING COUNT(es.id) > 0
        ORDER BY "highScore" DESC
        LIMIT ${limit}
      `;

      return leaderboard;
    } catch (error) {
      logger.error('Failed to get endless leaderboard:', error);
      return [];
    }
  }

  async getUserEndlessStats(userId: string): Promise<{
    highScore: number;
    totalRuns: number;
    averageScore: number;
    lastPlayed: string | null;
    rank: number;
  }> {
    try {
      const scores = await prisma.endlessScore.findMany({
        where: { userId },
        orderBy: { score: 'desc' }
      });

      if (scores.length === 0) {
        return {
          highScore: 0,
          totalRuns: 0,
          averageScore: 0,
          lastPlayed: null,
          rank: 0
        };
      }

      const highScore = scores[0].score;
      const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
      const lastEntry = scores[0];

      // Calculate rank
      const rank = await prisma.$queryRaw<[{ rank: bigint }]>`
        SELECT COUNT(DISTINCT u.id)::int + 1 as rank
        FROM "User" u
        JOIN "EndlessScore" es ON u.id = es."userId"
        WHERE es.score > ${highScore}
      `;

      return {
        highScore,
        totalRuns: scores.length,
        averageScore: Math.round(totalScore / scores.length),
        lastPlayed: lastEntry.timestamp.toISOString(),
        rank: Number(rank[0].rank)
      };
    } catch (error) {
      logger.error('Failed to get user endless stats:', error);
      return {
        highScore: 0,
        totalRuns: 0,
        averageScore: 0,
        lastPlayed: null,
        rank: 0
      };
    }
  }

  async getRecentScores(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const recentScores = await prisma.endlessScore.findMany({
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          user: true
        }
      });

      return recentScores.map(score => ({
        id: score.id,
        userId: score.user.id,
        username: score.user.username,
        avatarPokemonId: score.user.avatarPokemonId,
        avatarSprite: score.user.avatarSprite,
        score: score.score,
        timestamp: score.timestamp.toISOString()
      }));
    } catch (error) {
      logger.error('Failed to get recent scores:', error);
      return [];
    }
  }

  async clearAllScores(): Promise<void> {
    try {
      await prisma.endlessScore.deleteMany({});
      await prisma.gameStats.updateMany({
        data: { endlessHighScore: 0 }
      });
      logger.info('All leaderboard scores cleared');
    } catch (error) {
      logger.error('Failed to clear scores:', error);
    }
  }

  getPlayerCount(): number {
    // For async version, this would need to be refactored in the controller
    // For now, return 0 and let the controller handle it differently
    return 0;
  }
  
  async getPlayerCountAsync(): Promise<number> {
    try {
      const count = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT "userId")::int as count
        FROM "EndlessScore"
      `;
      return Number(count[0].count);
    } catch (error) {
      logger.error('Failed to get player count:', error);
      return 0;
    }
  }

  // Daily challenge score methods
  async submitDailyChallengeScore(userId: string, challengeDate: Date, score: number): Promise<void> {
    try {
      await prisma.dailyChallengeScore.upsert({
        where: {
          userId_challengeDate: {
            userId,
            challengeDate
          }
        },
        create: {
          userId,
          challengeDate,
          score
        },
        update: {
          score: Math.min(score, 600), // Cap at max possible score
          attempts: { increment: 1 }
        }
      });

      logger.info(`Daily challenge score submitted: User ${userId} scored ${score} for ${challengeDate.toISOString()}`);
    } catch (error) {
      logger.error('Failed to submit daily challenge score:', error);
      throw error;
    }
  }

  async getDailyChallengeLeaderboard(challengeDate: Date, limit: number = 100): Promise<any[]> {
    try {
      const scores = await prisma.dailyChallengeScore.findMany({
        where: { challengeDate },
        take: limit,
        orderBy: { score: 'asc' }, // Lower is better for daily challenges
        include: {
          user: true
        }
      });

      return scores.map(score => ({
        userId: score.user.id,
        username: score.user.username,
        avatarPokemonId: score.user.avatarPokemonId,
        avatarSprite: score.user.avatarSprite,
        score: score.score,
        attempts: score.attempts
      }));
    } catch (error) {
      logger.error('Failed to get daily challenge leaderboard:', error);
      return [];
    }
  }
}

export const leaderboardServiceDB = new LeaderboardServiceDB();