import { prisma } from '../lib/prisma';
import logger from '../utils/logger';
import type { PokemonInstance as PrismaPokemonInstance, Battle, Prisma } from '@prisma/client';
import type { PokemonInstanceData } from '../types/pokemon-instance.types';

interface BattleWithInstances extends Battle {
  pokemon1: PrismaPokemonInstance;
  pokemon2: PrismaPokemonInstance;
}

class BattleTrackerService {
  /**
   * Save a Pokemon instance to the database
   */
  async savePokemonInstance(pokemon: PokemonInstanceData): Promise<PrismaPokemonInstance> {
    try {
      // Convert the PokemonInstance type to match Prisma schema
      const data: Prisma.PokemonInstanceCreateInput = {
        pokemonId: pokemon.id,
        name: pokemon.name,
        level: pokemon.level,
        types: pokemon.types,
        
        // Stats
        hp: pokemon.stats.hp,
        attack: pokemon.stats.attack,
        defense: pokemon.stats.defense,
        specialAttack: pokemon.stats.specialAttack,
        specialDefense: pokemon.stats.specialDefense,
        speed: pokemon.stats.speed,
        
        // Battle details
        ability: pokemon.ability,
        abilityName: pokemon.abilityDetail?.name || pokemon.ability,
        item: pokemon.item || null,
        itemName: pokemon.itemDetail?.name || pokemon.item || null,
        nature: pokemon.nature,
        
        // Complex data as JSON
        moves: pokemon.moves,
        ivs: pokemon.ivs,
        evs: pokemon.evs,
        
        // Visual
        sprite: pokemon.sprites.front,
        spriteBack: pokemon.sprites.back || null,
        isShiny: pokemon.shiny || false,
        
        // Future fields
        gender: pokemon.gender || null,
      };

      return await prisma.pokemonInstance.create({ data });
    } catch (error) {
      logger.error('Failed to save Pokemon instance:', error);
      throw error;
    }
  }

  /**
   * Save or retrieve a battle with its Pokemon instances
   */
  async saveOrGetBattle(
    pokemon1: PokemonInstanceData,
    pokemon2: PokemonInstanceData,
    winRate: number,
    totalBattles: number,
    executionTime?: number
  ): Promise<BattleWithInstances> {
    try {
      // Save Pokemon instances
      const [instance1, instance2] = await Promise.all([
        this.savePokemonInstance(pokemon1),
        this.savePokemonInstance(pokemon2)
      ]);

      // Check if battle already exists
      const existingBattle = await prisma.battle.findUnique({
        where: {
          pokemon1Id_pokemon2Id: {
            pokemon1Id: instance1.id,
            pokemon2Id: instance2.id
          }
        },
        include: {
          pokemon1: true,
          pokemon2: true
        }
      });

      if (existingBattle) {
        return existingBattle;
      }

      // Create new battle
      const battle = await prisma.battle.create({
        data: {
          pokemon1Id: instance1.id,
          pokemon2Id: instance2.id,
          winRate,
          totalBattles,
          executionTime: executionTime || null
        },
        include: {
          pokemon1: true,
          pokemon2: true
        }
      });

      return battle;
    } catch (error) {
      logger.error('Failed to save battle:', error);
      throw error;
    }
  }

