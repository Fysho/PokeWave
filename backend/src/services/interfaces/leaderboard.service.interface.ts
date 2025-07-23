export interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  avatarPokemonId?: number;
  avatarSprite?: string;
  score: number;
  totalRuns: number;
  rank?: number;
}

export interface LeaderboardScore {
  userId: string;
  score: number;
  timestamp: Date | string;
}

export interface ILeaderboardService {
  // Common methods that both implementations should have
  submitEndlessScore(userId: string, score: number, username?: string): Promise<any>;
  getEndlessLeaderboard(limit?: number): Promise<any[]>;
  
  // Methods that might exist in some implementations
  getUserEndlessStats?(userId: string): Promise<any>;
  getRecentScores?(limit?: number): Promise<any[]>;
  getPlayerCount?(): number;
  getPlayerCountAsync?(): Promise<number>;
  clearAllScores?(): Promise<void>;
  submitDailyChallengeScore?(userId: string, challengeDate: Date | string, score: number): Promise<void>;
  getDailyChallengeLeaderboard?(challengeDate: Date | string, limit?: number): Promise<any[]>;
  
  // These might not exist in current implementations but are in the interface
  getEndlessLeaderboardWithRank?(userId: string, limit?: number): Promise<{
    leaderboard: LeaderboardEntry[];
    userRank: number | null;
  }>;
  getUserEndlessHighScore?(userId: string): Promise<number>;
  submitDailyScore?(userId: string, date: string, score: number): Promise<void>;
  getDailyLeaderboard?(date: string, limit?: number): Promise<LeaderboardEntry[]>;
  getUserDailyScore?(userId: string, date: string): Promise<number | null>;
}