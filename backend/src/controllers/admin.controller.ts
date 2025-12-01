import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import logger from '../utils/logger';

/**
 * Get all users with overview data
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await adminService.getAllUsers();
    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    logger.error('Admin: Failed to get all users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve users',
    });
  }
};

/**
 * Get user count
 */
export const getUserCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await adminService.getUserCount();
    res.json({
      success: true,
      count,
    });
  } catch (error) {
    logger.error('Admin: Failed to get user count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user count',
    });
  }
};

/**
 * Get comprehensive game analytics
 */
export const getGameAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const analytics = await adminService.getGameAnalytics();
    res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    logger.error('Admin: Failed to get game analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve game analytics',
    });
  }
};

/**
 * Get Pokedex insights
 */
export const getPokedexInsights = async (req: Request, res: Response): Promise<void> => {
  try {
    const insights = await adminService.getPokedexInsights();
    res.json({
      success: true,
      insights,
    });
  } catch (error) {
    logger.error('Admin: Failed to get Pokedex insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve Pokedex insights',
    });
  }
};

/**
 * Get battle statistics
 */
export const getBattleStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const statistics = await adminService.getBattleStatistics();
    res.json({
      success: true,
      statistics,
    });
  } catch (error) {
    logger.error('Admin: Failed to get battle statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve battle statistics',
    });
  }
};

/**
 * Get system health information
 */
export const getSystemHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const health = await adminService.getSystemHealth();
    res.json({
      success: true,
      health,
    });
  } catch (error) {
    logger.error('Admin: Failed to get system health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system health',
    });
  }
};

/**
 * Get daily challenge statistics
 */
export const getDailyChallengeStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await adminService.getDailyChallengeStats();
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Admin: Failed to get daily challenge stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve daily challenge stats',
    });
  }
};

/**
 * Get leaderboard management data
 */
export const getLeaderboardManagement = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await adminService.getLeaderboardManagement();
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Admin: Failed to get leaderboard management data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve leaderboard data',
    });
  }
};

/**
 * Reset a user's leaderboard score
 */
export const resetUserScore = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
      return;
    }

    const success = await adminService.resetUserScore(userId);

    if (success) {
      res.json({
        success: true,
        message: `Score reset for user ${userId}`,
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'User not found or score could not be reset',
      });
    }
  } catch (error) {
    logger.error('Admin: Failed to reset user score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset user score',
    });
  }
};

/**
 * Refresh daily challenges
 */
export const refreshDailyChallenges = async (req: Request, res: Response): Promise<void> => {
  try {
    await adminService.refreshDailyChallenges();
    const stats = await adminService.getDailyChallengeStats();
    res.json({
      success: true,
      message: 'Daily challenges refreshed',
      stats,
    });
  } catch (error) {
    logger.error('Admin: Failed to refresh daily challenges:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh daily challenges',
    });
  }
};

/**
 * Refresh battle cache
 */
export const refreshBattleCache = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await adminService.refreshBattleCache();
    res.json({
      success: true,
      message: 'Battle cache refreshed',
      ...result,
    });
  } catch (error) {
    logger.error('Admin: Failed to refresh battle cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh battle cache',
    });
  }
};

/**
 * Get comprehensive admin dashboard summary
 */
export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const summary = await adminService.getDashboardSummary();
    res.json({
      success: true,
      ...summary,
    });
  } catch (error) {
    logger.error('Admin: Failed to get dashboard summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard summary',
    });
  }
};
