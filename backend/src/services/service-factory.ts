import { isDatabaseEnabled } from '../config/database.config';
import { userService } from './user.service';
import { userServiceDB } from './user.service.db';
import { leaderboardService } from './leaderboard.service';
import { leaderboardServiceDB } from './leaderboard.service.db';
import logger from '../utils/logger';

// Service factory that returns the appropriate implementation
export function getUserService() {
  if (isDatabaseEnabled()) {
    logger.info('Using database-backed user service');
    return userServiceDB;
  } else {
    logger.info('Using in-memory user service');
    return userService;
  }
}

export function getLeaderboardService() {
  if (isDatabaseEnabled()) {
    logger.info('Using database-backed leaderboard service');
    return leaderboardServiceDB;
  } else {
    logger.info('Using in-memory leaderboard service');
    return leaderboardService;
  }
}

// Initialize database connection if enabled
export async function initializeServices() {
  if (isDatabaseEnabled()) {
    try {
      const { connectDatabase } = await import('../lib/prisma');
      await connectDatabase();
      logger.info('Database services initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database services:', error);
      throw error;
    }
  } else {
    logger.info('Using in-memory services (no database connection required)');
  }
}

// Cleanup function for graceful shutdown
export async function shutdownServices() {
  if (isDatabaseEnabled()) {
    try {
      const { disconnectDatabase } = await import('../lib/prisma');
      await disconnectDatabase();
      logger.info('Database services shut down successfully');
    } catch (error) {
      logger.error('Error during database shutdown:', error);
    }
  }
}