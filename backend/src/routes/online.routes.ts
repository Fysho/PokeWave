/**
 * Online Mode Routes
 *
 * REST API routes for Online Mode operations.
 */

import { Router } from 'express';
import { onlineController } from '../controllers/online.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// ==========================================
// PUBLIC ROUTES (no auth required)
// ==========================================

// Get current round state
router.get('/round/current', onlineController.getCurrentRound);

// Get round results by round number
router.get('/round/:roundNumber/results', onlineController.getRoundResults);

// Get global leaderboard
router.get('/leaderboard', onlineController.getLeaderboard);

// Get online players
router.get('/players', onlineController.getOnlinePlayers);

// ==========================================
// AUTHENTICATED ROUTES
// ==========================================

// Submit a guess
router.post('/guess', authMiddleware, onlineController.submitGuess);

// Get user's online stats
router.get('/stats', authMiddleware, onlineController.getUserStats);

// Update presence (heartbeat)
router.post('/heartbeat', authMiddleware, onlineController.heartbeat);

// Join online mode
router.post('/join', authMiddleware, onlineController.joinOnlineMode);

// Leave online mode
router.post('/leave', authMiddleware, onlineController.leaveOnlineMode);

export default router;
