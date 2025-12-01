# PokeWave Project Context

## Project Overview
PokeWave is a web-based Pokemon battle prediction game where users predict the winner of simulated battles between randomly selected Pokemon. The system uses Pokemon Showdown's battle engine to simulate battles between two Pokemon and challenges users to correctly identify which Pokemon will win.

**Current Status**: The game is fully functional with additional features including Pokedex, Daily Challenges, User Authentication, Leaderboards, and Online Mode.

## Implementation Status

### ✅ Phase 10 - Online Mode (Complete)
**Status**: Fully functional real-time multiplayer mode
**Recent Features**:
- **Online Mode System**:
  - Real-time synchronized battles visible to all players worldwide
  - 40-second round cycles (30s guessing + 10s results)
  - WebSocket-based communication for live updates
  - Players compete to predict win percentages closest to actual simulation
  - Full Pokemon cards (FullCard component) showing complete battle details
- **Spectator/Player Mode System**:
  - Players default to spectating mode when joining
  - "Join Next Round" button to enter playing mode (effective next round)
  - "Leave Game" button to return to spectating (after current round)
  - Players list separated into "Playing" and "Spectating" tabs
  - Mode transitions occur at round boundaries for fairness
- **Elo Rating System**:
  - Expected rank-based Elo calculation using standard Elo formula
  - Zero-sum system: total Elo gained = total Elo lost across all players
  - High Elo beating low Elo = small gain (expected outcome)
  - Low Elo beating high Elo = big gain (upset victory)
  - Base Elo change of ±15 points per round maximum
  - Rank tiers: Bronze (0-1199), Silver (1200-1399), Gold (1400-1599), Platinum (1600-1799), Diamond (1800-1999), Master (2000+)
  - Solo players can practice without Elo changes (minimum 2 players required)
- **Results Phase Features**:
  - All player guesses shown on slider with Pokemon sprite avatars
  - Hover tooltips show player username, guess, and Elo
  - Current user's guess highlighted with higher z-index
- **Real-time Features**:
  - Live player list showing online users with submission status
  - Smooth animated timer ring using requestAnimationFrame
  - Instant results broadcast with accuracy scores and Elo changes
  - Simple incrementing round counter (starts at 1, persisted in database)
- **Backend Infrastructure**:
  - Socket.IO WebSocket gateway for real-time communication
  - `OnlineRound`, `OnlineElo`, `OnlineGuess`, `OnlinePresence`, `OnlineGameState` Prisma models
  - Deterministic Pokemon pairing using seeded random from round number
  - 1000 battle simulations per round for accuracy
- **Frontend Components**:
  - `OnlineMode.tsx` main component with FullCard battle display
  - `PlayerModeControl` component for Join/Leave buttons
  - `OnlinePlayersList` with Playing/Spectating tabs
  - `RoundTimer` with smooth CSS animation
  - Zustand store for Online Mode state management
  - `useOnlineSocket` hook for WebSocket connection handling
  - `TypeColorSlider` with player guess markers for results phase

