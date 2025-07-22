import axios from 'axios';
import logger from '../utils/logger';
import { ApiError } from '../middleware/error.middleware';
import { cacheService } from './cache.service';
import * as fs from 'fs/promises';
import * as path from 'path';

interface AbilityDetail {
  id: number;
  name: string;
  effect: string;
  shortEffect: string;
  generation: string;
  isMainSeries: boolean;
  pokemon: string[]; // List of Pokemon that can have this ability
}

interface AbilityStoreData {
  abilities: Map<string, AbilityDetail>;
  lastUpdated: Date;
  totalAbilities: number;
}

class PokemonAbilityStoreService {
  private abilityStore: AbilityStoreData = {
    abilities: new Map(),
    lastUpdated: new Date(),
    totalAbilities: 0
  };
  
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  
  // Cache keys
  private readonly CACHE_KEY_PREFIX = 'pokemon-abilities:';
  private readonly CACHE_TTL = 86400; // 24 hours in seconds
  
  // File storage
  private readonly DATA_DIR = path.join(__dirname, '../../data');
  private readonly ABILITIES_FILE = path.join(this.DATA_DIR, 'pokemon-abilities.json');
  
  /**
   * Initialize the ability store on server startup
   */
  async initialize(): Promise<void> {
    // Prevent multiple initializations
    if (this.isInitialized) {
      logger.info('Pokemon ability store already initialized');
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
      logger.info('Initializing Pokemon ability store...');
      const startTime = Date.now();
      
      // 1. Try to load from JSON file first (permanent storage)
      const fileAbilities = await this.loadFromFile();
      if (fileAbilities && fileAbilities.length > 0) {
        logger.info(`Loaded ${fileAbilities.length} abilities from JSON file`);
        fileAbilities.forEach(ability => {
          this.abilityStore.abilities.set(ability.name, ability);
        });
        this.abilityStore.totalAbilities = fileAbilities.length;
        this.isInitialized = true;
        
        // Also update cache for faster access next time
        await this.cacheAllAbilities(fileAbilities);
        return;
      }
      
      // 2. Try to load from cache (Redis/memory)
      const cachedAbilities = await this.loadFromCache();
      if (cachedAbilities && cachedAbilities.length > 0) {
        logger.info(`Loaded ${cachedAbilities.length} abilities from cache`);
        cachedAbilities.forEach(ability => {
          this.abilityStore.abilities.set(ability.name, ability);
        });
        this.abilityStore.totalAbilities = cachedAbilities.length;
        this.isInitialized = true;
        
        // Save to file for permanent storage
        await this.saveToFile(cachedAbilities);
        return;
      }
      
      // 3. If no file or cache, fetch from PokeAPI
      await this.fetchAllAbilitiesFromPokeAPI();
      
      const endTime = Date.now();
      logger.info(`Pokemon ability store initialized with ${this.abilityStore.totalAbilities} abilities in ${endTime - startTime}ms`);
      this.isInitialized = true;
      
    } catch (error) {
      logger.error('Failed to initialize Pokemon ability store:', error);
      // Don't throw - allow the service to work without the ability store
      this.isInitialized = true;
    }
  }
  
  /**
   * Fetch all abilities from PokeAPI
   */
  private async fetchAllAbilitiesFromPokeAPI(): Promise<void> {
    try {
      // First, get the list of all abilities
      logger.info('Fetching ability list from PokeAPI...');
      const listResponse = await axios.get('https://pokeapi.co/api/v2/ability?limit=1000');
      const abilityList = listResponse.data.results;
      
      logger.info(`Found ${abilityList.length} abilities, fetching details...`);
      
      // Batch fetch ability details to avoid overwhelming the API
      const batchSize = 20;
      const abilities: AbilityDetail[] = [];
      
      for (let i = 0; i < abilityList.length; i += batchSize) {
        const batch = abilityList.slice(i, i + batchSize);
        const batchPromises = batch.map(async (ability: { name: string; url: string }) => {
          try {
            const abilityData = await this.fetchAbilityDetail(ability.url);
            if (abilityData) {
              abilities.push(abilityData);
              this.abilityStore.abilities.set(abilityData.name, abilityData);
            }
          } catch (error) {
            logger.warn(`Failed to fetch ability ${ability.name}:`, error);
          }
        });
        
        await Promise.all(batchPromises);
        
        // Log progress
        if ((i + batchSize) % 100 === 0 || i + batchSize >= abilityList.length) {
          logger.info(`Fetched ${Math.min(i + batchSize, abilityList.length)}/${abilityList.length} abilities`);
        }
      }
      
      this.abilityStore.totalAbilities = abilities.length;
      this.abilityStore.lastUpdated = new Date();
      
      // Cache the abilities
      await this.cacheAllAbilities(abilities);
      
      // Save to file for permanent storage
      await this.saveToFile(abilities);
      
    } catch (error) {
      logger.error('Error fetching abilities from PokeAPI:', error);
      throw new ApiError(500, 'Failed to fetch abilities from PokeAPI');
    }
  }
  
  /**
   * Fetch detailed ability data from PokeAPI
   */
  private async fetchAbilityDetail(url: string): Promise<AbilityDetail | null> {
    try {
      const response = await axios.get(url);
      const data = response.data;
      
      // Extract effect entries in English
      const effectEntry = data.effect_entries.find((entry: any) => entry.language.name === 'en');
      const effect = effectEntry ? effectEntry.effect : '';
      const shortEffect = effectEntry ? effectEntry.short_effect : '';
      
      // Get list of Pokemon that can have this ability
      const pokemon = data.pokemon.map((p: any) => p.pokemon.name);
      
      return {
        id: data.id,
        name: data.name,
        effect,
        shortEffect,
        generation: data.generation.name,
        isMainSeries: data.is_main_series,
        pokemon
      };
    } catch (error) {
      logger.error(`Error fetching ability detail from ${url}:`, error);
      return null;
    }
  }
  
