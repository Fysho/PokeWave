import { Router } from 'express';
import { simulateBattle, submitGuess } from '../controllers/battle.controller';

const router = Router();

// Simulate a battle between two Pokemon
router.post('/simulate', simulateBattle);

// Submit a guess for battle outcome
router.post('/guess', submitGuess);

export default router;