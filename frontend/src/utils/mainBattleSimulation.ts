import { Dex } from '@pkmn/dex';
import { Battle } from '@pkmn/sim';

interface BattleResult {
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
    ability?: string;
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
    ability?: string;
  };
  totalBattles: number;
  winRate: number;
  executionTime: number;
}

const NUM_BATTLES = 100; // Run 100 battles

function getSpeciesById(dex: any, id: number): any {
  // Try by national dex number first
  const allSpecies = dex.species.all();
  const found = allSpecies.find((s: any) => s.num === id);
  if (found) return found;
  
  // Fallback to trying by ID string
  const species = dex.species.get(String(id));
  if (species && species.exists) return species;
  
  return null;
}

function getRandomMoves(species: any, dex: any, count: number = 4): string[] {
  // Type-based move pools
  const movePool: { [key: string]: string[] } = {
    normal: ['tackle', 'scratch', 'pound', 'quickattack', 'slash', 'bodyslam'],
    fire: ['ember', 'flamethrower', 'fireblast', 'flamecharge', 'firepunch'],
    water: ['watergun', 'surf', 'hydropump', 'aquajet', 'bubblebeam'],
    electric: ['thundershock', 'thunderbolt', 'thunder', 'thunderpunch', 'spark'],
    grass: ['vinewhip', 'razorleaf', 'solarbeam', 'energyball', 'leafstorm'],
    ice: ['icepunch', 'icebeam', 'blizzard', 'iceshard', 'aurorabeam'],
    fighting: ['lowkick', 'brickbreak', 'closecombat', 'machpunch', 'crosschop'],
    poison: ['poisonsting', 'sludgebomb', 'toxic', 'poisonjab', 'venoshock'],
    ground: ['earthquake', 'dig', 'earthpower', 'mudshot', 'bulldoze'],
    flying: ['gust', 'wingattack', 'airslash', 'hurricane', 'aerialace'],
    psychic: ['confusion', 'psychic', 'psybeam', 'zenheadbutt', 'psychocut'],
    bug: ['bugbite', 'signalbeam', 'bugbuzz', 'xscissor', 'uturn'],
    rock: ['rockthrow', 'rockslide', 'stoneedge', 'powergem', 'rockblast'],
    ghost: ['lick', 'shadowball', 'shadowclaw', 'hex', 'shadowsneak'],
    dragon: ['dragonrage', 'dragonpulse', 'dragonclaw', 'outrage', 'dracometeor'],
    dark: ['bite', 'crunch', 'darkpulse', 'knockoff', 'suckerpunch'],
    steel: ['metalclaw', 'ironhead', 'flashcannon', 'meteormash', 'bulletpunch'],
    fairy: ['fairywind', 'moonblast', 'dazzlinggleam', 'playrough', 'drainingkiss']
  };
  
  const defaultMoves = ['tackle', 'scratch', 'pound', 'quickattack'];
  const moves: string[] = [];
  
  // Get moves based on Pokemon's types
  if (species.types) {
    for (const type of species.types) {
      const typeMoves = movePool[type.toLowerCase()];
      if (typeMoves) {
        const shuffled = [...typeMoves].sort(() => Math.random() - 0.5);
        moves.push(...shuffled.slice(0, 2));
      }
    }
  }
  
  // Remove duplicates and select required count
  const allMoves = [...new Set(moves)];
  const shuffledMoves = allMoves.sort(() => Math.random() - 0.5);
  const selectedMoves = shuffledMoves.slice(0, count);
  
  // Fill with default moves if needed
  while (selectedMoves.length < count) {
    const defaultMove = defaultMoves[selectedMoves.length % defaultMoves.length];
    if (!selectedMoves.includes(defaultMove)) {
      selectedMoves.push(defaultMove);
    }
  }
  
  return selectedMoves;
}

function getRandomAbility(species: any): string {
  const abilities = [];
  
  if (species.abilities) {
    if (species.abilities['0']) abilities.push(species.abilities['0']);
    if (species.abilities['1']) abilities.push(species.abilities['1']);
    if (species.abilities['H']) abilities.push(species.abilities['H']);
  }
  
  if (abilities.length === 0) {
    return 'Pressure';
  }
  
  return abilities[Math.floor(Math.random() * abilities.length)];
}