  /**
   * Cache all abilities
   */
  private async cacheAllAbilities(abilities: AbilityDetail[]): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}all`;
      await cacheService.set(cacheKey, abilities, this.CACHE_TTL);
      logger.info(`Cached ${abilities.length} abilities`);
    } catch (error) {
      logger.warn('Failed to cache abilities:', error);
    }
  }
  
  /**
   * Load abilities from cache
   */
  private async loadFromCache(): Promise<AbilityDetail[] | null> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}all`;
      const cachedAbilities = await cacheService.get<AbilityDetail[]>(cacheKey);
      return cachedAbilities;
    } catch (error) {
      logger.warn('Failed to load abilities from cache:', error);
      return null;
    }
  }
  
  /**
   * Save abilities to JSON file
   */
  private async saveToFile(abilities: AbilityDetail[]): Promise<void> {
    try {
      // Ensure data directory exists
      await fs.mkdir(this.DATA_DIR, { recursive: true });
      
      // Save abilities to JSON file
      const data = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        totalAbilities: abilities.length,
        abilities: abilities
      };
      
      await fs.writeFile(this.ABILITIES_FILE, JSON.stringify(data, null, 2), 'utf-8');
      logger.info(`Saved ${abilities.length} abilities to JSON file: ${this.ABILITIES_FILE}`);
    } catch (error) {
      logger.error('Failed to save abilities to file:', error);
    }
  }
  
  /**
   * Load abilities from JSON file
   */
  private async loadFromFile(): Promise<AbilityDetail[] | null> {
    try {
      const fileExists = await fs.access(this.ABILITIES_FILE).then(() => true).catch(() => false);
      
      if (!fileExists) {
        logger.info('No JSON file found for Pokemon abilities');
        return null;
      }
      
      const fileContent = await fs.readFile(this.ABILITIES_FILE, 'utf-8');
      const data = JSON.parse(fileContent);
      
      if (data.abilities && Array.isArray(data.abilities)) {
        logger.info(`Found JSON file with ${data.abilities.length} abilities (last updated: ${data.lastUpdated})`);
        return data.abilities;
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to load abilities from file:', error);
      return null;
    }
  }
  
  /**
   * Get all abilities
   */
  getAllAbilities(): AbilityDetail[] {
    if (!this.isInitialized) {
      logger.warn('Ability store not initialized, returning empty array');
      return [];
    }
    
    return Array.from(this.abilityStore.abilities.values());
  }
  
  /**
   * Get a specific ability by name
   */
  getAbility(abilityName: string): AbilityDetail | undefined {
    if (!this.isInitialized) {
      logger.warn('Ability store not initialized');
      return undefined;
    }
    
    // Try exact match first
    let ability = this.abilityStore.abilities.get(abilityName);
    
    // If not found, try with lowercase and hyphens
    if (!ability) {
      const normalizedName = abilityName.toLowerCase().replace(/\s+/g, '-');
      ability = this.abilityStore.abilities.get(normalizedName);
    }
    
    return ability;
  }
  
  /**
   * Get abilities by generation
   */
  getAbilitiesByGeneration(generation: string): AbilityDetail[] {
    if (!this.isInitialized) {
      return [];
    }
    
    return Array.from(this.abilityStore.abilities.values())
      .filter(ability => ability.generation === generation.toLowerCase());
  }
  
  /**
   * Get abilities for a specific Pokemon
   */
  getAbilitiesForPokemon(pokemonName: string): AbilityDetail[] {
    if (!this.isInitialized) {
      return [];
    }
    
    const normalizedName = pokemonName.toLowerCase().replace(/\s+/g, '-');
    return Array.from(this.abilityStore.abilities.values())
      .filter(ability => ability.pokemon.includes(normalizedName));
  }
  
  /**
   * Search abilities by partial name or effect
   */
  searchAbilities(query: string): AbilityDetail[] {
    if (!this.isInitialized) {
      return [];
    }
    
    const normalizedQuery = query.toLowerCase();
    return Array.from(this.abilityStore.abilities.values())
      .filter(ability => 
        ability.name.includes(normalizedQuery) ||
        ability.effect.toLowerCase().includes(normalizedQuery) ||
        ability.shortEffect.toLowerCase().includes(normalizedQuery)
      );
  }
  
  /**
   * Get ability store status
   */
  getStatus(): {
    initialized: boolean;
    totalAbilities: number;
    lastUpdated: Date;
  } {
    return {
      initialized: this.isInitialized,
      totalAbilities: this.abilityStore.totalAbilities,
      lastUpdated: this.abilityStore.lastUpdated
    };
  }
  
  /**
   * Force refresh the ability store
   */
  async refresh(): Promise<void> {
    logger.info('Force refreshing Pokemon ability store...');
    this.isInitialized = false;
    this.abilityStore.abilities.clear();
    this.abilityStore.totalAbilities = 0;
    
    // Delete the JSON file to force re-fetch from PokeAPI
    try {
      await fs.unlink(this.ABILITIES_FILE);
      logger.info('Deleted existing abilities JSON file');
    } catch (error) {
      // File might not exist, which is fine
      logger.debug('No existing JSON file to delete');
    }
    
    await this.initialize();
  }
}

// Export singleton instance
export const pokemonAbilityStoreService = new PokemonAbilityStoreService();