  /**
   * Update battle statistics after a user prediction
   */
  async updateBattlePrediction(
    battleId: string,
    userGuessPercent: number,
    actualWinRate: number
  ): Promise<Battle> {
    try {
      // Check if guess is correct (within 10% tolerance)
      const isCorrect = Math.abs(userGuessPercent - actualWinRate * 100) <= 10;

      // Get current battle to calculate new average
      const currentBattle = await prisma.battle.findUnique({
        where: { id: battleId }
      });

      if (!currentBattle) {
        throw new Error(`Battle ${battleId} not found`);
      }

      // Calculate new average guess percentage
      const currentAvg = currentBattle.avgGuessPercent || 0;
      const currentTotal = currentBattle.totalGuesses;
      const newAvg = (currentAvg * currentTotal + userGuessPercent) / (currentTotal + 1);

      // Update battle statistics
      const updatedBattle = await prisma.battle.update({
        where: { id: battleId },
        data: {
          totalGuesses: { increment: 1 },
          correctGuesses: isCorrect ? { increment: 1 } : undefined,
          avgGuessPercent: newAvg
        }
      });

      logger.info(
        `Updated battle stats: ${updatedBattle.totalGuesses} guesses, ` +
        `${updatedBattle.correctGuesses} correct (${Math.round((updatedBattle.correctGuesses / updatedBattle.totalGuesses) * 100)}%), ` +
        `avg guess: ${Math.round(newAvg)}%`
      );

      return updatedBattle;
    } catch (error) {
      logger.error('Failed to update battle prediction:', error);
      throw error;
    }
  }

  /**
   * Get battle by Pokemon instance IDs
   */
  async getBattleByInstanceIds(
    pokemon1Id: string,
    pokemon2Id: string
  ): Promise<BattleWithInstances | null> {
    try {
      return await prisma.battle.findUnique({
        where: {
          pokemon1Id_pokemon2Id: {
            pokemon1Id,
            pokemon2Id
          }
        },
        include: {
          pokemon1: true,
          pokemon2: true
        }
      });
    } catch (error) {
      logger.error('Failed to get battle:', error);
      return null;
    }
  }

  /**
   * Get battle statistics
   */
  async getBattleStats(battleId: string): Promise<{
    totalGuesses: number;
    correctGuesses: number;
    accuracyRate: number;
    avgGuessPercent: number;
    actualWinPercent: number;
    guessBias: number; // How far off users typically are
  } | null> {
    try {
      const battle = await prisma.battle.findUnique({
        where: { id: battleId }
      });

      if (!battle) {
        return null;
      }

      const accuracyRate = battle.totalGuesses > 0 
        ? (battle.correctGuesses / battle.totalGuesses) * 100 
        : 0;
      
      const actualWinPercent = battle.winRate * 100;
      const avgGuessPercent = battle.avgGuessPercent || 0;
      const guessBias = avgGuessPercent - actualWinPercent;

      return {
        totalGuesses: battle.totalGuesses,
        correctGuesses: battle.correctGuesses,
        accuracyRate,
        avgGuessPercent,
        actualWinPercent,
        guessBias
      };
    } catch (error) {
      logger.error('Failed to get battle stats:', error);
      return null;
    }
  }

  /**
   * Get most popular battles
   */
  async getPopularBattles(limit: number = 10): Promise<BattleWithInstances[]> {
    try {
      return await prisma.battle.findMany({
        orderBy: {
          totalGuesses: 'desc'
        },
        take: limit,
        include: {
          pokemon1: true,
          pokemon2: true
        }
      });
    } catch (error) {
      logger.error('Failed to get popular battles:', error);
      return [];
    }
  }

  /**
   * Get hardest battles (lowest accuracy rate)
   */
  async getHardestBattles(limit: number = 10): Promise<BattleWithInstances[]> {
    try {
      const battles = await prisma.battle.findMany({
        where: {
          totalGuesses: {
            gte: 5 // Only include battles with at least 5 guesses
          }
        },
        include: {
          pokemon1: true,
          pokemon2: true
        }
      });

      // Calculate accuracy rate and sort
      const battlesWithAccuracy = battles.map(battle => ({
        ...battle,
        accuracyRate: battle.totalGuesses > 0 
          ? (battle.correctGuesses / battle.totalGuesses) 
          : 0
      }));

      battlesWithAccuracy.sort((a, b) => a.accuracyRate - b.accuracyRate);

      return battlesWithAccuracy.slice(0, limit);
    } catch (error) {
      logger.error('Failed to get hardest battles:', error);
      return [];
    }
  }
}

export const battleTrackerService = new BattleTrackerService();