import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/error.middleware';
//import { battleService } from '../services/battle.service';
import {showdownService} from "../services/showdown.service";
import { battleCacheService } from '../services/battle-cache.service';
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
    const { battleId, guessPercentage } = req.body;

    if (!battleId || guessPercentage === undefined || guessPercentage === null) {
      throw new ApiError(400, 'Both battleId and guessPercentage are required');
    }

    if (typeof guessPercentage !== 'number' || guessPercentage < 0 || guessPercentage > 100) {
      throw new ApiError(400, 'guessPercentage must be a number between 0 and 100');
    }

    //const result = await battleService.submitGuess(battleId, guessPercentage);
    //res.json(result);
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

    logger.info('/simulate SINGLE FOR BATTLE TEST endpoint reached', {
      body: req.body,
      timestamp: new Date().toISOString()
    });

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