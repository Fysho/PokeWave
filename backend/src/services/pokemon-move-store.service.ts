import axios from 'axios';
import logger from '../utils/logger';
import { ApiError } from '../middleware/error.middleware';
import { cacheService } from './cache.service';
import { Dex } from '@pkmn/dex';

interface MoveDetail {
  id: number;
  name: string;
  type: string;
  category: 'physical' | 'special' | 'status';
  power: number | null;
  accuracy: number | null;
  pp: number;
  priority: number;
  damageClass: string;
  effectChance: number | null;
  effectEntries: string[];
  target: string;
  generation: string;
  learnedByPokemon: string[];
}

interface MoveStoreData {
  moves: Map<string, MoveDetail>;
  lastUpdated: Date;
  totalMoves: number;
}

class PokemonMoveStoreService {
  private moveStore: MoveStoreData = {
    moves: new Map(),
    lastUpdated: new Date(),
    totalMoves: 0
  };
  
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  
  // Cache keys
  private readonly CACHE_KEY_PREFIX = 'pokemon-moves:';
  private readonly CACHE_TTL = 86400; // 24 hours in seconds
  
  /**
   * Initialize the move store on server startup
   */
  async initialize(): Promise<void> {
    // Prevent multiple initializations
    if (this.isInitialized) {
      logger.info('Pokemon move store already initialized');
      return;
    }
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    this.initializationPromise = this._performInitialization();
    return this.initializationPromise;
  }
  
  private async _performInitialization(): Promise<void> {
    try {
      logger.info('Initializing Pokemon move store...');
      const startTime = Date.now();
      
      // Try to load from cache first
      const cachedMoves = await this.loadFromCache();
      if (cachedMoves && cachedMoves.length > 0) {
        logger.info(`Loaded ${cachedMoves.length} moves from cache`);
        cachedMoves.forEach(move => {
          this.moveStore.moves.set(move.name, move);
        });
        this.moveStore.totalMoves = cachedMoves.length;
        this.isInitialized = true;
        return;
      }
      
      // If no cache, fetch from PokeAPI
      await this.fetchAllMovesFromPokeAPI();
      
      const endTime = Date.now();
      logger.info(`Pokemon move store initialized with ${this.moveStore.totalMoves} moves in ${endTime - startTime}ms`);
      this.isInitialized = true;
      
    } catch (error) {
      logger.error('Failed to initialize Pokemon move store:', error);
      // Don't throw - allow the service to work with Pokemon Showdown data only
      this.isInitialized = true;
    }
  }
  
  /**
   * Fetch all moves from PokeAPI
   */
  private async fetchAllMovesFromPokeAPI(): Promise<void> {
    try {
      // First, get the list of all moves
      logger.info('Fetching move list from PokeAPI...');
      const listResponse = await axios.get('https://pokeapi.co/api/v2/move?limit=10000');
      const moveList = listResponse.data.results;
      
      logger.info(`Found ${moveList.length} moves, fetching details...`);
      
      // Batch fetch move details to avoid overwhelming the API
      const batchSize = 20;
      const moves: MoveDetail[] = [];
      
      for (let i = 0; i < moveList.length; i += batchSize) {
        const batch = moveList.slice(i, i + batchSize);
        const batchPromises = batch.map(async (move: { name: string; url: string }) => {
          try {
            const moveData = await this.fetchMoveDetail(move.url);
            if (moveData) {
              moves.push(moveData);
              this.moveStore.moves.set(moveData.name, moveData);
            }
          } catch (error) {
            logger.warn(`Failed to fetch move ${move.name}:`, error);
          }
        });
        
        await Promise.all(batchPromises);
        
        // Log progress
        if ((i + batchSize) % 100 === 0 || i + batchSize >= moveList.length) {
          logger.info(`Fetched ${Math.min(i + batchSize, moveList.length)}/${moveList.length} moves`);
        }
      }
      
      this.moveStore.totalMoves = moves.length;
      this.moveStore.lastUpdated = new Date();
      
      // Cache the moves
      await this.cacheAllMoves(moves);
      
    } catch (error) {
      logger.error('Error fetching moves from PokeAPI:', error);
      throw new ApiError(500, 'Failed to fetch moves from PokeAPI');
    }
  }
  
