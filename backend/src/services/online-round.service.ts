/**
 * Online Round Service
 *
 * Manages synchronized rounds for Online Mode. All players see the same battle
 * at the same time. Rounds are deterministically generated based on Unix timestamp.
 */

import { PrismaClient } from '@prisma/client';
import { pokemonShowdownService } from './pokemon-showdown.service';
import { ONLINE_CONFIG, OnlineRoundState, OnlineRoundData, OnlinePhase } from '../types/online.types';
import logger from '../utils/logger';

class OnlineRoundService {
  private prisma: PrismaClient;
  private roundCache: Map<number, OnlineRoundData> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Calculate current round number based on Unix timestamp
   * Round N starts at: epoch + (N * ROUND_DURATION seconds)
   */
  getCurrentRoundNumber(): number {
    const now = Math.floor(Date.now() / 1000);
    return Math.floor(now / ONLINE_CONFIG.ROUND_DURATION);
  }

  /**
   * Get current phase (guessing or results)
   */
  getCurrentPhase(): OnlinePhase {
    const now = Math.floor(Date.now() / 1000);
    const secondsIntoRound = now % ONLINE_CONFIG.ROUND_DURATION;
    return secondsIntoRound < ONLINE_CONFIG.GUESS_DURATION ? 'guessing' : 'results';
  }

  /**
   * Get time remaining in current phase
   */
  getTimeRemaining(): number {
    const now = Math.floor(Date.now() / 1000);
    const secondsIntoRound = now % ONLINE_CONFIG.ROUND_DURATION;

    if (secondsIntoRound < ONLINE_CONFIG.GUESS_DURATION) {
      return ONLINE_CONFIG.GUESS_DURATION - secondsIntoRound;
    }
    return ONLINE_CONFIG.ROUND_DURATION - secondsIntoRound;
  }

  /**
   * Get the start time for a specific round
   */
  getRoundStartTime(roundNumber: number): Date {
    return new Date(roundNumber * ONLINE_CONFIG.ROUND_DURATION * 1000);
  }

  /**
   * Get the end time for a specific round
   */
  getRoundEndTime(roundNumber: number): Date {
    return new Date((roundNumber + 1) * ONLINE_CONFIG.ROUND_DURATION * 1000);
  }

  /**
   * Generate deterministic Pokemon IDs from round number
   * Uses the round number as a seed for reproducible results
   */
  private getSeededRandomPokemonIds(roundNumber: number): { pokemon1Id: number; pokemon2Id: number } {
    // Simple seeded random using round number
    // This ensures the same round always produces the same Pokemon pair
    const seed1 = (roundNumber * 9301 + 49297) % 233280;
    const seed2 = ((roundNumber + 1000000) * 9301 + 49297) % 233280;

    // Gen 9 range: 906-1025
    const genStart = 906;
    const genEnd = 1025;
    const range = genEnd - genStart + 1;

    const pokemon1Id = genStart + (seed1 % range);
    let pokemon2Id = genStart + (seed2 % range);

    // Ensure different Pokemon
    if (pokemon2Id === pokemon1Id) {
      pokemon2Id = genStart + ((pokemon2Id - genStart + 1) % range);
    }

    return { pokemon1Id, pokemon2Id };
  }

  /**
   * Get or create round data for a specific round number
   */
  async getOrCreateRound(roundNumber: number): Promise<OnlineRoundData> {
    // Check memory cache first
    if (this.roundCache.has(roundNumber)) {
      return this.roundCache.get(roundNumber)!;
    }

    // Check database
    let round = await this.prisma.onlineRound.findUnique({
      where: { roundNumber }
    });

    if (!round) {
      // Generate new round
      round = await this.generateRound(roundNumber);
    }

    // TypeScript assertion - round is guaranteed to exist at this point
    const existingRound = round!;

    const roundData: OnlineRoundData = {
      id: existingRound.id,
      roundNumber: existingRound.roundNumber,
      pokemon1Data: existingRound.pokemon1Data,
      pokemon2Data: existingRound.pokemon2Data,
      actualWinPercent: existingRound.actualWinPercent,
      startTime: existingRound.startTime,
      endTime: existingRound.endTime,
      totalParticipants: existingRound.totalParticipants
    };

    // Cache the round (keep last 10 rounds in memory)
    this.roundCache.set(roundNumber, roundData);
    if (this.roundCache.size > 10) {
      const oldestRound = Math.min(...this.roundCache.keys());
      this.roundCache.delete(oldestRound);
    }

    return roundData;
  }

