import { Dex } from '@pkmn/dex';
import { cacheService } from './cache.service';
import { pokemonService } from './pokemon.service';
import logger from '../utils/logger';
import { ApiError } from '../middleware/error.middleware';
import crypto from 'crypto';

export interface ShowdownBattleConfig {
  pokemon1Id: number;
  pokemon2Id: number;
  options?: {
    generation?: number;
    pokemon1Level?: number;
    pokemon2Level?: number;
    withItems?: boolean;
    movesetType?: 'random' | 'competitive';
    aiDifficulty?: 'random' | 'elite';
  };
}

export interface ShowdownBattleResult {
  battleId: string;
  pokemon1: {
    id: number;
    name: string;
    level: number;
    wins: number;
    types: string[];
    sprites: {
      front: string;
      back: string;
      shiny: string;
    };
    moves: string[];
    stats: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
  };
  pokemon2: {
    id: number;
    name: string;
    level: number;
    wins: number;
    types: string[];
    sprites: {
      front: string;
      back: string;
      shiny: string;
    };
    moves: string[];
    stats: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
  };
  totalBattles: number;
  winRate: number;
  executionTime: number;
}

class ShowdownService {
  private readonly NUM_BATTLES = 1000;

  constructor() {
    // Initialize with default generation
  }

  async simulateBattle(config: ShowdownBattleConfig): Promise<ShowdownBattleResult> {
    const startTime = Date.now();
    
    try {
      // Generate cache key for battle configuration
      const cacheKey = this.generateBattleKey(config);
      
      // Check cache first
      const cachedResult = await cacheService.get<ShowdownBattleResult>(`showdown:${cacheKey}`);
      if (cachedResult) {
        logger.info(`Battle found in cache: ${cacheKey}`);
        return cachedResult;
      }

      // Get Pokemon data from both Dex and PokeAPI
      const generation = config.options?.generation || 9;
      const dex = Dex.forGen(generation);
      
      // Try to get Pokemon by ID and name
      let pokemon1 = dex.species.get(config.pokemon1Id.toString());
      let pokemon2 = dex.species.get(config.pokemon2Id.toString());

      // If not found by ID, try to find by national dex number
      if (!pokemon1?.exists) {
        const allPokemon = dex.species.all();
        const found = allPokemon.find(p => p.num === config.pokemon1Id);
        if (found) {
          pokemon1 = found;
        }
      }
      if (!pokemon2?.exists) {
        const allPokemon = dex.species.all();
        const found = allPokemon.find(p => p.num === config.pokemon2Id);
        if (found) {
          pokemon2 = found;
        }
      }

      if (!pokemon1?.exists || !pokemon2?.exists) {
        logger.error('Pokemon not found', { pokemon1Id: config.pokemon1Id, pokemon2Id: config.pokemon2Id });
        throw new ApiError(400, 'Invalid Pokemon IDs provided');
      }

      // Fetch Pokemon data from PokeAPI for sprites and types
      let pokemon1Data, pokemon2Data;
      try {
        [pokemon1Data, pokemon2Data] = await Promise.all([
          pokemonService.getPokemonById(config.pokemon1Id),
          pokemonService.getPokemonById(config.pokemon2Id)
        ]);
        
        logger.info(`Showdown service - Pokemon data fetched:`, {
          pokemon1Moves: pokemon1Data.moves,
          pokemon2Moves: pokemon2Data.moves
        });
      } catch (pokemonError) {
        logger.error('Failed to fetch Pokemon data from PokeAPI:', pokemonError);
        // Fallback to basic Pokemon data without sprites and types
        pokemon1Data = { types: [], sprites: { front: '', back: '', shiny: '' }, moves: [] };
        pokemon2Data = { types: [], sprites: { front: '', back: '', shiny: '' }, moves: [] };
      }

      const pokemon1Level = config.options?.pokemon1Level || 50;
      const pokemon2Level = config.options?.pokemon2Level || 50;

      // Calculate actual stats at current level for both Pokemon
      const pokemon1ActualStats = this.calculateEffectiveStats(pokemon1, pokemon1Level);
      const pokemon2ActualStats = this.calculateEffectiveStats(pokemon2, pokemon2Level);

      // For now, use a statistical simulation based on Pokemon stats
      // This is a simplified version - in a full implementation we'd use the actual battle engine
      const battleResult = this.simulateStatisticalBattle(
        pokemon1,
        pokemon2,
        pokemon1Level,
        pokemon2Level,
        config.options
      );

      const winRate = (battleResult.pokemon1Wins / this.NUM_BATTLES) * 100;
      const executionTime = Date.now() - startTime;

      const result: ShowdownBattleResult = {
        battleId: crypto.randomUUID(),
        pokemon1: {
          id: config.pokemon1Id,
          name: pokemon1.name,
          level: pokemon1Level,
          wins: battleResult.pokemon1Wins,
          types: pokemon1Data?.types || [],
          sprites: pokemon1Data?.sprites || { front: '', back: '', shiny: '' },
          moves: pokemon1Data?.moves || [],
          stats: pokemon1ActualStats
        },
        pokemon2: {
          id: config.pokemon2Id,
          name: pokemon2.name,
          level: pokemon2Level,
          wins: battleResult.pokemon2Wins,
          types: pokemon2Data?.types || [],
          sprites: pokemon2Data?.sprites || { front: '', back: '', shiny: '' },
          moves: pokemon2Data?.moves || [],
          stats: pokemon2ActualStats
        },
        totalBattles: this.NUM_BATTLES,
        winRate,
        executionTime
      };

      // Cache the result for 1 hour
      await cacheService.set(`showdown:${cacheKey}`, result, 3600);

      logger.info(`Battle simulation completed: ${pokemon1.name} vs ${pokemon2.name}`, {
        winRate,
        executionTime: `${executionTime}ms`,
        pokemon1Wins: battleResult.pokemon1Wins,
        pokemon2Wins: battleResult.pokemon2Wins
      });

      return result;
    } catch (error) {
      logger.error('Failed to simulate battle with Showdown:', error);
      throw error instanceof ApiError ? error : new ApiError(500, 'Failed to simulate battle');
    }
  }

