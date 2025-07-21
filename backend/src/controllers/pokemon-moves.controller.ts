import { Request, Response, NextFunction } from 'express';
import { pokemonMoveStoreService } from '../services/pokemon-move-store.service';
import logger from '../utils/logger';
import { ApiError } from '../middleware/error.middleware';

/**
 * Get all moves
 */
export const getAllMoves = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit, offset, type, category } = req.query;
    
    let moves = pokemonMoveStoreService.getAllMoves();
    
    // Apply filters if provided
    if (type && typeof type === 'string') {
      moves = moves.filter(move => move.type === type.toLowerCase());
    }
    
    if (category && typeof category === 'string') {
      moves = moves.filter(move => move.category === category.toLowerCase());
    }
    
    // Apply pagination
    const startIndex = offset ? parseInt(offset as string) : 0;
    const endIndex = limit ? startIndex + parseInt(limit as string) : moves.length;
    
    const paginatedMoves = moves.slice(startIndex, endIndex);
    
    res.json({
      moves: paginatedMoves,
      total: moves.length,
      offset: startIndex,
      limit: endIndex - startIndex
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific move by name
 */
export const getMoveById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.params;
    
    const move = pokemonMoveStoreService.getMove(name);
    
    if (!move) {
      throw new ApiError(404, `Move '${name}' not found`);
    }
    
    res.json(move);
  } catch (error) {
    next(error);
  }
};

/**
 * Get moves by type
 */
export const getMovesByType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    const { limit, offset } = req.query;
    
    let moves = pokemonMoveStoreService.getMovesByType(type);
    
    // Apply pagination
    const startIndex = offset ? parseInt(offset as string) : 0;
    const endIndex = limit ? startIndex + parseInt(limit as string) : moves.length;
    
    const paginatedMoves = moves.slice(startIndex, endIndex);
    
    res.json({
      type,
      moves: paginatedMoves,
      total: moves.length,
      offset: startIndex,
      limit: endIndex - startIndex
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get moves by category
 */
export const getMovesByCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    const { limit, offset } = req.query;
    
    // Validate category
    if (!['physical', 'special', 'status'].includes(category.toLowerCase())) {
      throw new ApiError(400, 'Invalid category. Must be one of: physical, special, status');
    }
    
    let moves = pokemonMoveStoreService.getMovesByCategory(category as 'physical' | 'special' | 'status');
    
    // Apply pagination
    const startIndex = offset ? parseInt(offset as string) : 0;
    const endIndex = limit ? startIndex + parseInt(limit as string) : moves.length;
    
    const paginatedMoves = moves.slice(startIndex, endIndex);
    
    res.json({
      category,
      moves: paginatedMoves,
      total: moves.length,
      offset: startIndex,
      limit: endIndex - startIndex
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get moves that a specific Pokemon can learn
 */
export const getMovesForPokemon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pokemonName } = req.params;
    const { limit, offset } = req.query;
    
    let moves = pokemonMoveStoreService.getMovesForPokemon(pokemonName);
    
    // Apply pagination
    const startIndex = offset ? parseInt(offset as string) : 0;
    const endIndex = limit ? startIndex + parseInt(limit as string) : moves.length;
    
    const paginatedMoves = moves.slice(startIndex, endIndex);
    
    res.json({
      pokemon: pokemonName,
      moves: paginatedMoves,
      total: moves.length,
      offset: startIndex,
      limit: endIndex - startIndex
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search moves by name or effect
 */
export const searchMoves = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, limit, offset } = req.query;
    
    if (!q || typeof q !== 'string') {
      throw new ApiError(400, 'Query parameter "q" is required');
    }
    
    let moves = pokemonMoveStoreService.searchMoves(q);
    
    // Apply pagination
    const startIndex = offset ? parseInt(offset as string) : 0;
    const endIndex = limit ? startIndex + parseInt(limit as string) : moves.length;
    
    const paginatedMoves = moves.slice(startIndex, endIndex);
    
    res.json({
      query: q,
      moves: paginatedMoves,
      total: moves.length,
      offset: startIndex,
      limit: endIndex - startIndex
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get move store status
 */
export const getMoveStoreStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = pokemonMoveStoreService.getStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
};

/**
 * Force refresh the move store
 */
export const refreshMoveStore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Admin request to refresh move store');
    
    // Start refresh in background
    pokemonMoveStoreService.refresh()
      .then(() => logger.info('Move store refresh completed'))
      .catch(error => logger.error('Move store refresh failed:', error));
    
    res.json({
      message: 'Move store refresh initiated',
      status: 'in_progress'
    });
  } catch (error) {
    next(error);
  }
};