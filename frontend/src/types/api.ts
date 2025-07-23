// API types for PokeWave frontend

export interface Pokemon {
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
  sprite: string;
}

export interface BattleResult {
  battleId: string;
  battleInstanceId?: string; // Unique ID for each battle instance (for animation purposes)
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
    baseStats?: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
    evs?: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
    ivs?: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
    ability?: string;
    abilityDetail?: {
      name: string;
      effect: string;
      shortEffect: string;
    };
    item?: string;
    itemDetail?: {
      name: string;
      effect: string;
      shortEffect: string;
      sprite: string;
    };
    moveDetails?: {
      name: string;
      type: string;
      category: 'physical' | 'special' | 'status';
      power: number | null;
      accuracy: number | null;
      pp: number;
      description?: string;
    }[];
    levelupMoves?: Array<{ level: number; move: string }>;
    shiny?: boolean;
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
    baseStats?: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
    evs?: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
    ivs?: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
    ability?: string;
    abilityDetail?: {
      name: string;
      effect: string;
      shortEffect: string;
    };
    item?: string;
    itemDetail?: {
      name: string;
      effect: string;
      shortEffect: string;
      sprite: string;
    };
    moveDetails?: {
      name: string;
      type: string;
      category: 'physical' | 'special' | 'status';
      power: number | null;
      accuracy: number | null;
      pp: number;
      description?: string;
    }[];
    levelupMoves?: Array<{ level: number; move: string }>;
    nature?: string;
    shiny?: boolean;
  };
  totalBattles: number;
  winRate: number;
  executionTime: number;
}

export interface GuessSubmission {
  battleId: string;
  guessPercentage: number; // Percentage (0-100) that user thinks Pokemon 1 will win
}

export interface GuessResult {
  battleId: string;
  guessPercentage: number;
  actualWinRate: number;
  isCorrect: boolean;
  accuracy: number;
  points: number;
  message: string;
  pokemon1Won: boolean;
}

export interface GameState {
  currentBattle: BattleResult | null;
  score: number;
  streak: number;
  totalGuesses: number;
  correctGuesses: number;
  isLoading: boolean;
  error: string | null;
}

export interface ApiError {
  message: string;
  code?: number;
  details?: any;
}

export interface PokemonInstanceData {
  id: number;
  name: string;
  species: string;
  level: number;
  types: string[];
  ability: string;
  abilityDetail?: {
    name: string;
    effect: string;
    shortEffect: string;
  };
  item?: string;
  itemDetail?: {
    name: string;
    effect: string;
    shortEffect: string;
    sprite: string;
  };
  moves: string[];
  moveDetails?: {
    name: string;
    type: string;
    category: 'physical' | 'special' | 'status';
    power: number | null;
    accuracy: number | null;
    pp: number;
    description?: string;
  }[];
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
  nature: string;
  sprites: {
    front: string;
    back: string;
    shiny: string;
  };
  shiny?: boolean;
}

export interface GetRandomPokemonWithInstancesResponse {
  pokemon1: PokemonInstanceData;
  pokemon2: PokemonInstanceData;
  generation: number;
  pokemon1InstanceId?: string;
  pokemon2InstanceId?: string;
  battleId?: string;
  battleInstanceId?: string;
  totalBattles?: number;
  pokemon1Wins?: number;
  pokemon2Wins?: number;
  winRate?: number;
  executionTime?: number;
}

export interface SimpleBattleResult {
  battleId: string;
  pokemon1Wins: number;
  pokemon2Wins: number;
  draws: number;
  totalBattles: number;
  winRate: number;
  executionTime: number;
}