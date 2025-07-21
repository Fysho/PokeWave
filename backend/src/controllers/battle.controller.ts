import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/error.middleware';
//import { battleService } from '../services/battle.service';
import {showdownService} from "../services/showdown.service";
import logger from "../utils/logger";

export const simulateBattle = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    logger.info('/simulate endpoint reached', {
      body: req.body,
      timestamp: new Date().toISOString()
    });

    const result = await showdownService.simulateBattle();
    console.log('Battle controller sending response');

    res.json({
      battleId: result.battleId,
      pokemon1Wins: result.pokemon1Wins,
      pokemon2Wins: result.pokemon2Wins,
      totalBattles: result.totalBattles,
      winRate: result.pokemon1Wins / result.totalBattles * 100,
      executionTime: result.executionTime
    });

    //res.json(result);
    console.log('Battle controller response sent successfully');
    logger.info(result.pokemon1Wins / result.totalBattles * 100)
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
    console.log('Battle controller sending response');

    res.json({
      battleId: result.battleId,
      pokemon1Wins: result.pokemon1Wins,
      pokemon2Wins: result.pokemon2Wins,
      totalBattles: result.totalBattles,
      winRate: result.pokemon1Wins / result.totalBattles * 100,
      executionTime: result.executionTime
    });

    //res.json(result);
    console.log('Battle controller response sent successfully');
    logger.info(result.pokemon1Wins / result.totalBattles * 100)
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