  private simulateStatisticalBattle(
    pokemon1: any,
    pokemon2: any,
    pokemon1Level: number,
    pokemon2Level: number,
    options?: ShowdownBattleConfig['options']
  ): { pokemon1Wins: number; pokemon2Wins: number } {
    // Calculate battle statistics based on Pokemon stats
    const p1Stats = this.calculateEffectiveStats(pokemon1, pokemon1Level);
    const p2Stats = this.calculateEffectiveStats(pokemon2, pokemon2Level);

    // Simple statistical model based on total stats
    const p1Total = p1Stats.hp + p1Stats.attack + p1Stats.defense + p1Stats.specialAttack + p1Stats.specialDefense + p1Stats.speed;
    const p2Total = p2Stats.hp + p2Stats.attack + p2Stats.defense + p2Stats.specialAttack + p2Stats.specialDefense + p2Stats.speed;

    // Calculate win probability for Pokemon 1
    const statRatio = p1Total / (p1Total + p2Total);
    
    // Add some randomness and type effectiveness simulation
    const typeAdvantage = this.getTypeAdvantage(pokemon1, pokemon2);
    const adjustedWinRate = Math.max(0.01, Math.min(0.99, statRatio + typeAdvantage));

    // Debug logging for extreme level differences
    if (Math.abs(pokemon1Level - pokemon2Level) > 50) {
      logger.info(`Battle simulation debug:`, {
        pokemon1: `${pokemon1.name} (Level ${pokemon1Level})`,
        pokemon2: `${pokemon2.name} (Level ${pokemon2Level})`,
        p1Stats,
        p2Stats,
        p1Total,
        p2Total,
        statRatio,
        typeAdvantage,
        adjustedWinRate: adjustedWinRate.toFixed(3)
      });
    }

    // Simulate 1000 battles
    let pokemon1Wins = 0;
    let pokemon2Wins = 0;

    for (let i = 0; i < this.NUM_BATTLES; i++) {
      const randomFactor = Math.random();
      if (randomFactor < adjustedWinRate) {
        pokemon1Wins++;
      } else {
        pokemon2Wins++;
      }
    }

    return { pokemon1Wins, pokemon2Wins };
  }

