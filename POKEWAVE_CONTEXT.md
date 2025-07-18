# PokeWave Project Context

## Project Overview
PokeWave is a web-based Pokemon battle prediction game where users predict the winner of simulated battles between randomly selected Pokemon. The system uses Pokemon Showdown's battle engine to simulate 1000 battles between two Pokemon and challenges users to correctly identify which Pokemon will win.

## Implementation Status

### ✅ Phase 3 Complete - Polish & Features (Current)
**Status**: All major features implemented and working
**Last Commit**: 70aefb0 - "feat: Complete Phase 3 - Polish & Features with Pokemon sprites and enhanced streak tracking"

### ✅ Phase 2 Complete - Core Game Loop  
**Status**: Fully implemented and working
**Last Commit**: fe71783 - "Complete game loop implementation with guess result feedback"

## Game Flow
1. **Battle Generation**: System selects two random Pokemon (Gen 1-151)
2. **Battle Simulation**: Pokemon Showdown engine simulates 1000 battles
3. **User Prediction**: User selects which Pokemon they think will win
4. **Result Feedback**: System shows correct/incorrect with points and messages
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
  - `POST /api/battle/simulate` - Simulate 1000 battles between two Pokemon
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
**Status**: ✅ Fully functional

#### Core Features
- **Game Interface**: Complete battle prediction UI with Pokemon cards and sprites
- **State Management**: Zustand store for game state persistence
- **API Integration**: Axios-based service layer with error handling
- **Theme Support**: Dark/light mode with next-themes
- **Responsive Design**: Mobile-first with Tailwind CSS
- **Real-time Stats**: Score, streak, accuracy, and battle count tracking
- **Animations**: Framer Motion animations and transitions throughout
- **Battle History**: Persistent battle tracking with detailed analytics
- **Streak Tracking**: Visual streak indicators and celebration animations

#### Key Components
- **BattleView**: Main game interface with Pokemon selection and streak celebrations
- **PokemonCard**: Interactive Pokemon display cards with sprites and types
- **GameDashboard**: Statistics and game state display with tabbed interface
- **BattleHistory**: Comprehensive battle tracking with streak indicators
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
1000 Battle Results → Cache → Frontend Display → Pokemon Service → PokeAPI
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
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Animation library for smooth transitions
- **Axios**: HTTP client for API communication
- **React Router**: Client-side routing
- **shadcn/ui**: Component library for consistent UI

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
  "totalBattles": 1000,
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
  "guess": 4  # Pokemon ID user thinks will win
}

Response:
{
  "battleId": "uuid",
  "guess": 4,
  "correctAnswer": 4,
  "isCorrect": true,
  "winRate": 58.2,
  "points": 18,
  "message": "Great job! You correctly identified the winner!"
}
```

## Scoring System
- **Base Points**: 10 points for correct guess
- **Difficulty Bonus**: Up to 10 additional points for close battles (near 50/50)
- **Streak Tracking**: Consecutive correct guesses
- **Accuracy Calculation**: Percentage of correct guesses over time

## Known Working Features
- ✅ Real Pokemon battle simulation with 1000 battles
- ✅ Interactive Pokemon selection interface with sprites and types
- ✅ Score tracking and persistence
- ✅ Dark/light theme support
- ✅ Mobile-responsive design
- ✅ Error handling and user feedback
- ✅ Battle result caching
- ✅ Automatic battle generation
- ✅ Statistical battle modeling with type advantages
- ✅ Pokemon sprites and type badges from PokeAPI
- ✅ Battle history tracking with persistent storage
- ✅ Streak tracking with visual indicators
- ✅ Streak celebration animations with particles
- ✅ Loading animations and smooth transitions
- ✅ Comprehensive analytics and statistics

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

### Phase 4 Possibilities
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

## AI Developer Notes

### Starting Development
1. **Both servers work independently** - backend on 4000, frontend on 4001
2. **Game loop is complete** - users can play immediately with full polish
3. **Real Pokemon data** - battles use actual Pokemon stats, types, and sprites
4. **Modular architecture** - easy to extend with new features
5. **Phase 3 complete** - All major UI/UX features implemented

### Key Files to Understand
- `backend/src/services/showdown.service.ts` - Pokemon Showdown integration with PokeAPI
- `backend/src/services/battle.service.ts` - Game logic and scoring
- `backend/src/services/pokemon.service.ts` - PokeAPI integration for sprites and types
- `frontend/src/components/battle/BattleView.tsx` - Main game interface with animations
- `frontend/src/components/battle/BattleHistory.tsx` - Battle history and streak tracking
- `frontend/src/components/ui/streak-celebration.tsx` - Streak celebration animations
- `frontend/src/store/gameStore.ts` - Game state management with battle history
- `frontend/src/services/api.ts` - API communication layer

### Common Tasks
- **Adding new Pokemon**: Update random generation range and validation
- **Modifying scoring**: Update `battle.service.ts` point calculation
- **UI changes**: Components are in `frontend/src/components/`
- **New game modes**: Extend `BattleView` and `gameStore`
- **Adding animations**: Use Framer Motion components in `frontend/src/components/ui/`
- **Extending battle history**: Update `BattleHistory` component and store interface

The project is production-ready for core battle prediction gameplay with real Pokemon simulation data, comprehensive UI polish, and full battle tracking features.