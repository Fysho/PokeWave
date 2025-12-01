import { prisma } from '../lib/prisma';
import logger from '../utils/logger';
import type { Prisma, User, Pokedex, GameStats } from '@prisma/client';

interface PokedexData {
  unlockedPokemon: number[];
  unlockedShinyPokemon: number[];
  pokemonCounts: [number, number][];
  shinyPokemonCounts: [number, number][];
}

interface CreateUserData {
  username: string;
  password: string;
}

type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    pokedex: true;
    gameStats: true;
  }
}>;

class UserServiceDB {
  async createUser(data: CreateUserData): Promise<UserWithRelations> {
    try {
      const user = await prisma.user.create({
        data: {
          username: data.username.toLowerCase(),
          password: data.password,
          pokedex: {
            create: {}
          },
          gameStats: {
            create: {}
          }
        },
        include: {
          pokedex: true,
          gameStats: true
        }
      });

      logger.info(`Created new user: ${user.username} (${user.id})`);
      return user;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('Username already exists');
      }
      throw error;
    }
  }

  async findById(id: string): Promise<UserWithRelations | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        pokedex: true,
        gameStats: true
      }
    });
  }

  async findByUsername(username: string): Promise<UserWithRelations | null> {
    return prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      include: {
        pokedex: true,
        gameStats: true
      }
    });
  }

  async updateUser(id: string, updates: Partial<User>): Promise<UserWithRelations | null> {
    try {
      return await prisma.user.update({
        where: { id },
        data: updates,
        include: {
          pokedex: true,
          gameStats: true
        }
      });
    } catch (error) {
      return null;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  getUserCount(): number {
    // For async version, this would need to be refactored
    // For now, return 0 and let the controller handle it differently
    return 0;
  }
  
  async getUserCountAsync(): Promise<number> {
    return prisma.user.count();
  }

  async getAllUsers(): Promise<UserWithRelations[]> {
    return prisma.user.findMany({
      include: {
        pokedex: true,
        gameStats: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async updatePokedex(userId: string, pokedexData: PokedexData): Promise<UserWithRelations | null> {
    try {
      // Convert array format to JSON object format for counts
      const pokemonCountsObj: Record<string, number> = {};
      const shinyPokemonCountsObj: Record<string, number> = {};
      
      pokedexData.pokemonCounts.forEach(([id, count]) => {
        pokemonCountsObj[id.toString()] = count;
      });
      
      pokedexData.shinyPokemonCounts.forEach(([id, count]) => {
        shinyPokemonCountsObj[id.toString()] = count;
      });

      await prisma.pokedex.upsert({
        where: { userId },
        create: {
          userId,
          unlockedPokemon: pokedexData.unlockedPokemon,
          unlockedShinyPokemon: pokedexData.unlockedShinyPokemon,
          pokemonCounts: pokemonCountsObj,
          shinyPokemonCounts: shinyPokemonCountsObj
        },
        update: {
          unlockedPokemon: pokedexData.unlockedPokemon,
          unlockedShinyPokemon: pokedexData.unlockedShinyPokemon,
          pokemonCounts: pokemonCountsObj,
          shinyPokemonCounts: shinyPokemonCountsObj
        }
      });

      const user = await this.findById(userId);
      if (user) {
        logger.info(`Updated Pokedex for user: ${user.username} (${user.id})`);
      }
      return user;
    } catch (error) {
      logger.error('Failed to update Pokedex:', error);
      return null;
    }
  }

  async updateGameStats(userId: string, gameStats: Partial<GameStats>): Promise<UserWithRelations | null> {
    try {
      await prisma.gameStats.upsert({
        where: { userId },
        create: {
          userId,
          ...gameStats
        },
        update: gameStats
      });

      const user = await this.findById(userId);
      if (user) {
        logger.info(`Updated game stats for user: ${user.username} (${user.id})`);
      }
      return user;
    } catch (error) {
      logger.error('Failed to update game stats:', error);
      return null;
    }
  }

  async unlockPokemon(userId: string, pokemonId: number, isShiny: boolean = false): Promise<UserWithRelations | null> {
    try {
      const user = await this.findById(userId);
      if (!user || !user.pokedex) return null;

      const pokedex = user.pokedex;
      const unlockedPokemon = [...pokedex.unlockedPokemon];
      const unlockedShinyPokemon = [...pokedex.unlockedShinyPokemon];
      const pokemonCounts = pokedex.pokemonCounts as Record<string, number>;
      const shinyPokemonCounts = pokedex.shinyPokemonCounts as Record<string, number>;

      // Update unlocked Pokemon
      if (!unlockedPokemon.includes(pokemonId)) {
        unlockedPokemon.push(pokemonId);
      }

      // Update counts
      const pokemonIdStr = pokemonId.toString();
      pokemonCounts[pokemonIdStr] = (pokemonCounts[pokemonIdStr] || 0) + 1;

      // Handle shiny Pokemon
      if (isShiny) {
        if (!unlockedShinyPokemon.includes(pokemonId)) {
          unlockedShinyPokemon.push(pokemonId);
        }
        shinyPokemonCounts[pokemonIdStr] = (shinyPokemonCounts[pokemonIdStr] || 0) + 1;
      }

      await prisma.pokedex.update({
        where: { id: pokedex.id },
        data: {
          unlockedPokemon,
          unlockedShinyPokemon,
          pokemonCounts,
          shinyPokemonCounts
        }
      });

      logger.info(`Unlocked Pokemon ${pokemonId} (shiny: ${isShiny}) for user: ${user.username}`);
      return this.findById(userId);
    } catch (error) {
      logger.error('Failed to unlock Pokemon:', error);
      return null;
    }
  }

  // Helper method to convert database format to API format
  convertPokedexToApiFormat(pokedex: Pokedex | null): PokedexData | null {
    if (!pokedex) return null;

    const pokemonCounts = pokedex.pokemonCounts as Record<string, number>;
    const shinyPokemonCounts = pokedex.shinyPokemonCounts as Record<string, number>;

    return {
      unlockedPokemon: pokedex.unlockedPokemon,
      unlockedShinyPokemon: pokedex.unlockedShinyPokemon,
      pokemonCounts: Object.entries(pokemonCounts).map(([id, count]) => [parseInt(id), count]),
      shinyPokemonCounts: Object.entries(shinyPokemonCounts).map(([id, count]) => [parseInt(id), count])
    };
  }

  // Compatibility method for smooth migration
  async ensureUserExists(userData: { id: string; username: string }): Promise<UserWithRelations> {
    const existingUser = await this.findById(userData.id);
    if (existingUser) {
      return existingUser;
    }

    // Create user with specific ID for compatibility
    return prisma.user.create({
      data: {
        id: userData.id,
        username: userData.username.toLowerCase(),
        password: 'temp-password-hash',
        pokedex: {
          create: {}
        },
        gameStats: {
          create: {}
        }
      },
      include: {
        pokedex: true,
        gameStats: true
      }
    });
  }
}

export const userServiceDB = new UserServiceDB();