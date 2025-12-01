import { Dex, Species } from '@pkmn/dex';
import { BattleStreams } from '@pkmn/sim';
import { Teams } from '@pkmn/sets';

//import { cacheService } from './cache.service';
import { pokemonService } from './pokemon.service';
import { pokemonMoveStoreService } from './pokemon-move-store.service';
import { pokemonItemStoreService } from './pokemon-item-store.service';
import { pokemonAbilityStoreService } from './pokemon-ability-store.service';
import logger from '../utils/logger';
import { ApiError } from '../middleware/error.middleware';
import crypto from 'crypto';
import { PokemonInstanceData } from '../types/pokemon-instance.types';
// Temporarily hardcode BATTLE_CONFIG until shared config is properly set up
const BATTLE_CONFIG = { TOTAL_BATTLES: 100 };

export interface ShowdownBattleConfig {
  pokemon1: PokemonInstanceData;
  pokemon2: PokemonInstanceData;
  generation: number;
  battleCount?: number; // Optional custom battle count, defaults to TOTAL_BATTLES
}

export interface ShowdownBattleResult {
  battleId: string;
  pokemon1Wins: number;
  pokemon2Wins: number;
  draws: number;
  totalBattles: number;
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
  missed?: boolean;
  statusEffect?: string;
  statusInflicted?: boolean;
  healing?: number;
  fainted?: boolean;
  statChange?: {
    stat: string;
    stages: number;
    type: 'boost' | 'unboost' | 'failed';
  };
  // Recoil/self-damage from the move (shown on the same card)
  recoilDamage?: number;
  attackerRemainingHP?: number;
}

interface SingleBattleResult {
  winner: string | 'draw';
  turns: BattleTurn[];
  totalTurns: number;
  finalHP1: number;
  finalHP2: number;
  executionTime: number;
  pokemon1: {
    name: string;
    level: number;
  };
  pokemon2: {
    name: string;
    level: number;
  };
}

// Helper to convert stat keys to Showdown stat names
function statToShowdownName(stat: string): string {
  switch (stat) {
    case "hp": return "HP";
    case "attack": return "Atk";
    case "defense": return "Def";
    case "specialAttack": return "SpA";
    case "specialDefense": return "SpD";
    case "speed": return "Spe";
    default: return stat;
  }
}

class PokemonShowdownService {
  private readonly NUM_BATTLES = BATTLE_CONFIG.TOTAL_BATTLES; // Number of battles to simulate from central config

