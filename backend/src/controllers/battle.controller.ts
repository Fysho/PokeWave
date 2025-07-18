import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/error.middleware';
import { battleService } from '../services/battle.service';

export const simulateBattle = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { pokemon1Id, pokemon2Id, options } = req.body;

    if (!pokemon1Id || !pokemon2Id) {
      throw new ApiError(400, 'Both pokemon1Id and pokemon2Id are required');
    }

    const result = await battleService.simulateBattle({
      pokemon1Id,
      pokemon2Id,
      options
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const submitGuess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { battleId, guessedWinRate } = req.body;

    if (!battleId || guessedWinRate === undefined) {
      throw new ApiError(400, 'Both battleId and guessedWinRate are required');
    }

    if (guessedWinRate < 0 || guessedWinRate > 100) {
      throw new ApiError(400, 'Guessed win rate must be between 0 and 100');
    }

    const result = await battleService.submitGuess(battleId, guessedWinRate);
    res.json(result);
  } catch (error) {
    next(error);
  }
};