import type { PokemonInstanceData } from './pokemon-instance.types';

export interface BattleOptions {
  generation?: number;
  pokemon1Level?: number;
  pokemon2Level?: number;
  totalBattles?: number;
  itemMode?: 'random' | 'none';
}

export interface BattleResult {
  battleId: string;
  pokemon1: PokemonInstanceData;
  pokemon2: PokemonInstanceData;
  totalBattles: number;
  pokemon1Wins: number;
  pokemon2Wins: number;
  winRate: number; // Pokemon 1's win rate as percentage (0-100)
  executionTime: number;
}

export interface GuessResult {
  battleId: string;
  guessPercentage: number;
  actualWinRate: number;
  isCorrect: boolean;
  accuracy: number;
  points: number;
  message: string;
}