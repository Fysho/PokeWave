# PokeWave Project Context

## Project Overview
PokeWave is a web-based Pokemon battle prediction game where users predict the winner of simulated battles between randomly selected Pokemon. The system uses Pokemon Showdown's battle engine to simulate 10 battles between two Pokemon and challenges users to correctly identify which Pokemon will win.

## Implementation Status

### ✅ Phase 4 Complete - UI Framework Migration (Current)
**Status**: Successfully migrated to Mantine UI framework
**Last Commit**: 3528b3d - "feat: migrate from shadcn/ui to Mantine UI framework"

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
1. **Battle Generation**: System selects two random Pokemon (Gen 1-151)
2. **Battle Simulation**: Pokemon Showdown engine simulates 10 battles
3. **User Prediction**: User predicts win percentage using a slider (within 10% accuracy required)
4. **Result Feedback**: System shows correct/incorrect with accuracy percentage and points
5. **Score Tracking**: Points, streak, accuracy, and total battles are tracked
6. **Auto-Continue**: New battle automatically generated after results

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
- **Showdown Service**: Handles Pokemon Showdown integration and battle simulation with PokeAPI integration
- **Battle Service**: Manages battle state, guess validation, and scoring
- **Pokemon Service**: Fetches Pokemon data from PokeAPI for sprites and types
- **Cache Service**: Redis caching with fallback to in-memory
- **Logger**: Structured logging for debugging and monitoring

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
Pokemon Showdown Simulation ← Battle Service ← API Controller
                    ↓                              ↓
10 Battle Results → Cache → Frontend Display → Pokemon Service → PokeAPI
                    ↓                              ↓
              Battle History → Streak Tracking → User Feedback + Celebrations
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
- ✅ Real Pokemon battle simulation with 10 battles
- ✅ Interactive Pokemon cards with sprites and types
- ✅ Percentage-based prediction system with slider
- ✅ 10% accuracy requirement for scoring
- ✅ Score tracking and persistence
- ✅ Dark/light theme support with Mantine theme system
- ✅ Mobile-responsive design with Mantine Grid
- ✅ Error handling and user feedback
- ✅ Battle result caching
- ✅ Automatic battle generation
- ✅ Statistical battle modeling with type advantages
- ✅ Pokemon sprites and type badges from PokeAPI
- ✅ Streak tracking with visual indicators
- ✅ Streak celebration animations with particles
- ✅ Loading animations and smooth transitions
- ✅ Comprehensive analytics and statistics
- ✅ Modern Mantine UI component library integration

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
1. **Both servers work independently** - backend on 4000, frontend on 4001
2. **Game loop is complete** - users can play immediately with percentage prediction system
3. **Real Pokemon data** - battles use actual Pokemon stats, types, and sprites
4. **Modular architecture** - easy to extend with new features
5. **Phase 4 complete** - Successfully migrated to Mantine UI framework
6. **Modern UI** - Mantine components provide better theming and responsiveness

### Key Files to Understand
- `backend/src/services/showdown.service.ts` - Pokemon Showdown integration with PokeAPI
- `backend/src/services/battle.service.ts` - Game logic and scoring (handles percentage guesses)
- `backend/src/services/pokemon.service.ts` - PokeAPI integration for sprites and types
- `frontend/src/components/battle/BattleArena.tsx` - Main game interface with Mantine components
- `frontend/src/components/layout/MainLayout.tsx` - Mantine AppShell layout with navigation
- `frontend/src/components/game/GameDashboard.tsx` - Statistics dashboard with Mantine cards
- `frontend/src/components/ui/streak-celebration.tsx` - Streak celebration animations
- `frontend/src/store/gameStore.ts` - Game state management with battle history
- `frontend/src/services/api.ts` - API communication layer

### Common Tasks
- **Adding new Pokemon**: Update random generation range and validation
- **Modifying scoring**: Update `battle.service.ts` point calculation for percentage accuracy
- **UI changes**: Components use Mantine UI in `frontend/src/components/`
- **New game modes**: Extend `BattleArena` and `gameStore`
- **Adding animations**: Use Framer Motion components in `frontend/src/components/ui/`
- **Rebuilding battle history**: Create new BattleHistory component with Mantine UI
- **Theme customization**: Modify Mantine theme in `frontend/src/App.tsx`

The project is production-ready for core battle prediction gameplay with real Pokemon simulation data, modern Mantine UI components, and percentage-based prediction system.