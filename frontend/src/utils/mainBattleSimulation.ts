import { Battle } from '@pkmn/sim';
import type { CompletePokemon } from '../types/pokemon';
import { createTeamString } from '../types/pokemon';

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
    item?: string;
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
    item?: string;
  };
  totalBattles: number;
  winRate: number;
  executionTime: number;
}

const NUM_BATTLES = 10; // Run 10 battles to match backend

interface BattleEvent {
  turn: number;
  type: 'move' | 'damage' | 'status' | 'weather' | 'ability' | 'item' | 'faint' | 'switch';
  pokemon: 'p1' | 'p2';
  description: string;
  details?: {
    move?: string;
    damage?: number;
    status?: string;
    effectiveness?: 'super' | 'normal' | 'not very' | 'immune';
    criticalHit?: boolean;
  };
}

interface SingleBattleResult {
  winner: 1 | 2;
  events: BattleEvent[];
  finalHP: {
    p1: number;
    p2: number;
  };
  totalTurns: number;
}

export async function simulateSingleBattle(
  pokemon1: CompletePokemon,
  pokemon2: CompletePokemon,
  generation: number
): Promise<SingleBattleResult> {
  try {
    const battle = new Battle({ formatid: `gen${generation}customgame` as any });
    
    // Create team strings using the pre-created Pokemon data
    const p1team = createTeamString(pokemon1);
    const p2team = createTeamString(pokemon2);
    
    try {
      battle.setPlayer('p1', { team: p1team });
      battle.setPlayer('p2', { team: p2team });
    } catch (error) {
      // If there's an error setting up the battle, randomly determine winner
      const winner = Math.random() < 0.5 ? 1 : 2;
      return {
        winner,
        events: [],
        finalHP: {
          p1: pokemon1.stats.hp,
          p2: pokemon2.stats.hp
        },
        totalTurns: 0
      };
    }
    
    let battleEnded = false;
    let turnCount = 0;
    const maxTurns = 50;
    const events: BattleEvent[] = [];
    
    // Helper function to parse battle log and extract events
    const parseBattleLog = (log: string[], currentTurn: number) => {
      for (const line of log) {
        // Parse move usage
        if (line.includes('|move|')) {
          const parts = line.split('|');
          const pokemon = parts[2].includes('p1') ? 'p1' : 'p2';
          const moveName = parts[3];
          events.push({
            turn: currentTurn,
            type: 'move',
            pokemon,
            description: `${pokemon} used ${moveName}`,
            details: { move: moveName }
          });
        }
        
        // Parse damage
        if (line.includes('|-damage|')) {
          const parts = line.split('|');
          const pokemon = parts[2].includes('p1') ? 'p1' : 'p2';
          // const hpInfo = parts[3];
          events.push({
            turn: currentTurn,
            type: 'damage',
            pokemon,
            description: `${pokemon} took damage`,
            details: { damage: 0 } // We'll calculate actual damage later
          });
        }
        
        // Parse status effects
        if (line.includes('|-status|')) {
          const parts = line.split('|');
          const pokemon = parts[2].includes('p1') ? 'p1' : 'p2';
          const status = parts[3];
          events.push({
            turn: currentTurn,
            type: 'status',
            pokemon,
            description: `${pokemon} was ${status}`,
            details: { status }
          });
        }
        
        // Parse burn/poison damage
        if (line.includes('|-damage|') && line.includes('[from]')) {
          const parts = line.split('|');
          const pokemon = parts[2].includes('p1') ? 'p1' : 'p2';
          const source = parts[4]?.replace('[from] ', '');
          if (source === 'brn' || source === 'psn' || source === 'tox') {
            events.push({
              turn: currentTurn,
              type: 'damage',
              pokemon,
              description: `${pokemon} was hurt by ${source === 'brn' ? 'burn' : 'poison'}`,
              details: { status: source }
            });
          }
        }
        
        // Parse fainting
        if (line.includes('|faint|')) {
          const parts = line.split('|');
          const pokemon = parts[2].includes('p1') ? 'p1' : 'p2';
          events.push({
            turn: currentTurn,
            type: 'faint',
            pokemon,
            description: `${pokemon} fainted!`,
            details: {}
          });
        }
      }
    };
    
    while (!battleEnded && turnCount < maxTurns) {
      turnCount++;
      (battle as any).log = [];
      
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
      
      // Parse the battle log for this turn
      parseBattleLog((battle as any).log, turnCount);
      
      if (battle.ended) {
        battleEnded = true;
        const winner = battle.winner === 'p1' ? 1 : 2;
        return {
          winner,
          events,
          finalHP: {
            p1: battle.sides[0].active[0]?.hp || 0,
            p2: battle.sides[1].active[0]?.hp || 0
          },
          totalTurns: turnCount
        };
      }
    }
    
    // If battle didn't end, determine winner by remaining HP
    const p1HP = battle.sides[0].active[0]?.hp || 0;
    const p2HP = battle.sides[1].active[0]?.hp || 0;
    return {
      winner: p1HP > p2HP ? 1 : 2,
      events,
      finalHP: {
        p1: p1HP,
        p2: p2HP
      },
      totalTurns: turnCount
    };
    
  } catch (error) {
    // Fallback to random winner on error
    const winner = Math.random() < 0.5 ? 1 : 2;
    return {
      winner,
      events: [],
      finalHP: {
        p1: pokemon1.stats.hp,
        p2: pokemon2.stats.hp
      },
      totalTurns: 0
    };
  }
}