  async simulateMultipleBattles(config: ShowdownBattleConfig): Promise<ShowdownBattleResult> {
    const startTime = Date.now();
    const numBattles = config.battleCount || this.NUM_BATTLES;

    try {
      // Generate cache key disabled
      //const cacheKey = this.generateBattleKey(config);

      // Check cache first
      //const cachedResult = await cacheService.get<ShowdownBattleResult>(`showdown:${cacheKey}`);
      //if (cachedResult) {
      //  logger.info(`Battle found in cache: ${cacheKey}`);
      //  return cachedResult;
      //}

      // Run multiple battles
      let pokemon1Wins = 0;
      let pokemon2Wins = 0;
      let draws = 0;

      // Reduced logging - only log at end

      for (let i = 0; i < numBattles; i++) {
        const winner = await this.runSingleShowdownBattle(
            config.pokemon1,
            config.pokemon2,
            config.generation
        );

        if (winner === 0) {
          // Draw - both Pokemon get 0.5 wins
          pokemon1Wins += 0.5;
          pokemon2Wins += 0.5;
          draws++;
          logger.warn(`Battle ${i + 1} ended in a DRAW - this should be rare!`, {skipFormat: true});
        } else if (winner === 1) {
          pokemon1Wins++;
          //logger.info(`${config.pokemon1.name} won battle ${i + 1}`, {skipFormat: true});
        } else {
          pokemon2Wins++;
          //logger.info(`${config.pokemon2.name} won battle ${i + 1}`, {skipFormat: true});
        }
      }

      const executionTime = Date.now() - startTime;

      const result: ShowdownBattleResult = {
        battleId: crypto.randomUUID(),
        pokemon1Wins: pokemon1Wins,
        pokemon2Wins: pokemon2Wins,
        draws: draws,
        totalBattles: numBattles,
        executionTime: executionTime,
      };

      // Cache the result disabled
      // await cacheService.set(`showdown:${cacheKey}`, result, 3600);

      // Alert if we got exactly 50% - this is suspicious, otherwise minimal logging
      const winRate = (pokemon1Wins / numBattles) * 100;
      if (winRate === 50) {
        logger.error(`⚠️ 50% RESULT: ${config.pokemon1.name} (L${config.pokemon1.level}) vs ${config.pokemon2.name} (L${config.pokemon2.level}) | Wins: ${pokemon1Wins}/${pokemon2Wins}, Draws: ${draws} | P1 Moves: ${config.pokemon1.moves?.join(', ')} | P2 Moves: ${config.pokemon2.moves?.join(', ')}`, {skipFormat: true});
      }

      return result;
    } catch (error) {
      logger.error('Failed to simulate battle with Pokemon Showdown:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        config
      });
      throw error instanceof ApiError ? error : new ApiError(500, `Failed to simulate battle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async simulateSingleBattleTester(config: ShowdownBattleConfig): Promise<SingleBattleResult> {
    const startTime = Date.now();
    
    try {
      const pokemon1 = config.pokemon1;
      const pokemon2 = config.pokemon2;
      
      // Use the shared battle simulation core with logging and parsing enabled
      const result = await this.runBattleSimulation(pokemon1, pokemon2, config.generation, {
        enableLogging: true,
        parseLog: true
      });
      
      // Parse battle log
      logger.info('🎮 Battle Tester: Parsing battle log...');
      const turns = this.parseBattleLog(result.outputs || []);
      
      logger.info(`🎮 Battle Tester: Battle simulation complete!`, {
        winner: result.winner,
        totalTurns: result.turnCount,
        parsedTurns: turns.length
      });
      
      // If no turns were parsed, create a simple turn for demo purposes
      if (turns.length === 0) {
        logger.info(`🎮 Battle Tester: Battle simulation had zero turn!!!`);
      }

      // Map numeric winner to string
      let winner: string | 'draw';
      if (result.winner === 0) {
        winner = 'draw';
      } else if (result.winner === 1) {
        winner = pokemon1.name;
      } else {
        winner = pokemon2.name;
      }

      // Extract final HP from the last turn or set to 0 for the loser
      const finalHP1 = winner === 'draw' ? 0 : (winner === pokemon1.name ? turns[turns.length - 1]?.remainingHP || 0 : 0);
      const finalHP2 = winner === 'draw' ? 0 : (winner === pokemon2.name ? turns[turns.length - 1]?.remainingHP || 0 : 0);
      
      const executionTime = Date.now() - startTime;

      logger.info(`🎮 Battle Tester: Returning battle result. Winner: ${winner}, Total turns: ${turns.length}, Execution time: ${executionTime}ms`);

      return {
        winner: winner || pokemon1.name,
        turns: turns,
        totalTurns: turns.length,
        finalHP1,
        finalHP2,
        executionTime,
        pokemon1: {
          name: pokemon1.name,
          level: pokemon1.level,
        },
        pokemon2: {
          name: pokemon2.name,
          level: pokemon2.level,
        }
      };
    } catch (error) {
      logger.error('Failed to simulate single battle:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        config
      });
      throw error instanceof ApiError ? error : new ApiError(500, `Battle simulation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async runBattleSimulation(
      pokemon1: PokemonInstanceData,
      pokemon2: PokemonInstanceData,
      generation: number,
      options: {
        enableLogging?: boolean;
        parseLog?: boolean;
      } = {}
  ): Promise<{
    winner: 0 | 1 | 2;
    outputs?: string[];
    turnCount?: number;
    p1CurrentHP?: number;
    p2CurrentHP?: number;
    p1MaxHP?: number;
    p2MaxHP?: number;
  }> {
    const { enableLogging = false, parseLog = false } = options;
    const outputs: string[] = [];
    
    if (enableLogging) {
      logger.info('🎮 Battle Tester: Starting single battle simulation', {
        generation: generation || 9,
        pokemon1Instance: pokemon1 || null,
        pokemon2Instance: pokemon2 || null
      });
    }

    const stream = new BattleStreams.BattleStream();

    // Create teams
    if (enableLogging) {
      logger.info('🎮 Battle Tester: Creating teams...');
    }
    const p1teamString = await this.createTeam(pokemon1, generation);
    const p2teamString = await this.createTeam(pokemon2, generation);

    // Convert team strings to packed format
    const p1teamImported = Teams.importTeam(p1teamString);
    const p2teamImported = Teams.importTeam(p2teamString);
    
    if (!p1teamImported || !p2teamImported) {
      throw new Error('Failed to import team data');
    }
    
    const p1team = Teams.packTeam(p1teamImported);
    const p2team = Teams.packTeam(p2teamImported);
    
    if (enableLogging) {
      logger.info(`🎮 Battle Tester: P1 team (packed): ${p1team}`);
      logger.info(`🎮 Battle Tester: P2 team (packed): ${p2team}`);
      logger.info(`🎮 Battle Tester: ${pokemon1.name} Level ${pokemon1.level} vs ${pokemon2.name} Level ${pokemon2.level}`);
      logger.info('🎮 Battle Tester: Battle started! Processing turns...');
    }

    // Start the battle
    await stream.write(`>start ${JSON.stringify({ formatid: `gen${generation}singles` })}`);
    await stream.write(`>player p1 ${JSON.stringify({ name: 'Player 1', team: p1team })}`);
    await stream.write(`>player p2 ${JSON.stringify({ name: 'Player 2', team: p2team })}`);

    let winner: 0 | 1 | 2 = 1;
    let turnCount = 0;
    const maxTurns = 100;
    
    // Track HP for both Pokemon
    let p1CurrentHP = 0;
    let p2CurrentHP = 0;
    let p1MaxHP = 0;
    let p2MaxHP = 0;
    let hpInitialized = false;
    
    // Give the stream a moment to initialize when logging
    if (enableLogging) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    while (turnCount < maxTurns) {
      if (enableLogging) {
        logger.info(`🎮 Battle Tester: ========================================================`);
        logger.info(`🎮 Battle Tester: Turn ${turnCount}`);
      }
      
      const chunk = await stream.read();
      
      if (!chunk) break;
      
      if (parseLog) {
        outputs.push(chunk);
      }
      
      if (enableLogging) {
        logger.info(`🎮 Battle Tester: Chunk received: ${chunk}`);
      }

      // Track HP updates - also check for initial spawn events
      const lines = chunk.split('\n');
      for (const line of lines) {
        // Check for damage, switch, or initial spawn events
        if (line.includes('|-damage|') || line.includes('|switch|') || line.includes('|drag|')) {
          const parts = line.split('|');
          // Handle switch/drag format: |switch|p1a: Pikachu|Pikachu, L50|100/100
          if ((parts[1] === 'switch' || parts[1] === 'drag') && parts.length >= 5) {
            const pokemonSide = parts[2];
            const hpInfo = parts[4];
            
            if (hpInfo && hpInfo.includes('/')) {
              const [current, max] = hpInfo.split('/').map(h => parseInt(h) || 0);
              if (pokemonSide.startsWith('p1a:')) {
                p1CurrentHP = current;
                p1MaxHP = max;
                hpInitialized = true;
                if (enableLogging) {
                  logger.info(`🎮 Battle Tester: P1 initial HP: ${current}/${max}`);
                }
              } else if (pokemonSide.startsWith('p2a:')) {
                p2CurrentHP = current;
                p2MaxHP = max;
                hpInitialized = true;
                if (enableLogging) {
                  logger.info(`🎮 Battle Tester: P2 initial HP: ${current}/${max}`);
                }
              }
            }
          }
          // Handle damage format: |-damage|p1a: Pikachu|80/100
          else if (parts[1] === '-damage' && parts.length >= 4) {
            const pokemonSide = parts[2];
            const hpInfo = parts[3];
            
            if (hpInfo === '0 fnt') {
              if (pokemonSide.startsWith('p1a:')) {
                p1CurrentHP = 0;
              } else if (pokemonSide.startsWith('p2a:')) {
                p2CurrentHP = 0;
              }
              hpInitialized = true;
            } else if (hpInfo.includes('/')) {
              const [current, max] = hpInfo.split('/').map(h => parseInt(h) || 0);
              if (pokemonSide.startsWith('p1a:')) {
                p1CurrentHP = current;
                p1MaxHP = max;
              } else if (pokemonSide.startsWith('p2a:')) {
                p2CurrentHP = current;
                p2MaxHP = max;
              }
              hpInitialized = true;
            }
          }
        }
      }

      // Check for win first
      if (chunk.includes('|win|')) {
        const declaredWinner = chunk.includes('Player 1') ? 1 : 2;

        // Only count as a draw if BOTH Pokemon are at 0 HP (true simultaneous KO)
        // A Pokemon can win even if they faint from recoil/poison/etc - that's not a draw
        if (hpInitialized && p1CurrentHP === 0 && p2CurrentHP === 0) {
          winner = 0; // Draw - both Pokemon KO'd
          if (enableLogging) {
            logger.info(`🎮 Battle Tester: Battle ended in a DRAW! (Both Pokemon at 0 HP)`);
            logger.info(`🎮 Battle Tester: P1 HP: ${p1CurrentHP}/${p1MaxHP}, P2 HP: ${p2CurrentHP}/${p2MaxHP}`);
          } else {
            logger.debug(`Battle ended in DRAW - both Pokemon at 0 HP`);
          }
        } else {
          // Trust Pokemon Showdown's declared winner
          winner = declaredWinner;
          if (enableLogging) {
            logger.info(`🎮 Battle Tester: Battle ended! Winner: ${winner === 1 ? pokemon1.name : pokemon2.name}`);
            logger.info(`🎮 Battle Tester: P1 HP: ${p1CurrentHP}/${p1MaxHP}, P2 HP: ${p2CurrentHP}/${p2MaxHP}`);
          }
        }
        break;
      }
      
      // Check for tie message from Pokemon Showdown
      // Must be a complete |tie| message, not part of another word like |tier|
      const tieLines = chunk.split('\n');
      for (const line of tieLines) {
        if (line === '|tie' || line.startsWith('|tie|')) {
          winner = 0;
          if (enableLogging) {
            logger.info(`🎮 Battle Tester: Battle ended in a TIE!`);
          }
          break;
        }
      }
      
      // Only check for faints after the battle has started (after turn 1)
      if (turnCount > 0 && chunk.includes('|faint|')) {
        const lines = chunk.split('\n');
        let p1FaintedThisChunk = false;
        let p2FaintedThisChunk = false;
        
        for (const line of lines) {
          if (line.startsWith('|faint|')) {
            // Format is |faint|p1a: PokemonName
            const parts = line.split('|');
            if (parts.length >= 3) {
              const faintedPokemon = parts[2];
              if (faintedPokemon.startsWith('p1a:')) {
                p1FaintedThisChunk = true;
                if (enableLogging) {
                  logger.info(`🎮 Battle Tester: ${pokemon1.name} fainted!`);
                } else {
                  logger.debug(`Battle: P1 fainted - ${faintedPokemon}`);
                }
              } else if (faintedPokemon.startsWith('p2a:')) {
                p2FaintedThisChunk = true;
                if (enableLogging) {
                  logger.info(`🎮 Battle Tester: ${pokemon2.name} fainted!`);
                } else {
                  logger.debug(`Battle: P2 fainted - ${faintedPokemon}`);
                }
              }
            }
          }
        }
        
        // Only count as draw if both fainted in the same chunk (simultaneous)
        if (p1FaintedThisChunk && p2FaintedThisChunk) {
          winner = 0;
          if (enableLogging) {
            logger.info(`🎮 Battle Tester: Battle ended in a DRAW!`);
          } else {
            logger.warn(`Battle: DRAW detected - both Pokemon fainted simultaneously at turn ${turnCount}`);
          }
          break;
        }
      }
      
      if (chunk.includes('|teampreview')) {
        await stream.write('>p1 team 1');
        await stream.write('>p2 team 1');
      }
      
      if (chunk.includes('|request|')) {
        const requestData = JSON.parse(chunk.split('|request|')[1]);

        // Determine which player is making the request
        const side = requestData.side && requestData.side.id ? requestData.side.id : null;
        if (!side) {
          continue;
        }

        // Choose a move for the appropriate player
        if (requestData.active && requestData.active[0]) {
          const active = requestData.active[0];
          const validMoves: (number | 'struggle')[] = [];

          active.moves.forEach((move: any, i: number) => {
            if (enableLogging) {
              logger.info(`🎮 Battle Tester: Available move for ${side}: ${move.move}`);
            }
            if (!move.disabled && (move.pp === undefined || move.pp > 0)) {
              validMoves.push(i + 1); // Moves are 1-indexed in Showdown
            }
          });

          const moveChoice = validMoves.length > 0
              ? validMoves[Math.floor(Math.random() * validMoves.length)]
              : 'struggle';

          if (enableLogging) {
            logger.info(`🎮 Battle Tester: >>> ${side} chose move: ${moveChoice}`);
          }
          await stream.write(`>${side} move ${moveChoice}`);
        }
      }
      
      if (chunk.includes('|turn|')) {
        turnCount++;
        if (enableLogging) {
          logger.info(`🎮 Battle Tester: ========================================================`);
          logger.info(`🎮 Battle Tester: NEW TURN ${turnCount}`);
        }
      }

      if (turnCount >= maxTurns) {
        // Call it a draw if max turns exceeded
        winner = 0;
        if (enableLogging) {
          logger.info(`🎮 Battle Tester: MAX TURN COUNT EXCEEDED (${maxTurns} turns) - Result: DRAW`);
        }
        break;
      }
    }

    // Log if battle ended without a clear winner (potential issue)
    if (winner === 1 && turnCount === 0) {
      logger.warn(`Battle ended with default winner (P1) but 0 turns - possible stream issue!`);
    }

    return {
      winner,
      outputs: parseLog ? outputs : undefined,
      turnCount: parseLog ? turnCount : undefined,
      p1CurrentHP: parseLog ? p1CurrentHP : undefined,
      p2CurrentHP: parseLog ? p2CurrentHP : undefined,
      p1MaxHP: parseLog ? p1MaxHP : undefined,
      p2MaxHP: parseLog ? p2MaxHP : undefined
    };
  }

  private async runSingleShowdownBattle(
      pokemon1: PokemonInstanceData,
      pokemon2: PokemonInstanceData,
      generation: number
  ): Promise<0 | 1 | 2> {
    // Use the shared battle simulation core with logging disabled
    const result = await this.runBattleSimulation(pokemon1, pokemon2, generation, {
      enableLogging: false,
      parseLog: false
    });
    
    return result.winner;
  }

  // Fish Editing Function
  private async createTeam(pokemon: PokemonInstanceData, generation: number): Promise<string> {
    const lines: string[] = [];

    // Name and item (items exist from Gen 2 onwards)
    const nameLine = (generation >= 2 && pokemon.item)
        ? `${pokemon.name} @ ${pokemon.item}`
        : `${pokemon.name}`;
    lines.push(nameLine);

    // Ability (Gen 3+)
    if (generation >= 3 && pokemon.ability) {
      lines.push(`Ability: ${pokemon.ability}`);
    }

    // Level (always valid)
    if (pokemon.level && pokemon.level !== 100) {
      lines.push(`Level: ${pokemon.level}`);
    }

    // Shiny (Gen 2+)
    if (generation >= 2 && pokemon.sprites?.shiny) {
      lines.push(`Shiny: Yes`);
    }

    // EVs (Gen 3+)
    if (generation >= 3 && pokemon.evs) {
      const evParts: string[] = [];
      for (const [stat, value] of Object.entries(pokemon.evs)) {
        if (value > 0) {
          const statName = statToShowdownName(stat);
          evParts.push(`${value} ${statName}`);
        }
      }
      if (evParts.length > 0) {
        lines.push(`EVs: ${evParts.join(" / ")}`);
      }
    }

    // Nature (Gen 3+)
    if (generation >= 3 && pokemon.nature) {
      lines.push(`${pokemon.nature} Nature`);
    }

    // IVs (Gen 3+)
    if (generation >= 3 && pokemon.ivs) {
      const ivParts: string[] = [];
      for (const [stat, value] of Object.entries(pokemon.ivs)) {
        if (value < 31) {
          const statName = statToShowdownName(stat);
          ivParts.push(`${value} ${statName}`);
        }
      }
      if (ivParts.length > 0) {
        lines.push(`IVs: ${ivParts.join(" / ")}`);
      }
    }

    // Moves - keep the display names as they are
    if (pokemon.moves && pokemon.moves.length > 0) {
      pokemon.moves.forEach(move => {
        lines.push(`- ${move}`);
      });
    }

    return lines.join("\n");
  }

  private parseBattleLog(outputs: string[]): BattleTurn[] {
    const turns: BattleTurn[] = [];
    let currentTurn = 0;
    const pokemonHP: { [key: string]: { current: number; max: number; lastHP?: number } } = {};
    let turnEvents: BattleTurn[] = []; // Temporary storage for events in current turn
    
    // First pass - initialize HP values
    for (const output of outputs) {
      const lines = output.split('\n');
      for (const line of lines) {
        // Look for initial HP values or updates
        if (line.includes('|switch|') || line.includes('|drag|') || line.includes('|player|')) {
          const parts = line.split('|');
          
          // Check for switch/drag format: |switch|p1a: Pokemon|Species, L50|HP/MaxHP
          if ((line.includes('|switch|') || line.includes('|drag|')) && parts.length >= 5) {
            const pokemonName = this.extractPokemonName(parts[2]);
            const hpInfo = parts[4];
            if (hpInfo && hpInfo.includes('/')) {
              const [current, max] = hpInfo.split('/').map(h => parseInt(h) || 0);
              pokemonHP[pokemonName] = { current, max, lastHP: current };
              logger.info(`Battle Tester: Initialized HP for ${pokemonName}: ${current}/${max}`);
            }
          }
          
          // Also check for any line with HP info
          for (let i = 0; i < parts.length; i++) {
            if (parts[i] && parts[i].includes('/') && /^\d+\/\d+$/.test(parts[i])) {
              const [current, max] = parts[i].split('/').map(h => parseInt(h) || 0);
              // Skip percentage lines (where max is 100)
              if (max === 100) continue;
              
              // Found HP format, try to get Pokemon name from previous parts
              if (i > 0) {
                const pokemonName = this.extractPokemonName(parts[i-1]);
                if (pokemonName && !pokemonHP[pokemonName]) {
                  pokemonHP[pokemonName] = { current, max };
                  logger.info(`Battle Tester: Found HP for ${pokemonName}: ${current}/${max}`);
                }
              }
            }
          }
        }
      }
    }
    
    // Second pass - parse battle events
    for (const output of outputs) {
      const lines = output.split('\n');
      for (const line of lines) {
        const parts = line.split('|');
        if (parts.length < 2) continue;
        
        const eventType = parts[1];
        
        // Log unknown event types for debugging
        if (eventType && !['turn', 'move', 'cant', '-damage', '-sethp', '-heal', '-crit', '-supereffective', '-resisted', '-immune', '-miss', '-status', '-start', '-end', 'faint', '-boost', '-unboost', '-fail', 'switch', 'drag'].includes(eventType)) {
          if (!eventType.startsWith('|') && !eventType.includes('request') && !eventType.includes('player')) {
            logger.debug(`Battle Tester: Unknown event type: ${eventType} - Full line: ${line}`);
          }
        }
        
        switch (eventType) {
          case 'turn':
            // When a new turn starts, add all events from previous turn to the main array
            if (turnEvents.length > 0) {
              turns.push(...turnEvents);
              turnEvents = [];
            }
            currentTurn = parseInt(parts[2]) || 0;
            break;
            
          case 'move':
            if (parts.length >= 5) {
              const attacker = this.extractPokemonName(parts[2]);
              const move = parts[3];
              const defender = this.extractPokemonName(parts[4]);
              
              // Store previous HP for damage calculation
              if (pokemonHP[defender]) {
                pokemonHP[defender].lastHP = pokemonHP[defender].current;
              }
              
              turnEvents.push({
                turn: currentTurn,
                attacker,
                defender,
                move,
                damage: 0,
                remainingHP: pokemonHP[defender]?.current || 100,
                critical: false,
                effectiveness: 'normal'
              });
            }
            break;
            
          case 'cant':
            if (parts.length >= 4) {
              const pokemonName = this.extractPokemonName(parts[2]);
              const reason = parts[3];
              
              // Create a special turn entry for cant move
              let cantReason = 'immobilized';
              if (reason.includes('par') || reason.includes('paralysis')) {
                cantReason = 'paralyzed';
              } else if (reason.includes('slp') || reason.includes('sleep')) {
                cantReason = 'asleep';
              } else if (reason.includes('frz') || reason.includes('freeze')) {
                cantReason = 'frozen';
              } else if (reason.includes('flinch')) {
                cantReason = 'flinched';
              }
              
              turnEvents.push({
                turn: currentTurn,
                attacker: pokemonName,
                defender: pokemonName,
                move: `Can't move (${cantReason})`,
                damage: 0,
                remainingHP: pokemonHP[pokemonName]?.current || 100,
                critical: false,
                effectiveness: 'normal',
                missed: true
              });
            }
            break;
            
          case '-damage':
          case '-sethp':
            if (parts.length >= 4) {
              const pokemonName = this.extractPokemonName(parts[2]);
              const hpInfo = parts[3];
              
              // Log all damage events for debugging
              if (parts.length >= 5) {
                logger.info(`Battle Tester: Damage event - Pokemon: ${pokemonName}, HP: ${hpInfo}, Source: ${parts[4] || 'none'}`);
              }
              
              if (hpInfo === '0 fnt') {
                // Pokemon fainted
                const previousHP = pokemonHP[pokemonName]?.lastHP || pokemonHP[pokemonName]?.current || pokemonHP[pokemonName]?.max || 0;
                if (pokemonHP[pokemonName]) {
                  pokemonHP[pokemonName].current = 0;
                }
                if (turnEvents.length > 0) {
                  const lastTurn = turnEvents[turnEvents.length - 1];
                  if (lastTurn.defender === pokemonName) {
                    // Calculate damage from previous HP to 0
                    lastTurn.damage = previousHP;
                    lastTurn.remainingHP = 0;
                    logger.info(`Battle Tester: ${pokemonName} fainted! Took ${previousHP} damage (was at ${previousHP} HP)`);
                  }
                }
              } else if (hpInfo && hpInfo.includes('/')) {
                const [current, max] = hpInfo.split('/').map(h => parseInt(h) || 0);
                
                // Skip percentage lines (where max is 100)
                if (max === 100) {
                  continue;
                }
                
                if (!pokemonHP[pokemonName]) {
                  pokemonHP[pokemonName] = { current: max, max: max };
                }
                
                const previousHP = pokemonHP[pokemonName].lastHP || pokemonHP[pokemonName].current;
                const damage = previousHP - current;
                pokemonHP[pokemonName].current = current;
                pokemonHP[pokemonName].max = max;
                
                logger.info(`Battle Tester: ${pokemonName} HP change: ${previousHP} -> ${current} (damage: ${damage})`);
                
                // Check if this is status damage or confusion damage
                // Some damage events might have only 4 parts (no source), so check both cases
                if (damage > 0) {
                  const source = parts.length >= 5 ? parts[4] : '';
                  
                  // Log the source for debugging recoil
                  if (source && source.toLowerCase().includes('recoil')) {
                    logger.info(`Battle Tester: Recoil damage detected - source: "${source}"`);
                  }
                  
                  // Also check if this might be recoil by looking at the last move
                  // IMPORTANT: Only consider it recoil if the pokemon taking damage is the ATTACKER of the last move
                  // If it's the defender, it's just normal move damage
                  let mightBeRecoil = false;
                  if (!source && turnEvents.length > 0) {
                    const lastTurn = turnEvents[turnEvents.length - 1];
                    const lastMove = lastTurn.move;
                    // Common recoil moves
                    const recoilMoves = ['Double-Edge', 'Submission', 'Take Down', 'Brave Bird', 'Flare Blitz', 'Head Smash', 'Wild Charge', 'Volt Tackle', 'Wood Hammer'];
                    // Only mark as recoil if this pokemon is the attacker (not the defender)
                    if (recoilMoves.some(move => lastMove.toLowerCase() === move.toLowerCase()) && lastTurn.attacker === pokemonName) {
                      mightBeRecoil = true;
                      logger.info(`Battle Tester: Recoil damage to ${pokemonName} from move: ${lastMove}`);
                    }
                  }
                  
                  // Create a special turn entry for status/confusion damage
                  // Check for recoil first since it might not have [from]
                  // Recoil might come as "[from] Recoil" or just "Recoil"
                  if ((source && (source.includes('[from]') || source.includes('confusion') || source.toLowerCase().includes('recoil') || source.includes('Recoil'))) || mightBeRecoil) {
                    let damageType = 'unknown';
                    let damageSource = '';
                    let skipTurnEntry = false;

                    // Extract the move name from [from] move: MoveName format
                    const moveMatch = source.match(/\[from\]\s*move:\s*(.+)/i);
                    if (moveMatch) {
                      damageSource = moveMatch[1].trim();
                    }

                    if (source.includes('confusion')) {
                      damageType = 'confusion';
                    } else if (source.includes('psn') || source.includes('tox')) {
                      damageType = 'poison';
                    } else if (source.includes('brn')) {
                      damageType = 'burn';
                    } else if (source.includes('sandstorm')) {
                      damageType = 'sandstorm';
                    } else if (source.includes('hail')) {
                      damageType = 'hail';
                    } else if (source.toLowerCase().includes('recoil') || source.includes('Recoil') || mightBeRecoil) {
                      // Recoil damage - attach to the previous move card instead of creating a new one
                      if (turnEvents.length > 0) {
                        const lastTurn = turnEvents[turnEvents.length - 1];
                        // Only attach if this is recoil to the attacker of the last move
                        if (lastTurn.attacker === pokemonName) {
                          lastTurn.recoilDamage = damage;
                          lastTurn.attackerRemainingHP = current;
                          pokemonHP[pokemonName].lastHP = current;
                          skipTurnEntry = true;
                        }
                      }
                      if (!skipTurnEntry) damageType = 'recoil';
                    } else if (source.includes('Life Orb')) {
                      // Life Orb damage - attach to the previous move card
                      if (turnEvents.length > 0) {
                        const lastTurn = turnEvents[turnEvents.length - 1];
                        if (lastTurn.attacker === pokemonName) {
                          lastTurn.recoilDamage = damage;
                          lastTurn.attackerRemainingHP = current;
                          lastTurn.statusEffect = 'Life Orb';
                          pokemonHP[pokemonName].lastHP = current;
                          skipTurnEntry = true;
                        }
                      }
                      if (!skipTurnEntry) damageType = 'Life Orb';
                    } else if (source.includes('Leech Seed')) {
                      damageType = 'Leech Seed';
                    } else if (source.includes('Curse')) {
                      damageType = 'Curse';
                    } else if (source.includes('Nightmare')) {
                      damageType = 'Nightmare';
                    } else if (source.includes('Salt Cure')) {
                      damageType = 'Salt Cure';
                    } else if (source.includes('Stealth Rock')) {
                      damageType = 'Stealth Rock';
                    } else if (source.includes('Spikes')) {
                      damageType = 'Spikes';
                    } else if (damageSource) {
                      // Trapping moves like Fire Spin, Wrap, Bind, Whirlpool, Infestation, Magma Storm, Sand Tomb, etc.
                      damageType = damageSource;
                    }

                    // Skip creating a new turn entry if we attached to existing
                    if (skipTurnEntry) {
                      // Already handled above
                    } else {
                      // Log when we have unknown damage type
                      if (damageType === 'unknown') {
                        logger.warn(`Battle Tester: Unknown damage type - source: "${source}"`);
                      }

                      // Format the display name
                      const displayName = damageType;

                      turnEvents.push({
                        turn: currentTurn,
                        attacker: damageType,
                        defender: pokemonName,
                        move: damageType === 'confusion' ? 'Confusion damage' :
                              damageType === 'recoil' ? 'Recoil damage' :
                              damageType === 'Life Orb' ? 'Life Orb damage' :
                              damageType === 'poison' ? 'poison damage' :
                              damageType === 'burn' ? 'burn damage' :
                              `${displayName} damage`,
                        damage: damage,
                        remainingHP: current,
                        critical: false,
                        effectiveness: 'normal',
                        statusEffect: damageType,
                        statusInflicted: false
                      });

                      // Update HP tracking
                      pokemonHP[pokemonName].lastHP = current;
                    }
                  } else {
                    // Normal move damage - update the last turn
                    if (turnEvents.length > 0) {
                      const lastTurn = turnEvents[turnEvents.length - 1];
                      if (lastTurn.defender === pokemonName && damage > 0) {
                        lastTurn.damage = damage;
                        lastTurn.remainingHP = current;
                        // Update lastHP so subsequent damage (like Life Orb) calculates correctly
                        pokemonHP[pokemonName].lastHP = current;
                      }
                    }
                  }
                } else {
                  // Normal move damage - update the last turn
                  if (turnEvents.length > 0) {
                    const lastTurn = turnEvents[turnEvents.length - 1];
                    if (lastTurn.defender === pokemonName && damage > 0) {
                      lastTurn.damage = damage;
                      lastTurn.remainingHP = current;
                      // Update lastHP so subsequent damage (like Life Orb) calculates correctly
                      pokemonHP[pokemonName].lastHP = current;
                    }
                  }
                }
              }
            }
            break;
            
          case '-heal':
            if (parts.length >= 4) {
              const pokemonName = this.extractPokemonName(parts[2]);
              const hpInfo = parts[3];
              if (hpInfo && hpInfo.includes('/')) {
                const [current, max] = hpInfo.split('/').map(h => parseInt(h) || 0);
                if (pokemonHP[pokemonName]) {
                  pokemonHP[pokemonName].current = current;
                  pokemonHP[pokemonName].max = max;
                }
              }
            }
            break;
            
          case '-crit':
            if (turnEvents.length > 0) {
              turnEvents[turnEvents.length - 1].critical = true;
            }
            break;
            
          case '-supereffective':
            if (turnEvents.length > 0) {
              turnEvents[turnEvents.length - 1].effectiveness = 'super';
            }
            break;
            
          case '-resisted':
            if (turnEvents.length > 0) {
              turnEvents[turnEvents.length - 1].effectiveness = 'not very';
            }
            break;
            
          case '-immune':
            if (turnEvents.length > 0) {
              turnEvents[turnEvents.length - 1].effectiveness = 'no';
              turnEvents[turnEvents.length - 1].damage = 0;
            }
            break;
            
          case '-miss':
            if (turnEvents.length > 0) {
              turnEvents[turnEvents.length - 1].missed = true;
              turnEvents[turnEvents.length - 1].damage = 0;
            }
            break;
            
          case '-status':
            if (parts.length >= 4 && turnEvents.length > 0) {
              const pokemonName = this.extractPokemonName(parts[2]);
              const status = parts[3]; // brn, par, psn, slp, frz, etc.
              const lastTurn = turnEvents[turnEvents.length - 1];
              if (lastTurn.defender === pokemonName) {
                lastTurn.statusEffect = status;
                lastTurn.statusInflicted = true;
              }
            }
            break;
            
          case '-start':
            if (parts.length >= 4) {
              const pokemonName = this.extractPokemonName(parts[2]);
              const condition = parts[3];
              // Check for status conditions like confusion, infatuation, etc.
              if (condition && (condition.includes('confusion') || condition.includes('Confusion'))) {
                if (turnEvents.length > 0) {
                  const lastTurn = turnEvents[turnEvents.length - 1];
                  if (lastTurn.defender === pokemonName) {
                    lastTurn.statusEffect = 'confusion';
                    lastTurn.statusInflicted = true;
                  }
                }
              }
            }
            break;
            
          case '-end':
            // Track when status effects end - could be useful for future enhancements
            break;
            
          case 'faint':
            if (parts.length >= 3) {
              const pokemonName = this.extractPokemonName(parts[2]);
              if (turnEvents.length > 0) {
                const lastTurn = turnEvents[turnEvents.length - 1];
                if (lastTurn.defender === pokemonName) {
                  lastTurn.fainted = true;
                }
              }
            }
            break;
            
          case '-boost':
            if (parts.length >= 5) {
              const pokemonName = this.extractPokemonName(parts[2]);
              const stat = parts[3];
              const stages = parseInt(parts[4]) || 1;
              
              // Create a special turn entry for stat boost
              turnEvents.push({
                turn: currentTurn,
                attacker: pokemonName,
                defender: pokemonName,
                move: 'Stat Change',
                damage: 0,
                remainingHP: pokemonHP[pokemonName]?.current || 100,
                critical: false,
                effectiveness: 'normal',
                statChange: {
                  stat: stat,
                  stages: stages,
                  type: 'boost'
                }
              });
            }
            break;
            
          case '-unboost':
            if (parts.length >= 5) {
              const pokemonName = this.extractPokemonName(parts[2]);
              const stat = parts[3];
              const stages = parseInt(parts[4]) || 1;
              
              // Create a special turn entry for stat drop
              turnEvents.push({
                turn: currentTurn,
                attacker: pokemonName,
                defender: pokemonName,
                move: 'Stat Change',
                damage: 0,
                remainingHP: pokemonHP[pokemonName]?.current || 100,
                critical: false,
                effectiveness: 'normal',
                statChange: {
                  stat: stat,
                  stages: -stages,
                  type: 'unboost'
                }
              });
            }
            break;
            
          case '-fail':
            if (parts.length >= 3) {
              const pokemonName = this.extractPokemonName(parts[2]);
              
              // Check if this is a stat change failure
              if (parts.length >= 4) {
                let isStatFail = false;
                let failureType = 'unknown';
                
                // Check for different stat failure messages
                if (parts[3].includes('stat') || parts[3].includes('boost') || parts[3].includes('unboost')) {
                  isStatFail = true;
                  if (parts[3].includes('higher') || parts[3].includes('boost')) {
                    failureType = 'too-high';
                  } else if (parts[3].includes('lower') || parts[3].includes('unboost')) {
                    failureType = 'too-low';
                  }
                }
                
                if (isStatFail) {
                  // Create a special turn entry for failed stat change
                  turnEvents.push({
                    turn: currentTurn,
                    attacker: pokemonName,
                    defender: pokemonName,
                    move: 'Stat Change',
                    damage: 0,
                    remainingHP: pokemonHP[pokemonName]?.current || 100,
                    critical: false,
                    effectiveness: 'normal',
                    statChange: {
                      stat: 'unknown',
                      stages: failureType === 'too-high' ? 1 : failureType === 'too-low' ? -1 : 0,
                      type: 'failed'
                    }
                  });
                }
              }
            }
            break;
        }
      }
    }
    
    // Push any remaining events from the last turn
    if (turnEvents.length > 0) {
      turns.push(...turnEvents);
    }
    
    return turns;
  }


  private extractPokemonName(pokemonStr: string): string {
    // Format: "p1a: Pikachu" -> "Pikachu"
    const match = pokemonStr.match(/:\s*(.+)$/);
    return match ? match[1] : pokemonStr;
  }

  // Nature stat modifiers: [increased stat, decreased stat]
  // Neutral natures (Hardy, Docile, Serious, Bashful, Quirky) have no modifiers
  private static readonly NATURE_MODIFIERS: Record<string, { increase?: string; decrease?: string }> = {
    // Neutral natures
    Hardy: {},
    Docile: {},
    Serious: {},
    Bashful: {},
    Quirky: {},
    // Attack boosting
    Lonely: { increase: 'attack', decrease: 'defense' },
    Brave: { increase: 'attack', decrease: 'speed' },
    Adamant: { increase: 'attack', decrease: 'specialAttack' },
    Naughty: { increase: 'attack', decrease: 'specialDefense' },
    // Defense boosting
    Bold: { increase: 'defense', decrease: 'attack' },
    Relaxed: { increase: 'defense', decrease: 'speed' },
    Impish: { increase: 'defense', decrease: 'specialAttack' },
    Lax: { increase: 'defense', decrease: 'specialDefense' },
    // Speed boosting
    Timid: { increase: 'speed', decrease: 'attack' },
    Hasty: { increase: 'speed', decrease: 'defense' },
    Jolly: { increase: 'speed', decrease: 'specialAttack' },
    Naive: { increase: 'speed', decrease: 'specialDefense' },
    // Special Attack boosting
    Modest: { increase: 'specialAttack', decrease: 'attack' },
    Mild: { increase: 'specialAttack', decrease: 'defense' },
    Quiet: { increase: 'specialAttack', decrease: 'speed' },
    Rash: { increase: 'specialAttack', decrease: 'specialDefense' },
    // Special Defense boosting
    Calm: { increase: 'specialDefense', decrease: 'attack' },
    Gentle: { increase: 'specialDefense', decrease: 'defense' },
    Sassy: { increase: 'specialDefense', decrease: 'speed' },
    Careful: { increase: 'specialDefense', decrease: 'specialAttack' },
  };

  private calculateStats(species: Species, level: number, nature: string = 'Hardy'): any {
    const IV = 31;
    const EV = 0;

    const getNatureModifier = (statName: string): number => {
      const modifier = PokemonShowdownService.NATURE_MODIFIERS[nature];
      if (!modifier) return 1.0;
      if (modifier.increase === statName) return 1.1;
      if (modifier.decrease === statName) return 0.9;
      return 1.0;
    };

    const calculateStat = (baseStat: number, statName: string, isHP: boolean = false) => {
      const baseStat_calc = Math.floor(((2 * baseStat + IV + (EV / 4)) * level / 100) + (isHP ? level + 10 : 5));
      // Nature doesn't affect HP
      if (isHP) return baseStat_calc;
      return Math.floor(baseStat_calc * getNatureModifier(statName));
    };

    return {
      hp: calculateStat(species.baseStats.hp, 'hp', true),
      attack: calculateStat(species.baseStats.atk, 'attack'),
      defense: calculateStat(species.baseStats.def, 'defense'),
      specialAttack: calculateStat(species.baseStats.spa, 'specialAttack'),
      specialDefense: calculateStat(species.baseStats.spd, 'specialDefense'),
      speed: calculateStat(species.baseStats.spe, 'speed')
    };
  }

  private async getMovesFromLearnset(species: Species, level: number, dex: any): Promise<string[]> {
    try {
      // Get all level-up moves for this Pokemon
      const levelupMoves = await this.getLevelupMoves(species, dex);

      // Filter moves that the Pokemon can know at the given level
      const availableMoves = levelupMoves
          .filter(moveData => moveData.level <= level);

      if (availableMoves.length === 0) {
        logger.error(`No moves found in learnset for ${species.name} at level ${level}`);
        throw new ApiError(500, `Pokemon ${species.name} has no valid moves at level ${level}. This is a critical data error.`);
      }

      // If we have more than 4 moves, select the 4 most recent ones (highest level)
      if (availableMoves.length > 4) {
        // Sort by level (descending) and take the last 4 learned
        const sortedMoves = availableMoves
            .sort((a, b) => b.level - a.level)
            .slice(0, 4);

        // logger.debug(`Selected 4 most recent moves for ${species.name} at level ${level}:`, sortedMoves.map(m => m.move));
        // Return move IDs (not formatted names) for battle simulation
        return sortedMoves.map(moveData => moveData.moveId);
      }

      // logger.debug(`Using all ${availableMoves.length} available moves for ${species.name} at level ${level}:`, availableMoves.map(m => m.move));
      // Return move IDs (not formatted names) for battle simulation
      return availableMoves.map(moveData => moveData.moveId);
    } catch (error) {
      logger.error('Critical error getting moves from learnset:', {
        species: species.name,
        level: level,
        error: error instanceof Error ? error.message : error
      });

      // This is a critical error - we cannot proceed without valid moves
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Failed to get valid moves for ${species.name}. Pokemon must have moves from their learnset.`);
    }
  }

  private async getLevelupMoves(species: Species, dex: any): Promise<Array<{ level: number; move: string; moveId: string }>> {
    const levelupMoves: Array<{ level: number; move: string; moveId: string }> = [];
    const generation = dex.gen || 9;
    
    logger.debug(`Getting levelup moves for ${species.name} (ID: ${species.id}) in Gen ${generation}`);
    
    try {
      // Get learnset data using the Dex API
      const learnsetData = await dex.learnsets.get(species.id);
      
      if (!learnsetData || !learnsetData.learnset) {
        logger.error(`No learnset data found for ${species.name} (ID: ${species.id}) in Gen ${generation}`);
        throw new ApiError(500, `No learnset data found for ${species.name}`);
      }
      
      logger.debug(`Found learnset for ${species.name} with ${Object.keys(learnsetData.learnset || {}).length} moves`);
      
      if (learnsetData && learnsetData.learnset) {
        // Process all moves from the learnset
        for (const [moveName, learnData] of Object.entries(learnsetData.learnset)) {
          if (Array.isArray(learnData)) {
            let earliestLevel = null;
            let foundInCurrentGen = false;
            
            for (const learnMethod of learnData) {
              // Format is like "8L1" (Gen 8, Level 1) or "7L45" (Gen 7, Level 45)
              const match = learnMethod.match(/^(\d+)L(\d+)$/);
              if (match) {
                const moveGen = parseInt(match[1]);
                const level = parseInt(match[2]);
                
                // For Gen 1, we need to be more lenient since many moves don't have explicit Gen 1 data
                // We'll include moves from any generation if we're in Gen 1 and the move exists in Gen 1
                if (moveGen <= generation || (generation === 1 && moveGen <= 3)) {
                  if (earliestLevel === null || level < earliestLevel) {
                    earliestLevel = level;
                    foundInCurrentGen = true;
                  }
                }
              }
            }
            
            if (foundInCurrentGen && earliestLevel !== null) {
              const move = dex.moves.get(moveName);
              if (move && move.exists) {
                // For Gen 1, check if the move actually exists in Gen 1
                if (generation === 1 && move.num && move.num > 165) {
                  continue; // Skip moves that don't exist in Gen 1
                }
                
                // Check if we already have this move
                const existingMove = levelupMoves.find(m => m.move === this.formatMoveName(move.name));
                if (!existingMove) {
                  levelupMoves.push({ 
                    level: earliestLevel, 
                    move: this.formatMoveName(move.name),
                    moveId: moveName // Keep the original move ID for battle simulation
                  });
                } else if (earliestLevel < existingMove.level) {
                  // Update to the earliest level this move is learned
                  existingMove.level = earliestLevel;
                }
              }
            }
          }
        }
        
        // Sort by level
        levelupMoves.sort((a, b) => a.level - b.level);
        
        // logger.debug(`Found ${levelupMoves.length} level-up moves for ${species.name}`);
      }
      
      // If we couldn't get learnset data, use fallback moves for Gen 1
      if (levelupMoves.length === 0 && generation === 1) {
        logger.warn(`No level-up moves found for ${species.name} in Gen ${generation}, using fallback moves`);
        
        // Use some basic moves that most Pokemon can learn
        const fallbackMoves = ['tackle', 'scratch', 'pound', 'growl', 'tailwhip', 'leer'];
        for (const moveName of fallbackMoves) {
          const move = dex.moves.get(moveName);
          if (move && move.exists && move.num <= 165) {
            levelupMoves.push({
              level: 1,
              move: this.formatMoveName(move.name),
              moveId: moveName
            });
            if (levelupMoves.length >= 4) break;
          }
        }
        
        // If still no moves, use species-specific defaults
        if (levelupMoves.length === 0) {
          if (species.types.includes('Electric')) {
            levelupMoves.push({ level: 1, move: 'Thunder Shock', moveId: 'thundershock' });
            levelupMoves.push({ level: 1, move: 'Growl', moveId: 'growl' });
          } else if (species.types.includes('Fire')) {
            levelupMoves.push({ level: 1, move: 'Ember', moveId: 'ember' });
            levelupMoves.push({ level: 1, move: 'Growl', moveId: 'growl' });
          } else if (species.types.includes('Water')) {
            levelupMoves.push({ level: 1, move: 'Water Gun', moveId: 'watergun' });
            levelupMoves.push({ level: 1, move: 'Tail Whip', moveId: 'tailwhip' });
          } else {
            levelupMoves.push({ level: 1, move: 'Tackle', moveId: 'tackle' });
            levelupMoves.push({ level: 1, move: 'Growl', moveId: 'growl' });
          }
        }
      }
      
      // If we still couldn't get any moves, this is a critical error
      if (levelupMoves.length === 0) {
        logger.error(`CRITICAL: No level-up moves found for ${species.name} in learnset data`);
        throw new ApiError(500, `No valid moves found for ${species.name} in Pokemon Showdown data. This is a critical data error.`);
      }
      
    } catch (error) {
      logger.error('Could not get levelup moves:', { 
        species: species.name,
        error: error instanceof Error ? error.message : error 
      });
      // Re-throw the error - we cannot proceed without valid moves
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Failed to retrieve moves for ${species.name} from Pokemon Showdown data.`);
    }
    
    return levelupMoves;
  }

  private getSpeciesById(dex: any, id: number): Species | null {
    try {
      // Try by national dex number first
      const allSpecies = dex.species.all();
      const found = allSpecies.find((s: Species) => s.num === id);
      if (found) return found;
      
      // Fallback to trying by ID string - dex.species.get expects a string
      const species = dex.species.get(String(id));
      if (species && species.exists) return species;
      
      return null;
    } catch (error) {
      logger.error('Error getting species by ID:', { id, error });
      return null;
    }
  }

 /* private async fetchPokemonSprites(id1: number, id2: number) {
    try {
      const [pokemon1Sprites, pokemon2Sprites] = await Promise.all([
        pokemonService.getPokemonSprites(id1),
        pokemonService.getPokemonSprites(id2)
      ]);
      return [pokemon1Sprites, pokemon2Sprites];
    } catch (error) {
      logger.error('Failed to fetch Pokemon sprites:', error);
      return [
        { front: '', back: '', shiny: '' },
        { front: '', back: '', shiny: '' }
      ];
    }
  }*/

  private formatMoveName(move: string): string {
    // Convert from camelCase or lowercase to Title Case
    // e.g., "thundershock" -> "Thunder Shock", "quickAttack" -> "Quick Attack"
    return move
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
      .replace(/\s+/g, ' '); // Replace multiple spaces with single space
  }

  private getRandomAbility(species: Species): string {
    // Get all available abilities
    const abilities = [];
    
    if (species.abilities) {
      // Add regular abilities
      if (species.abilities['0']) abilities.push(species.abilities['0']);
      if (species.abilities['1']) abilities.push(species.abilities['1']);
      // Add hidden ability if available
      if (species.abilities['H']) abilities.push(species.abilities['H']);
    }
    
    // If no abilities found, return a default
    if (abilities.length === 0) {
      return 'Pressure';
    }
    
    // Return a random ability
    return abilities[Math.floor(Math.random() * abilities.length)];
  }

  private getRandomItem(): string | undefined {
    // Common competitive items pool
    const itemPool = [
      'Leftovers',
      'Choice Band',
      'Choice Scarf',
      'Choice Specs',
      'Life Orb',
      'Focus Sash',
      'Assault Vest',
      'Eviolite',
      'Black Sludge',
      'Rocky Helmet',
      'Light Clay',
      'Sitrus Berry'
    ];
    
    // 50% chance to have no item
    if (Math.random() < 0.5) {
      return undefined;
    }
    
    // Return a random item
    return itemPool[Math.floor(Math.random() * itemPool.length)];
  }

  async createPokemonInstance(pokemonId: number, level: number = 50, generation: number = 9, itemMode: 'random' | 'none' = 'random'): Promise<PokemonInstanceData> {
    try {
      const dex = Dex.forGen(generation);
      
      // Get Pokemon species
      const species = this.getSpeciesById(dex, pokemonId);
      if (!species) {
        throw new ApiError(400, `Pokemon with ID ${pokemonId} not found`);
      }

      // Get sprites (local paths)
      const sprites = pokemonService.getPokemonSprites(pokemonId);

      // Get random nature FIRST (needed for stat calculation)
      const natures = ['Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty', 'Bold',
                      'Docile', 'Relaxed', 'Impish', 'Lax', 'Timid', 'Hasty',
                      'Serious', 'Jolly', 'Naive', 'Modest', 'Mild', 'Quiet',
                      'Bashful', 'Rash', 'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky'];
      const nature = natures[Math.floor(Math.random() * natures.length)];

      // Calculate stats with nature modifier, default IVs (31) and EVs (0)
      const stats = this.calculateStats(species, level, nature);

      // Get types
      const types = species.types.map(t => t.toLowerCase());

      // Get moves from level-up learnset
      const moveIds = await this.getMovesFromLearnset(species, level, dex);
      const levelupMovesData = await this.getLevelupMoves(species, dex);
      const moves = levelupMovesData
        .filter(m => moveIds.includes(m.moveId))
        .map(m => m.move);

      // Get move details from move store
      const moveDetails = [];
      for (const moveId of moveIds) {
        const moveData = pokemonMoveStoreService.getMove(moveId);
        if (!moveData) {
          // Fallback to Showdown data if move store doesn't have the move
          const dexMove = dex.moves.get(moveId);
          if (dexMove) {
            moveDetails.push({
              name: this.formatMoveName(dexMove.name),
              type: dexMove.type.toLowerCase(),
              category: dexMove.category.toLowerCase() as 'physical' | 'special' | 'status',
              power: dexMove.basePower || null,
              accuracy: dexMove.accuracy === true ? null : dexMove.accuracy,
              pp: dexMove.pp || 10
            });
          }
        } else {
          // Use move store data
          moveDetails.push({
            name: this.formatMoveName(moveData.name),
            type: moveData.type,
            category: moveData.category,
            power: moveData.power,
            accuracy: moveData.accuracy,
            pp: moveData.pp,
            description: moveData.effectEntries.length > 0 ? moveData.effectEntries[0] : undefined
          });
        }
      }

      // Get random ability
      const ability = this.getRandomAbility(species);
      
      // Get ability details
      let abilityDetail = undefined;
      if (ability) {
        const abilityData = pokemonAbilityStoreService.getAbility(ability);
        if (abilityData) {
          abilityDetail = {
            name: abilityData.name,
            effect: abilityData.effect,
            shortEffect: abilityData.shortEffect
          };
        }
      }

      // Get item based on item mode
      let item: string | undefined;
      let itemDetail = undefined;
      if (itemMode === 'none') {
        item = undefined;
      } else {
        // Random mode - 50% chance of having an item
        item = this.getRandomItem();
        
        // Get item details if we have an item
        if (item) {
          const itemData = pokemonItemStoreService.getItem(item);
          if (itemData) {
            itemDetail = {
              name: itemData.name,
              effect: itemData.effect,
              shortEffect: itemData.shortEffect,
              sprite: itemData.sprite
            };
          }
        }
      }

      // Default IVs and EVs (nature already selected above for stat calculation)
      const ivs = { hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 31 };
      const evs = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };

      // Base stats
      const baseStats = {
        hp: species.baseStats.hp,
        attack: species.baseStats.atk,
        defense: species.baseStats.def,
        specialAttack: species.baseStats.spa,
        specialDefense: species.baseStats.spd,
        speed: species.baseStats.spe
      };

      // 1/50 chance for shiny (2%)
      const isShiny = Math.random() < 0.02;
      
      if (isShiny) {
        logger.info(`🌟 SHINY Pokemon generated: ${species.name} (ID: ${pokemonId})`);
      }
      
      const pokemonInstance: PokemonInstanceData = {
        id: pokemonId,
        name: species.name,
        species: species.name,
        level,
        types,
        ability,
        abilityDetail,
        item,
        itemDetail,
        moves: moves.map(move => this.formatMoveName(move)),
        moveDetails,
        stats,
        baseStats,
        evs,
        ivs,
        nature,
        sprites,
        shiny: isShiny
      };

      return pokemonInstance;
    } catch (error) {
      logger.error('Failed to create Pokemon instance:', {
        pokemonId,
        level,
        generation,
        error: error instanceof Error ? error.message : error
      });
      throw error instanceof ApiError ? error : new ApiError(500, 'Failed to create Pokemon instance');
    }
  }

