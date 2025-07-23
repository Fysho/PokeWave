import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { pokemonShowdownService } from './pokemon-showdown.service';
import { isDatabaseEnabled } from '../config/database.config';
import { battleTrackerService } from './battle-tracker.service';
import type { BattleResult, GuessResult, BattleOptions } from '../types/battle.types';

interface StoredBattle extends BattleResult {
  dbBattleId?: string; // Reference to database battle record
}

class BattleServiceDB {
  // In-memory cache for current session
  private battles: Map<string, StoredBattle> = new Map();
  
  async simulateBattle(
    pokemon1Id: number, 
    pokemon2Id: number,
    options?: BattleOptions
  ): Promise<BattleResult> {
    try {
      const battleId = uuidv4();
      
      // Get Pokemon instances
      const pokemon1 = await pokemonShowdownService.createPokemonInstance(
        pokemon1Id, 
        options?.generation || 9,
        options?.pokemon1Level || 50,
        options?.itemMode || 'random'
      );
      
      const pokemon2 = await pokemonShowdownService.createPokemonInstance(
        pokemon2Id, 
        options?.generation || 9,
        options?.pokemon2Level || 50,
        options?.itemMode || 'random'
      );
      
      if (!pokemon1 || !pokemon2) {
        throw new Error('Failed to create Pokemon instances');
      }

      // Run the battle simulation
      const battleResult = await pokemonShowdownService.simulateMultipleBattles({
        pokemon1, 
        pokemon2, 
        generation: options?.generation || 9
      });
      
      // Extract results
      const pokemon1Wins = battleResult.pokemon1Wins;
      const pokemon2Wins = battleResult.pokemon2Wins;
      const totalBattles = battleResult.totalBattles;
      const winRate = pokemon1Wins / totalBattles;
      const executionTime = battleResult.executionTime;

      // Save to database if enabled
      let dbBattleId: string | undefined;
      if (isDatabaseEnabled()) {
        try {
          const dbBattle = await battleTrackerService.saveOrGetBattle(
            pokemon1,
            pokemon2,
            winRate,
            totalBattles,
            executionTime
          );
          dbBattleId = dbBattle.id;
        } catch (error) {
          logger.error('Failed to save battle to database:', error);
          // Continue without database tracking
        }
      }

      const result: StoredBattle = {
        battleId,
        pokemon1,
        pokemon2,
        totalBattles,
        pokemon1Wins,
        pokemon2Wins,
        winRate: winRate * 100, // Convert to percentage
        executionTime,
        dbBattleId
      };

      // Store in memory for this session
      this.battles.set(battleId, result);
      
      logger.info(`Battle ${battleId} simulated: ${pokemon1.name} vs ${pokemon2.name} - ${pokemon1.name} wins ${winRate * 100}%`);
      
      return result;
    } catch (error) {
      logger.error('Battle simulation failed:', error);
      throw error;
    }
  }

  async submitGuess(battleId: string, guessPercentage: number): Promise<GuessResult> {
    const battle = this.battles.get(battleId);
    
    if (!battle) {
      throw new Error('Battle not found');
    }

    // Validate guess
    if (guessPercentage < 0 || guessPercentage > 100) {
      throw new Error('Guess percentage must be between 0 and 100');
    }

    const actualWinRate = battle.winRate;
    const accuracy = Math.abs(guessPercentage - actualWinRate);
    const isCorrect = accuracy <= 10; // Within 10% tolerance

    // Calculate points
    let points = 0;
    if (isCorrect) {
      // Base points for correct guess
      points = 20;
      
      // Bonus points for accuracy (max 10 extra points)
      const accuracyBonus = Math.floor((10 - accuracy) * 1);
      points += accuracyBonus;
      
      // Difficulty bonus for close battles (50/50 is hardest)
      const difficultyBonus = Math.floor((50 - Math.abs(50 - actualWinRate)) / 5);
      points += difficultyBonus;
    }

    // Update database statistics if available
    if (isDatabaseEnabled() && battle.dbBattleId) {
      try {
        await battleTrackerService.updateBattlePrediction(
          battle.dbBattleId,
          guessPercentage,
          battle.winRate / 100 // Convert back to 0-1 range
        );
      } catch (error) {
        logger.error('Failed to update battle statistics:', error);
        // Continue without updating stats
      }
    }

    const message = isCorrect 
      ? `Great job! You predicted within ${accuracy.toFixed(1)}% accuracy!`
      : `Not quite! You were ${accuracy.toFixed(1)}% off.`;

    return {
      battleId,
      guessPercentage,
      actualWinRate,
      isCorrect,
      accuracy,
      points,
      message
    };
  }

  async getBattle(battleId: string): Promise<BattleResult | null> {
    return this.battles.get(battleId) || null;
  }

  // Additional methods for database-backed features
  async getPopularBattles(limit: number = 10) {
    if (!isDatabaseEnabled()) {
      return [];
    }
    
    try {
      const battles = await battleTrackerService.getPopularBattles(limit);
      return battles.map(battle => ({
        id: battle.id,
        pokemon1: battle.pokemon1,
        pokemon2: battle.pokemon2,
        totalGuesses: battle.totalGuesses,
        accuracyRate: battle.totalGuesses > 0 
          ? (battle.correctGuesses / battle.totalGuesses) * 100 
          : 0,
        avgGuessPercent: battle.avgGuessPercent || 0,
        actualWinPercent: battle.winRate * 100
      }));
    } catch (error) {
      logger.error('Failed to get popular battles:', error);
      return [];
    }
  }

  async getHardestBattles(limit: number = 10) {
    if (!isDatabaseEnabled()) {
      return [];
    }
    
    try {
      const battles = await battleTrackerService.getHardestBattles(limit);
      return battles.map(battle => ({
        id: battle.id,
        pokemon1: battle.pokemon1,
        pokemon2: battle.pokemon2,
        totalGuesses: battle.totalGuesses,
        accuracyRate: battle.totalGuesses > 0 
          ? (battle.correctGuesses / battle.totalGuesses) * 100 
          : 0,
        avgGuessPercent: battle.avgGuessPercent || 0,
        actualWinPercent: battle.winRate * 100
      }));
    } catch (error) {
      logger.error('Failed to get hardest battles:', error);
      return [];
    }
  }

  async getBattleStats(battleId: string) {
    const battle = this.battles.get(battleId);
    if (!battle || !battle.dbBattleId || !isDatabaseEnabled()) {
      return null;
    }

    try {
      return await battleTrackerService.getBattleStats(battle.dbBattleId);
    } catch (error) {
      logger.error('Failed to get battle stats:', error);
      return null;
    }
  }
}

export const battleServiceDB = new BattleServiceDB();