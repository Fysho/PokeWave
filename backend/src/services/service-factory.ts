import { isDatabaseEnabled } from '../config/database.config';
import { userService } from './user.service';
import { userServiceDB } from './user.service.db';
import { leaderboardService } from './leaderboard.service';
import { leaderboardServiceDB } from './leaderboard.service.db';
import { battleServiceMemory } from './battle.service.memory';
import { battleServiceDB } from './battle.service.db';
import { IUserService } from './interfaces/user.service.interface';
import { ILeaderboardService } from './interfaces/leaderboard.service.interface';
import { IBattleService } from './interfaces/battle.service.interface';
import logger from '../utils/logger';

// Service factory that returns the appropriate implementation
export function getUserService(): IUserService {
  if (isDatabaseEnabled()) {
    return userServiceDB as IUserService;
  } else {
    return userService as IUserService;
  }
}

export function getLeaderboardService(): ILeaderboardService {
  if (isDatabaseEnabled()) {
    return leaderboardServiceDB as ILeaderboardService;
  } else {
    return leaderboardService as ILeaderboardService;
  }
}

// Service factory for battle service
export function getBattleService(): IBattleService {
  if (isDatabaseEnabled()) {
    return battleServiceDB as IBattleService;
  } else {
    return battleServiceMemory as IBattleService;
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