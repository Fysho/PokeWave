/**
 * Game constants and configuration values
 */

// Shiny Pokemon Configuration
export const SHINY_ODDS = {
  // Standard shiny chance (1 in 4096)
  STANDARD: 1 / 4096,
  
  // With shiny charm (1 in 1365.33)
  WITH_CHARM: 3 / 4096,
  
  // Masuda method (1 in 682.67)
  MASUDA: 6 / 4096,
  
  // Masuda method with shiny charm (1 in 512)
  MASUDA_WITH_CHARM: 8 / 4096,
  
  // Custom rates for events or special modes
  BOOSTED: 1 / 2048,
  ULTRA_BOOSTED: 1 / 1024,
  
  // Debug mode (for testing)
  DEBUG: 1 / 10
};

// Default shiny chance to use in the game
export const DEFAULT_SHINY_CHANCE = SHINY_ODDS.DEBUG;

// Battle Configuration
export const BATTLE_CONFIG = {
  // Number of battles to simulate for win rate calculation
  SIMULATIONS_PER_BATTLE: 100,
  
  // Battle cache settings
  CACHE_SIZE: 200,
  CACHE_TTL: 86400, // 24 hours in seconds
  
  // Default generation for battles
  DEFAULT_GENERATION: 9
};

// Pokemon Level Configuration
export const LEVEL_CONFIG = {
  MIN_LEVEL: 1,
  MAX_LEVEL: 100,
  DEFAULT_LEVEL: 50,
  
  // Random level ranges
  RANDOM_MIN: 50,
  RANDOM_MAX: 100
};

// Daily Challenge Configuration
export const DAILY_CHALLENGE_CONFIG = {
  BATTLES_PER_CHALLENGE: 3,
  DAYS_TO_GENERATE: 7,
  CACHE_TTL: 86400 // 24 hours
};