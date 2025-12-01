export interface PokedexData {
  unlockedPokemon: number[];
  unlockedShinyPokemon: number[];
  pokemonCounts: [number, number][];
  shinyPokemonCounts: [number, number][];
}

export interface GameStats {
  totalBattles: number;
  totalCorrectGuesses: number;
  highestStreak: number;
  endlessHighScore: number;
  dailyChallengeScores?: { [date: string]: number };
}

export interface CreateUserData {
  username: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  createdAt: string | Date;
  avatarPokemonId?: number;
  avatarSprite?: string;
  pokedex?: PokedexData | null;
  gameStats?: GameStats | null;
  lastUpdated?: string;
  updatedAt?: Date;
}

export interface IUserService {
  createUser(data: CreateUserData): Promise<User | any>;
  findById(id: string): Promise<User | any | null>;
  findByUsername(username: string): Promise<User | any | null>;
  updateUser(id: string, updates: Partial<User>): Promise<User | any | null>;
  deleteUser(id: string): Promise<boolean>;
  getUserCount(): number;
  getUserCountAsync?(): Promise<number>;
  getAllUsers(): Promise<User[]>;
  updatePokedex(userId: string, pokedexData: PokedexData): Promise<User | any | null>;
  updateGameStats(userId: string, gameStats: Partial<GameStats>): Promise<User | any | null>;
  unlockPokemon(userId: string, pokemonId: number, isShiny?: boolean): Promise<User | any | null>;
  ensureUserExists?(userData: { id: string; username: string }): Promise<User | any>;
}