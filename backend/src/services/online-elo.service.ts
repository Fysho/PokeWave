/**
 * Online Elo Service
 *
 * Handles Elo calculations and ranking for Online Mode.
 * Uses a hybrid system combining accuracy and rank-based scoring.
 */

import { PrismaClient } from '@prisma/client';
import {
  ONLINE_CONFIG,
  RANK_THRESHOLDS,
  RankTier,
  OnlineGuessResult,
  LeaderboardEntry
} from '../types/online.types';
import logger from '../utils/logger';

class OnlineEloService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get rank tier from Elo value
   */
  getRankFromElo(elo: number): RankTier {
    for (const [rank, { min, max }] of Object.entries(RANK_THRESHOLDS)) {
      if (elo >= min && elo <= max) {
        return rank as RankTier;
      }
    }
    return 'bronze';
  }

  /**
   * Get or create Elo record for a user
   */
  async getOrCreateElo(userId: string): Promise<{ elo: number; rank: RankTier; id: string }> {
    let eloRecord = await this.prisma.onlineElo.findUnique({
      where: { userId }
    });

    if (!eloRecord) {
      eloRecord = await this.prisma.onlineElo.create({
        data: {
          userId,
          elo: 1000,
          rank: 'bronze'
        }
      });
      logger.info(`Created new Online Elo record for user ${userId}`);
    }

    return {
      id: eloRecord.id,
      elo: eloRecord.elo,
      rank: eloRecord.rank as RankTier
    };
  }

  /**
   * Calculate accuracy score (0-100)
   * Higher score = closer to actual result
   */
  calculateAccuracyScore(guess: number, actual: number): number {
    const error = Math.abs(guess - actual);
    return Math.max(0, 100 - error);
  }

  /**
   * Calculate zero-sum Elo changes for all players
   * Elo is transferred from worse performers to better performers
   * Total Elo change across all players = 0
   */
  calculateZeroSumEloChanges(
    guessesWithScores: Array<{ oderId: string; accuracyScore: number; rankPosition: number }>
  ): Map<string, number> {
    const n = guessesWithScores.length;
    const eloChanges = new Map<string, number>();

    if (n < 2) {
      // No Elo changes with less than 2 players
      guessesWithScores.forEach(g => eloChanges.set(g.oderId, 0));
      return eloChanges;
    }

    // Sort by rank position (1st place first)
    const sorted = [...guessesWithScores].sort((a, b) => a.rankPosition - b.rankPosition);

    // Calculate Elo changes based on position
    // Use a system where each player's change depends on their relative position
    // Top half gains, bottom half loses, middle (if odd) gets 0
    const baseChange = ONLINE_CONFIG.BASE_ELO_CHANGE;

    // To ensure perfect zero-sum, we calculate changes and then adjust for rounding
    const changes: number[] = [];
    for (let i = 0; i < n; i++) {
      // Position factor: ranges from +1 (1st place) to -1 (last place)
      // Formula: (n - 1 - 2*i) / (n - 1)
      // For 2 players: 1st gets +1, 2nd gets -1
      // For 3 players: 1st gets +1, 2nd gets 0, 3rd gets -1
      // For 4 players: 1st gets +1, 2nd gets +0.33, 3rd gets -0.33, 4th gets -1
      const positionFactor = (n - 1 - 2 * i) / (n - 1);
      changes.push(Math.round(baseChange * positionFactor));
    }

    // Adjust for rounding errors to ensure zero-sum
    const total = changes.reduce((sum, c) => sum + c, 0);
    if (total !== 0) {
      // Distribute the rounding error to middle players
      const midIndex = Math.floor(n / 2);
      changes[midIndex] -= total;
    }

    for (let i = 0; i < n; i++) {
      eloChanges.set(sorted[i].oderId, changes[i]);
    }

    return eloChanges;
  }

  /**
   * Process all guesses for a completed round
   * Calculates accuracy, rank, and Elo changes for each player
   */
  async processRoundResults(roundId: string, actualWinPercent: number): Promise<OnlineGuessResult[]> {
    // Get all guesses for this round
    const guesses = await this.prisma.onlineGuess.findMany({
      where: { roundId },
      orderBy: { submittedAt: 'asc' }
    });

    if (guesses.length === 0) {
      logger.info(`No guesses to process for round ${roundId}`);
      return [];
    }

    // Calculate accuracy scores for all guesses
    const guessesWithScores = guesses.map(g => ({
      ...g,
      accuracyScore: this.calculateAccuracyScore(g.guess, actualWinPercent)
    }));

    // Sort by accuracy score (highest first) to determine rank positions
    guessesWithScores.sort((a, b) => b.accuracyScore - a.accuracyScore);

    // Assign rank positions (1st, 2nd, etc.)
    guessesWithScores.forEach((g, index) => {
      (g as any).rankPosition = index + 1;
    });

    // Determine if Elo changes should apply (need 2+ players)
    const applyEloChanges = guesses.length >= ONLINE_CONFIG.MIN_PLAYERS_FOR_ELO;

    // Calculate zero-sum Elo changes for all players
    const eloChangesMap = this.calculateZeroSumEloChanges(
      guessesWithScores.map(g => ({
        oderId: g.userId,
        accuracyScore: g.accuracyScore,
        rankPosition: (g as any).rankPosition
      }))
    );

    const results: OnlineGuessResult[] = [];

    // Process each guess
    for (const guess of guessesWithScores) {
      // Get current Elo
      const { elo: currentElo } = await this.getOrCreateElo(guess.userId);

      // Get zero-sum Elo change from pre-calculated map
      const eloChange = applyEloChanges
        ? (eloChangesMap.get(guess.userId) || 0)
        : 0;

      const newElo = Math.max(0, currentElo + eloChange); // Never go below 0
      const newRank = this.getRankFromElo(newElo);

      // Update database
      try {
        await this.prisma.$transaction(async (tx) => {
          // Update guess record with results
          await tx.onlineGuess.update({
            where: { id: guess.id },
            data: {
              accuracyScore: guess.accuracyScore,
              rankPosition: (guess as any).rankPosition,
              eloChange,
              eloBefore: currentElo,
              eloAfter: newElo
            }
          });

          // Update Elo record (if changes apply)
          if (applyEloChanges) {
            const isWin = (guess as any).rankPosition <= Math.ceil(guesses.length / 2);

            await tx.onlineElo.update({
              where: { userId: guess.userId },
              data: {
                elo: newElo,
                rank: newRank,
                gamesPlayed: { increment: 1 },
                wins: isWin ? { increment: 1 } : undefined,
                highestElo: newElo > currentElo ? newElo : undefined,
                lowestElo: newElo < currentElo ? newElo : undefined
              }
            });
          } else {
            // Just increment games played for solo players
            await tx.onlineElo.update({
              where: { userId: guess.userId },
              data: {
                gamesPlayed: { increment: 1 }
              }
            });
          }
        });
      } catch (error) {
        logger.error(`Failed to update results for user ${guess.userId}:`, error);
      }

      // Get username and avatar for result
      const user = await this.prisma.user.findUnique({
        where: { id: guess.userId },
        select: { username: true, avatarPokemonId: true, avatarSprite: true }
      });

      results.push({
        userId: guess.userId,
        username: user?.username || 'Unknown',
        guess: guess.guess,
        accuracyScore: guess.accuracyScore,
        rankPosition: (guess as any).rankPosition,
        eloChange,
        eloBefore: currentElo,
        eloAfter: newElo,
        avatarPokemonId: user?.avatarPokemonId || 25,
        avatarSprite: user?.avatarSprite || ''
      });
    }

    // Update round participant count
    await this.prisma.onlineRound.update({
      where: { id: roundId },
      data: { totalParticipants: guesses.length }
    });

    logger.info(`Processed round ${roundId}: ${guesses.length} participants, Elo changes applied: ${applyEloChanges}`);
    return results;
  }

  /**
   * Get global leaderboard
   */
  async getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    const topPlayers = await this.prisma.onlineElo.findMany({
      take: limit,
      orderBy: { elo: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            avatarPokemonId: true,
            avatarSprite: true
          }
        }
      }
    });

    return topPlayers.map((p, index) => ({
      rank: index + 1,
      userId: p.userId,
      username: p.user.username,
      elo: p.elo,
      tier: p.rank as RankTier,
      gamesPlayed: p.gamesPlayed,
      wins: p.wins,
      avatarPokemonId: p.user.avatarPokemonId,
      avatarSprite: p.user.avatarSprite
    }));
  }

  /**
   * Get user's position on leaderboard
   */
  async getUserPosition(userId: string): Promise<number> {
    const userElo = await this.prisma.onlineElo.findUnique({
      where: { userId }
    });

    if (!userElo) return -1;

    const higherCount = await this.prisma.onlineElo.count({
      where: {
        elo: { gt: userElo.elo }
      }
    });

    return higherCount + 1;
  }

  /**
   * Get user's full online stats
   */
  async getUserStats(userId: string): Promise<{
    elo: number;
    rank: RankTier;
    position: number;
    gamesPlayed: number;
    wins: number;
    highestElo: number;
    lowestElo: number;
  } | null> {
    const eloRecord = await this.prisma.onlineElo.findUnique({
      where: { userId }
    });

    if (!eloRecord) {
      // Create new record and return default stats
      await this.getOrCreateElo(userId);
      return {
        elo: 1000,
        rank: 'bronze',
        position: await this.getUserPosition(userId),
        gamesPlayed: 0,
        wins: 0,
        highestElo: 1000,
        lowestElo: 1000
      };
    }

    const position = await this.getUserPosition(userId);

    return {
      elo: eloRecord.elo,
      rank: eloRecord.rank as RankTier,
      position,
      gamesPlayed: eloRecord.gamesPlayed,
      wins: eloRecord.wins,
      highestElo: eloRecord.highestElo,
      lowestElo: eloRecord.lowestElo
    };
  }

  /**
   * Get count of players with Elo records
   */
  async getTotalPlayerCount(): Promise<number> {
    return this.prisma.onlineElo.count();
  }
}

export const onlineEloService = new OnlineEloService();
