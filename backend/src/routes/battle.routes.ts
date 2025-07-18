import { Router } from 'express';
import { simulateBattle, submitGuess, simulateSingleBattle } from '../controllers/battle.controller';

const router = Router();

// Simulate a battle between two Pokemon
router.post('/simulate', simulateBattle);

// Submit a guess for battle outcome
router.post('/guess', submitGuess);

// Simulate a single battle with turn-by-turn details
router.post('/simulate-single', simulateSingleBattle);

export default router;