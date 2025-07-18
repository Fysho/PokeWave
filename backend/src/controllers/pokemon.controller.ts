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

    const pokemon = await pokemonService.getPokemonById(id);
    res.json(pokemon);
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