  private calculateEffectiveStats(pokemon: any, level: number): any {
    // More realistic Pokemon stat calculation
    // Formula: ((2 * baseStat + IV + (EV / 4)) * level / 100) + 5
    // Simplified: assume average IV (15) and no EVs for fairness
    const IV = 15; // Average IV
    const EV = 0;  // No EVs for simplicity
    
    const calculateStat = (baseStat: number, isHP: boolean = false) => {
      let stat = Math.floor(((2 * baseStat + IV + (EV / 4)) * level / 100) + 5);
      
      // HP has a different formula: add level + 5 instead of just + 5
      if (isHP) {
        stat = Math.floor(((2 * baseStat + IV + (EV / 4)) * level / 100) + level + 10);
      }
      
      return Math.max(1, stat); // Minimum stat of 1
    };
    
    return {
      hp: calculateStat(pokemon.baseStats.hp, true),
      attack: calculateStat(pokemon.baseStats.atk),
      defense: calculateStat(pokemon.baseStats.def),
      specialAttack: calculateStat(pokemon.baseStats.spa),
      specialDefense: calculateStat(pokemon.baseStats.spd),
      speed: calculateStat(pokemon.baseStats.spe)
    };
  }

  private getTypeAdvantage(pokemon1: any, pokemon2: any): number {
    // Simple type advantage calculation
    // This is a simplified version - in reality, type chart is complex
    const type1 = pokemon1.types[0];
    const type2 = pokemon2.types[0];

    // Some basic type advantages (simplified)
    const typeChart: { [key: string]: { [key: string]: number } } = {
      'Fire': { 'Grass': 0.1, 'Water': -0.1, 'Fire': 0 },
      'Water': { 'Fire': 0.1, 'Grass': -0.1, 'Water': 0 },
      'Grass': { 'Water': 0.1, 'Fire': -0.1, 'Grass': 0 },
      'Electric': { 'Water': 0.1, 'Flying': 0.1, 'Ground': -0.2 },
      'Ground': { 'Electric': 0.1, 'Fire': 0.1, 'Flying': -0.2 },
    };

    return typeChart[type1]?.[type2] || 0;
  }

