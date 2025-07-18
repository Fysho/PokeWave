import { Dex, Species } from '@pkmn/dex';
import { BattleStreams, Teams } from '@pkmn/sim';
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

interface BattleTurn {
  turn: number;
  attacker: string;
  defender: string;
  move: string;
  damage: number;
  remainingHP: number;
  critical: boolean;
  effectiveness: 'super' | 'normal' | 'not very' | 'no';
}

interface SingleBattleResult {
  winner: string;
  turns: BattleTurn[];
  totalTurns: number;
  finalHP1: number;
  finalHP2: number;
  executionTime: number;
  pokemon1: {
    name: string;
    level: number;
    stats: any;
  };
  pokemon2: {
    name: string;
    level: number;
    stats: any;
  };
}

class PokemonShowdownService {
  private readonly NUM_BATTLES = 1000;

  async simulateBattle(config: ShowdownBattleConfig): Promise<ShowdownBattleResult> {
    const startTime = Date.now();
    
    try {
      // Generate cache key
      const cacheKey = this.generateBattleKey(config);
      
      // Check cache first
      const cachedResult = await cacheService.get<ShowdownBattleResult>(`showdown:${cacheKey}`);
      if (cachedResult) {
        logger.info(`Battle found in cache: ${cacheKey}`);
        return cachedResult;
      }

      const generation = config.options?.generation || 9;
      const dex = Dex.forGen(generation);
      
      // Get Pokemon species
      const species1 = this.getSpeciesById(dex, config.pokemon1Id);
      const species2 = this.getSpeciesById(dex, config.pokemon2Id);

      if (!species1 || !species2) {
        throw new ApiError(400, 'Invalid Pokemon IDs provided');
      }

      // Fetch additional Pokemon data
      const [pokemon1Data, pokemon2Data] = await this.fetchPokemonData(
        config.pokemon1Id,
        config.pokemon2Id
      );

      const pokemon1Level = config.options?.pokemon1Level || 50;
      const pokemon2Level = config.options?.pokemon2Level || 50;

      // Run multiple battles
      let pokemon1Wins = 0;
      let pokemon2Wins = 0;

      for (let i = 0; i < this.NUM_BATTLES; i++) {
        const winner = await this.runSingleShowdownBattle(
          species1,
          species2,
          pokemon1Level,
          pokemon2Level,
          generation
        );
        
        if (winner === 1) {
          pokemon1Wins++;
        } else {
          pokemon2Wins++;
        }
      }

      const winRate = (pokemon1Wins / this.NUM_BATTLES) * 100;
      const executionTime = Date.now() - startTime;

      // Calculate stats for display
      const pokemon1Stats = this.calculateStats(species1, pokemon1Level);
      const pokemon2Stats = this.calculateStats(species2, pokemon2Level);

      const result: ShowdownBattleResult = {
        battleId: crypto.randomUUID(),
        pokemon1: {
          id: config.pokemon1Id,
          name: species1.name,
          level: pokemon1Level,
          wins: pokemon1Wins,
          types: pokemon1Data?.types || [],
          sprites: pokemon1Data?.sprites || { front: '', back: '', shiny: '' },
          moves: pokemon1Data?.moves || [],
          stats: pokemon1Stats
        },
        pokemon2: {
          id: config.pokemon2Id,
          name: species2.name,
          level: pokemon2Level,
          wins: pokemon2Wins,
          types: pokemon2Data?.types || [],
          sprites: pokemon2Data?.sprites || { front: '', back: '', shiny: '' },
          moves: pokemon2Data?.moves || [],
          stats: pokemon2Stats
        },
        totalBattles: this.NUM_BATTLES,
        winRate,
        executionTime
      };

      // Cache the result
      await cacheService.set(`showdown:${cacheKey}`, result, 3600);

      logger.info(`Battle simulation completed using Pokemon Showdown`, {
        pokemon1: `${species1.name} (${pokemon1Wins} wins)`,
        pokemon2: `${species2.name} (${pokemon2Wins} wins)`,
        winRate: `${winRate.toFixed(1)}%`,
        executionTime: `${executionTime}ms`
      });

      return result;
    } catch (error) {
      logger.error('Failed to simulate battle with Pokemon Showdown:', error);
      throw error instanceof ApiError ? error : new ApiError(500, 'Failed to simulate battle');
    }
  }

