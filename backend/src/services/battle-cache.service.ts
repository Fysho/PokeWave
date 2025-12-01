import { cacheService } from './cache.service';
import { showdownService } from './showdown.service';
import { pokemonInstanceStore } from './pokemon-instance-store.service';
import { pokemonShowdownService } from './pokemon-showdown.service';
import { isDatabaseEnabled } from '../config/database.config';
import { battleTrackerService } from './battle-tracker.service';
import logger from '../utils/logger';
import { BATTLE_CONFIG } from '../config/game-constants';

interface CachedBattle {
  battleId: string;
  pokemon1: any;
  pokemon2: any;
  pokemon1Wins: number;
  pokemon2Wins: number;
  draws: number;
  totalBattles: number;
  winRate: number;
  executionTime: number;
  createdAt: Date;
  dbBattleId?: string; // Reference to database battle record
}

class BattleCacheService {
  private readonly CACHE_PREFIX = 'battle-cache:';
  private readonly CACHE_SIZE = BATTLE_CONFIG.CACHE_SIZE;
  private readonly CACHE_TTL = BATTLE_CONFIG.CACHE_TTL;
  private readonly BATTLE_LIST_KEY = 'battle-cache:list';
  
  /**
   * Initialize the battle cache with pre-simulated battles
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing battle cache...');
      
      const existingBattles = await this.getCachedBattleIds();
      const battlesToGenerate = this.CACHE_SIZE - existingBattles.length;
      
      if (battlesToGenerate > 0) {
        logger.info(`Generating ${battlesToGenerate} new battles for cache...`);
        
        for (let i = 0; i < battlesToGenerate; i++) {
          await this.generateAndCacheBattle();
          // Small delay to ensure different random Pokemon
          if (i < battlesToGenerate - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } else {
        logger.info(`Battle cache already at full capacity (${existingBattles.length}/${this.CACHE_SIZE} battles)`);
      }
      
      const finalBattleCount = await this.getCachedBattleIds();
      logger.info(`Battle cache initialized with ${finalBattleCount.length}/${this.CACHE_SIZE} battles`);
    } catch (error) {
      logger.error('Failed to initialize battle cache:', error);
      throw error;
    }
  }
  
  /**
   * Get a random cached battle
   */
  async getRandomBattle(): Promise<CachedBattle | null> {
    try {
      const battleIds = await this.getCachedBattleIds();
      
      if (battleIds.length === 0) {
        logger.warn('No cached battles available');
        // Generate one on the fly
        return await this.generateAndCacheBattle();
      }
      
      // Select a random battle
      const randomIndex = Math.floor(Math.random() * battleIds.length);
      const selectedBattleId = battleIds[randomIndex];
      
      const cachedBattle = await cacheService.get<CachedBattle>(`${this.CACHE_PREFIX}${selectedBattleId}`);
      
      if (!cachedBattle) {
        logger.warn(`Cached battle ${selectedBattleId} not found, generating new one`);
        return await this.generateAndCacheBattle();
      }
      
      // Don't remove the battle - allow it to be selected again
      logger.info(`Serving cached battle ${selectedBattleId} from pool of ${battleIds.length} battles`);
      return cachedBattle;
    } catch (error) {
      logger.error('Failed to get random battle:', error);
      // Fallback to generating a new battle
      return await this.generateAndCacheBattle();
    }
  }
  
