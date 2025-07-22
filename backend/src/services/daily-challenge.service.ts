import { cacheService } from './cache.service';
import { pokemonShowdownService } from './pokemon-showdown.service';
import { DailyChallenge, DailyBattle } from '../types/daily-challenge.types';
import logger from '../utils/logger';
import crypto from 'crypto';

class DailyChallengeService {
  private readonly CACHE_PREFIX = 'daily-challenge:';
  private readonly DAYS_TO_KEEP_PAST = 7;
  private readonly DAYS_TO_GENERATE_FUTURE = 2;
  private readonly CACHE_TTL = 60 * 60 * 24 * 30; // 30 days

  /**
   * Get daily challenge for a specific date
   */
  async getDailyChallenge(date: Date): Promise<DailyChallenge | null> {
    const dateKey = this.getDateKey(date);
    const cacheKey = `${this.CACHE_PREFIX}${dateKey}`;
    
    try {
      const cached = await cacheService.get<DailyChallenge>(cacheKey);
      if (cached) {
        logger.info(`Daily challenge found in cache for ${dateKey}`);
        return cached;
      }
      
      // If not in cache and it's a valid date range, generate it
      if (this.isDateInValidRange(date)) {
        logger.info(`Generating daily challenge for ${dateKey}`);
        return await this.generateDailyChallenge(date);
      }
      
      return null;
    } catch (error) {
      logger.error('Error getting daily challenge:', error);
      throw error;
    }
  }

  /**
   * Get today's daily challenge
   */
  async getTodaysChallenge(): Promise<DailyChallenge> {
    const today = new Date();
    const challenge = await this.getDailyChallenge(today);
    
    if (!challenge) {
      // This should not happen if initialization is working correctly
      logger.warn('No daily challenge found for today, generating now');
      return await this.generateDailyChallenge(today);
    }
    
    return challenge;
  }

