// Types for Pokemon instances based on pokemonstats.md structure
export interface PokemonInstance {
  // Basic Information
  name: string;           // Custom nickname (defaults to species name)
  species: string;        // Pokemon species identifier
  forme: string | null;   // Alternate form (e.g., "Alola", "Galar", "Mega")
  gender: "M" | "F" | "N"; // Gender: Male, Female, or Genderless
  shiny: boolean;         // Is shiny?
  level: number;          // Level 1-100
  happiness: number;      // Friendship value 0-255
  
  // Abilities and Items
  ability: string;        // Active ability
  abilitySlot: number;    // Ability slot: 0 (primary), 1 (secondary), 2 (hidden)
  item: string;           // Held item (empty string = no item)
  pokeball: string;       // Pokeball caught in (cosmetic)
  
  // Gen-specific features
  teraType: string;       // Tera type (Gen 9)
  gigantamax: boolean;    // G-Max sprite flag
  canGigantamax: boolean; // Can G-Max?
  isDynamaxed: boolean;   // Currently Dynamaxed?
  zMove: string | null;   // Z-Move name (Gen 7)
  zMoveFrom: string | null; // Original move for Z-Move
  megaEvo: string | null; // Mega Evolution form
  
  // Moves
  moves: string[];        // List of up to 4 moves
  moveData: Array<{       // Optional detailed move data
    move: string;
    pp: number;
    maxpp: number;
  }>;
  
  // Stats (EVs and IVs)
  evs: {
    hp: number;          // 0-252 per stat, max 510 total
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  ivs: {
    hp: number;          // 0-31 per stat
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  
  // Additional Stats
  nature: string;         // Nature affecting stats
  hpType: string | null;  // Hidden Power type (Gen 7 and earlier)
  hpIVs: any | null;      // IV overrides for Hidden Power
  
  // Battle State
  status: string | null;  // Status: "brn", "par", "slp", "psn", "tox", "frz", null
  statusData: any | null; // Extra status data (e.g., sleep turn counter)
  volatileStatus: string[]; // Temporary conditions
  boosts: {               // Stat stage changes (-6 to +6)
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
    accuracy: number;
    evasion: number;
  };
  toxicCounter: number;   // Toxic damage counter
  subHP: number | null;   // Substitute HP
  fainted: boolean;       // Is fainted?
  
  // Current Battle State
  currentHP: number | null; // Current HP value
  maxHP: number | null;     // Max HP value
  faintedThisTurn: boolean; // Fainted this turn?
  teamIndex: number;        // Position in team (1-6)
  
  // Other
  hidden: boolean;        // Hide info flag
}

// Simplified version for API responses
export interface PokemonInstanceData {
  id: number;             // Pokemon ID (for sprites)
  name: string;           // Pokemon name
  species: string;        // Pokemon species
  level: number;          // Level
  types: string[];        // Type array
  ability: string;        // Active ability
  item?: string;          // Held item (optional)
  moves: string[];        // Move names
  stats: {                // Calculated stats (with IVs, EVs, Nature)
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  baseStats: {            // Base stats from species
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  evs: {                  // Effort Values
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  ivs: {                  // Individual Values
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  nature: string;         // Nature
  sprites: {              // Sprite URLs
    front: string;
    back: string;
    shiny: string;
  };
}

export interface GetRandomPokemonWithInstancesResponse {
  pokemon1: PokemonInstanceData;
  pokemon2: PokemonInstanceData;
  generation: number;
}

export interface RandomPokemonSettings {
  generation?: number;
  levelMode?: 'fixed' | 'random';
  level?: number;        // Used when levelMode is 'fixed'
  minLevel?: number;     // Used when levelMode is 'random'
  maxLevel?: number;     // Used when levelMode is 'random'
}