  /**
   * Generate a new battle and add it to the cache
   */
  private async generateAndCacheBattle(): Promise<CachedBattle> {
    try {

      // Use the default generation from config
      const generation = BATTLE_CONFIG.DEFAULT_GENERATION;

      // Generate random Pokemon IDs based on generation
      // Gen 1: 1-151, Gen 2: 1-251, Gen 3: 1-386, Gen 4: 1-493, Gen 5: 1-649, Gen 6: 1-721, Gen 7: 1-809, Gen 8: 1-905, Gen 9: 1-1025
      const maxPokemonByGen: { [key: number]: number } = {
        1: 151, 2: 251, 3: 386, 4: 493, 5: 649, 6: 721, 7: 809, 8: 905, 9: 1025
      };
      const maxPokemon = maxPokemonByGen[generation] || 1025;

      const pokemon1Id = Math.floor(Math.random() * maxPokemon) + 1;
      let pokemon2Id = Math.floor(Math.random() * maxPokemon) + 1;

      // Ensure they're different
      while (pokemon2Id === pokemon1Id) {
        pokemon2Id = Math.floor(Math.random() * maxPokemon) + 1;
      }

      // Generate random levels
      const level1 = Math.floor(Math.random() * 51) + 50; // 50-100
      const level2 = Math.floor(Math.random() * 51) + 50; // 50-100

      // Determine item mode based on generation (items don't exist in Gen 1)
      const itemMode = generation >= 2 ? (Math.random() < 0.5 ? 'random' : 'none') : 'none';

      // Create Pokemon instances with correct generation
      const pokemon1 = await pokemonShowdownService.createPokemonInstance(
        pokemon1Id,
        level1,
        generation,
        itemMode
      );

      const pokemon2 = await pokemonShowdownService.createPokemonInstance(
        pokemon2Id,
        level2,
        generation,
        itemMode
      );

      // Store instances for battle simulation with generation
      pokemonInstanceStore.storeInstances(pokemon1, pokemon2, generation);

      // Use showdown service to simulate a full battle
      const battleResult = await showdownService.simulateBattle();
      
      // Save to database if enabled
      let dbBattleId: string | undefined;
      if (isDatabaseEnabled()) {
        try {
          const dbBattle = await battleTrackerService.saveOrGetBattle(
            pokemon1,
            pokemon2,
            battleResult.pokemon1Wins / battleResult.totalBattles, // Win rate as 0-1
            battleResult.totalBattles,
            battleResult.executionTime
          );
          dbBattleId = dbBattle.id;
        } catch (error) {
          logger.error('Failed to save battle to database:', error);
          // Continue without database tracking
        }
      }
      
      const cachedBattle: CachedBattle = {
        battleId: battleResult.battleId,
        pokemon1: pokemon1,
        pokemon2: pokemon2,
        pokemon1Wins: battleResult.pokemon1Wins,
        pokemon2Wins: battleResult.pokemon2Wins,
        draws: battleResult.draws,
        totalBattles: battleResult.totalBattles,
        winRate: (battleResult.pokemon1Wins / battleResult.totalBattles) * 100,
        executionTime: battleResult.executionTime,
        createdAt: new Date(),
        dbBattleId
      };
      
      // Cache the battle
      const cacheKey = `${this.CACHE_PREFIX}${cachedBattle.battleId}`;
      await cacheService.set(cacheKey, cachedBattle, this.CACHE_TTL);
      
      // Add to the list of cached battles
      await this.addBattleToList(cachedBattle.battleId);
      
      // Minimal logging - only log count at end of initialization
      
      return cachedBattle;
    } catch (error) {
      logger.error('Failed to generate and cache battle:', error);
      throw error;
    }
  }
  
  /**
   * Get list of cached battle IDs
   */
  private async getCachedBattleIds(): Promise<string[]> {
    try {
      const battleList = await cacheService.get<string[]>(this.BATTLE_LIST_KEY);
      return battleList || [];
    } catch (error) {
      logger.error('Failed to get cached battle IDs:', error);
      return [];
    }
  }
  
  /**
   * Add a battle ID to the cached list
   */
  private async addBattleToList(battleId: string): Promise<void> {
    try {
      let battleIds = await this.getCachedBattleIds();
      
      // Add the new battle ID if not already present
      if (!battleIds.includes(battleId)) {
        battleIds.push(battleId);
        
        // Keep only the most recent battles up to CACHE_SIZE
        if (battleIds.length > this.CACHE_SIZE) {
          battleIds = battleIds.slice(-this.CACHE_SIZE);
        }
        
        await cacheService.set(this.BATTLE_LIST_KEY, battleIds, this.CACHE_TTL);
      }
    } catch (error) {
      logger.error('Failed to add battle to list:', error);
    }
  }
  
  
  /**
   * Clear all cached battles (useful for maintenance)
   */
  async clearCache(): Promise<void> {
    try {
      const battleIds = await this.getCachedBattleIds();
      
      // Delete each cached battle
      for (const battleId of battleIds) {
        await cacheService.delete(`${this.CACHE_PREFIX}${battleId}`);
      }
      
      // Clear the battle list
      await cacheService.delete(this.BATTLE_LIST_KEY);
      
      logger.info('Battle cache cleared');
    } catch (error) {
      logger.error('Failed to clear battle cache:', error);
    }
  }
  
  /**
   * Get cache statistics with battle details
   */
  async getCacheStats(): Promise<{ size: number; battles: { id: string; summary: string }[] }> {
    const battleIds = await this.getCachedBattleIds();
    const battleSummaries: { id: string; summary: string }[] = [];

    for (const battleId of battleIds) {
      const battle = await this.getCachedBattle(battleId);
      if (battle) {
        const p1Name = battle.pokemon1?.name || 'Unknown';
        const p1Level = battle.pokemon1?.level || '?';
        const p2Name = battle.pokemon2?.name || 'Unknown';
        const p2Level = battle.pokemon2?.level || '?';
        const p1Wins = battle.pokemon1Wins;
        const p2Wins = battle.pokemon2Wins;
        const winRate = battle.winRate?.toFixed(1) || '?';

        battleSummaries.push({
          id: battleId,
          summary: `${p1Name} (L${p1Level}) vs ${p2Name} (L${p2Level}) - ${p1Wins}/${p2Wins} (${winRate}%)`
        });
      } else {
        battleSummaries.push({
          id: battleId,
          summary: 'Unable to load battle details'
        });
      }
    }

    return {
      size: battleIds.length,
      battles: battleSummaries
    };
  }

  /**
   * Get a specific cached battle by ID
   */
  async getCachedBattle(battleId: string): Promise<CachedBattle | null> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${battleId}`;
      const cachedBattle = await cacheService.get<CachedBattle>(cacheKey);
      return cachedBattle;
    } catch (error) {
      logger.error(`Failed to get cached battle ${battleId}:`, error);
      return null;
    }
  }
}

export const battleCacheService = new BattleCacheService();