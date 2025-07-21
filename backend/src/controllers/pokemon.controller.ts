import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/error.middleware';
import { pokemonService } from '../services/pokemon.service';

export const getPokemon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id) || id < 1 || id > 1025) {
      throw new ApiError(400, 'Invalid Pokemon ID');
    }

    // This endpoint is not currently used by the frontend
    // Returning a placeholder response
    throw new ApiError(501, 'This endpoint is not implemented. Pokemon data is now fetched through the battle simulation endpoints.');
  } catch (error) {
    next(error);
  }
};

export const getRandomPokemon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const generation = req.query.generation 
      ? parseInt(req.query.generation as string) 
      : 9;

    const randomIds = pokemonService.getRandomPokemonIds(generation);
    res.json(randomIds);
  } catch (error) {
    next(error);
  }
};

export const getRandomPokemonWithInstances = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const generation = req.query.generation 
      ? parseInt(req.query.generation as string) 
      : 1;  // Default to Gen 1 for the game
    
    const level = req.query.level
      ? parseInt(req.query.level as string)
      : 50;

    // Validate inputs
    if (generation < 1 || generation > 9) {
      throw new ApiError(400, 'Invalid generation. Must be between 1 and 9');
    }
    
    if (level < 1 || level > 100) {
      throw new ApiError(400, 'Invalid level. Must be between 1 and 100');
    }

    const pokemonInstances = await pokemonService.getRandomPokemonWithInstances(generation, level);
    res.json(pokemonInstances);
  } catch (error) {
    next(error);
  }
};