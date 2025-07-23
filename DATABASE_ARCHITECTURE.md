# PokeWave Database Architecture

This document explains the database structure, persistence system, and how PokeWave manages user data and game state.

## Table of Contents
- [Overview](#overview)
- [Storage Modes](#storage-modes)
- [Database Schema](#database-schema)
- [Service Architecture](#service-architecture)
- [Data Flow](#data-flow)
- [Key Features](#key-features)
- [Migration Strategy](#migration-strategy)

## Overview

PokeWave uses a dual-storage architecture that supports both in-memory and persistent database storage. This design allows for:
- **Development flexibility** - Quick setup with in-memory storage
- **Production readiness** - PostgreSQL for data persistence
- **Seamless switching** - Toggle between modes via environment variable

## Storage Modes

### In-Memory Storage (Default)
- Data stored in JavaScript Map objects
- Ultra-fast performance
- No setup required
- Data lost on server restart
- Perfect for development and testing

### PostgreSQL Database
- Data persisted to disk
- Survives server restarts
- Production-ready
- Requires Docker and initial setup
- Slight performance overhead

### Mode Selection
```env
# .env file
USE_DATABASE=false  # In-memory mode (default)
USE_DATABASE=true   # PostgreSQL mode
```

## Database Schema

### User Table
Stores user authentication and profile information.

```prisma
model User {
  id                String    @id @default(uuid())
  username          String    @unique
  password          String    // Hashed with bcrypt
  avatarPokemonId   Int       @default(25)  // Pikachu
  avatarSprite      String    @default("...")
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  pokedex           Pokedex?
  gameStats         GameStats?
  endlessScores     EndlessScore[]
  dailyChallengeScores DailyChallengeScore[]
}
```

### Pokedex Table
Tracks which Pokemon each user has unlocked.

```prisma
model Pokedex {
  id                   String   @id @default(uuid())
  userId               String   @unique
  user                 User     @relation(...)
  
  // Arrays of Pokemon IDs
  unlockedPokemon      Int[]    @default([])
  unlockedShinyPokemon Int[]    @default([])
  
  // JSON objects: {pokemonId: count}
  pokemonCounts        Json     @default("{}")
  shinyPokemonCounts   Json     @default("{}")
}
```

**Data Structure Example:**
```json
{
  "unlockedPokemon": [25, 6, 150],
  "unlockedShinyPokemon": [25],
  "pokemonCounts": {
    "25": 5,    // Encountered Pikachu 5 times
    "6": 2,     // Encountered Charizard 2 times
    "150": 1    // Encountered Mewtwo 1 time
  },
  "shinyPokemonCounts": {
    "25": 1     // Encountered shiny Pikachu once
  }
}
```

### GameStats Table
Aggregated statistics for each user's gameplay.

```prisma
model GameStats {
  id                   String   @id @default(uuid())
  userId               String   @unique
  user                 User     @relation(...)
  
  totalBattles         Int      @default(0)
  totalCorrectGuesses  Int      @default(0)
  highestStreak        Int      @default(0)
  endlessHighScore     Int      @default(0)
}
```

### EndlessScore Table
Individual endless mode runs with scores.

```prisma
model EndlessScore {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(...)
  
  score       Int
  timestamp   DateTime @default(now())
  
  @@index([userId])
  @@index([score(sort: Desc)])  // For leaderboard queries
}
```

### DailyChallengeScore Table
Daily challenge attempts and best scores.

```prisma
model DailyChallengeScore {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(...)
  
  challengeDate DateTime @db.Date
  score         Int      // Lower is better
  attempts      Int      @default(1)
  
  @@unique([userId, challengeDate])  // One entry per user per day
}
```

## Service Architecture

### Service Factory Pattern
The system uses a factory pattern to provide the appropriate service implementation:

```typescript
// service-factory.ts
export function getUserService() {
  if (isDatabaseEnabled()) {
    return userServiceDB;     // Database-backed implementation
  } else {
    return userService;       // In-memory implementation
  }
}
```

### Service Interfaces
Both implementations share the same interface:

```typescript
interface UserService {
  createUser(data: CreateUserData): Promise<User>
  findById(id: string): Promise<User | null>
  findByUsername(username: string): Promise<User | null>
  updateUser(id: string, updates: Partial<User>): Promise<User | null>
  updatePokedex(userId: string, pokedexData: PokedexData): Promise<User | null>
  updateGameStats(userId: string, stats: Partial<GameStats>): Promise<User | null>
  unlockPokemon(userId: string, pokemonId: number, isShiny: boolean): Promise<User | null>
}
```

### Database Connection Management
```typescript
// On startup
await initializeServices();  // Connects to database if enabled

// On shutdown
await shutdownServices();    // Gracefully closes connections
```

## Data Flow

### User Registration Flow
1. User submits username/password
2. Password hashed with bcrypt
3. User record created with default avatar (Pikachu)
4. Empty Pokedex and GameStats created
5. JWT token generated and returned

### Battle Result Flow
1. Battle simulation completed
2. Winner determined
3. User's Pokemon unlocked in Pokedex
4. Pokemon encounter count incremented
5. GameStats updated (battles, correct guesses, streak)

### Leaderboard Flow
1. Endless mode game ends
2. Score submitted to EndlessScore table
3. GameStats.endlessHighScore updated if new personal best
4. Leaderboard queries aggregate best scores per user
5. Results cached for performance

## Key Features

### Automatic User Recovery
If the server restarts with a valid JWT token:
```typescript
// Recreates user from JWT data if missing
await userService.ensureUserExists({ 
  id: userId, 
  username: username 
});
```

### Efficient Leaderboard Queries
Uses raw SQL for complex aggregations:
```sql
SELECT 
  u.id as "userId",
  u.username,
  COALESCE(MAX(es.score), 0) as "highScore",
  COUNT(es.id)::int as "totalRuns"
FROM "User" u
LEFT JOIN "EndlessScore" es ON u.id = es."userId"
GROUP BY u.id
ORDER BY "highScore" DESC
LIMIT 100
```

### Shiny Pokemon Tracking
Separate tracking for regular and shiny Pokemon:
- `unlockedPokemon` - All Pokemon seen
- `unlockedShinyPokemon` - Only shiny variants
- Separate count tracking for collection stats

### Data Format Conversion
Converts between database JSON format and API array format:
```typescript
// Database: {"25": 5, "6": 2}
// API: [[25, 5], [6, 2]]
```

## Migration Strategy

### Development to Production
1. **Development Phase**: Use in-memory storage for rapid iteration
2. **Testing Phase**: Enable database mode to test persistence
3. **Staging Phase**: Run migrations, test data integrity
4. **Production Phase**: Deploy with `USE_DATABASE=true`

### Future Migrations
When schema changes are needed:
```bash
# Create migration
npx prisma migrate dev --name add_new_feature

# Deploy to production
npx prisma migrate deploy
```

### Data Migration
Currently no automatic migration from in-memory to database. Options:
1. **Fresh Start**: Users re-register (current approach)
2. **Export/Import**: Build migration tool (future enhancement)
3. **Dual Write**: Write to both systems during transition (complex)

## Performance Considerations

### Indexes
Strategic indexes for common queries:
- `User.username` - Unique index for login
- `EndlessScore.score` - Descending index for leaderboards
- `EndlessScore.userId` - For user-specific queries
- `DailyChallengeScore` - Composite index on userId + date

### Connection Pooling
Prisma manages connection pooling automatically:
- Default pool size: 10 connections
- Configurable via `DB_CONNECTION_LIMIT`

### Query Optimization
- Raw SQL for complex aggregations
- Selective field fetching
- Proper use of relations and includes

## Security

### Password Storage
- Bcrypt hashing with salt rounds of 10
- Passwords never stored in plain text
- Hash comparison for authentication

### SQL Injection Prevention
- Prisma parameterized queries
- No raw string concatenation
- Input validation at API layer

### Data Isolation
- Users can only access their own data
- JWT tokens validate user identity
- Role-based access control ready

## Monitoring and Debugging

### Prisma Studio
Visual database browser:
```bash
npx prisma studio
```

### Query Logging
Enable in development:
```typescript
new PrismaClient({
  log: ['query', 'error', 'warn']
})
```

### Health Checks
- Database connection status
- Migration status
- Active connection count

## Future Enhancements

### Planned Features
1. **Redis Caching Layer** - Cache leaderboards and hot data
2. **Data Migration Tools** - Import/export user data
3. **Audit Logging** - Track all data changes
4. **Soft Deletes** - Archive instead of hard delete
5. **Read Replicas** - Scale read operations

### Optimization Opportunities
1. **Materialized Views** - Pre-computed leaderboards
2. **Partitioning** - Split large tables by date
3. **Column Compression** - Reduce storage size
4. **Query Result Caching** - Application-level caching

## Conclusion

The PokeWave database architecture provides a robust foundation for data persistence while maintaining the flexibility needed for development. The dual-storage approach ensures that developers can work efficiently while the production system maintains data integrity and performance.