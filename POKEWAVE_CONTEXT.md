# PokeWave Project Context

## Project Overview
PokeWave is a web-based Pokemon battle prediction game where users predict the winner of simulated battles between randomly selected Pokemon. The system uses Pokemon Showdown's battle engine to simulate 10 battles between two Pokemon and challenges users to correctly identify which Pokemon will win.

## Implementation Status

### ✅ Phase 6 - Pokemon Instance System (Complete)
**Status**: Full Pokemon instance creation with comprehensive battle data
**Last Commit**: 9460bd7 - "feat: Update frontend to use new random-instances endpoint"

**Recent Updates**:
- **Pokemon Instance System**:
  - New `/api/pokemon/random-instances` endpoint returns complete Pokemon data
  - Pokemon instances include: stats, moves, abilities, items, types, sprites, IVs, EVs, nature
  - Support for flexible level settings (fixed or random levels)
  - Support for item settings (random with 50% chance or none)
- **Frontend Integration**:
  - Frontend now fetches full Pokemon instances before battle simulation
  - Displays comprehensive Pokemon stats calculated with level, IVs, EVs, and nature
  - Shows Pokemon abilities, held items (or "No Item"), and nature
  - "Perfect IVs" indicator displayed for all Pokemon
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

## Game Flow
1. **Pokemon Generation**: System creates two random Pokemon instances with full battle data
   - Fetches from `/api/pokemon/random-instances` endpoint
   - Includes calculated stats, abilities, items, moves, nature, IVs/EVs
   - Supports fixed or random levels, with or without items
2. **Battle Simulation**: Pokemon Showdown engine simulates exactly 17 battles (configured in shared/config/battle.config.ts)
3. **User Prediction**: User predicts win percentage using a slider (must be within 10% accuracy to score)
4. **Result Feedback**: System shows correct/incorrect with accuracy percentage and points earned
5. **Score Tracking**: Points, streak, accuracy percentage, and total battles are persistently tracked
6. **Auto-Continue**: New battle automatically generated after results are shown

## Technical Architecture

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
  - Handles all battle simulations (17 battles per request, configured in shared/config/battle.config.ts)
  - Generates type-appropriate move pools for each Pokemon
- **Battle Service** (`battle.service.ts`): 
  - Orchestrates battle flow and game state
  - Manages guess validation and scoring logic
  - Handles battle result caching
- **Pokemon Service** (`pokemon.service.ts`): 
  - **ONLY** fetches sprite images from PokeAPI
  - No longer provides stats, types, or moves (these come from Pokemon Showdown)
  - Caches sprite URLs for 24 hours
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
- **Loading Components**: PokeBall and battle loading animations
- **Transition Components**: Framer Motion animation wrappers
- **StreakCelebration**: Particle-based streak celebration animations
- **API Service**: Complete service layer for backend communication
- **Game Store**: Zustand state management with persistence

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
│   │   └── utils/        # Utilities
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
├── BATTLETESTER_CONTEXT.md # Battle Tester feature documentation
├── ImplementationSpec.md # Technical specification
└── README.md            # Setup instructions
```

## Key Technologies

### Backend Stack
- **Express.js 5.x**: Web framework with TypeScript
- **Pokemon Showdown**: Battle simulation engine (@pkmn/sim, @pkmn/dex, @pkmn/sets)
- **Redis**: Caching layer (optional, graceful fallback)
- **Winston**: Structured logging
- **TypeScript**: Strict type checking

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

## Scoring System
- **Base Points**: 20 points for correct guess (within 10% accuracy)
- **Accuracy Bonus**: Additional points based on prediction accuracy
- **Difficulty Bonus**: Up to 10 additional points for close battles (near 50/50)
- **Streak Tracking**: Consecutive correct guesses
- **Accuracy Calculation**: Percentage of correct guesses over time

## Known Working Features
- ✅ Real Pokemon battle simulation with exactly 17 battles (configured in shared/config/battle.config.ts)
- ✅ Pokemon data from authoritative sources:
  - Stats, types, moves, abilities from Pokemon Showdown (@pkmn)
  - Sprite images from PokeAPI
  - Move validation from local @pkmn/dex learnset data
- ✅ Strict level-up move enforcement (no invalid moves)
- ✅ Interactive Pokemon cards with sprites and types
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

## AI Developer Notes

### Starting Development
1. **Both servers must be running** - backend on port 4000, frontend on port 4001
2. **Game loop is complete** - users can play immediately with percentage prediction system
3. **Data sources are split**:
   - Pokemon Showdown (@pkmn) provides all gameplay data (stats, types, moves)
   - PokeAPI only provides sprite images
4. **Battle count is configured at 17** - Set in shared/config/battle.config.ts (originally 100, then reduced to 10)
5. **Modular architecture** - easy to extend with new features
6. **Phase 5 complete** - Data sources optimized for performance and accuracy

### Critical Implementation Details
1. **Battle Simulation**:
   - Always simulates exactly 17 battles (configured in `BATTLE_CONFIG.TOTAL_BATTLES`)
   - Each battle uses Pokemon Showdown's engine for accurate mechanics
   - Pokemon moves are strictly validated against their level-up learnset
   - Move IDs must be lowercase without spaces for Pokemon Showdown (e.g., 'thundershock' not 'Thunder Shock')
   - Frontend has 15-second timeout for battle simulations to handle cold starts

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
- `frontend/src/components/battle/BattleArena.tsx` - Main game UI with prediction slider
- `frontend/src/components/ui/loading.tsx` - Loading states (check battle count display)
- `frontend/src/store/gameStore.ts` - Persistent game state management
- `frontend/src/services/api.ts` - API client with 15-second timeout for battle simulations

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

### Recent Updates (Phase 5 Completion)
- **Move Validation**: Removed `getRandomMoves` function, now strictly enforces level-up learnsets
- **Learnset Integration**: Uses `@pkmn/dex/build/learnsets-DJNGQKWY.js` for move data
- **Move ID Format**: Separated move IDs (for battle) from display names (for UI)
- **Performance**: Preloads learnsets on server startup to prevent cold start timeouts
- **Stream Management**: Added proper stream cleanup with `stream.destroy()`
- **Frontend Timeout**: Increased to 15 seconds for battle simulations
- **Error Handling**: Enhanced error messages for better debugging

The project is production-ready with accurate Pokemon battle simulation, proper data sourcing, and a complete game loop.