  /**
   * Fetch detailed move data from PokeAPI
   */
  private async fetchMoveDetail(url: string): Promise<MoveDetail | null> {
    try {
      const response = await axios.get(url);
      const data = response.data;
      
      // Extract effect entries in English
      const effectEntries = data.effect_entries
        .filter((entry: any) => entry.language.name === 'en')
        .map((entry: any) => entry.effect);
      
      // Get list of Pokemon that can learn this move
      const learnedByPokemon = data.learned_by_pokemon.map((p: any) => p.name);
      
      return {
        id: data.id,
        name: data.name,
        type: data.type.name,
        category: data.damage_class.name,
        power: data.power,
        accuracy: data.accuracy,
        pp: data.pp,
        priority: data.priority,
        damageClass: data.damage_class.name,
        effectChance: data.effect_chance,
        effectEntries,
        target: data.target.name,
        generation: data.generation.name,
        learnedByPokemon
      };
    } catch (error) {
      logger.error(`Error fetching move detail from ${url}:`, error);
      return null;
    }
  }
  
  /**
   * Cache all moves
   */
  private async cacheAllMoves(moves: MoveDetail[]): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}all`;
      await cacheService.set(cacheKey, moves, this.CACHE_TTL);
      logger.info(`Cached ${moves.length} moves`);
    } catch (error) {
      logger.warn('Failed to cache moves:', error);
    }
  }
  
  /**
   * Load moves from cache
   */
  private async loadFromCache(): Promise<MoveDetail[] | null> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}all`;
      const cachedMoves = await cacheService.get<MoveDetail[]>(cacheKey);
      return cachedMoves;
    } catch (error) {
      logger.warn('Failed to load moves from cache:', error);
      return null;
    }
  }
  
  /**
   * Get all moves
   */
  getAllMoves(): MoveDetail[] {
    if (!this.isInitialized) {
      logger.warn('Move store not initialized, returning empty array');
      return [];
    }
    
    return Array.from(this.moveStore.moves.values());
  }
  
  /**
   * Get a specific move by name
   */
  getMove(moveName: string): MoveDetail | undefined {
    if (!this.isInitialized) {
      logger.warn('Move store not initialized');
      return undefined;
    }
    
    // Try exact match first
    let move = this.moveStore.moves.get(moveName);
    
    // If not found, try with lowercase and hyphens
    if (!move) {
      const normalizedName = moveName.toLowerCase().replace(/\s+/g, '-');
      move = this.moveStore.moves.get(normalizedName);
    }
    
    return move;
  }
  
  /**
   * Get moves by type
   */
  getMovesByType(type: string): MoveDetail[] {
    if (!this.isInitialized) {
      return [];
    }
    
    return Array.from(this.moveStore.moves.values())
      .filter(move => move.type === type.toLowerCase());
  }
  
  /**
   * Get moves by category
   */
  getMovesByCategory(category: 'physical' | 'special' | 'status'): MoveDetail[] {
    if (!this.isInitialized) {
      return [];
    }
    
    return Array.from(this.moveStore.moves.values())
      .filter(move => move.category === category);
  }
  
  /**
   * Get moves that a specific Pokemon can learn
   */
  getMovesForPokemon(pokemonName: string): MoveDetail[] {
    if (!this.isInitialized) {
      return [];
    }
    
    const normalizedName = pokemonName.toLowerCase().replace(/\s+/g, '-');
    return Array.from(this.moveStore.moves.values())
      .filter(move => move.learnedByPokemon.includes(normalizedName));
  }
  
  /**
   * Search moves by partial name
   */
  searchMoves(query: string): MoveDetail[] {
    if (!this.isInitialized) {
      return [];
    }
    
    const normalizedQuery = query.toLowerCase();
    return Array.from(this.moveStore.moves.values())
      .filter(move => 
        move.name.includes(normalizedQuery) ||
        move.effectEntries.some(effect => 
          effect.toLowerCase().includes(normalizedQuery)
        )
      );
  }
  
  /**
   * Get move store status
   */
  getStatus(): {
    initialized: boolean;
    totalMoves: number;
    lastUpdated: Date;
  } {
    return {
      initialized: this.isInitialized,
      totalMoves: this.moveStore.totalMoves,
      lastUpdated: this.moveStore.lastUpdated
    };
  }
  
  /**
   * Force refresh the move store
   */
  async refresh(): Promise<void> {
    logger.info('Force refreshing Pokemon move store...');
    this.isInitialized = false;
    this.moveStore.moves.clear();
    this.moveStore.totalMoves = 0;
    await this.initialize();
  }
}

// Export singleton instance
export const pokemonMoveStoreService = new PokemonMoveStoreService();