import { Router } from 'express';
import { simulateBattle, submitGuess, simulateSingleBattle } from '../controllers/battle.controller';
import { ApiError } from '../middleware/error.middleware';

const router = Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Battle routes are working!', timestamp: new Date().toISOString() });
});

// Debug endpoint for testing battle simulation
router.post('/test-simulate', async (req, res) => {
  try {
    const { Dex } = require('@pkmn/dex');
    const dex = Dex.forGen(1);
    
    // Test getting species
    const allSpecies = dex.species.all();
    const pikachu = allSpecies.find((s: any) => s.num === 25);
    const charizard = allSpecies.find((s: any) => s.num === 6);
    
    res.json({
      message: 'Test successful',
      pikachu: pikachu ? { name: pikachu.name, types: pikachu.types } : null,
      charizard: charizard ? { name: charizard.name, types: charizard.types } : null
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    });
  }
});

// Simulate a battle between two Pokemon
router.post('/simulate', simulateBattle);

// Simulate a battle with Pokemon instances
router.post('/simulate-with-instances', async (req, res, next) => {
  try {
    const { pokemon1, pokemon2, generation = 9 } = req.body;
    
    if (!pokemon1 || !pokemon2) {
      throw new ApiError(400, 'Both pokemon1 and pokemon2 instances are required');
    }
    
    // Use showdownService directly
    const { showdownService } = require('../services/showdown.service');
    const { pokemonShowdownService } = require('../services/pokemon-showdown.service');
    
    const result = await pokemonShowdownService.simulateMultipleBattles({
      pokemon1,
      pokemon2,
      generation
    });
    
    // Format the response to match what the frontend expects
    const winRate = (result.pokemon1Wins / result.totalBattles) * 100;
    
    res.json({
      battleId: result.battleId,
      pokemon1: {
        ...pokemon1,
        wins: result.pokemon1Wins
      },
      pokemon2: {
        ...pokemon2,
        wins: result.pokemon2Wins
      },
      totalBattles: result.totalBattles,
      winRate: winRate,
      executionTime: result.executionTime
    });
  } catch (error) {
    next(error);
  }
});

// Submit a guess for battle outcome
router.post('/guess', submitGuess);

// Simulate a single battle with turn-by-turn details
router.post('/simulate-single', simulateSingleBattle);

export default router;