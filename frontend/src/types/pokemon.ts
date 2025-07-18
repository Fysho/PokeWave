// Complete Pokemon data structure for battles
export interface CompletePokemon {
  // Basic info
  id: number;
  name: string;
  species: string; // Internal species name for battle engine
  level: number;
  
  // Battle properties
  types: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  moves: string[]; // Move IDs for battle engine
  moveNames: string[]; // Display names
  ability: string;
  abilityName: string; // Display name
  item?: string;
  itemName?: string; // Display name
  
  // Display properties
  sprites: {
    front: string;
    back: string;
    shiny: string;
  };
  
  // Battle results (updated after simulation)
  wins?: number;
}

// Function to create a team string for Pokemon Showdown
export function createTeamString(pokemon: CompletePokemon): string {
  const speciesName = pokemon.species.toLowerCase().replace(/[^a-z0-9]/g, '');
  const item = pokemon.item || '';
  const ability = pokemon.ability || '';
  const moves = pokemon.moves.join(',');
  
  // Format: species|item|ability|evs|moves|nature
  return `${speciesName}|${item}|${ability}||${moves}||`;
}