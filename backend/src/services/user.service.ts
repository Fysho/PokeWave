import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

interface PokedexData {
  unlockedPokemon: number[];
  unlockedShinyPokemon: number[];
  pokemonCounts: [number, number][]; // [pokemonId, count]
  shinyPokemonCounts: [number, number][]; // [pokemonId, count]
}

interface GameStats {
  totalBattles: number;
  totalCorrectGuesses: number;
  highestStreak: number;
  endlessHighScore: number;
  dailyChallengeScores: { [date: string]: number };
}

interface User {
  id: string;
  username: string;
  password: string;
  createdAt: string;
  avatarPokemonId?: number;
  avatarSprite?: string;
  pokedex?: PokedexData;
  gameStats?: GameStats;
  lastUpdated?: string;
}

interface CreateUserData {
  username: string;
  password: string;
}

class UserService {
  // In-memory storage for now (you can replace with database later)
  private users: Map<string, User> = new Map();
  private usernameIndex: Map<string, string> = new Map(); // username -> userId

  async createUser(data: CreateUserData): Promise<User> {
    const user: User = {
      id: uuidv4(),
      username: data.username.toLowerCase(),
      password: data.password,
      createdAt: new Date().toISOString(),
      avatarPokemonId: 25, // Default to Pikachu
      avatarSprite: '/sprites/front/25.png', // Local Pikachu sprite
      pokedex: {
        unlockedPokemon: [],
        unlockedShinyPokemon: [],
        pokemonCounts: [],
        shinyPokemonCounts: []
      },
      gameStats: {
        totalBattles: 0,
        totalCorrectGuesses: 0,
        highestStreak: 0,
        endlessHighScore: 0,
        dailyChallengeScores: {}
      },
      lastUpdated: new Date().toISOString()
    };

    this.users.set(user.id, user);
    this.usernameIndex.set(user.username, user.id);

    logger.info(`Created new user: ${user.username} (${user.id})`);

    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const userId = this.usernameIndex.get(username.toLowerCase());
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);

    // Update username index if username changed
    if (updates.username && updates.username !== user.username) {
      this.usernameIndex.delete(user.username);
      this.usernameIndex.set(updates.username.toLowerCase(), id);
    }

    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;

    this.users.delete(id);
    this.usernameIndex.delete(user.username);

    return true;
  }

  // Get total user count
  getUserCount(): number {
    return this.users.size;
  }

  // Update user's Pokedex data
  async updatePokedex(userId: string, pokedexData: PokedexData): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) return null;

    user.pokedex = pokedexData;
    user.lastUpdated = new Date().toISOString();
    this.users.set(userId, user);

    logger.info(`Updated Pokedex for user: ${user.username} (${user.id})`);
    return user;
  }

  // Update user's game stats
  async updateGameStats(userId: string, gameStats: Partial<GameStats>): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) return null;

    user.gameStats = {
      ...user.gameStats,
      ...gameStats
    } as GameStats;
    user.lastUpdated = new Date().toISOString();
    this.users.set(userId, user);

    logger.info(`Updated game stats for user: ${user.username} (${user.id})`);
    return user;
  }

  // Unlock Pokemon in user's Pokedex
  async unlockPokemon(userId: string, pokemonId: number, isShiny: boolean = false): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) return null;

    if (!user.pokedex) {
      user.pokedex = {
        unlockedPokemon: [],
        unlockedShinyPokemon: [],
        pokemonCounts: [],
        shinyPokemonCounts: []
      };
    }

    // Update unlocked Pokemon
    if (!user.pokedex.unlockedPokemon.includes(pokemonId)) {
      user.pokedex.unlockedPokemon.push(pokemonId);
    }

    // Update counts
    const countIndex = user.pokedex.pokemonCounts.findIndex(([id]) => id === pokemonId);
    if (countIndex >= 0) {
      user.pokedex.pokemonCounts[countIndex][1]++;
    } else {
      user.pokedex.pokemonCounts.push([pokemonId, 1]);
    }

    // Handle shiny Pokemon
    if (isShiny) {
      if (!user.pokedex.unlockedShinyPokemon.includes(pokemonId)) {
        user.pokedex.unlockedShinyPokemon.push(pokemonId);
      }

      const shinyCountIndex = user.pokedex.shinyPokemonCounts.findIndex(([id]) => id === pokemonId);
      if (shinyCountIndex >= 0) {
        user.pokedex.shinyPokemonCounts[shinyCountIndex][1]++;
      } else {
        user.pokedex.shinyPokemonCounts.push([pokemonId, 1]);
      }
    }

    user.lastUpdated = new Date().toISOString();
    this.users.set(userId, user);

    logger.info(`Unlocked Pokemon ${pokemonId} (shiny: ${isShiny}) for user: ${user.username}`);
    return user;
  }

  // Development helper: recreate user if missing
  async ensureUserExists(userData: { id: string; username: string }): Promise<User> {
    const existingUser = await this.findById(userData.id);
    if (existingUser) {
      return existingUser;
    }

    // Recreate user with provided data
    const user: User = {
      id: userData.id,
      username: userData.username.toLowerCase(),
      password: 'temp-password-hash', // This won't be used for auth
      createdAt: new Date().toISOString(),
      avatarPokemonId: 25, // Default to Pikachu
      avatarSprite: '/sprites/front/25.png', // Local Pikachu sprite
      pokedex: {
        unlockedPokemon: [],
        unlockedShinyPokemon: [],
        pokemonCounts: [],
        shinyPokemonCounts: []
      },
      gameStats: {
        totalBattles: 0,
        totalCorrectGuesses: 0,
        highestStreak: 0,
        endlessHighScore: 0,
        dailyChallengeScores: {}
      },
      lastUpdated: new Date().toISOString()
    };

    this.users.set(user.id, user);
    this.usernameIndex.set(user.username, user.id);

    logger.info(`Recreated user for development: ${user.username} (${user.id})`);

    return user;
  }
}

export const userService = new UserService();