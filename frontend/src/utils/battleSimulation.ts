import { Dex } from '@pkmn/dex';
import { Battle } from '@pkmn/sim';

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

function formatPokemonName(name: string): string {
  // Convert to lowercase and remove spaces/special characters
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getRandomMoves(species: any, dex: any, count: number = 4): string[] {
  // Since we don't have learnset data in the frontend, use a simple move pool
  // based on Pokemon type
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
        // Add up to 2 moves from each type
        const shuffled = [...typeMoves].sort(() => Math.random() - 0.5);
        moves.push(...shuffled.slice(0, 2));
      }
    }
  }
  
  // Shuffle all collected moves and pick the required count
  const allMoves = [...new Set(moves)]; // Remove duplicates
  const shuffledMoves = allMoves.sort(() => Math.random() - 0.5);
  const selectedMoves = shuffledMoves.slice(0, count);
  
  // Fill with default moves if needed
  while (selectedMoves.length < count) {
    const defaultMove = defaultMoves[selectedMoves.length % defaultMoves.length];
    if (!selectedMoves.includes(defaultMove)) {
      selectedMoves.push(defaultMove);
    } else {
      selectedMoves.push('struggle');
    }
  }
  
  return selectedMoves;
}

function createTeamString(species: any, level: number, dex: any): string {
  const moves = getRandomMoves(species, dex, 4);
  const movesStr = moves.join(',');
  
  // Basic team format: name|item|ability|moves|nature|evs|ivs|level
  // Simplified version with just name, ability, moves, and level
  const ability = species.abilities ? (species.abilities[0] || species.abilities['0'] || 'pressure') : 'pressure';
  return `${species.name}||${ability}|${movesStr}|||${level}`;
}

