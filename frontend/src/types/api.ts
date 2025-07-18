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
  };
  totalBattles: number;
  winRate: number;
  executionTime: number;
}

export interface GuessSubmission {
  battleId: string;
  guess: number; // Pokemon ID that user thinks will win
}

export interface GuessResult {
  battleId: string;
  guess: number;
  correctAnswer: number;
  isCorrect: boolean;
  winRate: number;
  points: number;
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