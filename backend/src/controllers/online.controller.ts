/**
 * Online Mode Controller
 *
 * REST API endpoints for Online Mode operations.
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { onlineRoundService } from '../services/online-round.service';
import { onlineEloService } from '../services/online-elo.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export const onlineController = {
  /**
   * GET /api/online/round/current
   * Get current round state
   */
  async getCurrentRound(_req: Request, res: Response): Promise<void> {
    try {
      const state = await onlineRoundService.getCurrentRoundState();
      res.json(state);
    } catch (error) {
      logger.error('Error getting current round:', error);
      res.status(500).json({ error: 'Failed to get current round' });
    }
  },

  /**
   * POST /api/online/guess
   * Submit a guess for the current round
   */
  async submitGuess(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { roundNumber, guess } = req.body;

      // Validate guess
      if (typeof guess !== 'number' || guess < 0 || guess > 100) {
        res.status(400).json({ error: 'Guess must be a number between 0 and 100' });
        return;
      }

      if (typeof roundNumber !== 'number') {
        res.status(400).json({ error: 'Round number is required' });
        return;
      }

      // Verify we're in guessing phase for this round
      const currentRound = onlineRoundService.getCurrentRoundNumber();
      const currentPhase = onlineRoundService.getCurrentPhase();

      if (roundNumber !== currentRound) {
        res.status(400).json({ error: 'Round has ended or not started' });
        return;
      }

      if (currentPhase !== 'guessing') {
        res.status(400).json({ error: 'Guessing phase has ended' });
        return;
      }

      // Get round from database
      const round = await prisma.onlineRound.findUnique({
        where: { roundNumber }
      });

      if (!round) {
        res.status(404).json({ error: 'Round not found' });
        return;
      }

      // Check for existing guess
      const existingGuess = await prisma.onlineGuess.findUnique({
        where: {
          roundId_userId: {
            roundId: round.id,
            userId
          }
        }
      });

      if (existingGuess) {
        res.status(400).json({ error: 'You have already submitted a guess for this round' });
        return;
      }

      // Create guess
      const newGuess = await prisma.onlineGuess.create({
        data: {
          roundId: round.id,
          userId,
          guess
        }
      });

      // Update presence to show submitted
      await prisma.onlinePresence.updateMany({
        where: { userId },
        data: { hasSubmitted: true }
      });

      logger.info(`User ${userId} submitted guess ${guess} for round ${roundNumber}`);

      res.json({
        success: true,
        guessId: newGuess.id,
        roundNumber,
        guess
      });
    } catch (error) {
      logger.error('Error submitting guess:', error);
      res.status(500).json({ error: 'Failed to submit guess' });
    }
  },

  /**
   * GET /api/online/round/:roundNumber/results
   * Get results for a specific round
   */
  async getRoundResults(req: Request, res: Response): Promise<void> {
    try {
      const { roundNumber } = req.params;
      const roundNum = parseInt(roundNumber, 10);

      if (isNaN(roundNum)) {
        res.status(400).json({ error: 'Invalid round number' });
        return;
      }

      const round = await prisma.onlineRound.findUnique({
        where: { roundNumber: roundNum },
        include: {
          guesses: {
            orderBy: { rankPosition: 'asc' }
          }
        }
      });

      if (!round) {
        res.status(404).json({ error: 'Round not found' });
        return;
      }

      // Get usernames for all guesses
      const userIds = round.guesses.map(g => g.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true }
      });
      const userMap = new Map(users.map(u => [u.id, u.username]));

      res.json({
        roundNumber: round.roundNumber,
        actualWinPercent: round.actualWinPercent,
        totalParticipants: round.totalParticipants,
        pokemon1: round.pokemon1Data,
        pokemon2: round.pokemon2Data,
        guesses: round.guesses.map(g => ({
          userId: g.userId,
          username: userMap.get(g.userId) || 'Unknown',
          guess: g.guess,
          accuracyScore: g.accuracyScore,
          rankPosition: g.rankPosition,
          eloChange: g.eloChange,
          eloBefore: g.eloBefore,
          eloAfter: g.eloAfter
        }))
      });
    } catch (error) {
      logger.error('Error getting round results:', error);
      res.status(500).json({ error: 'Failed to get round results' });
    }
  },

  /**
   * GET /api/online/leaderboard
   * Get global leaderboard
   */
  async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 100, 500);
      const leaderboard = await onlineEloService.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      logger.error('Error getting leaderboard:', error);
      res.status(500).json({ error: 'Failed to get leaderboard' });
    }
  },

  /**
   * GET /api/online/stats
   * Get authenticated user's online stats
   */
  async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const stats = await onlineEloService.getUserStats(userId);

      if (!stats) {
        res.status(404).json({ error: 'Stats not found' });
        return;
      }

      res.json(stats);
    } catch (error) {
      logger.error('Error getting user stats:', error);
      res.status(500).json({ error: 'Failed to get user stats' });
    }
  },

  /**
   * GET /api/online/players
   * Get currently online players
   */
  async getOnlinePlayers(_req: Request, res: Response): Promise<void> {
    try {
      // Get players active in last 60 seconds
      const cutoff = new Date(Date.now() - 60000);

      const onlinePlayers = await prisma.onlinePresence.findMany({
        where: {
          lastSeen: { gte: cutoff }
        },
        orderBy: { lastSeen: 'desc' }
      });

      if (onlinePlayers.length === 0) {
        res.json([]);
        return;
      }

      const userIds = onlinePlayers.map(p => p.userId);

      // Get user details and Elo
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          username: true,
          avatarPokemonId: true,
          avatarSprite: true,
          onlineElo: true
        }
      });

      const userMap = new Map(users.map(u => [u.id, u]));

      const players = onlinePlayers.map(p => {
        const user = userMap.get(p.userId);
        return {
          userId: p.userId,
          username: user?.username || 'Unknown',
          elo: user?.onlineElo?.elo || 1000,
          rank: user?.onlineElo?.rank || 'bronze',
          avatarPokemonId: user?.avatarPokemonId || 25,
          avatarSprite: user?.avatarSprite || '',
          hasSubmitted: p.hasSubmitted,
          isOnline: true
        };
      });

      // Sort by Elo (highest first)
      players.sort((a, b) => b.elo - a.elo);

      res.json(players);
    } catch (error) {
      logger.error('Error getting online players:', error);
      res.status(500).json({ error: 'Failed to get online players' });
    }
  },

  /**
   * POST /api/online/heartbeat
   * Update player presence (keep-alive)
   */
  async heartbeat(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const currentRound = onlineRoundService.getCurrentRoundNumber();

      await prisma.onlinePresence.upsert({
        where: { userId },
        update: {
          lastSeen: new Date(),
          currentRound
        },
        create: {
          userId,
          currentRound,
          hasSubmitted: false
        }
      });

      res.json({ success: true });
    } catch (error) {
      logger.error('Error updating heartbeat:', error);
      res.status(500).json({ error: 'Failed to update presence' });
    }
  },

  /**
   * POST /api/online/join
   * Join online mode (create presence record)
   */
  async joinOnlineMode(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const currentRound = onlineRoundService.getCurrentRoundNumber();

      // Create or update presence
      await prisma.onlinePresence.upsert({
        where: { userId },
        update: {
          lastSeen: new Date(),
          currentRound,
          hasSubmitted: false
        },
        create: {
          userId,
          currentRound,
          hasSubmitted: false
        }
      });

      // Ensure user has an Elo record
      await onlineEloService.getOrCreateElo(userId);

      // Get current state
      const state = await onlineRoundService.getCurrentRoundState();
      const stats = await onlineEloService.getUserStats(userId);

      logger.info(`User ${userId} joined Online Mode`);

      res.json({
        success: true,
        roundState: state,
        userStats: stats
      });
    } catch (error) {
      logger.error('Error joining online mode:', error);
      res.status(500).json({ error: 'Failed to join online mode' });
    }
  },

  /**
   * POST /api/online/leave
   * Leave online mode (remove presence record)
   */
  async leaveOnlineMode(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      await prisma.onlinePresence.deleteMany({
        where: { userId }
      });

      logger.info(`User ${userId} left Online Mode`);

      res.json({ success: true });
    } catch (error) {
      logger.error('Error leaving online mode:', error);
      res.status(500).json({ error: 'Failed to leave online mode' });
    }
  }
};
