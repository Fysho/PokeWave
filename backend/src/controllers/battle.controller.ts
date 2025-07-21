import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/error.middleware';
//import { battleService } from '../services/battle.service';
import {showdownService} from "../services/showdown.service";

export const simulateBattle = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('/simulate endpoint reached', {
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Check if the request includes Pokemon instances
    const { pokemon1, pokemon2, generation } = req.body;
    
    if (pokemon1 && pokemon2) {
      // New flow: directly simulate with provided instances
      const { pokemonShowdownService } = require('../services/pokemon-showdown.service');
      
      const result = await pokemonShowdownService.simulateMultipleBattles({
        pokemon1,
        pokemon2,
        generation: generation || 9
      });
      
      // Format the response to match what the frontend expects
      const winRate = (result.pokemon1Wins / result.totalBattles) * 100;
      
      res.json({
        battleId: result.battleId,
        pokemon1: {
          ...pokemon1,
          wins: result.pokemon1Wins
        },
        pokemon2: {
          ...pokemon2,
          wins: result.pokemon2Wins
        },
        totalBattles: result.totalBattles,
        winRate: winRate,
        executionTime: result.executionTime
      });
    } else {
      // Old flow: use stored instances (will throw error if not stored)
      const result = await showdownService.simulateBattle();
      console.log('Battle controller sending response');
      res.json(result);
      console.log('Battle controller response sent successfully');
    }

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
    const { pokemon1, pokemon2, options } = req.body;
    
    // Handle both old format (with IDs) and new format (with full instances)
    let pokemon1Id: number;
    let pokemon2Id: number;
    let battleOptions: any = options || {};
    
    if (pokemon1 && typeof pokemon1 === 'object' && pokemon1.pokemonId) {
      // New format with full Pokemon instances
      pokemon1Id = pokemon1.pokemonId;
      pokemon2Id = pokemon2.pokemonId;
      
      // Extract levels from instances for backward compatibility with showdown service
      battleOptions.pokemon1Level = pokemon1.level;
      battleOptions.pokemon2Level = pokemon2.level;
      
      // Store the full instances in options
      battleOptions.pokemon1Instance = pokemon1;
      battleOptions.pokemon2Instance = pokemon2;
      
      console.log('🎮 Battle Tester: Controller received single battle request with full instances:', { 
        pokemon1Instance: pokemon1,
        pokemon2Instance: pokemon2,
        options: {
          generation: battleOptions.generation,
          aiDifficulty: battleOptions.aiDifficulty
        },
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

    // Ensure we have the instances
    if (!battleOptions.pokemon1Instance || !battleOptions.pokemon2Instance) {
      throw new ApiError(400, 'Pokemon instances are required for battle simulation');
    }

    console.log('🎮 Battle Tester: Calling showdownService.simulateSingleBattle...');
    const result = await showdownService.simulateSingleBattle({
      pokemon1: battleOptions.pokemon1Instance,
      pokemon2: battleOptions.pokemon2Instance,
      generation: battleOptions.generation || 9
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