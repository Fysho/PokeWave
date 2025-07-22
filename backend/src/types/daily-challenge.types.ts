import { PokemonInstanceData } from './pokemon-instance.types';

export interface DailyBattle {
  battleId: string;
  pokemon1: PokemonInstanceData;
  pokemon2: PokemonInstanceData;
  winRate: number;
  totalBattles: number;
  executionTime: number;
}

export interface DailyChallenge {
  id: string;
  date: string; // YYYY-MM-DD format
  battles: DailyBattle[];
  createdAt: Date;
  expiresAt: Date;
}

export interface DailyChallengeResponse {
  challenge: DailyChallenge;
  isToday: boolean;
  dayOfWeek: string;
}