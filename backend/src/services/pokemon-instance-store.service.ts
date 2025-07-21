import { PokemonInstanceData } from '../types/pokemon-instance.types';
import logger from '../utils/logger';
import crypto from 'crypto';

interface StoredPokemonInstance extends PokemonInstanceData {
  instanceId: string;
  createdAt: Date;
  userId?: string; // For future multi-user support
}

class PokemonInstanceStore {
  private instances: Map<string, StoredPokemonInstance> = new Map();
  private readonly MAX_INSTANCES = 10000; // Prevent memory overflow
  private readonly INSTANCE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Store a Pokemon instance and return its unique ID
   */
  storeInstance(pokemonData: PokemonInstanceData, userId?: string): string {
    const instanceId = crypto.randomUUID();
    
    const storedInstance: StoredPokemonInstance = {
      ...pokemonData,
      instanceId,
      createdAt: new Date(),
      userId
    };

    // Clean up old instances if we're at capacity
    if (this.instances.size >= this.MAX_INSTANCES) {
      this.cleanupOldInstances();
    }

    this.instances.set(instanceId, storedInstance);
    
    logger.info(`Stored Pokemon instance: ${instanceId} - ${pokemonData.name} (Level ${pokemonData.level})`);
    
    return instanceId;
  }

  /**
   * Retrieve a Pokemon instance by ID
   */
  getInstance(instanceId: string): PokemonInstanceData | null {
    const instance = this.instances.get(instanceId);
    
    if (!instance) {
      logger.warn(`Pokemon instance not found: ${instanceId}`);
      return null;
    }

    // Check if instance is expired
    const age = Date.now() - instance.createdAt.getTime();
    if (age > this.INSTANCE_TTL) {
      logger.info(`Pokemon instance expired: ${instanceId}`);
      this.instances.delete(instanceId);
      return null;
    }

    // Return the instance data without internal metadata
    const { instanceId: _, createdAt: __, userId: ___, ...pokemonData } = instance;
    return pokemonData;
  }

  /**
   * Store two Pokemon instances and return their IDs
   */
  storeBattlePair(pokemon1: PokemonInstanceData, pokemon2: PokemonInstanceData, userId?: string): {
    pokemon1InstanceId: string;
    pokemon2InstanceId: string;
  } {
    const pokemon1InstanceId = this.storeInstance(pokemon1, userId);
    const pokemon2InstanceId = this.storeInstance(pokemon2, userId);

    return {
      pokemon1InstanceId,
      pokemon2InstanceId
    };
  }

  /**
   * Clean up instances older than TTL
   */
  private cleanupOldInstances(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, instance] of this.instances.entries()) {
      const age = now - instance.createdAt.getTime();
      if (age > this.INSTANCE_TTL) {
        this.instances.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} expired Pokemon instances`);
    }
  }

  /**
   * Get current store size (for monitoring)
   */
  getStoreSize(): number {
    return this.instances.size;
  }

  /**
   * Clear all instances (for testing)
   */
  clearAll(): void {
    this.instances.clear();
    logger.info('Cleared all Pokemon instances from store');
  }
}

// Export singleton instance
export const pokemonInstanceStore = new PokemonInstanceStore();