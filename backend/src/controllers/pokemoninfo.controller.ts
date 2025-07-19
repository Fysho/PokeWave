import { Request, Response } from 'express';
import { pokemonService } from '../services/pokemon.service';
import { Dex } from '@pkmn/dex';
import logger from '../utils/logger';
import { ApiError } from '../middleware/error.middleware';

interface PokemonInfoRequest extends Request {
  params: {
    id: string;
  };
  query: {
    generation?: string;
  };
}

interface PokemonInfoResponse {
  id: number;
  name: string;
  types: string[];
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  abilities: {
    primary: string;
    secondary?: string;
    hidden?: string;
  };
  levelUpMoves: Array<{
    level: number;
    move: string;
  }>;
  sprites: {
    front: string;
    back: string;
    shiny: string;
  };
  generation: number;
}

export const getPokemonInfo = async (req: PokemonInfoRequest, res: Response) => {
  try {
    const pokemonId = parseInt(req.params.id, 10);
    const generation = parseInt(req.query.generation || '9', 10);

    if (isNaN(pokemonId) || pokemonId < 1) {
      throw new ApiError(400, 'Invalid Pokemon ID');
    }

    if (isNaN(generation) || generation < 1 || generation > 9) {
      throw new ApiError(400, 'Invalid generation. Must be between 1 and 9');
    }

    logger.info('Getting Pokemon info', { pokemonId, generation });

    // Initialize Dex for the specified generation
    const dex = Dex.forGen(generation);
    
    // Get Pokemon species data
    const species = getSpeciesById(dex, pokemonId);
    
    if (!species) {
      throw new ApiError(404, `Pokemon with ID ${pokemonId} not found`);
    }

    // Get sprites from PokeAPI
    const sprites = await pokemonService.getPokemonSprites(pokemonId);

    // Get abilities
    const abilities: PokemonInfoResponse['abilities'] = {
      primary: species.abilities['0'] || 'Unknown'
    };
    
    if (species.abilities['1']) {
      abilities.secondary = species.abilities['1'];
    }
    
    if (species.abilities['H']) {
      abilities.hidden = species.abilities['H'];
    }

    // Get level-up moves for the specified generation
    const levelUpMoves = await getLevelUpMovesForGeneration(species, dex, generation);

    // Format base stats
    const baseStats = {
      hp: species.baseStats.hp,
      attack: species.baseStats.atk,
      defense: species.baseStats.def,
      specialAttack: species.baseStats.spa,
      specialDefense: species.baseStats.spd,
      speed: species.baseStats.spe
    };

    // Format types
    const types = species.types.map((t: string) => t.toLowerCase());

    const response: PokemonInfoResponse = {
      id: pokemonId,
      name: species.name,
      types,
      baseStats,
      abilities,
      levelUpMoves,
      sprites: sprites || { front: '', back: '', shiny: '' },
      generation
    };

    logger.info('Successfully retrieved Pokemon info', { 
      pokemonName: species.name,
      moveCount: levelUpMoves.length,
      generation 
    });

    res.json(response);
  } catch (error) {
    logger.error('Failed to get Pokemon info:', error);
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get Pokemon information' });
    }
  }
};

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

// Helper function to get level-up moves for a specific generation
async function getLevelUpMovesForGeneration(species: any, dex: any, generation: number): Promise<Array<{ level: number; move: string }>> {
  const levelupMoves: Array<{ level: number; move: string }> = [];
  
  try {
    // Get learnset data using the Dex API
    const learnsetData = await dex.learnsets.get(species.id);
    
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
    
    logger.info(`Found ${levelupMoves.length} level-up moves for ${species.name} in Gen ${generation}`);
    
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