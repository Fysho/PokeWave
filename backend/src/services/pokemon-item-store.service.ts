import axios from 'axios';
import logger from '../utils/logger';
import { ApiError } from '../middleware/error.middleware';
import { cacheService } from './cache.service';
import * as fs from 'fs/promises';
import * as path from 'path';

interface ItemDetail {
  id: number;
  name: string;
  category: string;
  cost: number;
  effect: string;
  shortEffect: string;
  sprite: string;
  attributes: string[];
}

interface ItemStoreData {
  items: Map<string, ItemDetail>;
  lastUpdated: Date;
  totalItems: number;
}

class PokemonItemStoreService {
  private itemStore: ItemStoreData = {
    items: new Map(),
    lastUpdated: new Date(),
    totalItems: 0
  };
  
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  
  // Cache keys
  private readonly CACHE_KEY_PREFIX = 'pokemon-items:';
  private readonly CACHE_TTL = 86400; // 24 hours in seconds
  
  // File storage
  private readonly DATA_DIR = path.join(__dirname, '../../data');
  private readonly ITEMS_FILE = path.join(this.DATA_DIR, 'pokemon-items.json');
  
  /**
   * Initialize the item store on server startup
   */
  async initialize(): Promise<void> {
    // Prevent multiple initializations
    if (this.isInitialized) {
      logger.info('Pokemon item store already initialized');
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
      logger.info('Initializing Pokemon item store...');
      const startTime = Date.now();
      
      // 1. Try to load from JSON file first (permanent storage)
      const fileItems = await this.loadFromFile();
      if (fileItems && fileItems.length > 0) {
        logger.info(`Loaded ${fileItems.length} items from JSON file`);
        fileItems.forEach(item => {
          this.itemStore.items.set(item.name, item);
        });
        this.itemStore.totalItems = fileItems.length;
        this.isInitialized = true;
        
        // Also update cache for faster access next time
        await this.cacheAllItems(fileItems);
        return;
      }
      
      // 2. Try to load from cache (Redis/memory)
      const cachedItems = await this.loadFromCache();
      if (cachedItems && cachedItems.length > 0) {
        logger.info(`Loaded ${cachedItems.length} items from cache`);
        cachedItems.forEach(item => {
          this.itemStore.items.set(item.name, item);
        });
        this.itemStore.totalItems = cachedItems.length;
        this.isInitialized = true;
        
        // Save to file for permanent storage
        await this.saveToFile(cachedItems);
        return;
      }
      
      // 3. If no file or cache, fetch from PokeAPI
      await this.fetchAllItemsFromPokeAPI();
      
      const endTime = Date.now();
      logger.info(`Pokemon item store initialized with ${this.itemStore.totalItems} items in ${endTime - startTime}ms`);
      this.isInitialized = true;
      
    } catch (error) {
      logger.error('Failed to initialize Pokemon item store:', error);
      // Don't throw - allow the service to work without the item store
      this.isInitialized = true;
    }
  }
  
  /**
   * Fetch all items from PokeAPI
   */
  private async fetchAllItemsFromPokeAPI(): Promise<void> {
    try {
      // First, get the list of all items
      logger.info('Fetching item list from PokeAPI...');
      const listResponse = await axios.get('https://pokeapi.co/api/v2/item?limit=2000');
      const itemList = listResponse.data.results;
      
      logger.info(`Found ${itemList.length} items, fetching details...`);
      
      // Batch fetch item details to avoid overwhelming the API
      const batchSize = 20;
      const items: ItemDetail[] = [];
      
      for (let i = 0; i < itemList.length; i += batchSize) {
        const batch = itemList.slice(i, i + batchSize);
        const batchPromises = batch.map(async (item: { name: string; url: string }) => {
          try {
            const itemData = await this.fetchItemDetail(item.url);
            if (itemData) {
              items.push(itemData);
              this.itemStore.items.set(itemData.name, itemData);
            }
          } catch (error) {
            logger.warn(`Failed to fetch item ${item.name}:`, error);
          }
        });
        
        await Promise.all(batchPromises);
        
        // Log progress
        if ((i + batchSize) % 100 === 0 || i + batchSize >= itemList.length) {
          logger.info(`Fetched ${Math.min(i + batchSize, itemList.length)}/${itemList.length} items`);
        }
      }
      
      this.itemStore.totalItems = items.length;
      this.itemStore.lastUpdated = new Date();
      
      // Cache the items
      await this.cacheAllItems(items);
      
      // Save to file for permanent storage
      await this.saveToFile(items);
      
    } catch (error) {
      logger.error('Error fetching items from PokeAPI:', error);
      throw new ApiError(500, 'Failed to fetch items from PokeAPI');
    }
  }
  
  /**
   * Get local sprite path for an item
   */
  private getLocalSpritePath(itemName: string): string {
    return `/sprites/items/${itemName}.png`;
  }

