import type { BattleResult, GuessResult, BattleOptions } from '../../types/battle.types';

export interface IBattleService {
  simulateBattle(
    pokemon1Id: number, 
    pokemon2Id: number,
    options?: BattleOptions
  ): Promise<BattleResult>;
  
  submitGuess(battleId: string, guessPercentage: number): Promise<GuessResult>;
  
  getBattle(battleId: string): Promise<BattleResult | null>;
  
  // Database-specific methods (optional for in-memory implementation)
  getPopularBattles?(limit: number): Promise<any[]>;
  getHardestBattles?(limit: number): Promise<any[]>;
  getBattleStats?(battleId: string): Promise<any>;
}