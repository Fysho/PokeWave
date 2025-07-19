import { Request, Response } from 'express';
import { pokemonService } from '../services/pokemon.service';
import { Dex } from '@pkmn/dex';
import logger from '../utils/logger';
import { ApiError } from '../middleware/error.middleware';

interface StatValues {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

interface PokemonInstanceRequest extends Request {
  body: {
    pokemonId: number;
    level: number;
    ivs?: Partial<StatValues>;
    evs?: Partial<StatValues>;
    generation?: number;
  };
}

interface PokemonInstanceResponse {
  id: number;
  name: string;
  level: number;
  types: string[];
  ability: string;
  moves: string[];
  stats: StatValues;
  baseStats: StatValues;
  ivs: StatValues;
  evs: StatValues;
  sprites: {
    front: string;
    back: string;
    shiny: string;
  };
}

export const getPokemonInstance = async (req: PokemonInstanceRequest, res: Response) => {
  try {
    const { pokemonId, level, ivs = {}, evs = {}, generation = 9 } = req.body;

    // Validate input
    if (!pokemonId || typeof pokemonId !== 'number' || pokemonId < 1) {
      throw new ApiError(400, 'Invalid Pokemon ID');
    }

    if (!level || typeof level !== 'number' || level < 1 || level > 100) {
      throw new ApiError(400, 'Invalid level. Must be between 1 and 100');
    }

    if (generation < 1 || generation > 9) {
      throw new ApiError(400, 'Invalid generation. Must be between 1 and 9');
    }

    logger.info('Creating Pokemon instance', { pokemonId, level, generation });

    // Initialize Dex for the specified generation
    const dex = Dex.forGen(generation);
    
    // Get Pokemon species data
    const species = getSpeciesById(dex, pokemonId);
    
    if (!species) {
      throw new ApiError(404, `Pokemon with ID ${pokemonId} not found`);
    }

    // Get sprites from PokeAPI
    const sprites = await pokemonService.getPokemonSprites(pokemonId);

    // Set default IVs (31 for all stats if not provided)
    const finalIvs: StatValues = {
      hp: ivs.hp ?? 31,
      attack: ivs.attack ?? 31,
      defense: ivs.defense ?? 31,
      specialAttack: ivs.specialAttack ?? 31,
      specialDefense: ivs.specialDefense ?? 31,
      speed: ivs.speed ?? 31
    };

    // Set default EVs (0 for all stats if not provided)
    const finalEvs: StatValues = {
      hp: evs.hp ?? 0,
      attack: evs.attack ?? 0,
      defense: evs.defense ?? 0,
      specialAttack: evs.specialAttack ?? 0,
      specialDefense: evs.specialDefense ?? 0,
      speed: evs.speed ?? 0
    };

    // Validate IVs (0-31)
    for (const [stat, value] of Object.entries(finalIvs)) {
      if (value < 0 || value > 31) {
        throw new ApiError(400, `Invalid IV for ${stat}. Must be between 0 and 31`);
      }
    }

    // Validate EVs (0-252 per stat, max 510 total)
    let totalEvs = 0;
    for (const [stat, value] of Object.entries(finalEvs)) {
      if (value < 0 || value > 252) {
        throw new ApiError(400, `Invalid EV for ${stat}. Must be between 0 and 252`);
      }
      totalEvs += value;
    }
    
    if (totalEvs > 510) {
      throw new ApiError(400, 'Total EVs cannot exceed 510');
    }

    // Calculate actual stats
    const calculatedStats = calculateStats(species, level, finalIvs, finalEvs);

    // Get random ability
    const ability = getRandomAbility(species);

    // Get the 4 highest level moves the Pokemon can learn at this level
    const moves = getTopFourMoves(species, level, dex, generation);

    // Format base stats
    const baseStats: StatValues = {
      hp: species.baseStats.hp,
      attack: species.baseStats.atk,
      defense: species.baseStats.def,
      specialAttack: species.baseStats.spa,
      specialDefense: species.baseStats.spd,
      speed: species.baseStats.spe
    };

    // Format types
    const types = species.types.map((t: string) => t.toLowerCase());

    const response: PokemonInstanceResponse = {
      id: pokemonId,
      name: species.name,
      level,
      types,
      ability,
      moves,
      stats: calculatedStats,
      baseStats,
      ivs: finalIvs,
      evs: finalEvs,
      sprites: sprites || { front: '', back: '', shiny: '' }
    };

    logger.info('Successfully created Pokemon instance', { 
      pokemonName: species.name,
      level,
      ability,
      moveCount: moves.length 
    });

    res.json(response);
  } catch (error) {
    logger.error('Failed to create Pokemon instance:', error);
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create Pokemon instance' });
    }
  }
};

