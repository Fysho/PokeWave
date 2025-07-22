import { Router } from 'express';
import { dailyChallengeController } from '../controllers/daily-challenge.controller';

const router = Router();

// Get today's daily challenge
router.get('/today', (req, res) => dailyChallengeController.getTodaysChallenge(req, res));

// Get available challenges list
router.get('/available', (req, res) => dailyChallengeController.getAvailableChallenges(req, res));

// Get challenge for specific date
router.get('/:date', (req, res) => dailyChallengeController.getChallengeByDate(req, res));

// Admin endpoint to refresh challenges
router.post('/refresh', (req, res) => dailyChallengeController.refreshChallenges(req, res));

export default router;