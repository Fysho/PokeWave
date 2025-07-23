import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/error.middleware';
import { pokemonService } from '../services/pokemon.service';
import { RandomPokemonSettings } from '../types/pokemon-instance.types';

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
    // Parse settings from query parameters
    const settings: RandomPokemonSettings = {};
    
    // Generation setting
    if (req.query.generation) {
      settings.generation = parseInt(req.query.generation as string);
      if (isNaN(settings.generation) || settings.generation < 1 || settings.generation > 9) {
        throw new ApiError(400, 'Invalid generation. Must be between 1 and 9');
      }
    }
    
    // Level settings - check for "random_levels" or specific level
    if (req.query.level_mode === 'random' || req.query.random_levels === 'true') {
      settings.levelMode = 'random';
      
      // Parse min and max levels if provided
      if (req.query.min_level) {
        settings.minLevel = parseInt(req.query.min_level as string);
        if (isNaN(settings.minLevel)) {
          throw new ApiError(400, 'Invalid min_level. Must be a number');
        }
      }
      
      if (req.query.max_level) {
        settings.maxLevel = parseInt(req.query.max_level as string);
        if (isNaN(settings.maxLevel)) {
          throw new ApiError(400, 'Invalid max_level. Must be a number');
        }
      }
    } else {
      // Fixed level mode
      settings.levelMode = 'fixed';
      
      if (req.query.level) {
        settings.level = parseInt(req.query.level as string);
        if (isNaN(settings.level)) {
          throw new ApiError(400, 'Invalid level. Must be a number');
        }
      }
    }
    
    // Item settings
    if (req.query.item_mode) {
      const itemMode = req.query.item_mode as string;
      if (itemMode !== 'random' && itemMode !== 'none') {
        throw new ApiError(400, 'Invalid item_mode. Must be "random" or "none"');
      }
      settings.itemMode = itemMode;
    } else if (req.query.no_items === 'true') {
      // Alternative way to set no items
      settings.itemMode = 'none';
    }

    const pokemonInstances = await pokemonService.getRandomPokemonWithInstances(settings);
    res.json(pokemonInstances);
  } catch (error) {
    next(error);
  }
};

export const getPokedex = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const generation = req.query.generation 
      ? parseInt(req.query.generation as string) 
      : undefined;

    const pokedexData = await pokemonService.getPokedexData(generation);
    res.json(pokedexData);
  } catch (error) {
    next(error);
  }
};

export const getPokemonById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id) || id < 1 || id > 1025) {
      throw new ApiError(400, 'Invalid Pokemon ID');
    }

    const pokemonData = await pokemonService.getPokemonDataById(id);
    res.json(pokemonData);
  } catch (error) {
    next(error);
  }
};

export const getAvailableMovesForPokemon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const generation = req.query.generation ? parseInt(req.query.generation as string) : 9;
    const level = req.query.level ? parseInt(req.query.level as string) : 50;
    const debugMode = req.query.debugMode === 'true';
    
    if (isNaN(id) || id < 1 || id > 1025) {
      throw new ApiError(400, 'Invalid Pokemon ID');
    }

    const availableMoves = await pokemonService.getAvailableMovesForPokemon(id, generation, level, debugMode);
    res.json({ moves: availableMoves });
  } catch (error) {
    next(error);
  }
};

export const updatePokemonInstanceMove = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { moveIndex, newMove } = req.body;
    
    if (isNaN(id) || id < 1 || id > 1025) {
      throw new ApiError(400, 'Invalid Pokemon ID');
    }

    if (typeof moveIndex !== 'number' || moveIndex < 0 || moveIndex > 3) {
      throw new ApiError(400, 'Invalid move index');
    }

    if (!newMove || !newMove.name || !newMove.id) {
      throw new ApiError(400, 'Invalid move data');
    }

    // Update the Pokemon instance in the store
    await pokemonService.updatePokemonInstanceMove(id, moveIndex, newMove);
    
    res.json({ success: true, message: 'Move updated successfully' });
  } catch (error) {
    next(error);
  }
};