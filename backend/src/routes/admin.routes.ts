import { Router } from 'express';
import {
  getAllUsers,
  getUserCount,
  getGameAnalytics,
  getPokedexInsights,
  getBattleStatistics,
  getSystemHealth,
  getDailyChallengeStats,
  getLeaderboardManagement,
  resetUserScore,
  refreshDailyChallenges,
  refreshBattleCache,
  getDashboardSummary,
} from '../controllers/admin.controller';

const router = Router();

// Dashboard summary (all data in one call)
router.get('/dashboard', getDashboardSummary);

// User management
router.get('/users', getAllUsers);
router.get('/users/count', getUserCount);

// Analytics
router.get('/analytics/game', getGameAnalytics);
router.get('/analytics/pokedex', getPokedexInsights);
router.get('/analytics/battles', getBattleStatistics);

// System
router.get('/system/health', getSystemHealth);

// Daily challenges
router.get('/daily-challenges', getDailyChallengeStats);
router.post('/daily-challenges/refresh', refreshDailyChallenges);

// Leaderboard management
router.get('/leaderboard', getLeaderboardManagement);
router.delete('/leaderboard/user/:userId', resetUserScore);

// Cache management
router.post('/cache/refresh', refreshBattleCache);

export default router;
