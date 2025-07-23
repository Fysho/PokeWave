import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/error.middleware';
//import { battleService } from '../services/battle.service';
import {showdownService} from "../services/showdown.service";
import { battleCacheService } from '../services/battle-cache.service';
import { pokemonInstanceStore } from '../services/pokemon-instance-store.service';
import { battleStatsService } from '../services/battle-stats.service';
import logger from "../utils/logger";

export const simulateBattle = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    logger.info('/simulate endpoint reached - using cached battle', {
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Get a random cached battle instead of simulating a new one
    const result = await battleCacheService.getRandomBattle();
    
    if (!result) {
      throw new ApiError(500, 'Failed to get battle from cache');
    }
    
    console.log('Battle controller sending cached battle response');

    res.json({
      battleId: result.battleId,
      pokemon1: result.pokemon1,
      pokemon2: result.pokemon2,
      pokemon1Wins: result.pokemon1Wins,
      pokemon2Wins: result.pokemon2Wins,
      draws: result.draws,
      totalBattles: result.totalBattles,
      winRate: result.winRate,
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
  req: Request,
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

    // Log the guess
    logger.info('Guess submitted', {
      battleId,
      guessPercentage,
      actualWinRate,
      isCorrect,
      accuracy: accuracy.toFixed(2),
      points,
      battleStats: {
        totalAttempts: battleStats.totalAttempts,
        successRate: battleStats.successRate.toFixed(2)
      }
    });

    // Return the result with battle statistics
    res.json({
      battleId,
      guessPercentage,
      actualWinRate,
      isCorrect,
      accuracy,
      points,
      message: isCorrect 
        ? `Great guess! You were ${accuracy.toFixed(1)}% accurate!` 
        : `Not quite! The actual win rate was ${actualWinRate.toFixed(1)}%`,
      battleStats: {
        totalAttempts: battleStats.totalAttempts,
        successfulAttempts: battleStats.successfulAttempts,
        successRate: parseFloat(battleStats.successRate.toFixed(2))
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