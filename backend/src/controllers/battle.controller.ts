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
    console.log('Battle controller received request:', { 
      pokemon1Id, 
      pokemon2Id,
      options,
      timestamp: new Date().toISOString()
    });

    if (!pokemon1Id || !pokemon2Id) {
      throw new ApiError(400, 'Both pokemon1Id and pokemon2Id are required');
    }

    console.log('Calling battleService.simulateBattle...');
    const result = await battleService.simulateBattle({
      pokemon1Id,
      pokemon2Id,
      options
    });

    console.log('Battle controller sending response');
    res.json(result);
    console.log('Battle controller response sent successfully');
  } catch (error) {
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

    const result = await battleService.submitGuess(battleId, guessPercentage);
    res.json(result);
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
    const { pokemon1, pokemon2, options } = req.body;
    
    // Handle both old format (with IDs) and new format (with full instances)
    let pokemon1Id: number;
    let pokemon2Id: number;
    let battleOptions: any = options || {};
    
    if (pokemon1 && typeof pokemon1 === 'object' && pokemon1.pokemonId) {
      // New format with full Pokemon instances
      pokemon1Id = pokemon1.pokemonId;
      pokemon2Id = pokemon2.pokemonId;
      
      // Override levels from the instance data
      battleOptions.pokemon1Level = pokemon1.level;
      battleOptions.pokemon2Level = pokemon2.level;
      
      // Store the full instances for later use (future enhancement)
      battleOptions.pokemon1Instance = pokemon1;
      battleOptions.pokemon2Instance = pokemon2;
      
      console.log('🎮 Battle Tester: Controller received single battle request with full instances:', { 
        pokemon1: {
          id: pokemon1Id,
          level: pokemon1.level,
          nature: pokemon1.nature,
          ability: pokemon1.ability?.ability || 'random',
          heldItem: pokemon1.heldItem?.item || 'none'
        },
        pokemon2: {
          id: pokemon2Id,
          level: pokemon2.level,
          nature: pokemon2.nature,
          ability: pokemon2.ability?.ability || 'random',
          heldItem: pokemon2.heldItem?.item || 'none'
        },
        options: battleOptions,
        timestamp: new Date().toISOString()
      });
    } else {
      // Old format with just IDs (backward compatibility)
      const { pokemon1Id: p1Id, pokemon2Id: p2Id } = req.body;
      pokemon1Id = p1Id;
      pokemon2Id = p2Id;
      
      console.log('🎮 Battle Tester: Controller received single battle request (legacy format):', { 
        pokemon1Id, 
        pokemon2Id,
        options,
        timestamp: new Date().toISOString()
      });
    }

    if (!pokemon1Id || !pokemon2Id) {
      throw new ApiError(400, 'Both pokemon1 and pokemon2 are required');
    }

    console.log('🎮 Battle Tester: Calling battleService.simulateSingleBattle...');
    const result = await battleService.simulateSingleBattle({
      pokemon1Id,
      pokemon2Id,
      options: battleOptions
    });

    console.log('🎮 Battle Tester: Controller sending response with', {
      winner: result.winner,
      totalTurns: result.totalTurns,
      turnsCount: result.turns.length
    });
    res.json(result);
  } catch (error) {
    console.error('🎮 Battle Tester: Controller caught error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};