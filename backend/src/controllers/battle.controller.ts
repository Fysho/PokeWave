import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/error.middleware';
import { getBattleService, getUserService } from '../services/service-factory';
import {showdownService} from "../services/showdown.service";
import { battleCacheService } from '../services/battle-cache.service';
import { pokemonInstanceStore } from '../services/pokemon-instance-store.service';
import { battleStatsService } from '../services/battle-stats.service';
import logger from "../utils/logger";

const battleService = getBattleService();
const userService = getUserService();

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

export const simulateBattle = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('/simulate endpoint reached', {
      method: req.method,
      body: req.body,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });

    const { pokemon1, pokemon2 } = req.body;

    // Validate input
    if (!pokemon1 || !pokemon2) {
      throw new ApiError(400, 'Both pokemon1 and pokemon2 are required');
    }

    logger.info('/simulate endpoint reached', {
      pokemon1: pokemon1?.name,
      pokemon2: pokemon2?.name,
      timestamp: new Date().toISOString()
    });

    // Return a pre-generated battle from the cache
    const result = await battleCacheService.getRandomBattle();
    
    if (!result) {
      throw new ApiError(503, 'No battles available in cache');
    }
    
    console.log('Battle controller sending response...');
    
    res.json({
      battleId: result.battleId,
      pokemon1: result.pokemon1,
      pokemon2: result.pokemon2,
      winRate: result.winRate,
      totalBattles: result.totalBattles,
      executionTime: result.executionTime
    });

    console.log('Battle controller response sent successfully');
    logger.info(`Served cached battle ${result.battleId} - Win rate: ${result.winRate}%`);
    }

    catch (error) {
    console.error('Battle controller caught error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

export const submitGuess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { battleId, guessPercentage, actualWinRate, guessRange } = req.body;

    // Validate inputs
    if (!battleId || guessPercentage === undefined || guessPercentage === null) {
      throw new ApiError(400, 'Both battleId and guessPercentage are required');
    }

    if (typeof guessPercentage !== 'number' || guessPercentage < 0 || guessPercentage > 100) {
      throw new ApiError(400, 'guessPercentage must be a number between 0 and 100');
    }

    if (!actualWinRate || typeof actualWinRate !== 'number') {
      throw new ApiError(400, 'actualWinRate is required and must be a number');
    }

    // Evaluate the guess
    let isCorrect = false;
    let accuracy = 0;
    let points = 0;

    if (guessRange && Array.isArray(guessRange) && guessRange.length === 2) {
      // Range guess evaluation (for endless mode)
      const [minGuess, maxGuess] = guessRange;
      isCorrect = actualWinRate >= minGuess && actualWinRate <= maxGuess;
      
      if (isCorrect) {
        const rangeSize = maxGuess - minGuess;
        const rangePenalty = rangeSize / 100; // Penalty for larger ranges
        accuracy = Math.max(0, 100 - rangeSize);
        points = Math.round(100 * (1 - rangePenalty));
      }
    } else {
      // Single value guess evaluation
      const difference = Math.abs(guessPercentage - actualWinRate);
      isCorrect = difference <= 10; // Within 10% is considered correct
      accuracy = Math.max(0, 100 - difference);
      
      if (isCorrect) {
        points = Math.round(100 - difference);
      }
    }

    // Record the guess attempt in battle stats
    const battleStats = await battleStatsService.recordGuessAttempt(battleId, isCorrect);
    
    // Update battle prediction statistics in database
    try {
      const cachedBattle = await battleCacheService.getCachedBattle(battleId);
      if (cachedBattle && 'dbBattleId' in cachedBattle && cachedBattle.dbBattleId) {
        // If this battle has a database record, update the statistics
        const { battleTrackerService } = await import('../services/battle-tracker.service');
        await battleTrackerService.updateBattlePrediction(
          cachedBattle.dbBattleId,
          guessPercentage,
          actualWinRate / 100 // Convert to 0-1 range
        );
      }
    } catch (error) {
      // Don't fail the request if stats update fails
      logger.error('Failed to update battle prediction stats:', error);
    }

    // If user is authenticated and guess is correct, unlock Pokemon in their Pokedex
    if (req.user && isCorrect) {
      try {
        // Get the cached battle to retrieve Pokemon info
        const cachedBattle = await battleCacheService.getCachedBattle(battleId);
        if (cachedBattle && cachedBattle.pokemon1 && cachedBattle.pokemon2) {
          const pokemon1Id = cachedBattle.pokemon1.id;
          const pokemon2Id = cachedBattle.pokemon2.id;
          const pokemon1Shiny = cachedBattle.pokemon1.shiny || false;
          const pokemon2Shiny = cachedBattle.pokemon2.shiny || false;

          // Unlock both Pokemon
          await userService.unlockPokemon(req.user.id, pokemon1Id, pokemon1Shiny);
          await userService.unlockPokemon(req.user.id, pokemon2Id, pokemon2Shiny);

          logger.info(`Pokemon unlocked for user ${req.user.username}: ${pokemon1Id} (shiny: ${pokemon1Shiny}), ${pokemon2Id} (shiny: ${pokemon2Shiny})`);
        }
      } catch (error) {
        // Don't fail the request if Pokemon unlock fails
        logger.error('Failed to unlock Pokemon for user:', error);
      }
    }

    // Log the guess
    logger.info('Guess submitted', {
      battleId,
      guessPercentage,
      actualWinRate,
      isCorrect,
      accuracy: accuracy.toFixed(2),
      points,
      battleStats: {
        totalGuesses: battleStats.totalAttempts,
        correctGuesses: battleStats.successfulAttempts
      }
    });

    const message = isCorrect 
      ? `Great job! You were ${accuracy.toFixed(1)}% accurate!`
      : `Not quite! You were ${(100 - accuracy).toFixed(1)}% off.`;

    res.json({
      success: true,
      battleId,
      guessPercentage,
      actualWinRate,
      isCorrect,
      accuracy: accuracy.toFixed(2),
      points,
      message,
      battleStats: {
        totalAttempts: battleStats.totalAttempts,
        successfulAttempts: battleStats.successfulAttempts,
        successRate: battleStats.totalAttempts > 0 
          ? Math.round((battleStats.successfulAttempts / battleStats.totalAttempts) * 100)
          : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

export const simulateSingleBattle = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { pokemon1, pokemon2 } = req.body;

    // Validate input
    if (!pokemon1 || !pokemon2) {
      throw new ApiError(400, 'Both pokemon1 and pokemon2 are required');
    }

    logger.info('/simulate SINGLE FOR BATTLE TEST endpoint reached', {
      pokemon1: pokemon1?.name,
      pokemon2: pokemon2?.name,
      timestamp: new Date().toISOString()
    });

    // Store the Pokemon instances temporarily for the battle
    pokemonInstanceStore.storeInstances(pokemon1, pokemon2);

    // Run the battle simulation
    const result = await showdownService.simulateSingleBattle();
    console.log('Battle controller sending response with turn details');
    
    // Return the full battle result with turn-by-turn details
    res.json(result);
    
    console.log('Battle controller response sent successfully');
    logger.info(`Battle completed: ${result.winner} won in ${result.totalTurns} turns`)
  }

  catch (error) {
    console.error('Battle controller caught error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

export const getBattleCacheStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get current cache statistics
    const stats = await battleCacheService.getCacheStats();
    res.json({
      status: 'ok',
      cacheSize: stats.size,
      targetSize: 5,
      battles: stats.battles
    });
  } catch (error) {
    next(error);
  }
};

// Get popular battles
export const getPopularBattles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (limit < 1 || limit > 100) {
      throw new ApiError(400, 'Limit must be between 1 and 100');
    }
    
    if (!battleService.getPopularBattles) {
      throw new ApiError(501, 'This feature is only available with database storage enabled');
    }
    
    const popularBattles = await battleService.getPopularBattles(limit);
    
    res.json({
      battles: popularBattles
    });
  } catch (error) {
    next(error);
  }
};

// Get hardest battles
export const getHardestBattles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (limit < 1 || limit > 100) {
      throw new ApiError(400, 'Limit must be between 1 and 100');
    }
    
    if (!battleService.getHardestBattles) {
      throw new ApiError(501, 'This feature is only available with database storage enabled');
    }
    
    const hardestBattles = await battleService.getHardestBattles(limit);
    
    res.json({
      battles: hardestBattles
    });
  } catch (error) {
    next(error);
  }
};

// Get battle statistics
export const getBattleStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { battleId } = req.params;
    
    if (!battleId) {
      throw new ApiError(400, 'Battle ID is required');
    }
    
    if (!battleService.getBattleStats) {
      throw new ApiError(501, 'This feature is only available with database storage enabled');
    }
    
    const stats = await battleService.getBattleStats(battleId);
    
    if (!stats) {
      throw new ApiError(404, 'Battle not found or statistics not available');
    }
    
    res.json(stats);
  } catch (error) {
    next(error);
  }
};