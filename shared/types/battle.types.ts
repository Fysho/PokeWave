export interface SimulateBattleRequest {
  pokemon1Id: number;
  pokemon2Id: number;
  options?: {
    generation?: number;
    pokemon1Level?: number;
    pokemon2Level?: number;
    withItems?: boolean;
    movesetType?: 'random' | 'competitive';
    aiDifficulty?: 'random' | 'elite';
  };
}

export interface SimulateBattleResponse {
  battleId: string;
  pokemon1: {
    id: number;
    name: string;
    level: number;
    wins: number;
  };
  pokemon2: {
    id: number;
    name: string;
    level: number;
    wins: number;
  };
  totalBattles: number;
  winRate: number;
}

export interface SubmitGuessRequest {
  battleId: string;
  guessedWinRate: number;
}

export interface SubmitGuessResponse {
  actualWinRate: number;
  guessedWinRate: number;
  accuracy: number;
  score: number;
  message: string;
}