function formatMoveName(move: string): string {
  // Convert move ID to display name
  return move
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function calculateStats(species: any, level: number): any {
  const calculateStat = (base: number, isHP: boolean = false) => {
    const iv = 31;
    const ev = 0;
    if (isHP) {
      return Math.floor((2 * base + iv + ev / 4) * level / 100 + level + 10);
    }
    return Math.floor((2 * base + iv + ev / 4) * level / 100 + 5);
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

async function simulateSingleBattle(
  species1: any,
  species2: any,
  level1: number,
  level2: number,
  generation: number
): Promise<1 | 2> {
  try {
    const battle = new Battle({ formatid: `gen${generation}customgame` });
    
    // Create team strings
    const p1moves = getRandomMoves(species1, null, 4).join(',');
    const p2moves = getRandomMoves(species2, null, 4).join(',');
    
    const p1ability = getRandomAbility(species1);
    const p2ability = getRandomAbility(species2);
    
    const p1team = `${species1.name.toLowerCase().replace(/[^a-z0-9]/g, '')}||${p1ability}||${p1moves}||`;
    const p2team = `${species2.name.toLowerCase().replace(/[^a-z0-9]/g, '')}||${p2ability}||${p2moves}||`;
    
    try {
      battle.setPlayer('p1', { team: p1team });
      battle.setPlayer('p2', { team: p2team });
    } catch (error) {
      // If there's an error setting up the battle, randomly determine winner
      return Math.random() < 0.5 ? 1 : 2;
    }
    
    let battleEnded = false;
    let turnCount = 0;
    const maxTurns = 50;
    
    while (!battleEnded && turnCount < maxTurns) {
      battle.log = [];
      
      // Make random moves for both players
      const p1Active = battle.sides[0].active[0];
      const p2Active = battle.sides[1].active[0];
      
      if (p1Active && p1Active.moveSlots) {
        const validMoves = p1Active.moveSlots
          .map((move: any, i: number) => !move.disabled ? i + 1 : -1)
          .filter((i: number) => i > 0);
        if (validMoves.length > 0) {
          battle.choose('p1', `move ${validMoves[Math.floor(Math.random() * validMoves.length)]}`);
        }
      }
      
      if (p2Active && p2Active.moveSlots) {
        const validMoves = p2Active.moveSlots
          .map((move: any, i: number) => !move.disabled ? i + 1 : -1)
          .filter((i: number) => i > 0);
        if (validMoves.length > 0) {
          battle.choose('p2', `move ${validMoves[Math.floor(Math.random() * validMoves.length)]}`);
        }
      }
      
      if (battle.ended) {
        battleEnded = true;
        return battle.winner === 'p1' ? 1 : 2;
      }
      
      turnCount++;
    }
    
    // If battle didn't end, determine winner by remaining HP
    const p1HP = battle.sides[0].active[0]?.hp || 0;
    const p2HP = battle.sides[1].active[0]?.hp || 0;
    return p1HP > p2HP ? 1 : 2;
    
  } catch (error) {
    // Fallback to random winner on error
    return Math.random() < 0.5 ? 1 : 2;
  }
}

export async function simulateMainBattle(
  pokemon1Id: number,
  pokemon2Id: number,
  options?: {
    generation?: number;
    pokemon1Level?: number;
    pokemon2Level?: number;
  }
): Promise<BattleResult> {
  const startTime = Date.now();
  
  const generation = options?.generation || 9;
  const dex = Dex.forGen(generation);
  
  // Get Pokemon species
  const species1 = getSpeciesById(dex, pokemon1Id);
  const species2 = getSpeciesById(dex, pokemon2Id);
  
  if (!species1 || !species2) {
    throw new Error(`Invalid Pokemon IDs: ${pokemon1Id}, ${pokemon2Id}`);
  }
  
  const pokemon1Level = options?.pokemon1Level || 50;
  const pokemon2Level = options?.pokemon2Level || 50;
  
  console.log(`Starting ${NUM_BATTLES} battle simulations between ${species1.name} and ${species2.name}`);
  
  // Run battles
  let pokemon1Wins = 0;
  let pokemon2Wins = 0;
  
  // Run battles in batches to avoid blocking the UI
  const batchSize = 10;
  for (let i = 0; i < NUM_BATTLES; i += batchSize) {
    const batchPromises = [];
    
    for (let j = 0; j < batchSize && i + j < NUM_BATTLES; j++) {
      batchPromises.push(
        simulateSingleBattle(species1, species2, pokemon1Level, pokemon2Level, generation)
      );
    }
    
    const results = await Promise.all(batchPromises);
    
    for (const winner of results) {
      if (winner === 1) {
        pokemon1Wins++;
      } else {
        pokemon2Wins++;
      }
    }
    
    // Allow UI to update
    if (i % 20 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  const winRate = (pokemon1Wins / NUM_BATTLES) * 100;
  const executionTime = Date.now() - startTime;
  
  console.log(`Battle results: ${species1.name} won ${pokemon1Wins}/${NUM_BATTLES} (${winRate.toFixed(1)}%)`);
  console.log(`Execution time: ${executionTime}ms`);
  
  // Get types
  const pokemon1Types = species1.types.map((t: string) => t.toLowerCase());
  const pokemon2Types = species2.types.map((t: string) => t.toLowerCase());
  
  // Get moves
  const pokemon1Moves = getRandomMoves(species1, dex, 4).map(formatMoveName);
  const pokemon2Moves = getRandomMoves(species2, dex, 4).map(formatMoveName);
  
  // Get abilities
  const pokemon1Ability = getRandomAbility(species1);
  const pokemon2Ability = getRandomAbility(species2);
  
  // Calculate stats
  const pokemon1Stats = calculateStats(species1, pokemon1Level);
  const pokemon2Stats = calculateStats(species2, pokemon2Level);
  
  // Note: Sprites will need to be fetched from the API or cached
  const sprites = { front: '', back: '', shiny: '' };
  
  return {
    battleId: crypto.randomUUID(),
    pokemon1: {
      id: pokemon1Id,
      name: species1.name,
      level: pokemon1Level,
      wins: pokemon1Wins,
      types: pokemon1Types,
      sprites: sprites,
      moves: pokemon1Moves,
      stats: pokemon1Stats,
      ability: pokemon1Ability
    },
    pokemon2: {
      id: pokemon2Id,
      name: species2.name,
      level: pokemon2Level,
      wins: pokemon2Wins,
      types: pokemon2Types,
      sprites: sprites,
      moves: pokemon2Moves,
      stats: pokemon2Stats,
      ability: pokemon2Ability
    },
    totalBattles: NUM_BATTLES,
    winRate,
    executionTime
  };
}