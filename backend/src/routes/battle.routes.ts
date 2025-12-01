import { Router, Request, Response, NextFunction } from 'express';
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
const isDev = process.env.NODE_ENV !== 'production';

// Development-only middleware
const devOnly = (req: Request, res: Response, next: NextFunction) => {
  if (!isDev) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  next();
};

// Test endpoint (development only)
router.get('/test', devOnly, (req, res) => {
  res.json({ message: 'Battle routes are working!', timestamp: new Date().toISOString() });
});

// Debug endpoint for testing battle simulation (development only)
router.post('/test-simulate', devOnly, async (req, res) => {
  try {
    const { Dex } = require('@pkmn/dex');
    const dex = Dex.forGen(1);

    // Test getting species
    const allSpecies = dex.species.all();
    const pikachu = allSpecies.find((s: { num: number }) => s.num === 25);
    const charizard = allSpecies.find((s: { num: number }) => s.num === 6);

    res.json({
      message: 'Test successful',
      pikachu: pikachu ? { name: pikachu.name, types: pikachu.types } : null,
      charizard: charizard ? { name: charizard.name, types: charizard.types } : null
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      error: 'Test failed',
      message: err.message
    });
  }
});

// Simulate a battle between two Pokemon
router.post('/simulate', simulateBattle);