// Helper function to calculate stats with IVs and EVs
function calculateStats(species: any, level: number, ivs: StatValues, evs: StatValues): StatValues {
  // Pokemon stat calculation formula
  const calculateStat = (baseStat: number, iv: number, ev: number, isHP: boolean = false): number => {
    if (isHP) {
      // HP calculation is different
      if (species.name === 'Shedinja') return 1; // Shedinja always has 1 HP
      return Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * level / 100) + level + 10);
    }
    // Other stats calculation
    const nature = 1.0; // Neutral nature for simplicity
    return Math.floor((((2 * baseStat + iv + Math.floor(ev / 4)) * level / 100) + 5) * nature);
  };

  return {
    hp: calculateStat(species.baseStats.hp, ivs.hp, evs.hp, true),
    attack: calculateStat(species.baseStats.atk, ivs.attack, evs.attack),
    defense: calculateStat(species.baseStats.def, ivs.defense, evs.defense),
    specialAttack: calculateStat(species.baseStats.spa, ivs.specialAttack, evs.specialAttack),
    specialDefense: calculateStat(species.baseStats.spd, ivs.specialDefense, evs.specialDefense),
    speed: calculateStat(species.baseStats.spe, ivs.speed, evs.speed)
  };
}

// Helper function to get species by ID
function getSpeciesById(dex: any, id: number): any {
  try {
    // Try by national dex number first
    const allSpecies = dex.species.all();
    const found = allSpecies.find((s: any) => s.num === id);
    if (found) return found;
    
    // Fallback to trying by ID string
    const species = dex.species.get(String(id));
    if (species && species.exists) return species;
    
    return null;
  } catch (error) {
    logger.error('Error getting species by ID:', { id, error });
    return null;
  }
}

// Helper function to get a random ability
function getRandomAbility(species: any): string {
  const abilities = [];
  
  if (species.abilities) {
    // Add all available abilities to the pool
    if (species.abilities['0']) abilities.push(species.abilities['0']);
    if (species.abilities['1']) abilities.push(species.abilities['1']);
    if (species.abilities['H']) abilities.push(species.abilities['H']);
  }
  
  // If no abilities found, return a default
  if (abilities.length === 0) {
    return 'Pressure';
  }
  
  // Return a random ability from all available
  return abilities[Math.floor(Math.random() * abilities.length)];
}

// Helper function to get the top 4 moves by level
function getTopFourMoves(species: any, level: number, dex: any, generation: number): string[] {
  const levelupMoves = getLevelUpMovesForGeneration(species, dex, generation);
  
  // Filter moves that can be learned at or below the current level
  const availableMoves = levelupMoves.filter(move => move.level <= level);
  
  if (availableMoves.length === 0) {
    logger.warn(`No moves found for ${species.name} at level ${level}`);
    return [];
  }
  
  // Sort by level (descending) to get the most recently learned moves
  availableMoves.sort((a, b) => b.level - a.level);
  
  // Take the top 4 moves
  const topMoves = availableMoves.slice(0, 4);
  
  // Return just the move names
  return topMoves.map(move => move.move);
}

// Helper function to get level-up moves for a specific generation
function getLevelUpMovesForGeneration(species: any, dex: any, generation: number): Array<{ level: number; move: string }> {
  const levelupMoves: Array<{ level: number; move: string }> = [];
  
  try {
    // Load learnsets data
    const learnsets = require('@pkmn/dex/build/learnsets-DJNGQKWY.js').default;
    const allLearnsets = learnsets['9']; // Gen 9 contains complete move data
    
    const learnsetData = allLearnsets[species.id];
    
    if (!learnsetData || !learnsetData.learnset) {
      logger.warn(`No learnset data found for ${species.name} (ID: ${species.id})`);
      return [];
    }
    
    // Process all moves from the learnset
    for (const [moveName, learnData] of Object.entries(learnsetData.learnset)) {
      if (Array.isArray(learnData)) {
        for (const learnMethod of learnData) {
          // Format is like "8L1" (Gen 8, Level 1) or "7L45" (Gen 7, Level 45)
          const match = learnMethod.match(/^(\d+)L(\d+)$/);
          if (match) {
            const moveGen = parseInt(match[1]);
            const level = parseInt(match[2]);
            
            // Include moves from the requested generation and earlier
            // For Gen 1, also include moves from later gens since data might be missing
            if (moveGen <= generation || (generation === 1 && moveGen <= 3)) {
              const move = dex.moves.get(moveName);
              if (move && move.exists) {
                // For older generations, check if the move actually exists in that generation
                // Special handling for Gen 1 - many moves don't have explicit Gen 1 data
                if (generation === 1 && move.num && move.num > 165) {
                  continue; // Skip moves that don't exist in Gen 1
                } else if (generation > 1 && move.gen && generation < move.gen) {
                  continue; // Skip moves that don't exist in the requested generation
                }
                
                // Check if we already have this move at a different level
                const existingMove = levelupMoves.find(m => m.move === formatMoveName(move.name));
                if (!existingMove) {
                  levelupMoves.push({ 
                    level, 
                    move: formatMoveName(move.name)
                  });
                } else if (level < existingMove.level) {
                  // Update to the earliest level this move is learned
                  existingMove.level = level;
                }
              }
            }
          }
        }
      }
    }
    
    // Sort by level
    levelupMoves.sort((a, b) => a.level - b.level);
    
  } catch (error) {
    logger.error('Error getting level-up moves:', { 
      species: species.name,
      generation,
      error: error instanceof Error ? error.message : error 
    });
  }
  
  return levelupMoves;
}

// Helper function to format move names
function formatMoveName(move: string): string {
  // Convert from camelCase or lowercase to Title Case
  return move
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
    .replace(/\s+/g, ' ');
}