export async function simulateMainBattle(
  pokemon1: CompletePokemon,
  pokemon2: CompletePokemon,
  options?: {
    generation?: number;
    returnSampleBattle?: boolean;
  }
): Promise<BattleResult & { sampleBattle?: SingleBattleResult }> {
  const startTime = Date.now();
  
  const generation = options?.generation || 9;
  
  console.log(`Starting ${NUM_BATTLES} battle simulations between ${pokemon1.name} and ${pokemon2.name}`);
  
  // Run battles
  let pokemon1Wins = 0;
  let pokemon2Wins = 0;
  let sampleBattle: SingleBattleResult | undefined;
  
  // Run battles in batches to avoid blocking the UI
  const batchSize = 10;
  for (let i = 0; i < NUM_BATTLES; i += batchSize) {
    const batchPromises = [];
    
    for (let j = 0; j < batchSize && i + j < NUM_BATTLES; j++) {
      batchPromises.push(
        simulateSingleBattle(pokemon1, pokemon2, generation)
      );
    }
    
    const results = await Promise.all(batchPromises);
    
    for (const result of results) {
      if (result.winner === 1) {
        pokemon1Wins++;
      } else {
        pokemon2Wins++;
      }
      
      // Capture first battle with events as sample
      if (!sampleBattle && result.events.length > 0 && options?.returnSampleBattle) {
        sampleBattle = result;
      }
    }
    
    // Allow UI to update
    if (i % 20 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  const winRate = (pokemon1Wins / NUM_BATTLES) * 100;
  const executionTime = Date.now() - startTime;
  
  console.log(`Battle results: ${pokemon1.name} won ${pokemon1Wins}/${NUM_BATTLES} (${winRate.toFixed(1)}%)`);
  console.log(`Execution time: ${executionTime}ms`);
  
  const result: BattleResult & { sampleBattle?: SingleBattleResult } = {
    battleId: crypto.randomUUID(),
    pokemon1: {
      id: pokemon1.id,
      name: pokemon1.name,
      level: pokemon1.level,
      wins: pokemon1Wins,
      types: pokemon1.types,
      sprites: pokemon1.sprites,
      moves: pokemon1.moveNames,
      stats: pokemon1.stats,
      ability: pokemon1.abilityName,
      item: pokemon1.item
    },
    pokemon2: {
      id: pokemon2.id,
      name: pokemon2.name,
      level: pokemon2.level,
      wins: pokemon2Wins,
      types: pokemon2.types,
      sprites: pokemon2.sprites,
      moves: pokemon2.moveNames,
      stats: pokemon2.stats,
      ability: pokemon2.abilityName,
      item: pokemon2.item
    },
    totalBattles: NUM_BATTLES,
    winRate,
    executionTime
  };
  
  if (sampleBattle) {
    result.sampleBattle = sampleBattle;
  }
  
  return result;
}