  async simulateSingleBattle(config: ShowdownBattleConfig): Promise<SingleBattleResult> {
    const startTime = Date.now();
    
    try {
      const generation = config.options?.generation || 9;
      const dex = Dex.forGen(generation);
      
      // Get Pokemon species
      const species1 = this.getSpeciesById(dex, config.pokemon1Id);
      const species2 = this.getSpeciesById(dex, config.pokemon2Id);

      if (!species1 || !species2) {
        throw new ApiError(400, 'Invalid Pokemon IDs provided');
      }

      const pokemon1Level = config.options?.pokemon1Level || 50;
      const pokemon2Level = config.options?.pokemon2Level || 50;

      // Create battle stream
      const stream = new BattleStreams.BattleStream();
      const outputs: string[] = [];
      
      // Capture all outputs
      void (async () => {
        for await (const output of stream) {
          outputs.push(output);
        }
      })();

      // Create teams
      const p1team = this.createTeam(species1, pokemon1Level, generation);
      const p2team = this.createTeam(species2, pokemon2Level, generation);

      // Start battle
      stream.write(`>start {"formatid":"gen${generation}customgame"}`);
      stream.write(`>player p1 {"name":"Player 1","team":"${p1team}"}`);
      stream.write(`>player p2 {"name":"Player 2","team":"${p2team}"}`);

      // Run battle with random AI
      let p1Request: any = null;
      let p2Request: any = null;
      let battleEnded = false;
      let turn = 0;
      const maxTurns = 100;

      while (!battleEnded && turn < maxTurns) {
        // Process outputs to check for requests
        for (const output of outputs) {
          if (output.startsWith('|request|')) {
            const parts = output.split('|');
            const playerIndex = output.includes('>p1') ? 1 : 2;
            const requestData = parts[2];
            
            if (requestData) {
              try {
                const request = JSON.parse(requestData);
                if (playerIndex === 1) p1Request = request;
                else p2Request = request;
              } catch (e) {
                // Not JSON, skip
              }
            }
          } else if (output.includes('|win|')) {
            battleEnded = true;
          }
        }

        // Make moves based on requests
        if (p1Request && p1Request.active) {
          const choice = this.makeRandomChoice(p1Request);
          stream.write(`>p1 ${choice}`);
          p1Request = null;
        }

        if (p2Request && p2Request.active) {
          const choice = this.makeRandomChoice(p2Request);
          stream.write(`>p2 ${choice}`);
          p2Request = null;
        }

        turn++;
        
        // Give the stream time to process
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Force end if needed
      if (!battleEnded) {
        stream.write('>forcewin p1');
      }

      // Parse battle log
      const turns = this.parseBattleLog(outputs);
      const winner = this.extractWinner(outputs);
      
      const executionTime = Date.now() - startTime;

      // Calculate stats for display
      const pokemon1Stats = this.calculateStats(species1, pokemon1Level);
      const pokemon2Stats = this.calculateStats(species2, pokemon2Level);

      return {
        winner: winner || species1.name,
        turns,
        totalTurns: turns.length,
        finalHP1: 0, // Will be extracted from battle log
        finalHP2: 0,
        executionTime,
        pokemon1: {
          name: species1.name,
          level: pokemon1Level,
          stats: pokemon1Stats
        },
        pokemon2: {
          name: species2.name,
          level: pokemon2Level,
          stats: pokemon2Stats
        }
      };
    } catch (error) {
      logger.error('Failed to simulate single battle:', error);
      throw error instanceof ApiError ? error : new ApiError(500, 'Failed to simulate single battle');
    }
  }

  private async runSingleShowdownBattle(
    species1: Species,
    species2: Species,
    level1: number,
    level2: number,
    generation: number
  ): Promise<1 | 2> {
    const stream = new BattleStreams.BattleStream();
    const outputs: string[] = [];
    let winner: 1 | 2 = 1;

    // Capture outputs
    void (async () => {
      for await (const output of stream) {
        outputs.push(output);
        if (output.includes('|win|')) {
          winner = output.includes('Player 1') ? 1 : 2;
        }
      }
    })();

    // Create teams
    const p1team = this.createTeam(species1, level1, generation);
    const p2team = this.createTeam(species2, level2, generation);

    // Start battle
    stream.write(`>start {"formatid":"gen${generation}customgame"}`);
    stream.write(`>player p1 {"name":"Player 1","team":"${p1team}"}`);
    stream.write(`>player p2 {"name":"Player 2","team":"${p2team}"}`);

    // Simple AI loop
    let battleEnded = false;
    let turn = 0;
    const maxTurns = 100;

    while (!battleEnded && turn < maxTurns) {
      // Check if battle ended
      if (outputs.some(o => o.includes('|win|'))) {
        battleEnded = true;
        break;
      }

      // Make random moves (simplified)
      stream.write(`>p1 move ${Math.floor(Math.random() * 4) + 1}`);
      stream.write(`>p2 move ${Math.floor(Math.random() * 4) + 1}`);
      
      turn++;
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    return winner;
  }

  private createTeam(species: Species, level: number, generation: number): string {
    const dex = Dex.forGen(generation);
    
    // Get random moves from learnset
    const moves = this.getRandomMoves(species, dex, 4);
    
    // Create a simple set
    const set = {
      name: species.name,
      species: species.name,
      item: '',
      ability: species.abilities['0'] || '',
      moves: moves,
      nature: 'Hardy',
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      level: level,
      gender: ''
    };

    // Pack into team string using Teams utility
    const team = Teams.pack([set]);
    return team;
  }

  private getRandomMoves(species: Species, dex: any, count: number): string[] {
    const moves: string[] = [];
    const learnset = dex.data.Learnsets[species.id]?.learnset || {};
    const availableMoves = Object.keys(learnset);
    
    // Shuffle and pick moves
    for (let i = 0; i < count && i < availableMoves.length; i++) {
      const randomIndex = Math.floor(Math.random() * availableMoves.length);
      const moveId = availableMoves[randomIndex];
      const move = dex.moves.get(moveId);
      
      if (move && move.exists && !moves.includes(move.name)) {
        moves.push(move.name);
      }
    }

    // Fill with default moves if needed
    const defaultMoves = ['Tackle', 'Scratch', 'Growl', 'Leer'];
    while (moves.length < count && moves.length < defaultMoves.length) {
      const defaultMove = defaultMoves.find(m => !moves.includes(m));
      if (defaultMove) moves.push(defaultMove);
    }

    return moves;
  }

  private makeRandomChoice(request: any): string {
    if (!request.active || !request.active[0]) return 'pass';
    
    const active = request.active[0];
    
    // If we have moves, use a random one
    if (active.moves && active.moves.length > 0) {
      const validMoves = active.moves
        .map((move: any, i: number) => ({ move, index: i + 1 }))
        .filter((m: any) => !m.move.disabled);
      
      if (validMoves.length > 0) {
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        return `move ${randomMove.index}`;
      }
    }
    
    // If we can switch, maybe switch
    if (request.side && request.side.pokemon) {
      const switchableTargets = request.side.pokemon
        .map((p: any, i: number) => ({ pokemon: p, index: i + 1 }))
        .filter((p: any) => !p.pokemon.active && !p.pokemon.fainted);
      
      if (switchableTargets.length > 0 && Math.random() < 0.1) { // 10% chance to switch
        const target = switchableTargets[Math.floor(Math.random() * switchableTargets.length)];
        return `switch ${target.index}`;
      }
    }
    
    return 'pass';
  }

  private parseBattleLog(outputs: string[]): BattleTurn[] {
    const turns: BattleTurn[] = [];
    let currentTurn = 0;
    
    for (const output of outputs) {
      const parts = output.split('|');
      if (parts.length < 2) continue;
      
      const eventType = parts[1];
      
      switch (eventType) {
        case 'turn':
          currentTurn = parseInt(parts[2]) || 0;
          break;
          
        case 'move':
          if (parts.length >= 5) {
            const attacker = this.extractPokemonName(parts[2]);
            const move = parts[3];
            const defender = this.extractPokemonName(parts[4]);
            
            turns.push({
              turn: currentTurn,
              attacker,
              defender,
              move,
              damage: 0,
              remainingHP: 0,
              critical: false,
              effectiveness: 'normal'
            });
          }
          break;
          
        case '-damage':
          if (parts.length >= 4 && turns.length > 0) {
            const lastTurn = turns[turns.length - 1];
            const hpInfo = parts[3];
            if (hpInfo && hpInfo.includes('/')) {
              const [current, max] = hpInfo.split('/').map(h => parseInt(h) || 0);
              lastTurn.remainingHP = current;
              lastTurn.damage = Math.max(0, max - current);
            }
          }
          break;
          
        case '-crit':
          if (turns.length > 0) {
            turns[turns.length - 1].critical = true;
          }
          break;
          
        case '-supereffective':
          if (turns.length > 0) {
            turns[turns.length - 1].effectiveness = 'super';
          }
          break;
          
        case '-resisted':
          if (turns.length > 0) {
            turns[turns.length - 1].effectiveness = 'not very';
          }
          break;
          
        case '-immune':
          if (turns.length > 0) {
            turns[turns.length - 1].effectiveness = 'no';
          }
          break;
      }
    }
    
    return turns;
  }

  private extractWinner(outputs: string[]): string | null {
    for (const output of outputs) {
      if (output.includes('|win|')) {
        const parts = output.split('|');
        if (parts.length >= 3) {
          return parts[2];
        }
      }
    }
    return null;
  }

  private extractPokemonName(pokemonStr: string): string {
    // Format: "p1a: Pikachu" -> "Pikachu"
    const match = pokemonStr.match(/:\s*(.+)$/);
    return match ? match[1] : pokemonStr;
  }

  private calculateStats(species: Species, level: number): any {
    const IV = 31;
    const EV = 0;
    
    const calculateStat = (baseStat: number, isHP: boolean = false) => {
      if (isHP) {
        return Math.floor(((2 * baseStat + IV + (EV / 4)) * level / 100) + level + 10);
      }
      return Math.floor(((2 * baseStat + IV + (EV / 4)) * level / 100) + 5);
    };
    
    return {
      hp: calculateStat(species.baseStats.hp, true),
      attack: calculateStat(species.baseStats.atk),
      defense: calculateStat(species.baseStats.def),
      specialAttack: calculateStat(species.baseStats.spa),
      specialDefense: calculateStat(species.baseStats.spd),
      speed: calculateStat(species.baseStats.spe)
    };
  }

  private getSpeciesById(dex: any, id: number): Species | null {
    // Try by ID first
    let species = dex.species.get(String(id));
    if (species && species.exists) return species;
    
    // Try by national dex number
    const allSpecies = dex.species.all();
    const found = allSpecies.find((s: Species) => s.num === id);
    return found || null;
  }

  private async fetchPokemonData(id1: number, id2: number) {
    try {
      const [pokemon1Data, pokemon2Data] = await Promise.all([
        pokemonService.getPokemonById(id1),
        pokemonService.getPokemonById(id2)
      ]);
      return [pokemon1Data, pokemon2Data];
    } catch (error) {
      logger.error('Failed to fetch Pokemon data:', error);
      return [
        { types: [], sprites: { front: '', back: '', shiny: '' }, moves: [] },
        { types: [], sprites: { front: '', back: '', shiny: '' }, moves: [] }
      ];
    }
  }

  private generateBattleKey(config: ShowdownBattleConfig): string {
    const keyData = {
      pokemon1Id: config.pokemon1Id,
      pokemon2Id: config.pokemon2Id,
      generation: config.options?.generation || 9,
      pokemon1Level: config.options?.pokemon1Level || 50,
      pokemon2Level: config.options?.pokemon2Level || 50
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex');
  }
}

export const pokemonShowdownService = new PokemonShowdownService();