// Simulate a battle with Pokemon instances (development only)
router.post('/simulate-with-instances', devOnly, async (req, res, next) => {
  try {
    logger.debug('/simulate-with-instances endpoint reached', {
      hasPokemon1: !!req.body.pokemon1,
      hasPokemon2: !!req.body.pokemon2,
      generation: req.body.generation
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

// Simulate a test battle with specific Pokemon IDs and settings (development only)
router.post('/simulate-test', devOnly, async (req, res, next) => {
  try {
    const { pokemon1Id, pokemon2Id, options = {} } = req.body;
    
    // Validate input
    if (!pokemon1Id || !pokemon2Id) {
      res.status(400).json({ error: 'Both pokemon1Id and pokemon2Id are required' });
      return;
    }
    
    logger.info(`Simulating test battle: Pokemon ${pokemon1Id} vs ${pokemon2Id} with options:`, options);
    
    // Import required services
    const { showdownService } = require('../services/showdown.service');
    const { pokemonInstanceStore } = require('../services/pokemon-instance-store.service');
    
    // Check if Pokemon instances are stored
    if (!pokemonInstanceStore.pokemonInstance1 || !pokemonInstanceStore.pokemonInstance2) {
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

// Simulate multiple battles with provided Pokemon (development only)
router.post('/simulate-multiple', devOnly, async (req, res, next) => {
  try {
    const { count = 100, pokemon1, pokemon2, generation = 9, level = 50 } = req.body;

    // Validate input
    if (!pokemon1 || !pokemon2) {
      res.status(400).json({ error: 'Both pokemon1 and pokemon2 are required' });
      return;
    }

    if (!pokemon1.id || !pokemon2.id) {
      res.status(400).json({ error: 'Both pokemon1 and pokemon2 must have an id' });
      return;
    }

    if (count < 1 || count > 1000) {
      res.status(400).json({ error: 'Count must be between 1 and 1000' });
      return;
    }

    logger.info(`Simulating ${count} battles: ${pokemon1.name || pokemon1.id} vs ${pokemon2.name || pokemon2.id} (Gen ${generation})`);

    // Import required services
    const { pokemonShowdownService } = require('../services/pokemon-showdown.service');
    const { pokemonInstanceStore } = require('../services/pokemon-instance-store.service');

    // Generate full Pokemon instances from IDs
    // Use 'none' for itemMode since we'll override with specific items if provided
    const pokemon1Level = pokemon1.level || level;
    const pokemon2Level = pokemon2.level || level;

    const [pokemon1Instance, pokemon2Instance] = await Promise.all([
      pokemonShowdownService.createPokemonInstance(pokemon1.id, pokemon1Level, generation, 'none'),
      pokemonShowdownService.createPokemonInstance(pokemon2.id, pokemon2Level, generation, 'none')
    ]);

    // Override items if specific items were provided
    if (pokemon1.item) {
      pokemon1Instance.item = pokemon1.item;
      logger.info(`Pokemon 1 holding: ${pokemon1.item}`);
    }
    if (pokemon2.item) {
      pokemon2Instance.item = pokemon2.item;
      logger.info(`Pokemon 2 holding: ${pokemon2.item}`);
    }

    // Store the Pokemon instances with generation
    pokemonInstanceStore.storeInstances(pokemon1Instance, pokemon2Instance, generation);

    // Simulate the battles
    const result = await pokemonShowdownService.simulateMultipleBattles({
      pokemon1: pokemon1Instance,
      pokemon2: pokemon2Instance,
      generation: generation,
      battleCount: count
    });

    // Also run a single detailed battle to show turn-by-turn breakdown
    const sampleBattle = await pokemonShowdownService.simulateSingleBattleTester({
      pokemon1: pokemon1Instance,
      pokemon2: pokemon2Instance,
      generation: generation
    });

    const winRate = (result.pokemon1Wins / result.totalBattles) * 100;

    logger.info(`Simulated ${count} battles: ${pokemon1Instance.name} (${result.pokemon1Wins} wins, ${winRate.toFixed(1)}%) vs ${pokemon2Instance.name} (${result.pokemon2Wins} wins)`);

    res.json({
      battleCount: result.totalBattles,
      pokemon1Wins: result.pokemon1Wins,
      pokemon2Wins: result.pokemon2Wins,
      draws: result.draws,
      winRate: winRate,
      executionTime: result.executionTime,
      sampleBattle: sampleBattle,
      pokemon1Instance: pokemon1Instance,
      pokemon2Instance: pokemon2Instance
    });
  } catch (error) {
    logger.error('Error in simulate-multiple:', error);
    next(error);
  }
});

// Simulate multiple random battles for testing (development only)
router.post('/simulate-random', devOnly, async (req, res, next) => {
  try {
    const { count = 100, options = {} } = req.body;

    // Validate count
    if (count < 1 || count > 1000) {
      res.status(400).json({ error: 'Count must be between 1 and 1000' });
      return;
    }

    // Get generation from options or default to 9
    const generation = options.generation || 9;

    logger.info(`Simulating ${count} random battles with options (Gen ${generation}):`, options);

    // Import required services
    const { pokemonService } = require('../services/pokemon.service');
    const { showdownService } = require('../services/showdown.service');
    const { pokemonInstanceStore } = require('../services/pokemon-instance-store.service');

    // Get two random Pokemon with instances
    const pokemon1Data = await pokemonService.getRandomPokemonWithInstances(options);
    const pokemon2Data = await pokemonService.getRandomPokemonWithInstances(options);

    // Store instances for battle simulation with generation
    pokemonInstanceStore.storeInstances(pokemon1Data.pokemon1, pokemon2Data.pokemon1, generation);

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

// Clear battle cache only (no regeneration)
router.post('/cache-clear', devOnly, async (req, res, next) => {
  try {
    const { battleCacheService } = require('../services/battle-cache.service');
    const { isDatabaseEnabled } = require('../config/database.config');

    // Clear existing cache
    await battleCacheService.clearCache();

    // If database is enabled, also clear database records
    if (isDatabaseEnabled()) {
      const { prisma } = require('../lib/prisma');

      // Delete all battles first (this will cascade delete related records)
      const deletedBattles = await prisma.battle.deleteMany({});

      // Delete all Pokemon instances
      const deletedInstances = await prisma.pokemonInstance.deleteMany({});

      res.json({
        message: 'Battle cache and database cleared',
        deletedBattles: deletedBattles.count,
        deletedInstances: deletedInstances.count
      });
    } else {
      res.json({
        message: 'Battle cache cleared (no database)'
      });
    }
  } catch (error) {
    next(error);
  }
});

// Refresh battle cache (development only)
router.post('/cache-refresh', devOnly, async (req, res, next) => {
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