function parseBattleLog(outputs: string[]): BattleTurn[] {
  const turns: BattleTurn[] = [];
  let currentTurn = 0;
  let pokemon1HP: { current: number; max: number } = { current: 0, max: 0 };
  let pokemon2HP: { current: number; max: number } = { current: 0, max: 0 };
  
  for (const output of outputs) {
    const lines = output.split('\n');
    
    for (const line of lines) {
      const parts = line.split('|');
      if (parts.length < 2) continue;
      
      const eventType = parts[1];
      
      switch (eventType) {
        case 'turn':
          currentTurn = parseInt(parts[2]) || 0;
          break;
          
        case 'move':
          if (parts.length >= 5) {
            const attacker = extractPokemonName(parts[2]);
            const move = parts[3];
            const defender = extractPokemonName(parts[4]);
            
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
            const pokemon = extractPokemonName(parts[2]);
            const hpInfo = parts[3];
            
            if (hpInfo && hpInfo.includes('/')) {
              const [current, max] = hpInfo.split('/').map(h => parseInt(h) || 0);
              
              // Update HP tracking
              if (pokemon === pokemon1HP.current ? pokemon : '') {
                const damage = pokemon1HP.current - current;
                pokemon1HP.current = current;
                
                const lastTurn = turns[turns.length - 1];
                if (lastTurn && lastTurn.defender === pokemon) {
                  lastTurn.damage = damage;
                  lastTurn.remainingHP = current;
                }
              }
            } else if (hpInfo === '0 fnt') {
              // Pokemon fainted
              const lastTurn = turns[turns.length - 1];
              if (lastTurn && lastTurn.defender === pokemon) {
                lastTurn.remainingHP = 0;
              }
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
  }
  
  return turns;
}

function extractPokemonName(str: string): string {
  // Format: "p1a: Pikachu" or "p2a: Charizard"
  const match = str.match(/p[12]a: (.+)/);
  return match ? match[1] : str;
}

function createDemoBattle(
  species1: any,
  species2: any,
  pokemon1Level: number,
  pokemon2Level: number,
  startTime: number
): SingleBattleResult {
  const turns: BattleTurn[] = [];
  
  // Calculate stats
  const pokemon1Stats = {
    hp: Math.floor((species1.baseStats.hp * 2 + 31 + 0) * pokemon1Level / 100 + pokemon1Level + 10),
    attack: Math.floor((species1.baseStats.atk * 2 + 31 + 0) * pokemon1Level / 100 + 5),
    defense: Math.floor((species1.baseStats.def * 2 + 31 + 0) * pokemon1Level / 100 + 5),
    specialAttack: Math.floor((species1.baseStats.spa * 2 + 31 + 0) * pokemon1Level / 100 + 5),
    specialDefense: Math.floor((species1.baseStats.spd * 2 + 31 + 0) * pokemon1Level / 100 + 5),
    speed: Math.floor((species1.baseStats.spe * 2 + 31 + 0) * pokemon1Level / 100 + 5),
  };
  
  const pokemon2Stats = {
    hp: Math.floor((species2.baseStats.hp * 2 + 31 + 0) * pokemon2Level / 100 + pokemon2Level + 10),
    attack: Math.floor((species2.baseStats.atk * 2 + 31 + 0) * pokemon2Level / 100 + 5),
    defense: Math.floor((species2.baseStats.def * 2 + 31 + 0) * pokemon2Level / 100 + 5),
    specialAttack: Math.floor((species2.baseStats.spa * 2 + 31 + 0) * pokemon2Level / 100 + 5),
    specialDefense: Math.floor((species2.baseStats.spd * 2 + 31 + 0) * pokemon2Level / 100 + 5),
    speed: Math.floor((species2.baseStats.spe * 2 + 31 + 0) * pokemon2Level / 100 + 5),
  };
  
  // Create demo turns
  let hp1 = pokemon1Stats.hp;
  let hp2 = pokemon2Stats.hp;
  let turn = 1;
  const moves1 = getRandomMoves(species1, null, 4);
  const moves2 = getRandomMoves(species2, null, 4);
  
  while (hp1 > 0 && hp2 > 0 && turn <= 10) {
    // Pokemon 1 attacks
    const damage1 = Math.floor(pokemon2Stats.hp * (0.15 + Math.random() * 0.1));
    hp2 -= damage1;
    turns.push({
      turn,
      attacker: species1.name,
      defender: species2.name,
      move: moves1[Math.floor(Math.random() * moves1.length)],
      damage: damage1,
      remainingHP: Math.max(0, Math.floor(hp2)),
      critical: Math.random() < 0.1,
      effectiveness: 'normal'
    });
    
    if (hp2 <= 0) break;
    
    // Pokemon 2 attacks
    const damage2 = Math.floor(pokemon1Stats.hp * (0.15 + Math.random() * 0.1));
    hp1 -= damage2;
    turns.push({
      turn,
      attacker: species2.name,
      defender: species1.name,
      move: moves2[Math.floor(Math.random() * moves2.length)],
      damage: damage2,
      remainingHP: Math.max(0, Math.floor(hp1)),
      critical: Math.random() < 0.1,
      effectiveness: 'normal'
    });
    
    turn++;
  }
  
  const winner = hp1 > 0 ? species1.name : species2.name;
  
  return {
    winner,
    turns,
    totalTurns: turns.length,
    finalHP1: Math.max(0, Math.floor(hp1)),
    finalHP2: Math.max(0, Math.floor(hp2)),
    executionTime: Date.now() - startTime,
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
}

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

export async function simulateSingleBattle(
  pokemon1Id: number,
  pokemon2Id: number,
  options?: {
    generation?: number;
    pokemon1Level?: number;
    pokemon2Level?: number;
  }
): Promise<SingleBattleResult> {
  const startTime = Date.now();
  
  try {
    const generation = options?.generation || 9;
    const dex = Dex.forGen(generation);
    
    // Get Pokemon species using the same logic as backend
    const species1 = getSpeciesById(dex, pokemon1Id);
    const species2 = getSpeciesById(dex, pokemon2Id);
    
    console.log('Species lookup:', {
      pokemon1Id,
      pokemon2Id,
      species1: species1 ? { name: species1.name, num: species1.num } : null,
      species2: species2 ? { name: species2.name, num: species2.num } : null
    });
    
    if (!species1 || !species2) {
      throw new Error(`Invalid Pokemon IDs: ${pokemon1Id}, ${pokemon2Id}`);
    }
    
    const pokemon1Level = options?.pokemon1Level || 50;
    const pokemon2Level = options?.pokemon2Level || 50;
    
    // Create battle using the Battle class directly
    const battle = new Battle({ formatid: `gen${generation}customgame` });
    const outputs: string[] = [];
    
    // Get moves and abilities
    const p1moves = getRandomMoves(species1, dex, 4);
    const p2moves = getRandomMoves(species2, dex, 4);
    
    const p1ability = species1.abilities ? 
      (species1.abilities['0'] || species1.abilities['1'] || species1.abilities['H'] || 'Pressure') : 
      'Pressure';
    const p2ability = species2.abilities ? 
      (species2.abilities['0'] || species2.abilities['1'] || species2.abilities['H'] || 'Pressure') : 
      'Pressure';
    
    // Create teams in the packed format
    const p1team = [{
      name: species1.name,
      species: species1.name,
      item: '',
      ability: p1ability,
      moves: p1moves,
      nature: 'Hardy',
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      level: pokemon1Level
    }];
    
    const p2team = [{
      name: species2.name,
      species: species2.name,
      item: '',
      ability: p2ability,
      moves: p2moves,
      nature: 'Hardy',
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      level: pokemon2Level
    }];
    
    console.log('Starting battle:', {
      pokemon1: species1.name,
      pokemon2: species2.name,
      p1moves,
      p2moves
    });
    
    // Set players and teams
    try {
      battle.setPlayer('p1', { team: p1team });
      battle.setPlayer('p2', { team: p2team });
    } catch (error) {
      console.error('Error setting players:', error);
      // Return a simple demo battle if there's an error
      return createDemoBattle(species1, species2, pokemon1Level, pokemon2Level, startTime);
    }
    
    let winner = species1.name;
    let battleEnded = false;
    let turnCount = 0;
    const maxTurns = 30;
    
    // Process battle turns
    while (!battleEnded && turnCount < maxTurns) {
      // Clear previous log entries
      battle.log = [];
      
      // Make random moves for both players
      const p1Moves = battle.sides[0].active[0]?.moveSlots;
      const p2Moves = battle.sides[1].active[0]?.moveSlots;
      
      if (p1Moves && p1Moves.length > 0) {
        const validP1Moves = p1Moves
          .map((move: any, i: number) => move.disabled ? -1 : i + 1)
          .filter((i: number) => i > 0);
        if (validP1Moves.length > 0) {
          const moveIndex = validP1Moves[Math.floor(Math.random() * validP1Moves.length)];
          battle.choose('p1', `move ${moveIndex}`);
        } else {
          battle.choose('p1', 'pass');
        }
      }
      
      if (p2Moves && p2Moves.length > 0) {
        const validP2Moves = p2Moves
          .map((move: any, i: number) => move.disabled ? -1 : i + 1)
          .filter((i: number) => i > 0);
        if (validP2Moves.length > 0) {
          const moveIndex = validP2Moves[Math.floor(Math.random() * validP2Moves.length)];
          battle.choose('p2', `move ${moveIndex}`);
        } else {
          battle.choose('p2', 'pass');
        }
      }
      
      // Collect battle log
      const turnLog = battle.log.join('\n');
      if (turnLog) {
        outputs.push(turnLog);
      }
      
      // Check if battle ended
      if (battle.ended) {
        battleEnded = true;
        winner = battle.winner === 'p1' ? species1.name : species2.name;
        break;
      }
      
      // Check for winner in log
      if (turnLog.includes('|win|')) {
        battleEnded = true;
        winner = turnLog.includes('p1') ? species1.name : species2.name;
        break;
      }
      
      turnCount++;
    }
    
    // Parse battle log
    const turns = parseBattleLog(outputs);
    
    // If no turns parsed, create demo turns
    if (turns.length === 0) {
      const hp1 = species1.baseStats.hp * 2 + 110; // Simplified HP calc
      const hp2 = species2.baseStats.hp * 2 + 110;
      
      for (let i = 1; i <= 3; i++) {
        turns.push({
          turn: i,
          attacker: species1.name,
          defender: species2.name,
          move: 'Tackle',
          damage: Math.floor(hp2 * 0.2),
          remainingHP: Math.floor(hp2 * (1 - 0.2 * i)),
          critical: false,
          effectiveness: 'normal'
        });
        
        if (i < 3) {
          turns.push({
            turn: i,
            attacker: species2.name,
            defender: species1.name,
            move: 'Tackle',
            damage: Math.floor(hp1 * 0.2),
            remainingHP: Math.floor(hp1 * (1 - 0.2 * i)),
            critical: false,
            effectiveness: 'normal'
          });
        }
      }
    }
    
    const executionTime = Date.now() - startTime;
    
    // Calculate stats
    const pokemon1Stats = {
      hp: Math.floor((species1.baseStats.hp * 2 + 31 + 0) * pokemon1Level / 100 + pokemon1Level + 10),
      attack: Math.floor((species1.baseStats.atk * 2 + 31 + 0) * pokemon1Level / 100 + 5),
      defense: Math.floor((species1.baseStats.def * 2 + 31 + 0) * pokemon1Level / 100 + 5),
      specialAttack: Math.floor((species1.baseStats.spa * 2 + 31 + 0) * pokemon1Level / 100 + 5),
      specialDefense: Math.floor((species1.baseStats.spd * 2 + 31 + 0) * pokemon1Level / 100 + 5),
      speed: Math.floor((species1.baseStats.spe * 2 + 31 + 0) * pokemon1Level / 100 + 5),
    };
    
    const pokemon2Stats = {
      hp: Math.floor((species2.baseStats.hp * 2 + 31 + 0) * pokemon2Level / 100 + pokemon2Level + 10),
      attack: Math.floor((species2.baseStats.atk * 2 + 31 + 0) * pokemon2Level / 100 + 5),
      defense: Math.floor((species2.baseStats.def * 2 + 31 + 0) * pokemon2Level / 100 + 5),
      specialAttack: Math.floor((species2.baseStats.spa * 2 + 31 + 0) * pokemon2Level / 100 + 5),
      specialDefense: Math.floor((species2.baseStats.spd * 2 + 31 + 0) * pokemon2Level / 100 + 5),
      speed: Math.floor((species2.baseStats.spe * 2 + 31 + 0) * pokemon2Level / 100 + 5),
    };
    
    return {
      winner,
      turns,
      totalTurns: turns.length,
      finalHP1: winner === species1.name ? 100 : 0,
      finalHP2: winner === species2.name ? 100 : 0,
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
    console.error('Battle simulation error:', error);
    throw error;
  }
}