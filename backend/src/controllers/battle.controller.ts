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
    const { battleId, guess } = req.body;

    if (!battleId || !guess) {
      throw new ApiError(400, 'Both battleId and guess (Pokemon ID) are required');
    }

    if (typeof guess !== 'number') {
      throw new ApiError(400, 'Guess must be a valid Pokemon ID (number)');
    }

    const result = await battleService.submitGuess(battleId, guess);
    res.json(result);
  } catch (error) {
    next(error);
  }
};