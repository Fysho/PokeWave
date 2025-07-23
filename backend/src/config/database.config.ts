// Database configuration
export const DATABASE_CONFIG = {
  // Set to true to use database, false for in-memory storage
  USE_DATABASE: process.env.USE_DATABASE === 'true' || false,
  
  // Database URL from environment
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://pokewave:pokewave_password@localhost:5432/pokewave_db',
  
  // Enable query logging in development
  ENABLE_QUERY_LOGGING: process.env.NODE_ENV === 'development',
  
  // Connection pool settings
  CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000
};

// Helper to check if database is enabled
export const isDatabaseEnabled = () => DATABASE_CONFIG.USE_DATABASE;