  private generateBattleKey(config: ShowdownBattleConfig): string {
    const keyData = {
      pokemon1Id: config.pokemon1Id,
      pokemon2Id: config.pokemon2Id,
      generation: config.options?.generation || 9,
      pokemon1Level: config.options?.pokemon1Level || 50,
      pokemon2Level: config.options?.pokemon2Level || 50,
      withItems: config.options?.withItems || false,
      movesetType: config.options?.movesetType || 'random',
      aiDifficulty: config.options?.aiDifficulty || 'random'
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex');
  }

  async simulateSingleBattle(config: ShowdownBattleConfig): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Get Pokemon data
      const generation = config.options?.generation || 9;
      const dex = Dex.forGen(generation);
      
      let pokemon1 = dex.species.get(config.pokemon1Id.toString());
      let pokemon2 = dex.species.get(config.pokemon2Id.toString());

      if (!pokemon1?.exists) {
        const allPokemon = dex.species.all();
        const found = allPokemon.find(p => p.num === config.pokemon1Id);
        if (found) pokemon1 = found;
      }
      if (!pokemon2?.exists) {
        const allPokemon = dex.species.all();
        const found = allPokemon.find(p => p.num === config.pokemon2Id);
        if (found) pokemon2 = found;
      }

      if (!pokemon1?.exists || !pokemon2?.exists) {
        throw new ApiError(400, 'Invalid Pokemon IDs provided');
      }

      // Fetch Pokemon data from PokeAPI for moves
      let pokemon1Data, pokemon2Data;
      try {
        [pokemon1Data, pokemon2Data] = await Promise.all([
          pokemonService.getPokemonById(config.pokemon1Id),
          pokemonService.getPokemonById(config.pokemon2Id)
        ]);
      } catch (pokemonError) {
        logger.error('Failed to fetch Pokemon data from PokeAPI:', pokemonError);
        pokemon1Data = { moves: [] };
        pokemon2Data = { moves: [] };
      }

      const pokemon1Level = config.options?.pokemon1Level || 50;
      const pokemon2Level = config.options?.pokemon2Level || 50;

      // Calculate actual stats at current level
      const pokemon1Stats = this.calculateEffectiveStats(pokemon1, pokemon1Level);
      const pokemon2Stats = this.calculateEffectiveStats(pokemon2, pokemon2Level);

      // Simulate a single battle
      const battleResult = this.simulateSingleBattleDetailed(
        pokemon1,
        pokemon2,
        pokemon1Stats,
        pokemon2Stats,
        pokemon1Data,
        pokemon2Data,
        pokemon1Level,
        pokemon2Level
      );

      const executionTime = Date.now() - startTime;

      return {
        ...battleResult,
        executionTime,
        pokemon1: {
          name: pokemon1.name,
          level: pokemon1Level,
          stats: pokemon1Stats
        },
        pokemon2: {
          name: pokemon2.name,
          level: pokemon2Level,
          stats: pokemon2Stats
        }
      };
    } catch (error) {
      logger.error('Failed to simulate single battle:', error);
      throw error instanceof ApiError ? error : new ApiError(500, 'Failed to simulate single battle');
    }
  }

  private simulateSingleBattleDetailed(
    pokemon1: any,
    pokemon2: any,
    pokemon1Stats: any,
    pokemon2Stats: any,
    pokemon1Data: any,
    pokemon2Data: any,
    pokemon1Level: number,
    pokemon2Level: number
  ): any {
    const turns: any[] = [];
    let currentHP1 = pokemon1Stats.hp;
    let currentHP2 = pokemon2Stats.hp;
    let turnNumber = 1;

    // Get random moves for each Pokemon
    const getMoves = (pokemonData: any) => {
      const moves = pokemonData.moves || [];
      return moves.length > 0 ? moves : ['Tackle', 'Scratch'];
    };

    const pokemon1Moves = getMoves(pokemon1Data);
    const pokemon2Moves = getMoves(pokemon2Data);

    // Simple battle simulation
    while (currentHP1 > 0 && currentHP2 > 0 && turnNumber <= 50) {
      // Determine who goes first (higher speed)
      const pokemon1GoesFirst = pokemon1Stats.speed >= pokemon2Stats.speed;
      
      if (pokemon1GoesFirst) {
        // Pokemon 1 attacks
        const result1 = this.simulateAttack(pokemon1, pokemon2, pokemon1Stats, pokemon2Stats, pokemon1Moves, pokemon1Level, pokemon2Level);
        currentHP2 -= result1.damage;
        
        turns.push({
          turn: turnNumber,
          attacker: pokemon1.name,
          defender: pokemon2.name,
          move: result1.move,
          damage: result1.damage,
          remainingHP: Math.max(0, currentHP2),
          critical: result1.critical,
          effectiveness: result1.effectiveness
        });

        if (currentHP2 <= 0) break;

        // Pokemon 2 attacks
        const result2 = this.simulateAttack(pokemon2, pokemon1, pokemon2Stats, pokemon1Stats, pokemon2Moves, pokemon2Level, pokemon1Level);
        currentHP1 -= result2.damage;
        
        turns.push({
          turn: turnNumber,
          attacker: pokemon2.name,
          defender: pokemon1.name,
          move: result2.move,
          damage: result2.damage,
          remainingHP: Math.max(0, currentHP1),
          critical: result2.critical,
          effectiveness: result2.effectiveness
        });
      } else {
        // Pokemon 2 attacks first
        const result2 = this.simulateAttack(pokemon2, pokemon1, pokemon2Stats, pokemon1Stats, pokemon2Moves, pokemon2Level, pokemon1Level);
        currentHP1 -= result2.damage;
        
        turns.push({
          turn: turnNumber,
          attacker: pokemon2.name,
          defender: pokemon1.name,
          move: result2.move,
          damage: result2.damage,
          remainingHP: Math.max(0, currentHP1),
          critical: result2.critical,
          effectiveness: result2.effectiveness
        });

        if (currentHP1 <= 0) break;

        // Pokemon 1 attacks
        const result1 = this.simulateAttack(pokemon1, pokemon2, pokemon1Stats, pokemon2Stats, pokemon1Moves, pokemon1Level, pokemon2Level);
        currentHP2 -= result1.damage;
        
        turns.push({
          turn: turnNumber,
          attacker: pokemon1.name,
          defender: pokemon2.name,
          move: result1.move,
          damage: result1.damage,
          remainingHP: Math.max(0, currentHP2),
          critical: result1.critical,
          effectiveness: result1.effectiveness
        });
      }

      turnNumber++;
    }

    return {
      winner: currentHP1 > 0 ? pokemon1.name : pokemon2.name,
      turns,
      totalTurns: turnNumber - 1,
      finalHP1: Math.max(0, currentHP1),
      finalHP2: Math.max(0, currentHP2)
    };
  }

  private simulateAttack(
    attacker: any,
    defender: any,
    attackerStats: any,
    defenderStats: any,
    moves: string[],
    attackerLevel: number,
    defenderLevel: number
  ): any {
    // Pick a random move
    const move = moves[Math.floor(Math.random() * moves.length)];
    
    // Simple damage calculation (simplified Pokemon damage formula)
    const attackStat = Math.random() > 0.5 ? attackerStats.attack : attackerStats.specialAttack;
    const defenseStat = Math.random() > 0.5 ? defenderStats.defense : defenderStats.specialDefense;
    
    // Critical hit chance (6.25% chance)
    const critical = Math.random() < 0.0625;
    const criticalMultiplier = critical ? 2 : 1;
    
    // Random damage roll (85-100% of calculated damage)
    const randomFactor = (Math.random() * 0.15) + 0.85;
    
    // Type effectiveness (simplified)
    const effectiveness = this.getRandomEffectiveness();
    const effectivenessMultiplier = this.getEffectivenessMultiplier(effectiveness);
    
    // Basic damage formula (simplified)
    const baseDamage = Math.floor(
      ((((2 * attackerLevel / 5 + 2) * 50 * attackStat / defenseStat) / 50) + 2) * 
      criticalMultiplier * 
      effectivenessMultiplier * 
      randomFactor
    );
    
    const damage = Math.max(1, baseDamage);
    
    return {
      move,
      damage,
      critical,
      effectiveness
    };
  }

  private getRandomEffectiveness(): string {
    const rand = Math.random();
    if (rand < 0.1) return 'super';
    if (rand < 0.2) return 'not very';
    if (rand < 0.05) return 'no';
    return 'normal';
  }

  private getEffectivenessMultiplier(effectiveness: string): number {
    switch (effectiveness) {
      case 'super': return 2;
      case 'not very': return 0.5;
      case 'no': return 0;
      default: return 1;
    }
  }
}

export const showdownService = new ShowdownService();