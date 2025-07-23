import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/error.middleware';
import { getUserService } from '../services/service-factory';
import logger from '../utils/logger';

const userService = getUserService();

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

interface PokedexSyncRequest {
  unlockedPokemon: number[];
  unlockedShinyPokemon: number[];
  pokemonCounts: [number, number][];
  shinyPokemonCounts: [number, number][];
}

interface GameStatsSyncRequest {
  totalBattles?: number;
  totalCorrectGuesses?: number;
  highestStreak?: number;
  endlessHighScore?: number;
  dailyChallengeScores?: { [date: string]: number };
}

export const syncPokedex = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const pokedexData: PokedexSyncRequest = req.body;

    // Validate pokedex data
    if (!Array.isArray(pokedexData.unlockedPokemon) || 
        !Array.isArray(pokedexData.unlockedShinyPokemon) ||
        !Array.isArray(pokedexData.pokemonCounts) ||
        !Array.isArray(pokedexData.shinyPokemonCounts)) {
      throw new ApiError(400, 'Invalid pokedex data format');
    }

    const updatedUser = await userService.updatePokedex(userId, pokedexData);
    if (!updatedUser) {
      throw new ApiError(404, 'User not found');
    }

    logger.info(`Pokedex synced for user ${req.user?.username}`);

    res.json({
      success: true,
      message: 'Pokedex data synced successfully',
      pokedex: updatedUser.pokedex
    });
  } catch (error) {
    next(error);
  }
};

export const syncGameStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const gameStats: GameStatsSyncRequest = req.body;

    const updatedUser = await userService.updateGameStats(userId, gameStats);
    if (!updatedUser) {
      throw new ApiError(404, 'User not found');
    }

    logger.info(`Game stats synced for user ${req.user?.username}`);

    res.json({
      success: true,
      message: 'Game stats synced successfully',
      gameStats: updatedUser.gameStats
    });
  } catch (error) {
    next(error);
  }
};

export const getUserData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const user = await userService.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      avatarPokemonId: user.avatarPokemonId,
      avatarSprite: user.avatarSprite,
      pokedex: user.pokedex || {
        unlockedPokemon: [],
        unlockedShinyPokemon: [],
        pokemonCounts: [],
        shinyPokemonCounts: []
      },
      gameStats: user.gameStats || {
        totalBattles: 0,
        totalCorrectGuesses: 0,
        highestStreak: 0,
        endlessHighScore: 0,
        dailyChallengeScores: {}
      },
      lastUpdated: 'updatedAt' in user ? user.updatedAt : (user as any).lastUpdated
    });
  } catch (error) {
    next(error);
  }
};

export const unlockPokemon = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const { pokemonId, isShiny } = req.body;

    if (typeof pokemonId !== 'number' || pokemonId < 1 || pokemonId > 1025) {
      throw new ApiError(400, 'Invalid Pokemon ID');
    }

    const updatedUser = await userService.unlockPokemon(userId, pokemonId, isShiny || false);
    if (!updatedUser) {
      throw new ApiError(404, 'User not found');
    }

    logger.info(`Pokemon ${pokemonId} unlocked for user ${req.user?.username}`);

    res.json({
      success: true,
      message: `Pokemon ${pokemonId} unlocked successfully`,
      pokedex: updatedUser.pokedex
    });
  } catch (error) {
    next(error);
  }
};