  /**
   * Fetch detailed item data from PokeAPI
   */
  private async fetchItemDetail(url: string): Promise<ItemDetail | null> {
    try {
      const response = await axios.get(url);
      const data = response.data;

      // Extract effect entries in English
      const effectEntry = data.effect_entries.find((entry: any) => entry.language.name === 'en');
      const effect = effectEntry ? effectEntry.effect : '';
      const shortEffect = effectEntry ? effectEntry.short_effect : '';

      // Get attributes
      const attributes = data.attributes.map((attr: any) => attr.name);

      return {
        id: data.id,
        name: data.name,
        category: data.category.name,
        cost: data.cost,
        effect,
        shortEffect,
        sprite: this.getLocalSpritePath(data.name), // Use local sprite path
        attributes
      };
    } catch (error) {
      logger.error(`Error fetching item detail from ${url}:`, error);
      return null;
    }
  }
  
  /**
   * Cache all items
   */
  private async cacheAllItems(items: ItemDetail[]): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}all`;
      await cacheService.set(cacheKey, items, this.CACHE_TTL);
      logger.info(`Cached ${items.length} items`);
    } catch (error) {
      logger.warn('Failed to cache items:', error);
    }
  }
  
  /**
   * Load items from cache
   */
  private async loadFromCache(): Promise<ItemDetail[] | null> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}all`;
      const cachedItems = await cacheService.get<ItemDetail[]>(cacheKey);
      return cachedItems;
    } catch (error) {
      logger.warn('Failed to load items from cache:', error);
      return null;
    }
  }
  
  /**
   * Save items to JSON file
   */
  private async saveToFile(items: ItemDetail[]): Promise<void> {
    try {
      // Ensure data directory exists
      await fs.mkdir(this.DATA_DIR, { recursive: true });
      
      // Save items to JSON file
      const data = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        totalItems: items.length,
        items: items
      };
      
      await fs.writeFile(this.ITEMS_FILE, JSON.stringify(data, null, 2), 'utf-8');
      logger.info(`Saved ${items.length} items to JSON file: ${this.ITEMS_FILE}`);
    } catch (error) {
      logger.error('Failed to save items to file:', error);
    }
  }
  
  /**
   * Load items from JSON file
   */
  private async loadFromFile(): Promise<ItemDetail[] | null> {
    try {
      const fileExists = await fs.access(this.ITEMS_FILE).then(() => true).catch(() => false);

      if (!fileExists) {
        logger.info('No JSON file found for Pokemon items');
        return null;
      }

      const fileContent = await fs.readFile(this.ITEMS_FILE, 'utf-8');
      const data = JSON.parse(fileContent);

      if (data.items && Array.isArray(data.items)) {
        logger.info(`Found JSON file with ${data.items.length} items (last updated: ${data.lastUpdated})`);
        // Convert any external URLs to local paths
        const items = data.items.map((item: ItemDetail) => ({
          ...item,
          sprite: item.sprite.startsWith('http') ? this.getLocalSpritePath(item.name) : item.sprite
        }));
        return items;
      }

      return null;
    } catch (error) {
      logger.error('Failed to load items from file:', error);
      return null;
    }
  }
  
  /**
   * Get all items
   */
  getAllItems(): ItemDetail[] {
    if (!this.isInitialized) {
      logger.warn('Item store not initialized, returning empty array');
      return [];
    }
    
    return Array.from(this.itemStore.items.values());
  }
  
  /**
   * Get a specific item by name
   */
  getItem(itemName: string): ItemDetail | undefined {
    if (!this.isInitialized) {
      logger.warn('Item store not initialized');
      return undefined;
    }
    
    // Try exact match first
    let item = this.itemStore.items.get(itemName);
    
    // If not found, try with lowercase and hyphens
    if (!item) {
      const normalizedName = itemName.toLowerCase().replace(/\s+/g, '-');
      item = this.itemStore.items.get(normalizedName);
    }
    
    return item;
  }
  
  /**
   * Get items by category
   */
  getItemsByCategory(category: string): ItemDetail[] {
    if (!this.isInitialized) {
      return [];
    }
    
    return Array.from(this.itemStore.items.values())
      .filter(item => item.category === category.toLowerCase());
  }
  
  /**
   * Search items by partial name or effect
   */
  searchItems(query: string): ItemDetail[] {
    if (!this.isInitialized) {
      return [];
    }
    
    const normalizedQuery = query.toLowerCase();
    return Array.from(this.itemStore.items.values())
      .filter(item => 
        item.name.includes(normalizedQuery) ||
        item.effect.toLowerCase().includes(normalizedQuery) ||
        item.shortEffect.toLowerCase().includes(normalizedQuery)
      );
  }
  
  /**
   * Get item store status
   */
  getStatus(): {
    initialized: boolean;
    totalItems: number;
    lastUpdated: Date;
  } {
    return {
      initialized: this.isInitialized,
      totalItems: this.itemStore.totalItems,
      lastUpdated: this.itemStore.lastUpdated
    };
  }
  
  /**
   * Force refresh the item store
   */
  async refresh(): Promise<void> {
    logger.info('Force refreshing Pokemon item store...');
    this.isInitialized = false;
    this.itemStore.items.clear();
    this.itemStore.totalItems = 0;
    
    // Delete the JSON file to force re-fetch from PokeAPI
    try {
      await fs.unlink(this.ITEMS_FILE);
      logger.info('Deleted existing items JSON file');
    } catch (error) {
      // File might not exist, which is fine
      logger.debug('No existing JSON file to delete');
    }
    
    await this.initialize();
  }
}

// Export singleton instance
export const pokemonItemStoreService = new PokemonItemStoreService();