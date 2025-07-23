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

      logger.info(`Beginning simulation: ${config.pokemon1.name} vs ${config.pokemon2.name}`, {skipFormat: true});

      for (let i = 0; i < this.NUM_BATTLES; i++) {
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
          //logger.info(`Battle ${i + 1} ended in a draw`, {skipFormat: true});
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
        totalBattles: this.NUM_BATTLES,
        executionTime: executionTime,
      };

      // Cache the result disabled
      // await cacheService.set(`showdown:${cacheKey}`, result, 3600);

      logger.info(`Simulation complete: ${config.pokemon1.name} won ${pokemon1Wins}, ${config.pokemon2.name} won ${pokemon2Wins}`, {skipFormat: true});
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
    
    logger.info('🎮 Battle Tester: Starting single battle simulation', {
      generation: config.generation || 9,
      pokemon1Instance: config.pokemon1 || null,
      pokemon2Instance: config.pokemon2 || null
    });
    
    try {
      let stream: BattleStreams.BattleStream | null = new BattleStreams.BattleStream();
      const outputs: string[] = [];

      const pokemon1 = config.pokemon1;
      const pokemon2 = config.pokemon2;
      // Create teams with moves from Pokemon Showdown
      logger.info('🎮 Battle Tester: Creating teams...');
      const p1teamString = await this.createTeam(pokemon1, config.generation);
      const p2teamString = await this.createTeam(pokemon2, config.generation);
      
      // Convert team strings to packed format
      const p1teamImported = Teams.importTeam(p1teamString);
      const p2teamImported = Teams.importTeam(p2teamString);
      
      if (!p1teamImported || !p2teamImported) {
        throw new Error('Failed to import team data');
      }
      
      const p1team = Teams.packTeam(p1teamImported);
      const p2team = Teams.packTeam(p2teamImported);
      
      logger.info(`🎮 Battle Tester: P1 team (packed): ${p1team}`);
      logger.info(`🎮 Battle Tester: P2 team (packed): ${p2team}`);

      // Start battle
      logger.info('🎮 Battle Tester: Initializing battle stream...');
      await stream.write(`>start {"formatid":"gen${config.generation}singles"}`);
      await stream.write(`>player p1 ${JSON.stringify({ name: 'Player 1', team: p1team })}`);
      await stream.write(`>player p2 ${JSON.stringify({ name: 'Player 2', team: p2team })}`);
      
      // Log both Pokemon levels
      logger.info(`🎮 Battle Tester: ${pokemon1.name} Level ${pokemon1.level} vs ${pokemon2.name} Level ${pokemon2.level}`);
      
      let winner: string | 'draw' = config.pokemon1.name;
      let battleEnded = false;
      let turnCount = 0;
      const maxTurns = 50;
      let p1Request: any = null;
      let p2Request: any = null;

      logger.info('🎮 Battle Tester: Battle started! Processing turns...');
      
      // Give the stream a moment to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Process battle synchronously for simplicity
      while (!battleEnded && turnCount < maxTurns) {
        logger.info(`🎮 Battle Tester: ========================================================`);
        logger.info(`🎮 Battle Tester: Turn ${turnCount}`);
        
        // Read from stream
        
        const chunk = await stream.read();
        if (!chunk) break;
        
        logger.info(`🎮 Battle Tester: Chunk received: ${chunk}`);
        
        outputs.push(chunk);
        
        
        // Check for winner first
        if (chunk.includes('|win|')) {
          battleEnded = true;
          winner = chunk.includes('Player 1') ? pokemon1.name : pokemon2.name;
          logger.info(`🎮 Battle Tester: Battle ended! Winner: ${winner}`);
          break;
        }
        
        // Check for tie message from Pokemon Showdown
        // Must be a complete |tie| message, not part of another word like |tier|
        const tieLines = chunk.split('\n');
        for (const line of tieLines) {
          if (line === '|tie' || line.startsWith('|tie|')) {
            battleEnded = true;
            winner = 'draw';
            logger.info(`🎮 Battle Tester: Battle ended in a TIE!`);
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
                  logger.info(`🎮 Battle Tester: ${pokemon1.name} fainted!`);
                } else if (faintedPokemon.startsWith('p2a:')) {
                  p2FaintedThisChunk = true;
                  logger.info(`🎮 Battle Tester: ${pokemon2.name} fainted!`);
                }
              }
            }
          }
          
          // Only count as draw if both fainted in the same chunk (simultaneous)
          if (p1FaintedThisChunk && p2FaintedThisChunk) {
            battleEnded = true;
            winner = 'draw';
            logger.info(`🎮 Battle Tester: Battle ended in a DRAW!`);
            break;
          }
        }
        
        // Handle team preview
        if (chunk.includes('|teampreview')) {
          logger.info('🎮 Battle Tester: Team preview phase');
          await stream.write('>p1 team 1');
          await stream.write('>p2 team 1');
        }
        
        // Parse requests and make moves
        const lines = chunk.split('\n');
        for (const line of lines) {
          // Log important battle events
          if (line.includes('|move|')) {
            const moveMatch = line.match(/\|move\|([^|]+)\|([^|]+)\|([^|]+)/);
            if (moveMatch) {
              logger.info(`🎮 Battle Tester: ${this.extractPokemonName(moveMatch[1])} used ${moveMatch[2]}!`);
            }
          }
          if (line.includes('|-damage|')) {
            const damageMatch = line.match(/\|-damage\|([^|]+)\|([^|]+)/);
            if (damageMatch) {
              logger.info(`🎮 Battle Tester: ${this.extractPokemonName(damageMatch[1])} took damage! HP: ${damageMatch[2]}`);
            }
          }
          if (line.includes('|-supereffective|')) {
            logger.info('🎮 Battle Tester: It\'s super effective!');
          }
          if (line.includes('|-resisted|')) {
            logger.info('🎮 Battle Tester: It\'s not very effective...');
          }
          if (line.includes('|-crit|')) {
            logger.info('🎮 Battle Tester: Critical hit!');
          }
          
          // Better request parsing - look for request data in each line
          if (line.includes('|request|')) {
            // Extract the JSON data after |request|
            const parts = line.split('|request|');
            if (parts.length > 1) {
              const requestData = parts[1].trim();
              if (requestData && requestData.startsWith('{')) {
                try {
                  logger.debug(`🎮 Battle Tester: Found request data: ${requestData.substring(0, 100)}...`);
                  const request = JSON.parse(requestData);
                  
                  // Determine which player this is for based on previous line context
                  // Look for the player indicator in the previous lines
                  let playerFound = false;
                  for (let i = lines.indexOf(line) - 1; i >= 0 && i > lines.indexOf(line) - 5; i--) {
                    if (lines[i] && lines[i].startsWith('>p1')) {
                      p1Request = request;
                      playerFound = true;
                      logger.info(`🎮 Battle Tester: Parsed P1 request with ${request.active?.[0]?.moves?.length || 0} moves`);
                      break;
                    } else if (lines[i] && lines[i].startsWith('>p2')) {
                      p2Request = request;
                      playerFound = true;
                      logger.info(`🎮 Battle Tester: Parsed P2 request with ${request.active?.[0]?.moves?.length || 0} moves`);
                      break;
                    }
                  }
                  
                  // If we couldn't determine the player from context, check if we can infer it
                  if (!playerFound) {
                    // If we don't have a p1 request yet, assume this is for p1
                    if (!p1Request && !p2Request) {
                      p1Request = request;
                      logger.info(`🎮 Battle Tester: Assigned request to P1 by default`);
                    } else if (p1Request && !p2Request) {
                      p2Request = request;
                      logger.info(`🎮 Battle Tester: Assigned request to P2 (P1 already has request)`);
                    }
                  }
                } catch (e) {
                  logger.error(`🎮 Battle Tester: Failed to parse request JSON:`, e);
                }
              }
            }
          }
        }
        
        // Handle requests similar to runSingleShowdownBattle
        if (chunk.includes('|request|')) {
          const requestData = JSON.parse(chunk.split('|request|')[1]);
          
          // Determine which player is making the request
          const side = requestData.side && requestData.side.id ? requestData.side.id : null;
          if (!side) {
            logger.warn('🎮 Battle Tester: No side info found in requestData');
            continue;
          }
          
          // Choose a move for the appropriate player
          if (requestData.active && requestData.active[0]) {
            const active = requestData.active[0];
            const validMoves: (number | 'struggle')[] = [];
            
            active.moves.forEach((move: any, i: number) => {
              logger.info(`🎮 Battle Tester: Available move for ${side}: ${move.move}`);
              if (!move.disabled && (move.pp === undefined || move.pp > 0)) {
                validMoves.push(i + 1); // Moves are 1-indexed in Showdown
              }
            });
            
            const moveChoice = validMoves.length > 0
                ? validMoves[Math.floor(Math.random() * validMoves.length)]
                : 'struggle';
            
            logger.info(`🎮 Battle Tester: >>> ${side} chose move: ${moveChoice}`);
            await stream.write(`>${side} move ${moveChoice}`);
          }
        }
        
        if (chunk.includes('|turn|')) {
          turnCount++;
          logger.info(`🎮 Battle Tester: ========================================================`);
          logger.info(`🎮 Battle Tester: NEW TURN ${turnCount}`);
        }
      }
      
      // Force end if battle takes too long
      if (turnCount >= maxTurns) {
        // Decide winner based on base stat totals
        const bst1 = Object.values(pokemon1.baseStats).reduce((a, b) => a + b, 0);
        const bst2 = Object.values(pokemon2.baseStats).reduce((a, b) => a + b, 0);
        winner = bst1 >= bst2 ? pokemon1.name : pokemon2.name;
        logger.info(`🎮 Battle Tester: MAX TURN COUNT EXCEEDED - Winner: ${winner}`);
      }

      // Parse battle log
      logger.info('🎮 Battle Tester: Parsing battle log...');
      const turns = this.parseBattleLog(outputs);
      
      logger.info(`🎮 Battle Tester: Battle simulation complete!`, {
        winner,
        totalTurns: turnCount,
        parsedTurns: turns.length
      });
      
      // If no turns were parsed, create a simple turn for demo purposes
      if (turns.length === 0) {
        logger.info(`🎮 Battle Tester: Battle simulation had zero turn!!!`);

      }

      // Extract final HP from the last turn or set to 0 for the loser
      const finalHP1 = winner === 'draw' ? 0 : (winner === pokemon1.name ? turns[turns.length - 1]?.remainingHP || 0 : 0);
      const finalHP2 = winner === 'draw' ? 0 : (winner === pokemon2.name ? turns[turns.length - 1]?.remainingHP || 0 : 0);
      
      const executionTime = Date.now() - startTime;

      // Important: Clean up the stream properly
      try {
        // Instead of destroying the stream, let it be garbage collected
        // The BattleStream doesn't properly implement destroy() method
        // and calling it causes internal state corruption
        // Just nullify the reference and let GC handle it
        stream = null;
      } catch (cleanupError) {
        logger.error('Error during stream cleanup in simulateSingleBattle:', cleanupError);
      }

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

  private async runSingleShowdownBattle(
      pokemon1: PokemonInstanceData,
      pokemon2: PokemonInstanceData,
      generation: number
  ): Promise<0 | 1 | 2> {
    const stream = new BattleStreams.BattleStream();

    // Create teams
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

    // Teams are now in packed format


    // Log teams for debugging
    //logger.info(`P1 team (unpacked):\n${p1teamString}`);
    //logger.info(`P1 team (packed): ${p1team}`);

// Start the battle
    await stream.write(`>start ${JSON.stringify({ formatid: `gen${generation}singles` })}`);
    await stream.write(`>player p1 ${JSON.stringify({ name: 'Player 1', team: p1team })}`);
    await stream.write(`>player p2 ${JSON.stringify({ name: 'Player 2', team: p2team })}`);

    let winner: 0 | 1 | 2 = 1;
    let turnCount = 0;
    const maxTurns = 50;

    //logger.info(`\n\n==========================================================================='`);
    //logger.info(`NewTurnCourt ` + turnCount);
    while (turnCount < maxTurns) {
      //logger.info(`=========================================================='`);

      //logger.info(`turn ${turnCount}`);
      const chunk = await stream.read();
      
      // Debug logging for first few chunks
      if (turnCount < 3) {
        logger.debug(`Chunk ${turnCount}: ${chunk?.substring(0, 200)}...`);
      }

      if (!chunk) break;

      // Check for win first
      if (chunk.includes('|win|')) {
        winner = chunk.includes('Player 1') ? 1 : 2;
        break;
      }
      
      // Check for tie message from Pokemon Showdown
      // Must be a complete |tie| message, not part of another word like |tier|
      const tieLines = chunk.split('\n');
      for (const line of tieLines) {
        if (line === '|tie' || line.startsWith('|tie|')) {
          winner = 0;
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
                logger.debug(`Battle: P1 fainted - ${faintedPokemon}`);
              } else if (faintedPokemon.startsWith('p2a:')) {
                p2FaintedThisChunk = true;
                logger.debug(`Battle: P2 fainted - ${faintedPokemon}`);
              }
            }
          }
        }
        
        // Only count as draw if both fainted in the same chunk (simultaneous)
        if (p1FaintedThisChunk && p2FaintedThisChunk) {
          logger.warn(`Battle: DRAW detected - both Pokemon fainted simultaneously at turn ${turnCount}`);
          winner = 0;
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
        //  logger.warn('No side info found in requestData');
          continue;
        }

        // Choose a move for the appropriate player
        if (requestData.active && requestData.active[0]) {
          const active = requestData.active[0];
          const validMoves: (number | 'struggle')[] = [];

          active.moves.forEach((move: any, i: number) => {
         //   logger.info(`Available move for ${side}: ${move.move}`);
            if (!move.disabled && (move.pp === undefined || move.pp > 0)) {
              validMoves.push(i + 1); // Moves are 1-indexed in Showdown
            }
          });

          const moveChoice = validMoves.length > 0
              ? validMoves[Math.floor(Math.random() * validMoves.length)]
              : 'struggle';

         // logger.info(`>>> ${side} chose move: ${moveChoice}`);
          await stream.write(`>${side} move ${moveChoice}`);
        }
      }
      if (chunk.includes('|turn|')) {
        turnCount++;
       // logger.info(`\n\n==========================================================================='`);
      //  logger.info(`NewTurnCourt ` + turnCount);

      }

      if (turnCount >= maxTurns) {
        // Decide winner based on base stat totals
        const bst1 = Object.values(pokemon1.baseStats).reduce((a, b) => a + b, 0);
        const bst2 = Object.values(pokemon2.baseStats).reduce((a, b) => a + b, 0);
        winner = bst1 >= bst2 ? 1 : 2;
       // logger.info(`MAX TURN COUNT EXCEEDED`);
        return winner;
      }
    }


    return winner;
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
    if (generation >= 2 && pokemon.sprites.shiny) {
      lines.push(`Shiny: Yes`);
    }

    // EVs (Gen 3+)
    if (generation >= 3) {
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
    if (generation >= 3) {
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
    pokemon.moves.forEach(move => {
      lines.push(`- ${move}`);
    });

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
          
          // Check for switch/drag format
          if ((line.includes('|switch|') || line.includes('|drag|')) && parts.length >= 6) {
            const pokemonName = this.extractPokemonName(parts[3]);
            const hpInfo = parts[5];
            if (hpInfo && hpInfo.includes('/')) {
              const [current, max] = hpInfo.split('/').map(h => parseInt(h) || 0);
              pokemonHP[pokemonName] = { current, max };
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
              
              if (hpInfo === '0 fnt') {
                // Pokemon fainted
                if (pokemonHP[pokemonName]) {
                  pokemonHP[pokemonName].current = 0;
                }
                if (turnEvents.length > 0) {
                  const lastTurn = turnEvents[turnEvents.length - 1];
                  if (lastTurn.defender === pokemonName) {
                    lastTurn.damage = pokemonHP[pokemonName]?.lastHP || pokemonHP[pokemonName]?.max || 0;
                    lastTurn.remainingHP = 0;
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
                if (parts.length >= 5 && damage > 0) {
                  const source = parts[4];
                  
                  // Create a special turn entry for status/confusion damage
                  if (source && (source.includes('[from]') || source.includes('confusion'))) {
                    let damageType = 'unknown';
                    
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
                    } else if (source.includes('recoil')) {
                      damageType = 'recoil';
                    } else if (source.includes('Life Orb')) {
                      damageType = 'Life Orb';
                    }
                    
                    turnEvents.push({
                      turn: currentTurn,
                      attacker: damageType,
                      defender: pokemonName,
                      move: damageType === 'confusion' ? 'Confusion damage' : 
                            damageType === 'recoil' ? 'Recoil damage' :
                            damageType === 'Life Orb' ? 'Life Orb damage' :
                            `${damageType} damage`,
                      damage: damage,
                      remainingHP: current,
                      critical: false,
                      effectiveness: 'normal',
                      statusEffect: damageType,
                      statusInflicted: false
                    });
                    
                    // Update HP tracking
                    pokemonHP[pokemonName].lastHP = current;
                  } else {
                    // Normal move damage - update the last turn
                    if (turnEvents.length > 0) {
                      const lastTurn = turnEvents[turnEvents.length - 1];
                      if (lastTurn.defender === pokemonName && damage > 0) {
                        lastTurn.damage = damage;
                        lastTurn.remainingHP = current;
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

      // Get sprites
      const sprites = await pokemonService.getPokemonSprites(pokemonId);

      // Calculate stats with default IVs (31) and EVs (0)
      const stats = this.calculateStats(species, level);

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

      // Get random nature
      const natures = ['Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty', 'Bold', 
                      'Docile', 'Relaxed', 'Impish', 'Lax', 'Timid', 'Hasty',
                      'Serious', 'Jolly', 'Naive', 'Modest', 'Mild', 'Quiet',
                      'Bashful', 'Rash', 'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky'];
      const nature = natures[Math.floor(Math.random() * natures.length)];

      // Default IVs and EVs
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
}

export const pokemonShowdownService = new PokemonShowdownService();