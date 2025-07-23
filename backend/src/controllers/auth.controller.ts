import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from '../middleware/error.middleware';
import { getUserService } from '../services/service-factory';
import logger from '../utils/logger';

const userService = getUserService();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = '7d';

export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      throw new ApiError(400, 'Username and password are required');
    }

    if (username.length < 3) {
      throw new ApiError(400, 'Username must be at least 3 characters long');
    }

    if (password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters long');
    }

    // Check if user already exists
    const existingUser = await userService.findByUsername(username);
    if (existingUser) {
      throw new ApiError(409, 'Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await userService.createUser({
      username,
      password: hashedPassword
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    logger.info(`New user registered: ${username}`);

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        avatarPokemonId: user.avatarPokemonId,
        avatarSprite: user.avatarSprite,
        pokedex: user.pokedex,
        gameStats: user.gameStats
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

export const signIn = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      throw new ApiError(400, 'Username and password are required');
    }

    // Find user
    const user = await userService.findByUsername(username);
    if (!user) {
      throw new ApiError(401, 'Invalid username or password');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid username or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    logger.info(`User signed in: ${username}`);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        avatarPokemonId: user.avatarPokemonId,
        avatarSprite: user.avatarSprite,
        pokedex: user.pokedex,
        gameStats: user.gameStats
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // User is attached by auth middleware
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const user = await userService.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        avatarPokemonId: user.avatarPokemonId,
        avatarSprite: user.avatarSprite,
        pokedex: user.pokedex,
        gameStats: user.gameStats
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateAvatar = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { avatarPokemonId, avatarSprite } = req.body;
    
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (!avatarPokemonId || !avatarSprite) {
      throw new ApiError(400, 'Avatar Pokemon ID and sprite URL are required');
    }

    logger.info(`Attempting to update avatar for user ID: ${userId}`);

    // For development: ensure user exists (recreate if needed)
    const username = req.user?.username;
    if (username && userService.ensureUserExists) {
      await userService.ensureUserExists({ id: userId, username });
    }

    const updatedUser = await userService.updateUser(userId, {
      avatarPokemonId,
      avatarSprite
    });

    if (!updatedUser) {
      throw new ApiError(404, 'User not found');
    }

    logger.info(`User ${updatedUser.username} updated avatar to Pokemon ${avatarPokemonId}`);

    res.json({
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        createdAt: updatedUser.createdAt,
        avatarPokemonId: updatedUser.avatarPokemonId,
        avatarSprite: updatedUser.avatarSprite
      }
    });
  } catch (error) {
    next(error);
  }
};