  /**
   * Initialize daily challenges on app startup
   */
  async initializeDailyChallenges(): Promise<void> {
    logger.info('Initializing daily challenges...');
    
    const today = new Date();
    const dates: Date[] = [];
    
    // Add past days
    for (let i = this.DAYS_TO_KEEP_PAST; i >= 1; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    
    // Add today
    dates.push(today);
    
    // Add future days
    for (let i = 1; i <= this.DAYS_TO_GENERATE_FUTURE; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    
    // Check and generate challenges for each date
    for (const date of dates) {
      const dateKey = this.getDateKey(date);
      const existing = await this.getDailyChallenge(date);
      
      if (!existing) {
        logger.info(`Generating missing daily challenge for ${dateKey}`);
        await this.generateDailyChallenge(date);
      } else {
        logger.info(`Daily challenge already exists for ${dateKey}`);
      }
    }
    
    // Clean up old challenges
    await this.cleanupOldChallenges();
    
    logger.info('Daily challenges initialization complete');
  }

  /**
   * Generate a daily challenge for a specific date
   */
  private async generateDailyChallenge(date: Date): Promise<DailyChallenge> {
    const dateKey = this.getDateKey(date);
    const battles: DailyBattle[] = [];
    
    // Use date as seed for consistent random generation
    const seed = this.generateSeed(dateKey);
    const rng = this.createSeededRandom(seed);
    
    // Generate 6 unique battles
    for (let i = 0; i < 6; i++) {
      const battle = await this.generateUniqueBattle(rng, battles);
      battles.push(battle);
    }
    
    const challenge: DailyChallenge = {
      id: crypto.randomUUID(),
      date: dateKey,
      battles,
      createdAt: new Date(),
      expiresAt: new Date(date.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days later
    };
    
    // Cache the challenge
    const cacheKey = `${this.CACHE_PREFIX}${dateKey}`;
    await cacheService.set(cacheKey, challenge, this.CACHE_TTL);
    
    logger.info(`Generated and cached daily challenge for ${dateKey}`);
    return challenge;
  }

  /**
   * Generate a unique battle that doesn't duplicate Pokemon from existing battles
   */
  private async generateUniqueBattle(rng: () => number, existingBattles: DailyBattle[]): Promise<DailyBattle> {
    const usedPokemonIds = new Set<number>();
    existingBattles.forEach(battle => {
      usedPokemonIds.add(battle.pokemon1.id);
      usedPokemonIds.add(battle.pokemon2.id);
    });
    
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
      // Generate random Pokemon IDs
      const pokemon1Id = this.getRandomPokemonId(rng);
      const pokemon2Id = this.getRandomPokemonId(rng);
      
      // Ensure they're different and not already used
      if (pokemon1Id !== pokemon2Id && 
          !usedPokemonIds.has(pokemon1Id) && 
          !usedPokemonIds.has(pokemon2Id)) {
        
        // Generate random levels
        const level1 = Math.floor(rng() * 51) + 50; // 50-100
        const level2 = Math.floor(rng() * 51) + 50; // 50-100
        
        // Create Pokemon instances
        const pokemon1 = await pokemonShowdownService.createPokemonInstance(
          pokemon1Id, 
          level1, 
          9, // Gen 9
          rng() < 0.5 ? 'random' : 'none' // 50% chance of item
        );
        
        const pokemon2 = await pokemonShowdownService.createPokemonInstance(
          pokemon2Id, 
          level2, 
          9, // Gen 9
          rng() < 0.5 ? 'random' : 'none' // 50% chance of item
        );
        
        // Simulate the battle
        const battleResult = await pokemonShowdownService.simulateMultipleBattles({
          pokemon1,
          pokemon2,
          generation: 9
        });
        
        const dailyBattle: DailyBattle = {
          battleId: crypto.randomUUID(),
          pokemon1,
          pokemon2,
          winRate: battleResult.pokemon1Wins / battleResult.totalBattles,
          totalBattles: battleResult.totalBattles,
          executionTime: battleResult.executionTime
        };
        
        return dailyBattle;
      }
      
      attempts++;
    }
    
    throw new Error('Failed to generate unique battle after maximum attempts');
  }

  /**
   * Get a random Pokemon ID using seeded random
   */
  private getRandomPokemonId(rng: () => number): number {
    // For now, use Gen 1-3 Pokemon (1-386) for variety
    return Math.floor(rng() * 386) + 1;
  }

  /**
   * Create a seeded random number generator
   */
  private createSeededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 2147483647;
      return state / 2147483647;
    };
  }

  /**
   * Generate a numeric seed from a date string
   */
  private generateSeed(dateKey: string): number {
    let hash = 0;
    for (let i = 0; i < dateKey.length; i++) {
      hash = ((hash << 5) - hash) + dateKey.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get date key in YYYY-MM-DD format
   */
  private getDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Check if date is within valid range for challenges
   */
  private isDateInValidRange(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() - this.DAYS_TO_KEEP_PAST);
    
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + this.DAYS_TO_GENERATE_FUTURE);
    
    date.setHours(0, 0, 0, 0);
    return date >= minDate && date <= maxDate;
  }

  /**
   * Clean up challenges older than DAYS_TO_KEEP_PAST
   */
  private async cleanupOldChallenges(): Promise<void> {
    logger.info('Cleaning up old daily challenges...');
    
    const today = new Date();
    const oldestDate = new Date(today);
    oldestDate.setDate(oldestDate.getDate() - this.DAYS_TO_KEEP_PAST - 1);
    
    // We can't easily iterate Redis keys with the current setup,
    // so we'll just try to delete specific old dates
    for (let i = this.DAYS_TO_KEEP_PAST + 1; i <= this.DAYS_TO_KEEP_PAST + 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = this.getDateKey(date);
      const cacheKey = `${this.CACHE_PREFIX}${dateKey}`;
      
      try {
        await cacheService.delete(cacheKey);
      } catch (error) {
        // Ignore errors for non-existent keys
      }
    }
    
    logger.info('Old daily challenges cleanup complete');
  }

  /**
   * Manually refresh challenges (for testing or admin purposes)
   */
  async refreshAllChallenges(): Promise<void> {
    logger.info('Manually refreshing all daily challenges...');
    await this.initializeDailyChallenges();
  }
}

export const dailyChallengeService = new DailyChallengeService();