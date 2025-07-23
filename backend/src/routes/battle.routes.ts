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
import { ApiError } from '../middleware/error.middleware';
import logger from '../utils/logger';

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

// Simulate a test battle with specific Pokemon IDs and settings
router.post('/simulate-test', async (req, res, next) => {
  try {
    const { pokemon1Id, pokemon2Id, pokemon1InstanceId, pokemon2InstanceId, options = {} } = req.body;
    
    // Validate input
    if (!pokemon1Id || !pokemon2Id) {
      res.status(400).json({ error: 'Both pokemon1Id and pokemon2Id are required' });
      return;
    }
    
    logger.info(`Simulating test battle: Pokemon ${pokemon1Id} vs ${pokemon2Id} with options:`, options);
    
    // Import required services
    const { showdownService } = require('../services/showdown.service');
    const { pokemonInstanceStore } = require('../services/pokemon-instance-store.service');
    
    // Get the stored Pokemon instances
    const instances = pokemonInstanceStore.getInstances();
    if (!instances || !instances.pokemon1 || !instances.pokemon2) {
      throw new ApiError(500, 'Pokemon instances not found. Please generate new Pokemon first.');
    }
    
    // Simulate the battle
    const result = await showdownService.simulateBattle(100); // 100 battles
    
    logger.info(`Test battle completed: Pokemon 1 wins: ${result.pokemon1Wins}, Pokemon 2 wins: ${result.pokemon2Wins}`);
    
    res.json({
      pokemon1Wins: result.pokemon1Wins,
      pokemon2Wins: result.pokemon2Wins,
      draws: result.draws,
      totalBattles: result.totalBattles,
      winRate: result.winRate,
      executionTime: result.executionTime
    });
  } catch (error) {
    logger.error('Error in simulate-test:', error);
    next(error);
  }
});

// Simulate multiple random battles for testing
router.post('/simulate-random', async (req, res, next) => {
  try {
    const { count = 100, options = {} } = req.body;
    
    // Validate count
    if (count < 1 || count > 1000) {
      res.status(400).json({ error: 'Count must be between 1 and 1000' });
      return;
    }
    
    logger.info(`Simulating ${count} random battles with options:`, options);
    
    // Import required services
    const { pokemonService } = require('../services/pokemon.service');
    const { showdownService } = require('../services/showdown.service');
    const { pokemonInstanceStore } = require('../services/pokemon-instance-store.service');
    
    // Get two random Pokemon with instances
    const pokemon1Data = await pokemonService.getRandomPokemonWithInstances(options);
    const pokemon2Data = await pokemonService.getRandomPokemonWithInstances(options);
    
    // Store instances for battle simulation
    pokemonInstanceStore.storeInstances(pokemon1Data.pokemon1, pokemon2Data.pokemon1);
    
    // Simulate the battles
    const result = await showdownService.simulateBattle(count);
    
    logger.info(`Simulated ${count} battles: ${pokemon1Data.pokemon1.name} (${result.pokemon1Wins} wins) vs ${pokemon2Data.pokemon1.name} (${result.pokemon2Wins} wins)`);
    
    res.json({
      battleCount: count,
      pokemon1Name: pokemon1Data.pokemon1.name,
      pokemon2Name: pokemon2Data.pokemon1.name,
      pokemon1Wins: result.pokemon1Wins,
      pokemon2Wins: result.pokemon2Wins,
      draws: result.draws,
      winRate: result.winRate,
      executionTime: result.executionTime
    });
  } catch (error) {
    logger.error('Error in simulate-random:', error);
    next(error);
  }
});

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
    const { isDatabaseEnabled } = require('../config/database.config');
    const { BATTLE_CONFIG } = require('../config/game-constants');
    
    // Clear existing cache
    await battleCacheService.clearCache();
    
    // If database is enabled, also clear database records
    if (isDatabaseEnabled()) {
      const { prisma } = require('../lib/prisma');
      
      // Delete all battles first (this will cascade delete related records)
      const deletedBattles = await prisma.battle.deleteMany({});
      logger.info(`Deleted ${deletedBattles.count} battles from database`);
      
      // Delete all Pokemon instances
      const deletedInstances = await prisma.pokemonInstance.deleteMany({});
      logger.info(`Deleted ${deletedInstances.count} Pokemon instances from database`);
    }
    
    // Reinitialize with new settings
    await battleCacheService.initialize();
    
    const stats = await battleCacheService.getCacheStats();
    
    res.json({
      message: 'Battle cache and database refreshed successfully',
      cacheSize: stats.size,
      targetSize: BATTLE_CONFIG.CACHE_SIZE
    });
  } catch (error) {
    next(error);
  }
});

export default router;