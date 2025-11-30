/**
 * Centralized battle configuration
 * This file contains all battle-related constants that need to be shared
 * across the application (frontend and backend)
 */

export const BATTLE_CONFIG = {
  /**
   * Total number of battles to simulate for each battle request
   * This value is used for:
   * - Battle simulation loops in the backend
   * - Win rate percentage calculations
   * - UI display messages
   * - Loading animations
   * - Battle history tracking
   */
  TOTAL_BATTLES: 17,
  
  /**
   * Maximum number of turns per individual battle before timeout
   */
  MAX_TURNS_PER_BATTLE: 50,
  
  /**
   * Default Pokemon level if not specified
   */
  DEFAULT_POKEMON_LEVEL: 50,
  
  /**
   * Default generation if not specified
   */
  DEFAULT_GENERATION: 9,
} as const;

// Type export for TypeScript
export type BattleConfig = typeof BATTLE_CONFIG;