  /**
   * Generate a new round with Pokemon and simulation
   */
  private async generateRound(roundNumber: number): Promise<any> {
    logger.info(`Generating online round ${roundNumber}`);

    try {
      // Get deterministic Pokemon IDs
      const { pokemon1Id, pokemon2Id } = this.getSeededRandomPokemonIds(roundNumber);

      // Create Pokemon instances
      const [pokemon1, pokemon2] = await Promise.all([
        pokemonShowdownService.createPokemonInstance(
          pokemon1Id,
          ONLINE_CONFIG.LEVEL,
          ONLINE_CONFIG.GENERATION,
          ONLINE_CONFIG.ITEM_MODE
        ),
        pokemonShowdownService.createPokemonInstance(
          pokemon2Id,
          ONLINE_CONFIG.LEVEL,
          ONLINE_CONFIG.GENERATION,
          ONLINE_CONFIG.ITEM_MODE
        )
      ]);

      // Run battle simulation (1000 times for accuracy)
      const battleResult = await pokemonShowdownService.simulateMultipleBattles({
        pokemon1,
        pokemon2,
        generation: ONLINE_CONFIG.GENERATION,
        battleCount: ONLINE_CONFIG.SIMULATION_COUNT
      });

      // Calculate win percentage (0-100)
      const actualWinPercent = (battleResult.pokemon1Wins / battleResult.totalBattles) * 100;

      // Calculate round timing
      const startTime = this.getRoundStartTime(roundNumber);
      const endTime = this.getRoundEndTime(roundNumber);

      // Store in database
      const round = await this.prisma.onlineRound.create({
        data: {
          roundNumber,
          pokemon1Data: pokemon1 as any,
          pokemon2Data: pokemon2 as any,
          actualWinPercent,
          startTime,
          endTime,
          totalParticipants: 0
        }
      });

      logger.info(`Online round ${roundNumber} generated: ${pokemon1.name} vs ${pokemon2.name} (${actualWinPercent.toFixed(1)}% win rate)`);
      return round;
    } catch (error) {
      logger.error(`Failed to generate online round ${roundNumber}:`, error);
      throw error;
    }
  }

  /**
   * Pre-generate upcoming rounds
   */
  async preGenerateRounds(count: number = 5): Promise<void> {
    const currentRound = this.getCurrentRoundNumber();

    for (let i = 0; i < count; i++) {
      const roundNumber = currentRound + i;
      try {
        const exists = await this.prisma.onlineRound.findUnique({
          where: { roundNumber },
          select: { id: true }
        });

        if (!exists) {
          await this.generateRound(roundNumber);
        }
      } catch (error) {
        logger.error(`Failed to pre-generate round ${roundNumber}:`, error);
      }
    }
  }

  /**
   * Start the round generation loop
   */
  async startRoundLoop(): Promise<void> {
    if (this.intervalId || this.isInitialized) return;

    this.isInitialized = true;
    logger.info('Starting Online Mode round generation loop...');

    // Generate initial rounds
    try {
      await this.preGenerateRounds(10);
      logger.info('Initial rounds pre-generated');
    } catch (error) {
      logger.error('Failed to pre-generate initial rounds:', error);
    }

    // Check every 10 seconds for new rounds needed
    this.intervalId = setInterval(async () => {
      try {
        await this.preGenerateRounds(5);
      } catch (error) {
        logger.error('Error in round generation loop:', error);
      }
    }, 10000);

    logger.info('Online round generation loop started');
  }

  /**
   * Stop the round generation loop
   */
  stopRoundLoop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isInitialized = false;
      logger.info('Online round generation loop stopped');
    }
  }

  /**
   * Get current round state (for REST API and WebSocket)
   */
  async getCurrentRoundState(): Promise<OnlineRoundState> {
    const roundNumber = this.getCurrentRoundNumber();
    const roundData = await this.getOrCreateRound(roundNumber);
    const phase = this.getCurrentPhase();
    const timeRemaining = this.getTimeRemaining();

    return {
      roundNumber: roundData.roundNumber,
      phase,
      timeRemaining,
      pokemon1: roundData.pokemon1Data,
      pokemon2: roundData.pokemon2Data,
      // Only reveal actual win percent in results phase
      actualWinPercent: phase === 'results' ? roundData.actualWinPercent : undefined,
      totalParticipants: roundData.totalParticipants
    };
  }

  /**
   * Get round by number (for results lookup)
   */
  async getRoundByNumber(roundNumber: number): Promise<OnlineRoundData | null> {
    const round = await this.prisma.onlineRound.findUnique({
      where: { roundNumber }
    });

    if (!round) return null;

    return {
      id: round.id,
      roundNumber: round.roundNumber,
      pokemon1Data: round.pokemon1Data,
      pokemon2Data: round.pokemon2Data,
      actualWinPercent: round.actualWinPercent,
      startTime: round.startTime,
      endTime: round.endTime,
      totalParticipants: round.totalParticipants
    };
  }

  /**
   * Update participant count for a round
   */
  async updateParticipantCount(roundId: string, count: number): Promise<void> {
    await this.prisma.onlineRound.update({
      where: { id: roundId },
      data: { totalParticipants: count }
    });
  }

  /**
   * Clean up old rounds (older than 24 hours)
   */
  async cleanupOldRounds(): Promise<number> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await this.prisma.onlineRound.deleteMany({
      where: {
        endTime: { lt: oneDayAgo }
      }
    });

    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} old online rounds`);
    }

    return result.count;
  }
}

export const onlineRoundService = new OnlineRoundService();