  async getAvailableMovesForPokemon(pokemonId: number, generation: number, level: number, debugMode: boolean = false): Promise<any[]> {
    try {
      const dex = Dex.forGen(generation);
      
      // In debug mode, return ALL moves available in the generation
      if (debugMode) {
        const allMoves = dex.moves.all();
        const moveMap = new Map<string, any>();
        
        // Use a Map to ensure unique move IDs
        allMoves
          .filter(move => {
            // Filter out non-damaging moves with no effect
            if (!move.exists) return false;
            // Filter out Z-moves, Max moves, and G-Max moves
            if (move.isZ || move.isMax || move.name.startsWith('G-Max')) return false;
            // Make sure the move exists in the current generation
            if (move.gen && move.gen > generation) return false;
            return true;
          })
          .forEach(move => {
            // Only add if we haven't seen this ID before (prevents duplicates like Hidden Power variants)
            if (!moveMap.has(move.id)) {
              moveMap.set(move.id, {
                id: move.id,
                name: this.formatMoveName(move.name),
                type: move.type.toLowerCase(),
                category: move.category.toLowerCase() as 'physical' | 'special' | 'status',
                power: move.basePower || null,
                accuracy: move.accuracy === true ? null : move.accuracy,
                pp: move.pp || 10,
                description: move.desc || move.shortDesc || ''
              });
            }
          });
        
        // Convert map values to array and sort
        const availableMoves = Array.from(moveMap.values());
        availableMoves.sort((a, b) => a.name.localeCompare(b.name));
        
        logger.info(`Returning ${availableMoves.length} total moves for debug mode in gen ${generation}`);
        return availableMoves;
      }
      
      // Regular mode - only moves the Pokemon can learn
      const species = this.getSpeciesById(dex, pokemonId);
      if (!species) {
        throw new ApiError(400, `Pokemon with ID ${pokemonId} not found`);
      }

      // Get all level-up moves for this Pokemon
      const levelupMoves = await this.getLevelupMoves(species, dex);
      
      // Filter moves that the Pokemon can know at the given level
      const availableMoves = levelupMoves
        .filter(moveData => moveData.level <= level)
        .map(moveData => {
          const move = dex.moves.get(moveData.moveId);
          return {
            id: moveData.moveId,
            name: this.formatMoveName(move.name),
            type: move.type.toLowerCase(),
            category: move.category.toLowerCase() as 'physical' | 'special' | 'status',
            power: move.basePower || null,
            accuracy: move.accuracy === true ? null : move.accuracy,
            pp: move.pp || 10,
            description: move.desc || move.shortDesc || ''
          };
        });

      // Sort by level learned (most recent first) and then by name
      availableMoves.sort((a, b) => {
        const aMove = levelupMoves.find(m => m.moveId === a.id);
        const bMove = levelupMoves.find(m => m.moveId === b.id);
        const levelDiff = (bMove?.level || 0) - (aMove?.level || 0);
        if (levelDiff !== 0) return levelDiff;
        return a.name.localeCompare(b.name);
      });

      return availableMoves;
    } catch (error) {
      logger.error('Failed to get available moves for Pokemon:', {
        pokemonId,
        generation,
        level,
        error: error instanceof Error ? error.message : error
      });
      throw error instanceof ApiError ? error : new ApiError(500, 'Failed to get available moves');
    }
  }
}

export const pokemonShowdownService = new PokemonShowdownService();