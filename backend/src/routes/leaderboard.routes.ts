import { Router } from 'express';
import { 
  submitEndlessScore, 
  getEndlessLeaderboard, 
  getUserEndlessStats,
  getRecentScores
} from '../controllers/leaderboard.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/endless', getEndlessLeaderboard);
router.get('/recent', getRecentScores);

// Protected routes
router.post('/endless/submit', authMiddleware, submitEndlessScore);
router.get('/endless/stats', optionalAuthMiddleware, getUserEndlessStats);
router.get('/endless/stats/:userId', optionalAuthMiddleware, getUserEndlessStats);

export default router;