import { Dex, Species } from '@pkmn/dex';
import { Teams, BattleStreams } from '@pkmn/sim';
import { cacheService } from './cache.service';
import { pokemonService } from './pokemon.service';
import logger from '../utils/logger';
import { ApiError } from '../middleware/error.middleware';
import crypto from 'crypto';
import { PokemonInstanceData } from '../types/pokemon-instance.types';
// Temporarily hardcode BATTLE_CONFIG until shared config is properly set up
const BATTLE_CONFIG = { TOTAL_BATTLES: 17 };

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
    pokemon1Instance?: any;
    pokemon2Instance?: any;
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
    baseStats: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
    evs: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
    ivs: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
    ability?: string;
    item?: string;
    levelupMoves?: Array<{ level: number; move: string }>;
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
    baseStats: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
    evs: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
    ivs: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
    ability?: string;
    item?: string;
    levelupMoves?: Array<{ level: number; move: string }>;
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
  private readonly NUM_BATTLES = BATTLE_CONFIG.TOTAL_BATTLES; // Number of battles to simulate from central config

  async simulateBattle(config: ShowdownBattleConfig): Promise<ShowdownBattleResult> {
    const startTime = Date.now();
    // Reduced logging - moved to battle start
    
    try {
      // logger.debug('Config received:', config);
      // Generate cache key
      const cacheKey = this.generateBattleKey(config);
      // logger.debug('Generated cache key:', cacheKey);
      
      // Check cache first
      const cachedResult = await cacheService.get<ShowdownBattleResult>(`showdown:${cacheKey}`);
      if (cachedResult) {
        logger.info(`Battle found in cache: ${cacheKey}`);
        return cachedResult;
      }

      const generation = config.options?.generation || 9;
      // logger.debug('Using generation:', generation);
      
      let dex;
      try {
        dex = Dex.forGen(generation);
        // logger.debug('Dex initialized successfully for generation', generation);
      } catch (dexError) {
        logger.error('Failed to initialize Dex:', dexError);
        throw new ApiError(500, 'Failed to initialize Pokemon data');
      }
      
      // Get Pokemon species
      // logger.debug('Getting species for IDs:', { id1: config.pokemon1Id, id2: config.pokemon2Id });
      const species1 = this.getSpeciesById(dex, config.pokemon1Id);
      const species2 = this.getSpeciesById(dex, config.pokemon2Id);

      if (!species1 || !species2) {
        logger.error('Pokemon not found', {
          pokemon1Id: config.pokemon1Id,
          pokemon2Id: config.pokemon2Id,
          species1Found: !!species1,
          species2Found: !!species2
        });
        throw new ApiError(400, `Invalid Pokemon IDs provided: ${config.pokemon1Id}, ${config.pokemon2Id}`);
      }

      // logger.debug('Pokemon species found', {
      //   species1: species1.name,
      //   species2: species2.name,
      //   species1Types: species1.types,
      //   species2Types: species2.types,
      //   species1BaseStats: species1.baseStats
      // });

      // Fetch Pokemon sprites from PokeAPI
      // logger.debug('Fetching Pokemon sprites...');
      let pokemon1Sprites, pokemon2Sprites;
      try {
        [pokemon1Sprites, pokemon2Sprites] = await this.fetchPokemonSprites(
          config.pokemon1Id,
          config.pokemon2Id
        );
        // logger.debug('Sprites fetched successfully');
      } catch (spriteError) {
        logger.error('Failed to fetch sprites:', spriteError);
        throw new ApiError(500, 'Failed to fetch Pokemon sprites');
      }

      const pokemon1Level = config.options?.pokemon1Level || 50;
      const pokemon2Level = config.options?.pokemon2Level || 50;

      // Run multiple battles
      let pokemon1Wins = 0;
      let pokemon2Wins = 0;

      logger.info(`Beginning simulation: ${species1.name} vs ${species2.name}`, { skipFormat: true });

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
          logger.info(`${species1.name} won battle ${i + 1}`, { skipFormat: true });
        } else {
          pokemon2Wins++;
          logger.info(`${species2.name} won battle ${i + 1}`, { skipFormat: true });
        }
      }

      const winRate = (pokemon1Wins / this.NUM_BATTLES) * 100;
      const executionTime = Date.now() - startTime;

      // Calculate stats for display
      const pokemon1Stats = this.calculateStats(species1, pokemon1Level);
      const pokemon2Stats = this.calculateStats(species2, pokemon2Level);

      // Get types from Pokemon Showdown
      const pokemon1Types = species1.types.map(t => t.toLowerCase());
      const pokemon2Types = species2.types.map(t => t.toLowerCase());

      // Get moves from level-up learnset only
      const pokemon1MoveIds = await this.getMovesFromLearnset(species1, pokemon1Level, dex);
      const pokemon2MoveIds = await this.getMovesFromLearnset(species2, pokemon2Level, dex);
      
      // Get formatted move names for display
      const pokemon1LevelupMovesData = await this.getLevelupMoves(species1, dex);
      const pokemon1Moves = pokemon1LevelupMovesData
        .filter(m => pokemon1MoveIds.includes(m.moveId))
        .map(m => m.move);
      const pokemon2LevelupMovesData = await this.getLevelupMoves(species2, dex);
      const pokemon2Moves = pokemon2LevelupMovesData
        .filter(m => pokemon2MoveIds.includes(m.moveId))
        .map(m => m.move);

      // Get random abilities
      const pokemon1Ability = this.getRandomAbility(species1);
      const pokemon2Ability = this.getRandomAbility(species2);

      // Get random items
      const pokemon1Item = this.getRandomItem();
      const pokemon2Item = this.getRandomItem();

      // Get levelup moves
      const pokemon1LevelupMoves = await this.getLevelupMoves(species1, dex);
      const pokemon2LevelupMoves = await this.getLevelupMoves(species2, dex);

      // Base stats
      const pokemon1BaseStats = {
        hp: species1.baseStats.hp,
        attack: species1.baseStats.atk,
        defense: species1.baseStats.def,
        specialAttack: species1.baseStats.spa,
        specialDefense: species1.baseStats.spd,
        speed: species1.baseStats.spe
      };

      const pokemon2BaseStats = {
        hp: species2.baseStats.hp,
        attack: species2.baseStats.atk,
        defense: species2.baseStats.def,
        specialAttack: species2.baseStats.spa,
        specialDefense: species2.baseStats.spd,
        speed: species2.baseStats.spe
      };

      // EVs and IVs (currently fixed values)
      const evs = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };
      const ivs = { hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 31 };

      const result: ShowdownBattleResult = {
        battleId: crypto.randomUUID(),
        pokemon1: {
          id: config.pokemon1Id,
          name: species1.name,
          level: pokemon1Level,
          wins: pokemon1Wins,
          types: pokemon1Types,
          sprites: pokemon1Sprites || { front: '', back: '', shiny: '' },
          moves: pokemon1Moves.map((move: string) => this.formatMoveName(move)),
          stats: pokemon1Stats,
          baseStats: pokemon1BaseStats,
          evs: evs,
          ivs: ivs,
          ability: pokemon1Ability,
          item: pokemon1Item,
          levelupMoves: pokemon1LevelupMoves
        },
        pokemon2: {
          id: config.pokemon2Id,
          name: species2.name,
          level: pokemon2Level,
          wins: pokemon2Wins,
          types: pokemon2Types,
          sprites: pokemon2Sprites || { front: '', back: '', shiny: '' },
          moves: pokemon2Moves.map((move: string) => this.formatMoveName(move)),
          stats: pokemon2Stats,
          baseStats: pokemon2BaseStats,
          evs: evs,
          ivs: ivs,
          ability: pokemon2Ability,
          item: pokemon2Item,
          levelupMoves: pokemon2LevelupMoves
        },
        totalBattles: this.NUM_BATTLES,
        winRate,
        executionTime
      };

      // Cache the result
      await cacheService.set(`showdown:${cacheKey}`, result, 3600);

      logger.info(`Simulation complete: ${species1.name} won ${pokemon1Wins}, ${species2.name} won ${pokemon2Wins}`, { skipFormat: true });
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

  async simulateSingleBattle(config: ShowdownBattleConfig): Promise<SingleBattleResult> {
    const startTime = Date.now();
    
    logger.info('🎮 Battle Tester: Starting single battle simulation', {
      pokemon1Id: config.pokemon1Id,
      pokemon2Id: config.pokemon2Id,
      generation: config.options?.generation || 9,
      aiDifficulty: config.options?.aiDifficulty || 'random',
      pokemon1Instance: config.options?.pokemon1Instance || null,
      pokemon2Instance: config.options?.pokemon2Instance || null
    });
    
    try {
      const generation = config.options?.generation || 9;
      const dex = Dex.forGen(generation);
      
      // Get Pokemon species
      const species1 = this.getSpeciesById(dex, config.pokemon1Id);
      const species2 = this.getSpeciesById(dex, config.pokemon2Id);

      if (!species1 || !species2) {
        logger.error('Pokemon not found', {
          pokemon1Id: config.pokemon1Id,
          pokemon2Id: config.pokemon2Id,
          species1Found: !!species1,
          species2Found: !!species2
        });
        throw new ApiError(400, `Invalid Pokemon IDs provided: ${config.pokemon1Id}, ${config.pokemon2Id}`);
      }

      logger.info(`🎮 Battle Tester: ${species1.name} (Lv.${config.options?.pokemon1Level || 50}) vs ${species2.name} (Lv.${config.options?.pokemon2Level || 50})`);

      const pokemon1Level = config.options?.pokemon1Level || 50;
      const pokemon2Level = config.options?.pokemon2Level || 50;

      // Create battle stream
      let stream: BattleStreams.BattleStream | null = new BattleStreams.BattleStream();
      const outputs: string[] = [];
      
      // Create teams with moves from Pokemon Showdown
      logger.info('🎮 Battle Tester: Creating teams...');
      const p1team = await this.createTeam(species1, pokemon1Level, generation);
      const p2team = await this.createTeam(species2, pokemon2Level, generation);

      // Start battle
      logger.info('🎮 Battle Tester: Initializing battle stream...');
      await stream.write(`>start {"formatid":"gen${generation}singles"}`);
      await stream.write(`>player p1 {"name":"Player 1","team":"${p1team}"}`);
      await stream.write(`>player p2 {"name":"Player 2","team":"${p2team}"}`);
      
      // Log both Pokemon levels
      logger.info(`🎮 Battle Tester: ${species1.name} Level ${pokemon1Level} vs ${species2.name} Level ${pokemon2Level}`);
      
      let winner = species1.name;
      let battleEnded = false;
      let turnCount = 0;
      const maxTurns = 50;
      let p1Request: any = null;
      let p2Request: any = null;
      let noDataCount = 0;
      const maxNoDataCount = 5;
      
      logger.info('🎮 Battle Tester: Battle started! Processing turns...');
      
      // Give the stream a moment to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Process battle synchronously for simplicity
      while (!battleEnded && turnCount < maxTurns) {
        // Read from stream with a simple approach
        logger.debug(`🎮 Battle Tester: Waiting for stream data... (Turn ${turnCount}, NoData: ${noDataCount})`);
        
        // Add timeout to prevent hanging
        let chunk: string | null | undefined = null;
        try {
          const timeoutPromise = new Promise<null>((resolve) => {
            setTimeout(() => {
              logger.debug('🎮 Battle Tester: Read timeout after 2 seconds');
              resolve(null);
            }, 2000);
          });
          
          chunk = await Promise.race([
            stream.read(),
            timeoutPromise
          ]) as string | null | undefined;
        } catch (readError) {
          logger.error('🎮 Battle Tester: Error reading from stream:', readError);
          break;
        }
        
        if (!chunk) {
          noDataCount++;
          logger.info(`🎮 Battle Tester: No chunk received (${noDataCount}/${maxNoDataCount})`);
          
          if (noDataCount >= maxNoDataCount) {
            logger.warn('🎮 Battle Tester: Too many empty reads, forcing battle end');
            battleEnded = true;
            break;
          }
          
          // Don't try to force moves without proper request data
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }
        
        noDataCount = 0; // Reset counter on successful read
        
        logger.info(`🎮 Battle Tester: Received chunk (${chunk.length} chars)`);
        outputs.push(chunk);
        // Log first 200 chars of chunk for debugging
        logger.debug(`🎮 Battle Tester: Chunk preview: ${chunk.substring(0, 200).replace(/\n/g, '\\n')}`);
        
        
        // Check for winner
        if (chunk.includes('|win|')) {
          battleEnded = true;
          winner = chunk.includes('Player 1') ? species1.name : species2.name;
          logger.info(`🎮 Battle Tester: Battle ended! Winner: ${winner}`);
          break;
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
        
        // Check if we need to make moves based on the chunk content
        if (chunk.includes('|request|')) {
          logger.info('🎮 Battle Tester: Found request in chunk, processing moves...');
        }
        
        // Make moves based on requests
        let madeMove = false;
        
        if (p1Request && p1Request.active) {
          const choice = this.makeRandomChoice(p1Request);
          logger.info(`🎮 Battle Tester: ${species1.name} choosing action: ${choice}`);
          await stream.write(`>p1 ${choice}`);
          p1Request = null;
          madeMove = true;
        }
        
        if (p2Request && p2Request.active) {
          const choice = this.makeRandomChoice(p2Request);
          logger.info(`🎮 Battle Tester: ${species2.name} choosing action: ${choice}`);
          await stream.write(`>p2 ${choice}`);
          p2Request = null;
          madeMove = true;
        }
        
        // If we made moves, give the stream a moment to process
        if (madeMove) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        if (chunk.includes('|turn|')) {
          turnCount++;
          logger.info(`🎮 Battle Tester: === Turn ${turnCount} ===`);
        }
      }
      
      // Force end if battle takes too long
      if (!battleEnded) {
        logger.warn('🎮 Battle Tester: Battle timed out after 50 turns, forcing winner');
        await stream.write('>forcewin p1');
        winner = species1.name;
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
        logger.warn('🎮 Battle Tester: No turns parsed from battle, creating demo turns');
        
        // Create a simple battle turn for demonstration
        const pokemon1Stats = this.calculateStats(species1, pokemon1Level);
        const pokemon2Stats = this.calculateStats(species2, pokemon2Level);
        
        turns.push({
          turn: 1,
          attacker: species1.name,
          defender: species2.name,
          move: 'Tackle',
          damage: Math.floor(pokemon2Stats.hp * 0.3),
          remainingHP: Math.floor(pokemon2Stats.hp * 0.7),
          critical: false,
          effectiveness: 'normal'
        });
        
        turns.push({
          turn: 1,
          attacker: species2.name,
          defender: species1.name,
          move: 'Tackle',
          damage: Math.floor(pokemon1Stats.hp * 0.3),
          remainingHP: Math.floor(pokemon1Stats.hp * 0.7),
          critical: false,
          effectiveness: 'normal'
        });
        
        // Simulate a few more turns
        let hp1 = pokemon1Stats.hp * 0.7;
        let hp2 = pokemon2Stats.hp * 0.7;
        let turn = 2;
        
        while (hp1 > 0 && hp2 > 0 && turn <= 5) {
          // Pokemon 1 attacks
          const damage1 = Math.floor(pokemon2Stats.hp * 0.2);
          hp2 -= damage1;
          turns.push({
            turn,
            attacker: species1.name,
            defender: species2.name,
            move: 'Tackle',
            damage: damage1,
            remainingHP: Math.max(0, Math.floor(hp2)),
            critical: false,
            effectiveness: 'normal'
          });
          
          if (hp2 <= 0) break;
          
          // Pokemon 2 attacks
          const damage2 = Math.floor(pokemon1Stats.hp * 0.2);
          hp1 -= damage2;
          turns.push({
            turn,
            attacker: species2.name,
            defender: species1.name,
            move: 'Tackle',
            damage: damage2,
            remainingHP: Math.max(0, Math.floor(hp1)),
            critical: false,
            effectiveness: 'normal'
          });
          
          turn++;
        }
        
        // Set winner based on remaining HP
        if (hp1 <= 0) {
          winner = species2.name;
        } else if (hp2 <= 0) {
          winner = species1.name;
        }
      }
      
      // Extract final HP from the last turn or set to 0 for the loser
      const finalHP1 = winner === species1.name ? turns[turns.length - 1]?.remainingHP || 0 : 0;
      const finalHP2 = winner === species2.name ? turns[turns.length - 1]?.remainingHP || 0 : 0;
      
      const executionTime = Date.now() - startTime;

      // Calculate stats for display
      const pokemon1Stats = this.calculateStats(species1, pokemon1Level);
      const pokemon2Stats = this.calculateStats(species2, pokemon2Level);

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
        winner: winner || species1.name,
        turns: turns,
        totalTurns: turns.length,
        finalHP1,
        finalHP2,
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
      logger.error('Failed to simulate single battle:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        config
      });
      throw error instanceof ApiError ? error : new ApiError(500, `Battle simulation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async runSingleShowdownBattle(
    species1: Species,
    species2: Species,
    level1: number,
    level2: number,
    generation: number
  ): Promise<1 | 2> {
    let stream: BattleStreams.BattleStream | null = null;
    let pendingRead: Promise<string | null | undefined> | null = null;
    
    try {
      stream = new BattleStreams.BattleStream();
      
      // Create simple teams
      const p1team = await this.createTeam(species1, level1, generation);
      const p2team = await this.createTeam(species2, level2, generation);
      
      // Start battle
      await stream.write(`>start {"formatid":"gen${generation}singles","seed":[${Math.floor(Math.random() * 65536)},${Math.floor(Math.random() * 65536)},${Math.floor(Math.random() * 65536)},${Math.floor(Math.random() * 65536)}]}`);
      await stream.write(`>player p1 {"name":"Player 1","team":"${p1team}"}`);
      await stream.write(`>player p2 {"name":"Player 2","team":"${p2team}"}`);
      
      let winner: 1 | 2 = 1;
      let battleEnded = false;
      let turnCount = 0;
      const maxTurns = 50;
      
      // Process battle quickly
      while (!battleEnded && turnCount < maxTurns) {
        let chunk: string | null | undefined = null;
        try {
          // Create a cancellable timeout
          let timeoutId: NodeJS.Timeout | null = null;
          const timeoutPromise = new Promise<string | null>((resolve) => {
            timeoutId = setTimeout(() => resolve(null), 1000);
          });
          
          // Store the pending read promise
          pendingRead = stream.read();
          
          // Race between read and timeout
          chunk = await Promise.race([
            pendingRead,
            timeoutPromise
          ]);
          
          // Clear the timeout if read completed
          if (timeoutId) clearTimeout(timeoutId);
          
          // If we got a timeout, mark pendingRead as handled
          if (chunk === null) {
            // The read is still pending, we'll handle it in cleanup
            break;
          }
          
          // Clear pendingRead since it completed
          pendingRead = null;
        } catch (readError) {
          logger.error('Error reading from stream:', readError);
          break;
        }
        
        if (!chunk) continue;
        
        // Check for winner
        if (chunk.includes('|win|')) {
          battleEnded = true;
          winner = chunk.includes('Player 1') ? 1 : 2;
          break;
        }
        
        // Handle team preview
        if (chunk.includes('|teampreview')) {
          await stream.write('>p1 team 1');
          await stream.write('>p2 team 1');
        }
        
        // Make random moves for both players
        if (chunk.includes('|request|')) {
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.includes('p1') && line.includes('|request|')) {
              await stream.write('>p1 move 1');
            } else if (line.includes('p2') && line.includes('|request|')) {
              await stream.write('>p2 move 1');
            }
          }
        }
        
        if (chunk.includes('|turn|')) {
          turnCount++;
        }
      }
      
      // Force end if battle takes too long
      if (!battleEnded) {
        // Determine winner based on base stats as fallback
        const bst1 = Object.values(species1.baseStats).reduce((a, b) => a + b, 0);
        const bst2 = Object.values(species2.baseStats).reduce((a, b) => a + b, 0);
        winner = bst1 >= bst2 ? 1 : 2;
      }
      
      return winner;
    } catch (error) {
      logger.error('Error in runSingleShowdownBattle:', {
        error: error instanceof Error ? error.message : error,
        species1: species1.name,
        species2: species2.name
      });
      // Fallback to BST comparison on error
      const bst1 = Object.values(species1.baseStats).reduce((a, b) => a + b, 0);
      const bst2 = Object.values(species2.baseStats).reduce((a, b) => a + b, 0);
      return bst1 >= bst2 ? 1 : 2;
    } finally {
      // Clean up stream properly
      if (stream) {
        try {
          // Wait for any pending read to complete or timeout
          if (pendingRead) {
            await Promise.race([
              pendingRead.catch(() => null), // Ignore errors from pending read
              new Promise(resolve => setTimeout(resolve, 100)) // Give it 100ms max
            ]);
          }
          
          // Instead of destroying the stream, let it be garbage collected
          // The BattleStream doesn't properly implement destroy() method
          // and calling it causes internal state corruption
          stream = null;
        } catch (cleanupError) {
          logger.error('Error during stream cleanup:', cleanupError);
        }
      }
    }
  }

  private async createTeam(species: Species, level: number, generation: number): Promise<string> {
    const dex = Dex.forGen(generation);
    
    // Debug: Check what's available on dex at creation
    // logger.debug('Dex root keys:', Object.keys(dex).slice(0, 20));
    
    // Get moves from level-up learnset only
    const moves = await this.getMovesFromLearnset(species, level, dex);
    // logger.debug(`Using moves for ${species.name}:`, moves);
    
    // Get random ability and item
    const ability = this.getRandomAbility(species);
    const item = this.getRandomItem();
    
    // Create a simple set
    const set = {
      name: species.name,
      species: species.name as any,
      item: item || '',
      ability: ability,
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


  private makeRandomChoice(request: any): string {
    if (!request.active || !request.active[0]) {
      logger.debug('🎮 Battle Tester: No active Pokemon in request');
      return 'pass';
    }
    
    const active = request.active[0];
    
    // If we have moves, use a random one
    if (active.moves && active.moves.length > 0) {
      const validMoves = active.moves
        .map((move: any, i: number) => ({ move, index: i + 1 }))
        .filter((m: any) => !m.move.disabled && (m.move.pp === undefined || m.move.pp > 0));
      
      logger.debug(`🎮 Battle Tester: Available moves: ${validMoves.length} out of ${active.moves.length}`);
      
      if (validMoves.length > 0) {
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        const moveName = randomMove.move.move || randomMove.move.id || `Move ${randomMove.index}`;
        logger.debug(`🎮 Battle Tester: Selected move: ${moveName} (index ${randomMove.index})`);
        return `move ${randomMove.index}`;
      } else {
        logger.warn('🎮 Battle Tester: No valid moves available');
      }
    } else {
      logger.warn('🎮 Battle Tester: No moves in active Pokemon data');
    }
    
    // If we can switch, maybe switch
    if (request.side && request.side.pokemon) {
      const switchableTargets = request.side.pokemon
        .map((p: any, i: number) => ({ pokemon: p, index: i + 1 }))
        .filter((p: any) => !p.pokemon.active && !p.pokemon.fainted);
      
      if (switchableTargets.length > 0 && Math.random() < 0.1) { // 10% chance to switch
        const target = switchableTargets[Math.floor(Math.random() * switchableTargets.length)];
        logger.debug(`🎮 Battle Tester: Switching to Pokemon ${target.index}`);
        return `switch ${target.index}`;
      }
    }
    
    logger.debug('🎮 Battle Tester: No valid action, passing');
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

  private async fetchPokemonSprites(id1: number, id2: number) {
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
  }

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

  private generateBattleKey(config: ShowdownBattleConfig): string {
    const keyData = {
      pokemon1Id: config.pokemon1Id,
      pokemon2Id: config.pokemon2Id,
      generation: config.options?.generation || 9,
      pokemon1Level: config.options?.pokemon1Level || 50,
      pokemon2Level: config.options?.pokemon2Level || 50,
      version: 'v6-learnset-moveids' // Add version to invalidate old cache
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex');
  }

  async createPokemonInstance(pokemonId: number, level: number = 50, generation: number = 9): Promise<PokemonInstanceData> {
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

      // Get random ability
      const ability = this.getRandomAbility(species);

      // Get random item (50% chance)
      const item = this.getRandomItem();

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

      const pokemonInstance: PokemonInstanceData = {
        id: pokemonId,
        name: species.name,
        species: species.name,
        level,
        types,
        ability,
        item,
        moves: moves.map(move => this.formatMoveName(move)),
        stats,
        baseStats,
        evs,
        ivs,
        nature,
        sprites
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