### ✅ Phase 9 - User Authentication & Leaderboards (Complete)
**Status**: Fully functional with user accounts and competitive leaderboards
**Recent Features**:
- **User Authentication System**:
  - JWT-based authentication with sign-up/sign-in functionality
  - User profiles with customizable avatars from unlocked Pokemon
  - Avatar selection includes both regular and shiny Pokemon sprites
  - Default avatar is Pikachu (#25)
  - Persistent auth state with Zustand
- **Profile System**:
  - User profile page showing username, join date, and battle statistics
  - Avatar displayed in navigation bar and profile page
  - Edit button to change avatar from unlocked Pokemon collection
  - Search functionality in avatar selection modal
- **Leaderboard System**:
  - Endless mode high scores tracked per user
  - Global leaderboard showing top 50 players
  - Displays rank, username, avatar, high score, total runs
  - Gold/silver/bronze badges for top 3 players
  - Current user's row highlighted
  - Automatic score submission when endless mode game ends
- **UI Updates**:
  - Removed redundant Stats tab (info available on Profile)
  - Removed duplicate Profile button in navigation
  - Removed stats display below battle screen
  - Cleaner, more focused interface

### ✅ Phase 8 - Pokedex & Daily Challenges (Complete)
**Status**: Fully functional with Pokedex collection system and daily challenge mode
**Recent Features**:
- **Pokedex System**:
  - Complete Pokedex showing all 1025 Pokemon from generations 1-9
  - Unlock system where Pokemon appear grayed out until guessed correctly
  - Collection tracking with count display for each Pokemon
  - Shiny Pokemon system with 1/50 (2%) chance
  - Generation filtering and search functionality
  - Separate tracking for regular and shiny Pokemon
- **Daily Challenge Mode**:
  - 6 simultaneous battles presented in a 2x3 grid
  - Backend generates and stores daily challenges with consistent seeding
  - Challenges available for past 7 days + today + next 2 days
  - Scoring system: 1 point per percentage off (lower is better)
  - Best score tracking with persistent storage
  - Expandable sidebar panel showing all available challenges
  - Red triangle indicator showing correct answer after submission
- **UI Enhancements**:
  - Type-colored sliders showing Pokemon type colors
  - Compact battle cards for daily mode with dynamic sprite sizing
  - Full Pokemon card details shown on hover in daily mode
  - Pixelated image rendering for crisp sprite display

### ✅ Phase 7 - Core Fixes & Battle System (Complete)
**Status**: Fixed all critical issues, battle system fully operational
**Fixed Issues**:
- Battle count restored to 100 battles (configured in shared config)
- Battle service re-enabled with full scoring functionality
- Performance optimized with proper caching
- All TypeScript errors resolved

**Recent Updates**:
- **Pokemon Instance System**:
  - New `/api/pokemon/random-instances` endpoint returns complete Pokemon data
  - Pokemon instances include: stats, moves, abilities, items, types, sprites, IVs, EVs, nature
  - Support for flexible level settings (fixed or random levels)
  - Support for item settings (random with 50% chance or none)
  - Now includes detailed move, ability, and item information from data stores
- **Data Stores Implementation**:
  - Created persistent stores for moves, items, and abilities fetched from PokeAPI
  - 3-tier storage architecture: in-memory cache, Redis (24hr TTL), permanent JSON files
  - Stores initialized in parallel on server startup for optimal performance
  - Move store provides: type, power, accuracy, category, PP for each move
  - Item store provides: effects, sprites, cost, attributes for each item
  - Ability store provides: effects, descriptions, compatible Pokemon for each ability
- **Frontend Integration**:
  - Frontend now fetches full Pokemon instances before battle simulation
  - Displays comprehensive Pokemon stats calculated with level, IVs, EVs, and nature
  - Shows Pokemon abilities, held items (or "No Item"), and nature
  - "Perfect IVs" indicator displayed for all Pokemon
  - Move buttons colored by type with hover tooltips showing power, accuracy, PP
  - Ability badges with hover tooltips showing effect descriptions
  - Item badges with hover tooltips showing effects and item sprites
  - Ensured consistent 2x2 grid layout for moves regardless of move count
- **API Query Parameters**:
  - `generation`: Pokemon generation (1-9, default: 1)
  - `level_mode`: "fixed" or "random" (default: "fixed")
  - `level`: Fixed level value (default: 50)
  - `min_level`/`max_level`: Range for random levels (default: 1-100)
  - `item_mode`: "random" or "none" (default: "random")
  - `no_items`: Boolean alternative to disable items

### ✅ Phase 5 - Data Source Optimization (Complete)
**Status**: Fully optimized with Pokemon Showdown data and learnset enforcement
**Previous Updates**:
- Pokemon Showdown (@pkmn packages) provides: stats, types, moves, abilities, battle mechanics
- PokeAPI only provides: sprite images (front, back, shiny)
- Battle Simulation: Always simulates exactly 17 battles
- Strict enforcement of level-up moves only
- Learnset data preloaded on server startup

### ✅ Phase 4 Complete - UI Framework Migration
**Status**: Successfully migrated to Mantine UI framework
**Migration Details**:
- **Replaced**: shadcn/ui + Tailwind CSS → Mantine UI + Tabler Icons
- **Improved**: Theme system with Mantine's built-in dark/light mode
- **Enhanced**: Responsive design with Mantine's Grid system
- **Modernized**: Components now use Mantine's Card, Button, Badge, Slider, AppShell
- **Maintained**: All existing functionality including percentage prediction system
- **Note**: BattleHistory component temporarily removed during migration (needs rebuild with Mantine)

### ✅ Phase 3 Complete - Polish & Features 
**Status**: All major features implemented and working
**Last Commit**: 70aefb0 - "feat: Complete Phase 3 - Polish & Features with Pokemon sprites and enhanced streak tracking"

### ✅ Phase 2 Complete - Core Game Loop  
**Status**: Fully implemented and working
**Last Commit**: fe71783 - "Complete game loop implementation with guess result feedback"

## Game Flow (Current State)
1. **Pokemon Generation**: System creates two random Pokemon instances with full battle data ✅
   - Fetches from `/api/pokemon/random-instances` endpoint
   - Includes calculated stats, abilities, items, moves, nature, IVs/EVs
   - Supports fixed or random levels, with or without items
2. **Battle Simulation**: Pokemon Showdown engine simulates battles ⚠️
   - **ISSUE**: Simulates 170 battles instead of configured 17
   - Causes significant performance degradation
3. **User Prediction**: User predicts win percentage using a slider ✅
   - UI works correctly
4. **Result Feedback**: Frontend calculates results locally ⚠️
   - **ISSUE**: Backend scoring is disabled (battle.service.ts commented out)
   - Frontend uses local evaluation only
5. **Score Tracking**: Points, streak, accuracy percentage tracked in frontend only ⚠️
   - Works but not validated by backend
6. **Auto-Continue**: New battle automatically generated after results are shown ✅

## Technical Architecture

### Database Architecture
**Status**: ✅ Fully implemented with dual-storage support

PokeWave uses a flexible dual-storage architecture that supports both:
- **In-Memory Storage** (default): Fast development with Map-based storage
- **PostgreSQL Database**: Production-ready persistent storage

For comprehensive database documentation, see [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md).

**Key Features**:
- Seamless switching via `USE_DATABASE` environment variable
- Prisma ORM for type-safe database access
- Service factory pattern for storage abstraction
- Complete data models for users, scores, pokedex, and statistics
- Docker-based PostgreSQL setup for easy local development

### Backend (Express + TypeScript) - Port 4000
**Status**: ✅ Fully functional

#### Core Features
- **Pokemon Showdown Integration**: Real battle simulation using @pkmn/sim, @pkmn/dex, @pkmn/sets
- **Battle Engine**: Statistical simulation with type advantages and level scaling
- **API Endpoints**:
  - `GET /health` - Health check
  - `GET /api/pokemon/random` - Random Pokemon data
  - `POST /api/battle/simulate` - Simulate 10 battles between two Pokemon
  - `POST /api/battle/guess` - Submit Pokemon selection guess
- **Caching**: Redis integration with graceful fallback
- **Error Handling**: Comprehensive middleware with proper HTTP status codes
- **Logging**: Winston logger with structured logging

#### Key Services
- **Pokemon Showdown Service** (`pokemon-showdown.service.ts`): 
  - Primary battle engine integration using @pkmn packages
  - Provides Pokemon stats, types, moves, and abilities
  - Handles all battle simulations (100 battles per request, configured in shared/config/battle.config.ts)
  - Generates type-appropriate move pools for each Pokemon
  - Fetches move, item, and ability details from respective stores
  - Creates Pokemon instances with 2% (1/50) shiny chance
- **Battle Service** (`battle.service.ts`): 
  - Orchestrates battle flow and game state
  - Manages guess validation and scoring logic
  - Handles battle result caching
- **Pokemon Service** (`pokemon.service.ts`): 
  - **ONLY** fetches sprite images from PokeAPI
  - No longer provides stats, types, or moves (these come from Pokemon Showdown)
  - Caches sprite URLs for 24 hours
- **Pokemon Move Store Service** (`pokemon-move-store.service.ts`):
  - Fetches and stores all Pokemon moves from PokeAPI
  - 3-tier storage: in-memory cache, Redis (24hr TTL), permanent JSON file
  - Provides move details including type, power, accuracy, category, PP
  - Initialized on server startup
- **Pokemon Item Store Service** (`pokemon-item-store.service.ts`):
  - Fetches and stores all Pokemon items from PokeAPI
  - Same 3-tier storage architecture as move store
  - Provides item effects, sprites, cost, and attributes
  - Initialized on server startup
- **Pokemon Ability Store Service** (`pokemon-ability-store.service.ts`):
  - Fetches and stores all Pokemon abilities from PokeAPI
  - Same 3-tier storage architecture as other stores
  - Provides ability effects and which Pokemon can have them
  - Initialized on server startup
- **Pokemon Instance Store Service** (`pokemon-instance-store.service.ts`):
  - Stores complete Pokemon instance data for reuse across battles
  - Maintains instance IDs for consistent Pokemon in daily challenges
  - Enables backend-driven battle scenarios
  - **Stores generation alongside Pokemon instances** for correct battle mechanics
  - Generation is passed to showdownService for battle simulation
- **Daily Challenge Service** (`daily-challenge.service.ts`):
  - Generates daily challenges with 6 unique Pokemon battles
  - Uses date-based seeding for consistent challenge generation
  - Stores challenges for past 7 days + today + next 2 days
  - Each battle simulated 100 times for accurate win rates
  - Automatic cleanup of old challenges
- **Online Round Service** (`online-round.service.ts`):
  - Manages synchronized global rounds with simple incrementing counter
  - Round number persisted in `OnlineGameState` database table
  - Generates deterministic Pokemon pairs using seeded random from round number
  - Tracks round start time for phase calculations
  - Cleans up rounds older than 24 hours
- **Online Elo Service** (`online-elo.service.ts`):
  - Expected rank-based Elo calculation using standard Elo formula
  - Zero-sum system ensuring total gains = total losses
  - High Elo vs low Elo matchups yield appropriate rewards
  - Manages rank tiers from Bronze to Master
  - Processes round results and updates player Elo
  - Provides leaderboard and user stats
- **Online WebSocket Gateway** (`websocket/online.gateway.ts`):
  - Socket.IO server for real-time communication
  - JWT-based authentication for connected clients
  - Tick loop broadcasts time updates every second
  - Handles phase transitions and result broadcasting
- **Showdown Service** (`showdown.service.ts`): 
  - Simple wrapper that delegates to pokemon-showdown.service.ts
- **Cache Service**: Redis caching with graceful fallback to in-memory
- **Logger**: Winston structured logging for debugging and monitoring

### Frontend (React + Vite + TypeScript) - Port 4001
**Status**: ✅ Fully functional with Mantine UI

#### Core Features
- **Game Interface**: Complete battle prediction UI with Pokemon cards and percentage slider
- **State Management**: Zustand store for game state persistence
- **API Integration**: Axios-based service layer with error handling
- **Theme Support**: Dark/light mode with Mantine's built-in theme system
- **Responsive Design**: Mobile-first with Mantine's responsive Grid system
- **Real-time Stats**: Score, streak, accuracy, and battle count tracking
- **Animations**: Framer Motion animations and transitions throughout
- **Battle History**: Persistent battle tracking with detailed analytics (temporarily disabled during migration)
- **Streak Tracking**: Visual streak indicators and celebration animations
- **Percentage Prediction**: Slider-based prediction system requiring 10% accuracy

#### Key Components
- **BattleArena**: Main game interface with Pokemon cards and percentage slider prediction
- **MainLayout**: Mantine AppShell-based layout with navigation and theme toggle
- **GameDashboard**: Statistics and game state display with tabbed interface using Mantine components
- **Pokedex**: Complete Pokemon collection display with search, filtering, and unlock tracking
- **DailyMode**: Daily challenge interface with 6 simultaneous battles in 2x3 grid
- **CompactBattleCard**: Condensed Pokemon card for daily mode with dynamic sizing
- **TypeColorSlider**: Custom slider showing Pokemon type colors with correct answer indicator
- **Loading Components**: PokeBall and battle loading animations
- **Transition Components**: Framer Motion animation wrappers
- **StreakCelebration**: Particle-based streak celebration animations
- **API Service**: Complete service layer for backend communication including daily challenges
- **Game Store**: Zustand state management with persistence
- **Pokedex Store**: Tracks unlocked Pokemon and collection counts
- **Daily Challenge Store**: Persists daily challenge scores and best attempts

### Data Flow
```
User Interaction → Frontend (React) → API Service (Axios) → Backend (Express)
                                                                ↓
                                                         Battle Controller
                                                                ↓
                                                         Battle Service
                                                           ↙        ↘
                                         Pokemon Showdown Service    Pokemon Service
                                          (stats, types, moves)      (sprites only)
                                                    ↓                      ↓
                                              @pkmn packages           PokeAPI
                                                    ↓
                                           17 Battle Simulations
                                                    ↓
                                              Cache (Redis)
                                                    ↓
                                             Frontend Display
                                                    ↓
                                    Score/Streak/History → User Feedback
```

## Project Structure
```
pokewave/
├── backend/              # Express + TypeScript API
│   ├── src/
│   │   ├── controllers/  # API controllers
│   │   ├── routes/       # Route definitions
│   │   ├── services/     # Business logic (Showdown, Battle, Cache)
│   │   ├── middleware/   # Express middleware
│   │   ├── lib/          # Database connection (Prisma)
│   │   ├── config/       # Configuration files
│   │   └── utils/        # Utilities
│   ├── prisma/           # Database schema and migrations
│   ├── package.json
│   └── tsconfig.json
├── frontend/             # React + Vite frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── battle/   # Battle-related components (BattleView, PokemonCard, BattleHistory)
│   │   │   ├── game/     # Game UI components (GameDashboard)
│   │   │   ├── layout/   # Layout components
│   │   │   └── ui/       # Reusable UI components (Loading, Transitions, StreakCelebration)
│   │   ├── services/     # API service layer
│   │   ├── store/        # Zustand state management
│   │   ├── types/        # TypeScript types
│   │   └── lib/          # Utilities
│   ├── package.json
│   └── tailwind.config.js
├── POKEWAVE_CONTEXT.md   # This file
├── DATABASE_ARCHITECTURE.md # Database structure and persistence documentation
├── DATABASE_SETUP.md     # Database setup instructions
├── BATTLETESTER_CONTEXT.md # Battle Tester feature documentation
├── ImplementationSpec.md # Technical specification
├── docker-compose.yml    # Docker configuration for PostgreSQL & Redis
└── README.md            # Setup instructions
```

## Key Technologies

### Backend Stack
- **Express.js 5.x**: Web framework with TypeScript
- **Pokemon Showdown**: Battle simulation engine (@pkmn/sim, @pkmn/dex, @pkmn/sets)
- **PostgreSQL**: Persistent database storage (optional, via Docker)
- **Prisma ORM**: Type-safe database access and migrations
- **Redis**: Caching layer (optional, graceful fallback)
- **Winston**: Structured logging
- **TypeScript**: Strict type checking
- **Docker Compose**: Container orchestration for PostgreSQL and Redis

### Frontend Stack
- **React 19**: UI framework with TypeScript
- **Vite**: Build tool and development server
- **Zustand**: State management with persistence
- **Mantine UI**: Modern component library with built-in theme system
- **Tabler Icons**: Icon library for consistent iconography
- **Framer Motion**: Animation library for smooth transitions
- **Axios**: HTTP client for API communication
- **React Router**: Client-side routing

## Development Environment

### Backend Development
```bash
cd backend
npm install
npm run dev  # Starts on port 4000
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev  # Starts on port 4001
```

### Optional: Redis Cache
```bash
# If Docker is available
docker compose up -d redis
```

### Optional: PostgreSQL Database
```bash
# For persistent storage (requires Docker)
docker compose up -d postgres

# Run database migrations
cd backend
npx prisma migrate dev --name init

# Enable database mode in .env
echo "USE_DATABASE=true" >> .env
```

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed setup instructions.

## API Documentation

### Battle Simulation
```bash
POST /api/battle/simulate
Content-Type: application/json

{
  "pokemon1Id": 1,
  "pokemon2Id": 4,
  "options": {
    "generation": 9,
    "pokemon1Level": 50,
    "pokemon2Level": 50
  }
}

Response:
{
  "battleId": "uuid",
  "pokemon1": { 
    "id": 1, 
    "name": "Bulbasaur", 
    "level": 50, 
    "wins": 418,
    "types": ["grass", "poison"],
    "sprites": {
      "front": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
      "back": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/1.png",
      "shiny": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/1.png"
    }
  },
  "pokemon2": { 
    "id": 4, 
    "name": "Charmander", 
    "level": 50, 
    "wins": 582,
    "types": ["fire"],
    "sprites": {
      "front": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png",
      "back": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/4.png",
      "shiny": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/4.png"
    }
  },
  "totalBattles": 10,
  "winRate": 41.8,
  "executionTime": 12
}
```

### Guess Submission
```bash
POST /api/battle/guess
Content-Type: application/json

{
  "battleId": "uuid",
  "guessPercentage": 65  # Percentage prediction (0-100)
}

Response:
{
  "battleId": "uuid",
  "guessPercentage": 65,
  "actualWinRate": 58.2,
  "isCorrect": true,
  "accuracy": 6.8,
  "points": 18,
  "message": "Great job! You predicted within 10% accuracy!"
}
```

### Daily Challenge Endpoints
```bash
# Get today's daily challenge
GET /api/daily-challenge/today

Response:
{
  "challenge": {
    "id": "uuid",
    "date": "2025-07-22",
    "battles": [
      {
        "battleId": "uuid",
        "pokemon1": { /* full Pokemon instance data */ },
        "pokemon2": { /* full Pokemon instance data */ },
        "winRate": 0.45,  # Decimal (0-1)
        "totalBattles": 100,
        "executionTime": 1234
      }
      // ... 5 more battles
    ],
    "createdAt": "2025-07-22T12:00:00.000Z",
    "expiresAt": "2025-08-21T12:00:00.000Z"
  },
  "isToday": true,
  "dayOfWeek": "Monday"
}

# Get available challenges
GET /api/daily-challenge/available

# Get specific date's challenge
GET /api/daily-challenge/2025-07-22

# Refresh all challenges (admin)
POST /api/daily-challenge/refresh
```

### Online Mode Endpoints
```bash
# Get current round state
GET /api/online/round/current

Response:
{
  "roundNumber": 12345678,
  "phase": "guessing",  # or "results"
  "timeRemaining": 25,
  "pokemon1": { /* full Pokemon instance data */ },
  "pokemon2": { /* full Pokemon instance data */ },
  "actualWinPercent": 65.2,  # Only in results phase
  "totalParticipants": 5
}

# Submit a guess (authenticated)
POST /api/online/guess
Content-Type: application/json
Authorization: Bearer <token>

{
  "roundNumber": 12345678,
  "guess": 65  # 0-100 percentage
}

Response:
{
  "success": true,
  "guessId": "uuid",
  "roundNumber": 12345678,
  "guess": 65
}

# Get round results
GET /api/online/round/:roundNumber/results

# Get global leaderboard
GET /api/online/leaderboard?limit=100

# Get user's online stats (authenticated)
GET /api/online/stats

# Get currently online players
GET /api/online/players

# Join online mode (authenticated)
POST /api/online/join

# Leave online mode (authenticated)
POST /api/online/leave

# Heartbeat for presence (authenticated)
POST /api/online/heartbeat
```

### Online Mode WebSocket Events
```
WebSocket Path: /ws/online

# Client → Server
authenticate: { token: string }
heartbeat: {}
guess-submitted: {}
set-mode: { mode: 'spectating' | 'playing' }

# Server → Client
authenticated: { success: boolean, userId?: string, error?: string }
round-state: OnlineRoundState
tick: { roundNumber, phase, timeRemaining }
new-round: OnlineRoundState
round-results: { roundNumber, actualWinPercent, results: OnlineGuessResult[] }
players-update: OnlinePlayer[]  # Includes mode field for each player
```

## Scoring System
- **Base Points**: 20 points for correct guess (within 10% accuracy)
- **Accuracy Bonus**: Additional points based on prediction accuracy
- **Difficulty Bonus**: Up to 10 additional points for close battles (near 50/50)
- **Streak Tracking**: Consecutive correct guesses
- **Accuracy Calculation**: Percentage of correct guesses over time

## Current System State

The game is now fully functional with all features working as intended. Recent additions include Online Mode for real-time multiplayer battles with Elo ranking, a complete Pokedex system with shiny Pokemon tracking, and a daily challenge mode with persistent scoring.

## Known Working Features
- ✅ Real Pokemon battle simulation with 100 battles per simulation
- ✅ Pokemon data from authoritative sources:
  - Stats, types, moves, abilities from Pokemon Showdown (@pkmn)
  - Sprite images from PokeAPI
  - Move validation from local @pkmn/dex learnset data
  - Move details (power, accuracy, PP) from pokemon-move-store
  - Item details (effects, sprites) from pokemon-item-store
  - Ability details (effects, descriptions) from pokemon-ability-store
- ✅ Strict level-up move enforcement (no invalid moves)
- ✅ Interactive Pokemon cards with sprites and types
- ✅ Move buttons colored by Pokemon type with hover tooltips
- ✅ Ability and item badges with detailed hover tooltips
- ✅ Percentage-based prediction system with slider (0-100%)
- ✅ 10% accuracy requirement for scoring points
- ✅ Score tracking and persistence via Zustand
- ✅ Dark/light theme support with Mantine theme system
- ✅ Mobile-responsive design with Mantine Grid
- ✅ Comprehensive error handling and user feedback
- ✅ Battle result caching (Redis with fallback) with version-based invalidation
- ✅ Automatic battle generation after each guess
- ✅ Accurate battle simulation with Pokemon Showdown engine
- ✅ Streak tracking with visual indicators
- ✅ Streak celebration animations with particles
- ✅ Loading animations with accurate battle count display
- ✅ Comprehensive analytics and game statistics
- ✅ 15-second timeout for battle API calls (handles cold starts)
- ✅ Preloaded learnset data for improved performance
- ✅ Battle Tester tool for turn-by-turn battle visualization
- ✅ Persistent data stores for moves, items, and abilities
- ✅ Complete Pokedex system with:
  - All 1025 Pokemon from generations 1-9
  - Unlock tracking for discovered Pokemon
  - Collection count display
  - Shiny Pokemon system (1/50 chance)
  - Generation filtering and search
  - Persistent storage via Zustand
- ✅ Daily Challenge mode with:
  - 6 simultaneous battles per day
  - Backend-generated challenges with consistent seeding
  - Past 7 days + today + next 2 days available
  - Scoring system (1 point per % off, lower is better)
  - Best score tracking and persistence
  - Expandable challenge selection panel
  - Red arrow indicators showing correct answers
- ✅ Online Mode with:
  - Real-time synchronized battles for all players worldwide
  - 40-second round cycles (30s guessing + 10s results)
  - WebSocket-based live updates (Socket.IO)
  - Expected rank-based zero-sum Elo system
  - Rank tiers: Bronze, Silver, Gold, Platinum, Diamond, Master
  - Spectator/Player mode system with round-boundary transitions
  - Live player list with Playing/Spectating tabs
  - Player guess markers on slider during results phase
  - Smooth animated timer ring with requestAnimationFrame
  - Simple incrementing round counter (persisted in database)
  - Solo practice mode (no Elo change with single player)
  - Global leaderboard with rank badges
- ✅ Enhanced UI components:
  - Type-colored sliders for battle predictions
  - Compact battle cards with dynamic sprite sizing
  - Pixelated image rendering for crisp sprites
  - Full Pokemon details on hover in daily mode

## Battle Tester Feature
The Battle Tester is a debugging tool that shows detailed turn-by-turn breakdowns of individual battles.
For comprehensive documentation, see [BATTLETESTER_CONTEXT.md](./BATTLETESTER_CONTEXT.md).

### Quick Overview:
- **Purpose**: Visualize individual battle mechanics turn-by-turn
- **Access**: Click the sword icon on the right side of the battle screen
- **Data Flow**: Frontend → Backend API → Pokemon Showdown simulation → Turn data → Display
- **Endpoint**: `POST /api/battle/simulate-single`
- **Shows**: Moves used, damage dealt, HP remaining, critical hits, type effectiveness

## Testing Current State

### Backend Health Check
```bash
curl http://localhost:4000/health
# Returns: {"status":"OK","timestamp":"..."}
```

### Frontend Access
```bash
cd frontend && npm run dev
# Opens browser to http://localhost:4001
```

### Battle Simulation Test
```bash
curl -X POST http://localhost:4000/api/battle/simulate \
  -H "Content-Type: application/json" \
  -d '{"pokemon1Id": 1, "pokemon2Id": 4}'
```

## Future Development Opportunities

### Phase 5 Possibilities
- **Battle History Restoration**: Rebuild BattleHistory component with Mantine UI
- **Additional Game Modes**: Daily challenges, survival mode, tournament bracket
- **Enhanced Pokemon Data**: Abilities, moves, detailed stats from PokeAPI  
- **Leaderboards**: Global and friend rankings
- **Multiplayer**: Challenge friends to prediction battles
- **Advanced Statistics**: Win rate trends, favorite Pokemon, type effectiveness analysis
- **Difficulty Ramping**: Adaptive gameplay based on performance
- **Sound Effects**: Audio feedback for battles and streaks

### Technical Improvements
- **Performance**: Battle simulation optimization
- **Caching**: Enhanced caching strategies
- **Testing**: Unit and integration tests
- **Monitoring**: Performance metrics and alerts
- **Deployment**: Docker containerization and CI/CD
- **Component Library**: Complete migration of remaining components to Mantine

## Recent Improvements

### Performance Optimizations
- Battle count optimized to 100 battles (from previous 170)
- Caching properly implemented for battle results and Pokemon data
- Parallel data fetching for improved loading times
- Preloaded data stores for moves, items, and abilities

### Architecture Improvements
- Pokemon instance store properly implemented with unique IDs
- Daily challenge service with automatic generation and cleanup
- Consistent type interfaces across all services
- Proper error handling and recovery mechanisms

### UI/UX Enhancements
- Complete Pokedex with visual unlock system
- Daily challenge mode for varied gameplay
- Type-colored sliders for better visual feedback
- Responsive design improvements for mobile
- Pixelated rendering for crisp sprite display

## AI Developer Notes

### Starting Development
1. **Both servers must be running** - backend on port 4000, frontend on port 4001
2. **Game loop is complete** - users can play immediately with percentage prediction system
3. **Data sources are split**:
   - Pokemon Showdown (@pkmn) provides all gameplay data (stats, types, moves)
   - PokeAPI only provides sprite images
4. **Battle count is configured at 100** - Set in shared/config/battle.config.ts
5. **Modular architecture** - easy to extend with new features
6. **Phase 5 complete** - Data sources optimized for performance and accuracy

### Critical Implementation Details
1. **Battle Simulation**:
   - Simulates 100 battles per request (configured in shared config)
   - Each battle uses Pokemon Showdown's engine for accurate mechanics
   - Pokemon moves are strictly validated against their level-up learnset
   - Move IDs must be lowercase without spaces for Pokemon Showdown (e.g., 'thundershock' not 'Thunder Shock')
   - Frontend has 15-second timeout for battle simulations
   - Battle service fully functional with scoring and validation

2. **Data Flow**:
   - `pokemon-showdown.service.ts` is the primary service for Pokemon data and battle engine
   - `pokemon.service.ts` ONLY provides sprites (getPokemonSprites method)
   - Learnset data loaded from `@pkmn/dex/build/learnsets-DJNGQKWY.js`
   - The old `getPokemonById` method is deprecated and returns 501 error

3. **Caching Strategy**:
   - Battle results cached for 1 hour (cache key includes version for invalidation)
   - Pokemon sprites cached for 24 hours
   - Learnset data preloaded and cached in memory on server startup
   - Redis optional with graceful in-memory fallback

### Key Files to Understand
- `backend/src/services/pokemon-showdown.service.ts` - Primary Pokemon data and battle engine
- `backend/src/services/battle.service.ts` - Game orchestration and scoring logic
- `backend/src/services/pokemon.service.ts` - Sprite fetching ONLY (not full Pokemon data)
- `backend/src/services/pokemon-move-store.service.ts` - Move data storage and retrieval
- `backend/src/services/pokemon-item-store.service.ts` - Item data storage and retrieval
- `backend/src/services/pokemon-ability-store.service.ts` - Ability data storage and retrieval
- `backend/src/services/pokemon-instance-store.service.ts` - Pokemon instance storage for reuse
- `backend/src/services/daily-challenge.service.ts` - Daily challenge generation and management
- `frontend/src/components/battle/BattleArena.tsx` - Main game UI with prediction slider
- `frontend/src/components/pokedex/Pokedex.tsx` - Complete Pokedex display with search/filter
- `frontend/src/components/game/DailyMode.tsx` - Daily challenge interface
- `frontend/src/components/ui/TypeColorSlider.tsx` - Custom slider with type colors
- `frontend/src/store/gameStore.ts` - Persistent game state management
- `frontend/src/store/pokedexStore.ts` - Pokedex unlock and collection tracking
- `frontend/src/store/dailyChallengeStore.ts` - Daily challenge score persistence
- `frontend/src/store/onlineStore.ts` - Online Mode state management with Zustand
- `frontend/src/hooks/useOnlineSocket.ts` - WebSocket connection hook for Online Mode
- `frontend/src/components/game/OnlineMode.tsx` - Online Mode main component
- `frontend/src/services/api.ts` - API client with 15-second timeout for battle simulations
- `frontend/src/services/online.ts` - Online Mode API service
- `frontend/src/types/online.ts` - Online Mode TypeScript types
- `frontend/src/utils/typeColors.ts` - Pokemon type color mappings
- `backend/src/services/online-round.service.ts` - Online round management
- `backend/src/services/online-elo.service.ts` - Elo calculation service
- `backend/src/websocket/online.gateway.ts` - Socket.IO WebSocket gateway
- `backend/src/controllers/online.controller.ts` - Online Mode REST endpoints
- `backend/src/types/online.types.ts` - Online Mode backend types

### Common Tasks
- **Adding new Pokemon generations**: Update `GENERATION_RANGES` in pokemon.service.ts
- **Changing battle count**: Update `TOTAL_BATTLES` in shared/config/battle.config.ts (centralized)
- **Modifying scoring**: Update battle.service.ts point calculation logic
- **Working with moves**: Moves come from learnsets only - modify `getMovesFromLearnset` and `getLevelupMoves`
- **UI changes**: All components use Mantine UI (not Tailwind/shadcn)
- **Performance issues**: Check if sprites and learnsets are being cached properly
- **Timeout issues**: Frontend has 15s timeout for battles; backend preloads learnsets

### Common Pitfalls to Avoid
1. **Don't use getPokemonById** - it's deprecated, use Pokemon Showdown for data
2. **Don't change battle count** without updating both backend AND frontend
3. **Don't fetch full Pokemon data from PokeAPI** - only sprites
4. **Don't skip caching** - it significantly improves performance (especially learnsets)
5. **Remember Mantine UI** - project migrated from shadcn/Tailwind
6. **Don't use formatted move names in battles** - use move IDs (lowercase, no spaces)
7. **Don't give Pokemon invalid moves** - all moves must come from their learnset
8. **Watch for Promise.race TypeScript issues** - may need type assertions with BattleStreams
9. **Shared config imports** - backend tsconfig doesn't include ../shared by default
10. **Always pass generation to pokemonInstanceStore.storeInstances()** - battle mechanics depend on it

### Generation System
Pokemon Showdown uses different mechanics based on the selected generation. The generation setting affects:

**What changes per generation:**
| Feature | Gen 1 | Gen 2 | Gen 3+ |
|---------|-------|-------|--------|
| Items | ❌ No | ✅ Yes | ✅ Yes |
| Abilities | ❌ No | ❌ No | ✅ Yes |
| Natures | ❌ No | ❌ No | ✅ Yes |
| EV/IV System | DVs | DVs | Modern |
| Shiny | ❌ No | ✅ Yes | ✅ Yes |
| Move Pool | Limited | Expanded | Full |

**Implementation details:**
- `pokemonInstanceStore.storeInstances(p1, p2, generation)` - stores generation alongside Pokemon
- `showdownService` reads generation from the store for battle simulation
- `battle-cache.service.ts` uses `BATTLE_CONFIG.DEFAULT_GENERATION` from game-constants.ts
- Battle format uses `gen${generation}singles` for correct mechanics
- Pokemon creation via `createPokemonInstance()` uses `Dex.forGen(generation)` for accurate data
- Frontend passes `battleSettings.generation` with battle requests

**Max Pokemon IDs by generation:**
- Gen 1: 151, Gen 2: 251, Gen 3: 386, Gen 4: 493
- Gen 5: 649, Gen 6: 721, Gen 7: 809, Gen 8: 905, Gen 9: 1025

### Recent Updates (Phase 8 - Pokedex & Daily Challenges)
- **Pokedex Implementation**:
  - Complete Pokedex with all 1025 Pokemon from generations 1-9
  - Pokemon appear grayed out until unlocked by guessing correctly
  - Collection tracking shows count of each Pokemon caught
  - Shiny Pokemon system with 1/50 (2%) chance
  - Generation filtering (Gen 1-9) and search functionality
  - Persistent storage using Zustand with local storage
  - Fixed sprite alignment issues with Map-based approach
- **Daily Challenge Mode**:
  - 6 simultaneous battles presented in 2x3 grid layout
  - Backend generates challenges with date-based seeding for consistency
  - Each battle simulated 100 times for accurate win rates
  - Challenges stored for past 7 days + today + next 2 days
  - Scoring: 1 point per percentage off (lower is better)
  - Best score tracking with persistent storage
  - Expandable sidebar showing all available challenges
  - Red triangle indicator shows correct answer after submission
- **UI Enhancements**:
  - TypeColorSlider component with Pokemon type colors
  - CompactBattleCard for condensed battle display in daily mode
  - Dynamic sprite sizing based on prediction percentage
  - Full Pokemon card details on hover in daily mode
  - Pixelated image rendering for crisp sprite display
  - Fixed win percentage calculations (was showing 10000%)
- **Backend Services**:
  - Pokemon instance store for reusable Pokemon data
  - Daily challenge service with automatic generation and cleanup
  - Fixed winRate storage as decimal (0-1) instead of percentage
  - Refresh endpoint properly clears cache before regenerating

### Previous Updates (Phase 5 Completion)
- **Move Validation**: Removed `getRandomMoves` function, now strictly enforces level-up learnsets
- **Learnset Integration**: Uses `@pkmn/dex/build/learnsets-DJNGQKWY.js` for move data
- **Move ID Format**: Separated move IDs (for battle) from display names (for UI)
- **Performance**: Preloads learnsets on server startup to prevent cold start timeouts
- **Stream Management**: Added proper stream cleanup with `stream.destroy()`
- **Frontend Timeout**: Increased to 15 seconds for battle simulations
- **Error Handling**: Enhanced error messages for better debugging

**NOTE**: The project is now fully functional with all features working correctly. Recent additions include Pokedex collection tracking and daily challenge mode.

### UI Updates (Endless Mode & Range Slider Implementation)
- **Endless Mode**: Implemented endless mode with lives, score tracking, and range-based predictions
  - 3 lives system with score tracking and high score persistence
  - Range slider starts at 50% width, shrinks by 1% per correct guess (minimum 20%)
  - Lives, Score, and Best stats displayed vertically on the left sidebar
  - Removed bottom stats tabs (Score, Streak, Accuracy, Battles) in endless mode
- **Range Slider**: Custom `CenterDraggableRangeSlider` component for range predictions
  - Center dragging to move entire range while maintaining width
  - Hidden handle knobs and disabled individual dragging in endless mode
  - Proper offset tracking for smooth dragging experience
- **Scoring System**: 
  - Endless mode: 1 point per correct guess (result within range)
  - Regular mode: Points based on accuracy (closer = more points)
- **UI Improvements**:
  - Inverted slider logic: sliding right = right Pokemon wins more (intuitive)
  - Pokemon sprites dynamically resize based on predicted win percentage
  - Level displayed in top-left corner of Pokemon cards
  - Pokemon name centered in cards
  - All badges (type, ability, item) have consistent sizing (120px min width, 36px height)
  - VS text stays centered using absolute positioning
  - Results panel matches slider panel size to prevent UI shifting
  - Simplified result display: "Correct!" or "Incorrect!" only
  - Removed percentage increment labels (0%, 50%, 100%) below slider
  - Added space after Pokemon name, removed space after sprite

### Authentication & Profile Features
- **Backend Services**:
  - `auth.controller.ts`: Handles sign-up, sign-in, profile retrieval, and avatar updates
  - `user.service.ts`: In-memory user storage with username/password management
  - `auth.middleware.ts`: JWT verification for protected routes
  - Password hashing with bcryptjs, JWT tokens with 7-day expiry
- **Frontend Components**:
  - `SignInModal`: Combined sign-in/sign-up modal with form validation
  - `authStore.ts`: Zustand store for persistent auth state
  - `auth.ts`: Service layer for auth API calls
  - Avatar selection modal with search and Pokemon name display
- **Leaderboard Implementation**:
  - `leaderboard.service.ts`: Tracks endless mode scores per user
  - `leaderboard.controller.ts`: Endpoints for score submission and retrieval
  - In-memory storage with high score calculation
  - Automatic score submission on endless mode game over
  - Real-time leaderboard updates

### Recent Battle Mode Updates
- **Green Arrow Fix**: TypeColorSlider now uses `isCorrect` prop from backend instead of custom calculation
  - Frontend was checking 5% tolerance while backend uses 10% tolerance
  - Fixed inconsistency where slightly higher guesses weren't showing as correct
- **Pokedex Notifications**: Pokemon are automatically added to Pokedex on successful guesses
  - Custom `PokedexNotification` component shows Pokemon sprite in circular frame
  - Notifications only appear for newly unlocked Pokemon (not duplicates)
  - Shiny sprites shown when shiny Pokemon is caught
  - Notification duration reduced from 4000ms to 2500ms for quicker dismissal
- **Streak Celebration Removal**: Disabled flying text animations
  - Removed "Streak Started!" text that would rotate and fly across screen
  - Commented out `StreakCelebration` component and related state management
  - Cleaned up unused imports (ResultReveal, ScaleIn)
- **Range Indicators**: Added visual indicators for correct answer tolerance
  - Two vertical lines show ±10% range from correct answer in battle mode
  - Lines only appear when results are shown (after guess submission)
  - Smart boundary detection: lines hidden if they would appear at 0% or 100%
  - Helps users understand the acceptable range for correct guesses
- **Battle Tester Improvements**:
  - Fixed scrolling issues with proper absolute positioning inside relative container
  - Resolved nested `<p>` tag hydration errors by converting parent Text to Box
  - Used `component="span"` for inline text elements to maintain proper HTML structure
  - ScrollArea now correctly displays scrollbar when battle has many turns
  - **Battle Tester Panel Relocation**: Moved from right side panel to left side panel
    - Combined with Battle Settings in a single left panel with vertical icon navigation
    - Fixed collapsed state to show both Settings and Battle Tester icons vertically
    - Improved dark mode colors with semi-transparent backgrounds (15% opacity)
    - Replaced segmented control with cleaner vertical list layout when expanded
  - **Battle Simulation Consistency Fix**: Synchronized draw detection between single and bulk battles
    - Added HP tracking to bulk battle simulation (runSingleShowdownBattle)
    - Checks if declared winner has 0 HP (from Explosion, etc) and marks as draw
    - Fixes discrepancy where Explosion battles showed as draws in tester but not bulk mode
    - Both simulation methods now properly detect mutual KOs as draws

## Docker Production Deployment

### Container Architecture
PokeWave uses Docker Compose for production deployment with the following containers:

1. **pokewave-postgres**: PostgreSQL 16 database
   - Stores user data, pokedex, scores, and battle statistics
   - Volume: `pokewave_postgres_data`
   - Health checks enabled

2. **pokewave-redis**: Redis 7 cache
   - Caches Pokemon sprites, battle results, and API data
   - Volume: `pokewave_redis_data`
   - Configured with AOF persistence

3. **pokewave-backend**: Node.js Express API
   - Handles all game logic and Pokemon Showdown simulations
   - Runs on port 4000 internally
   - Non-root user (nodejs:1001) for security
   - Includes Prisma migrations on startup

4. **pokewave-frontend**: Nginx serving React app
   - Serves the built React application
   - Proxies `/api` and `/health` to backend
   - Internal nginx on port 80

5. **pokewave-nginx**: Main Nginx reverse proxy
   - Listens on ports 80 and 443 (public facing)
   - Handles SSL termination with Let's Encrypt certificates
   - Routes to frontend container
   - Includes security headers

6. **pokewave-certbot**: Let's Encrypt certificate management
   - Automatically renews SSL certificates
   - Certificates valid for 90 days

### Production Environment Files
- `.env.production`: Contains production secrets
  - `POSTGRES_PASSWORD`: Database password (no special chars to avoid URL encoding issues)
  - `JWT_SECRET`: Authentication token secret
  - `DOMAIN`: pokewave.fysho.dev
  - `LETSENCRYPT_EMAIL`: SSL certificate notifications

- `docker-compose.prod.yml`: Production Docker configuration
  - All services configured with proper networking
  - Health checks and restart policies
  - Volume persistence for data

### Networking
- All containers use `pokewave_pokewave-network` (bridge network)
- Internal container communication uses container names (e.g., `pokewave-backend:4000`)
- Only nginx exposes public ports (80/443)

### SSL/HTTPS Setup
1. Initial deployment uses HTTP-only nginx config
2. Certbot obtains certificates from Let's Encrypt
3. Nginx config updated to use SSL with HTTP→HTTPS redirect
4. Automatic renewal via certbot container

### Common Docker Commands
```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend

# View logs
docker logs pokewave-backend --tail 50

# Rebuild after code changes
docker-compose -f docker-compose.prod.yml build frontend
docker-compose -f docker-compose.prod.yml up -d frontend
```

### Known Issues & Solutions
1. **docker-compose v1.29.2 ContainerConfig error**: 
   - Use `docker run` directly or restart services individually
   - This is a known bug with the older docker-compose version

2. **Frontend API calls to localhost:4000**:
   - Update all API calls to use relative paths (`/api`)
   - Frontend nginx proxies these to the backend container

3. **Database connection issues**:
   - Ensure password doesn't contain special characters
   - Backend must use container name `postgres` not `localhost`

4. **502 Bad Gateway errors**:
   - Usually DNS resolution issues between containers
   - Restart affected containers to refresh DNS

### Production URLs
- Main application: https://pokewave.fysho.dev
- API endpoints: https://pokewave.fysho.dev/api/*
- Health check: https://pokewave.fysho.dev/health

### Deployment Process
1. Update code in `/opt/apps/PokeWave/`
2. Rebuild affected containers: `docker-compose -f docker-compose.prod.yml build [service]`
3. Restart services: `docker-compose -f docker-compose.prod.yml up -d`
4. Monitor logs: `docker logs [container-name] --follow`

### Multi-App Hosting
The server can host multiple applications using nginx virtual hosting:
- Each app gets its own subdomain (e.g., pokewave.fysho.dev, app2.fysho.dev)
- All apps share the same nginx container on ports 80/443
- Nginx routes based on `server_name` to different backend containers
- Each app has isolated containers and networks