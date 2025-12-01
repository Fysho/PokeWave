/**
 * Online Mode Types
 *
 * Frontend type definitions for the synchronized global battle prediction game mode.
 */

// ==========================================
// CONFIGURATION (mirrors backend)
// ==========================================

export const ONLINE_CONFIG = {
  ROUND_DURATION: 40,      // Total round duration in seconds
  GUESS_DURATION: 30,      // Time for guessing phase
  RESULTS_DURATION: 10,    // Time for results phase
};

// ==========================================
// RANK SYSTEM
// ==========================================

export type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';

export const RANK_THRESHOLDS: Record<RankTier, { min: number; max: number }> = {
  bronze: { min: 0, max: 1199 },
  silver: { min: 1200, max: 1399 },
  gold: { min: 1400, max: 1599 },
  platinum: { min: 1600, max: 1799 },
  diamond: { min: 1800, max: 1999 },
  master: { min: 2000, max: Infinity }
};

export const RANK_COLORS: Record<RankTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
  master: '#9B59B6'
};

export const RANK_LABELS: Record<RankTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  diamond: 'Diamond',
  master: 'Master'
};

// ==========================================
// ROUND STATE
// ==========================================

export type OnlinePhase = 'guessing' | 'results';

export interface OnlineRoundState {
  roundNumber: number;
  phase: OnlinePhase;
  timeRemaining: number;
  pokemon1: PokemonData;
  pokemon2: PokemonData;
  actualWinPercent?: number; // Only revealed in results phase
  totalParticipants: number;
}

export interface PokemonData {
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
  sprites: {
    front: string;
    back: string;
    shiny: string;
  };
  shiny?: boolean;
}

// ==========================================
// PLAYER DATA
// ==========================================

export interface OnlinePlayer {
  userId: string;
  username: string;
  elo: number;
  rank: RankTier;
  avatarPokemonId: number;
  avatarSprite: string;
  hasSubmitted: boolean;
  isOnline: boolean;
}

export interface OnlineUserStats {
  elo: number;
  rank: RankTier;
  position: number;
  gamesPlayed: number;
  wins: number;
  highestElo: number;
  lowestElo: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  elo: number;
  tier: RankTier;
  gamesPlayed: number;
  wins: number;
  avatarPokemonId: number;
  avatarSprite: string;
}

// ==========================================
// GUESS DATA
// ==========================================

export interface OnlineGuessSubmission {
  roundNumber: number;
  guess: number; // 0-100 percentage
}

export interface OnlineGuessResult {
  userId: string;
  username: string;
  guess: number;
  accuracyScore: number;
  rankPosition: number;
  eloChange: number;
  eloBefore: number;
  eloAfter: number;
}

export interface OnlineRoundResults {
  roundNumber: number;
  actualWinPercent: number;
  results: OnlineGuessResult[];
}

// ==========================================
// WEBSOCKET EVENTS
// ==========================================

export interface TickData {
  roundNumber: number;
  phase: OnlinePhase;
  timeRemaining: number;
}

export interface NewRoundData {
  roundNumber: number;
  phase: OnlinePhase;
  timeRemaining: number;
  pokemon1: PokemonData;
  pokemon2: PokemonData;
  totalParticipants: number;
}

export interface RoundResultsData {
  roundNumber: number;
  actualWinPercent: number;
  results: OnlineGuessResult[];
}

// ==========================================
// API RESPONSES
// ==========================================

export interface GuessSubmitResponse {
  success: boolean;
  guessId: string;
  roundNumber: number;
  guess: number;
}

export interface JoinOnlineModeResponse {
  success: boolean;
  roundState: OnlineRoundState;
  userStats: OnlineUserStats;
}

// ==========================================
// STORE STATE
// ==========================================

export interface OnlineStoreState {
  // Connection state
  isConnected: boolean;
  isAuthenticated: boolean;

  // Round state
  roundState: OnlineRoundState | null;

  // User state
  userStats: OnlineUserStats | null;
  currentGuess: number | null;
  hasSubmittedGuess: boolean;

  // Results state
  lastResults: OnlineRoundResults | null;
  myLastResult: OnlineGuessResult | null;

  // Players
  onlinePlayers: OnlinePlayer[];

  // Leaderboard
  leaderboard: LeaderboardEntry[];

  // UI state
  isLoading: boolean;
  error: string | null;
}
