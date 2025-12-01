/**
 * Online Mode Types
 *
 * Type definitions for the synchronized global battle prediction game mode.
 */

// ==========================================
// CONFIGURATION
// ==========================================

export const ONLINE_CONFIG = {
  ROUND_DURATION: 40,      // Total round duration in seconds
  GUESS_DURATION: 30,      // Time for guessing phase
  RESULTS_DURATION: 10,    // Time for results phase
  SIMULATION_COUNT: 1000,  // Number of battle simulations for accuracy
  BASE_ELO_CHANGE: 15,     // Maximum Elo change per round
  ACCURACY_WEIGHT: 0.6,    // Weight for accuracy in Elo calculation
  RANK_WEIGHT: 0.4,        // Weight for rank in Elo calculation
  MIN_PLAYERS_FOR_ELO: 2,  // Minimum players for Elo to change
  GENERATION: 9,           // Pokemon generation
  LEVEL: 50,               // Fixed battle level
  ITEM_MODE: 'random' as const  // Item assignment mode
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

// ==========================================
// ROUND STATE
// ==========================================

export type OnlinePhase = 'guessing' | 'results';

export interface OnlineRoundState {
  roundNumber: number;
  phase: OnlinePhase;
  timeRemaining: number;
  pokemon1: any; // PokemonInstance data
  pokemon2: any; // PokemonInstance data
  actualWinPercent?: number; // Only revealed in results phase
  totalParticipants: number;
}

export interface OnlineRoundData {
  id: string;
  roundNumber: number;
  pokemon1Data: any;
  pokemon2Data: any;
  actualWinPercent: number;
  startTime: Date;
  endTime: Date;
  totalParticipants: number;
}

// ==========================================
// PLAYER DATA
// ==========================================

export type PlayerMode = 'spectating' | 'playing' | 'leaving';

export interface OnlinePlayer {
  userId: string;
  username: string;
  elo: number;
  rank: RankTier;
  avatarPokemonId: number;
  avatarSprite: string;
  hasSubmitted: boolean;
  isOnline: boolean;
  mode: PlayerMode;
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
  avatarPokemonId: number;
  avatarSprite: string;
}

export interface OnlineRoundResults {
  roundNumber: number;
  actualWinPercent: number;
  totalParticipants: number;
  guesses: OnlineGuessResult[];
}

// ==========================================
// WEBSOCKET EVENTS
// ==========================================

// Client -> Server events
export interface ClientToServerEvents {
  authenticate: (data: { token: string }) => void;
  heartbeat: () => void;
  'guess-submitted': () => void;
}

// Server -> Client events
export interface ServerToClientEvents {
  authenticated: (data: { success: boolean; error?: string }) => void;
  'round-state': (state: OnlineRoundState) => void;
  tick: (data: { roundNumber: number; phase: OnlinePhase; timeRemaining: number }) => void;
  'new-round': (state: OnlineRoundState) => void;
  'round-results': (data: { roundNumber: number; actualWinPercent: number; results: OnlineGuessResult[] }) => void;
  'players-update': (players: OnlinePlayer[]) => void;
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

export interface OnlineStatsResponse extends OnlineUserStats {}

export interface OnlinePlayersResponse extends Array<OnlinePlayer> {}

export interface LeaderboardResponse extends Array<LeaderboardEntry> {}
