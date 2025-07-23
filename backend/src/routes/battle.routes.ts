import { Router } from 'express';
import { 
  simulateBattle, 
  submitGuess, 
  simulateSingleBattle, 
  getBattleCacheStats,
  getPopularBattles,
  getHardestBattles,
  getBattleStats
} from '../controllers/battle.controller';
import { optionalAuthMiddleware } from '../middleware/auth.middleware';

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
    console.log('/simulate-with-instances endpoint reached', {
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      message: 'Endpoint reached successfully',
      receivedData: {
        hasPokemon1: !!req.body.pokemon1,
        hasPokemon2: !!req.body.pokemon2,
        generation: req.body.generation
      }
    });
  } catch (error) {
    next(error);
  }
});

// Submit a guess for battle outcome (with optional auth for Pokedex unlocks)
router.post('/guess', optionalAuthMiddleware, submitGuess);

// Simulate a single battle with turn-by-turn details
router.post('/simulate-single', simulateSingleBattle);

// Get battle cache statistics
router.get('/cache-stats', getBattleCacheStats);

// Get popular battles (most played)
router.get('/popular', getPopularBattles);

// Get hardest battles (lowest accuracy rate)
router.get('/hardest', getHardestBattles);

// Get battle statistics by ID
router.get('/stats/:battleId', getBattleStats);

// Refresh battle cache (admin/development route)
router.post('/cache-refresh', async (req, res, next) => {
  try {
    const { battleCacheService } = require('../services/battle-cache.service');
    
    // Clear existing cache
    await battleCacheService.clearCache();
    
    // Reinitialize with new settings
    await battleCacheService.initialize();
    
    const stats = await battleCacheService.getCacheStats();
    
    res.json({
      message: 'Battle cache refreshed successfully',
      cacheSize: stats.size,
      targetSize: 100
    });
  } catch (error) {
    next(error);
  }
});

export default router;