import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/error.middleware';
import { getLeaderboardService } from '../services/service-factory';
import logger from '../utils/logger';

const leaderboardService = getLeaderboardService();

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

export const submitEndlessScore = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { score } = req.body;

    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (typeof score !== 'number' || score < 0) {
      throw new ApiError(400, 'Invalid score');
    }

    const entry = await leaderboardService.submitEndlessScore(userId, score, req.user?.username);

    logger.info(`Endless score submitted: User ${req.user?.username} scored ${score}`);

    res.status(201).json({
      success: true,
      entry,
      message: 'Score submitted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getEndlessLeaderboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;

    if (limit < 1 || limit > 1000) {
      throw new ApiError(400, 'Limit must be between 1 and 1000');
    }

    const leaderboard = await leaderboardService.getEndlessLeaderboard(limit);

    res.json({
      leaderboard,
      totalPlayers: leaderboardService.getPlayerCount ? leaderboardService.getPlayerCount() : 0
    });
  } catch (error) {
    next(error);
  }
};

export const getUserEndlessStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id || req.params.userId;

    if (!userId) {
      throw new ApiError(400, 'User ID required');
    }

    const stats = leaderboardService.getUserEndlessStats 
      ? await leaderboardService.getUserEndlessStats(userId)
      : { highScore: 0, totalRuns: 0, recentScores: [] };

    res.json({
      userId,
      stats
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentScores = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    if (limit < 1 || limit > 50) {
      throw new ApiError(400, 'Limit must be between 1 and 50');
    }

    const recentScores = leaderboardService.getRecentScores 
      ? await leaderboardService.getRecentScores(limit)
      : [];

    res.json({
      recentScores
    });
  } catch (error) {
    next(error);
  }
};