# Battle Tester Context

## Overview
The Battle Tester is a debugging and visualization tool that allows users to see a detailed turn-by-turn breakdown of a single Pokemon battle. Unlike the main game which simulates 17 battles and shows only aggregated results, the Battle Tester provides insight into the actual battle mechanics, showing each move, damage dealt, and battle events.

## Purpose
- **Debugging**: Helps developers and players understand battle mechanics
- **Transparency**: Shows exactly how battles play out turn by turn
- **Education**: Teaches players about type effectiveness, critical hits, and move mechanics
- **Testing**: Validates that Pokemon stats, moves, and abilities work correctly

## Architecture

### Frontend Components

#### BattleTester Component (`/frontend/src/components/battle/BattleTester.tsx`)
- Collapsible side panel that appears on the right side of the battle screen
- Displays:
  - Battle setup (Pokemon names and levels)
  - Simulate button to trigger a single battle
  - Turn-by-turn breakdown with:
    - Move used
    - Damage dealt
    - Remaining HP
    - Critical hits
    - Type effectiveness (super effective, not very effective, no effect)
  - Final battle result and winner
  - Total turns and execution time

#### MainLayout Integration (`/frontend/src/components/layout/MainLayout.tsx`)
- Manages the Battle Tester state through `useSettingsStore`
- Handles the battle simulation trigger
- Passes current battle Pokemon data to the backend
- Manages loading states during simulation

### API Layer

#### API Service (`/frontend/src/services/api.ts`)
```typescript
static async simulateSingleBattle(
  pokemon1Id: number, 
  pokemon2Id: number, 
  options?: {
    generation?: number;
    pokemon1Level?: number;
    pokemon2Level?: number;
    withItems?: boolean;
    movesetType?: 'random' | 'competitive';
    aiDifficulty?: 'random' | 'elite';
  }
): Promise<SingleBattleResult>
```

### Backend Implementation

#### Route (`/backend/src/routes/battle.routes.ts`)
- `POST /api/battle/simulate-single` - Endpoint for single battle simulation

#### Controller (`/backend/src/controllers/battle.controller.ts`)
- `simulateSingleBattle` - Validates request and delegates to battle service

#### Battle Service (`/backend/src/services/battle.service.ts`)
- `simulateSingleBattle` - Orchestrates the battle simulation

#### Pokemon Showdown Service (`/backend/src/services/pokemon-showdown.service.ts`)
- `simulateSingleBattle` - Core battle simulation logic
- Uses Pokemon Showdown's battle engine (`@pkmn/sim`)
- Creates battle streams and processes turn-by-turn events
- Parses battle log to extract meaningful turn data

## Data Flow

```
1. User clicks "Simulate Battle" in Battle Tester
   ↓
2. MainLayout.onSimulateBattle() triggered
   ↓
3. ApiService.simulateSingleBattle(pokemon1Id, pokemon2Id, options)
   ↓
4. POST /api/battle/simulate-single
   ↓
5. Backend creates Pokemon Showdown battle stream
   ↓
6. Battle executes turn by turn with AI making random moves
   ↓
7. Battle events parsed into BattleTurn objects
   ↓
8. SingleBattleResult returned to frontend
   ↓
9. BattleTester component displays turn-by-turn breakdown
```

## Data Structures

### Request Format
```json
{
  "pokemon1Id": 25,
  "pokemon2Id": 6,
  "options": {
    "generation": 1,
    "pokemon1Level": 50,
    "pokemon2Level": 50,
    "withItems": false,
    "movesetType": "random",
    "aiDifficulty": "random"
  }
}
```

### Response Format (SingleBattleResult)
```typescript
{
  winner: string;              // Name of winning Pokemon
  turns: BattleTurn[];        // Array of turn events
  totalTurns: number;         // Total number of turns
  finalHP1: number;           // Final HP of Pokemon 1
  finalHP2: number;           // Final HP of Pokemon 2
  executionTime: number;      // Time taken to simulate (ms)
  pokemon1: {
    name: string;
    level: number;
    stats: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
  };
  pokemon2: {
    // Same structure as pokemon1
  };
}
```

### BattleTurn Structure
```typescript
{
  turn: number;               // Turn number (1, 2, 3...)
  attacker: string;           // Name of attacking Pokemon (or damage source for residual damage)
  defender: string;           // Name of defending Pokemon
  move: string;              // Move used (e.g., "Thunderbolt") or damage type (e.g., "Fire Spin damage")
  damage: number;            // Damage dealt to defender
  remainingHP: number;       // Defender's remaining HP
  critical: boolean;         // Whether it was a critical hit
  effectiveness: 'super' | 'normal' | 'not very' | 'no';
  missed?: boolean;          // Whether the move missed
  statusEffect?: string;     // Status effect (brn, par, psn, slp, frz, confusion)
  statusInflicted?: boolean; // Whether a status was inflicted this turn
  fainted?: boolean;         // Whether the defender fainted
  statChange?: {             // Stat changes from moves like Swords Dance, Growl
    stat: string;            // atk, def, spa, spd, spe, accuracy, evasion
    stages: number;          // +1 to +6 or -1 to -6
    type: 'boost' | 'unboost' | 'failed';
  };
  recoilDamage?: number;     // Recoil/Life Orb damage to attacker (shown on same card)
  attackerRemainingHP?: number; // Attacker's HP after recoil damage
}
```

## Battle Simulation Details

### Move Selection
- AI randomly selects from available moves
- Disabled moves are filtered out
- If no valid moves, Pokemon uses Struggle

### Battle Processing
1. Battle stream initialized with format (e.g., "gen1singles")
2. Teams created with Pokemon data, moves, abilities, and stats
3. Turn-by-turn processing:
   - Request move choices from each player
   - Execute moves in order (based on speed/priority)
   - Process damage and effects
   - Check for battle end conditions
4. Maximum 50 turns before timeout
5. Battle log parsed to extract turn events

### Event Parsing
The backend parses Pokemon Showdown's battle log to extract:
- Move usage (`|move|` events)
- Damage dealt (`|-damage|` events) with source detection
- Critical hits (`|-crit|` events)
- Type effectiveness (`|-supereffective|`, `|-resisted|`, `|-immune|`)
- Move misses (`|-miss|` events)
- Status effects (`|-status|` events) - burn, paralysis, poison, sleep, freeze
- Status condition start (`|-start|` events) - confusion, infatuation
- Stat changes (`|-boost|`, `|-unboost|`, `|-fail|` events)
- Healing (`|-heal|` events)
- Fainting (`|faint|` events)
- Battle end (`|win|`, `|tie|` events)

### Residual Damage Types
The Battle Tester properly identifies and displays various residual damage sources:

**Recoil Moves** (shown on same card as the move):
- Double-Edge, Submission, Take Down, Brave Bird, Flare Blitz
- Head Smash, Wild Charge, Volt Tackle, Wood Hammer

**Status Damage** (shown as separate cards):
- Burn, Poison, Bad Poison (toxic)
- Confusion self-hit

**Weather Damage**:
- Sandstorm, Hail

**Trapping Moves** (residual damage over turns):
- Fire Spin, Wrap, Bind, Whirlpool, Infestation
- Magma Storm, Sand Tomb, Clamp, Snap Trap, Thunder Cage

**Other Residual Damage**:
- Leech Seed, Curse (ghost), Nightmare, Salt Cure
- Stealth Rock, Spikes (entry hazards)
- Life Orb (shown on same card as the move)

### Display Consolidation
To improve readability, related damage is consolidated onto single cards:
- **Recoil damage**: Shown on the same card as the attack that caused it
- **Life Orb damage**: Shown on the same card as the attack
- **Regular damage**: "[Defender] took X damage" with HP remaining
- **Residual damage**: "[Defender] took X damage from [Source]" with color-coded source name

## Key Implementation Files

### Frontend
- `/frontend/src/components/battle/BattleTester.tsx` - UI component
- `/frontend/src/components/layout/MainLayout.tsx` - Integration point
- `/frontend/src/services/api.ts` - API client
- `/frontend/src/store/settingsStore.ts` - State management

### Backend
- `/backend/src/routes/battle.routes.ts` - API routes
- `/backend/src/controllers/battle.controller.ts` - Request handling
- `/backend/src/services/battle.service.ts` - Business logic
- `/backend/src/services/pokemon-showdown.service.ts` - Battle engine integration

## Common Issues and Solutions

### Issue: Battle simulation timeout
**Solution**: The frontend has a 15-second timeout for battle API calls to handle cold starts and complex battles

### Issue: No turns displayed
**Solution**: The backend creates demo turns if parsing fails, ensuring some data is always shown

### Issue: Move names not displaying correctly
**Solution**: Moves are formatted from their IDs (e.g., "thundershock" → "Thunder Shock")

### Issue: Pokemon not found
**Solution**: Backend validates Pokemon IDs against the Showdown Dex before simulation

## Implemented Features

The following enhancements have been implemented:

1. ✅ **Detailed Battle Log**: Shows status conditions, stat changes, confusion, and more
2. ✅ **Recoil/Life Orb Display**: Consolidated onto same card as the attack
3. ✅ **Residual Damage Tracking**: Fire Spin, Wrap, Leech Seed, entry hazards, etc.
4. ✅ **Color-Coded Damage Sources**: Each damage type has its own color
5. ✅ **Stat Change Display**: Shows boost/unboost with stage counts
6. ✅ **Miss Detection**: Shows "but it missed!" for failed attacks
7. ✅ **Faint Detection**: Shows "Fainted!" when Pokemon reaches 0 HP

## Future Enhancements

1. **Battle Replay**: Allow stepping through battles move by move
2. **Battle Analysis**: Provide insights on type matchups and optimal moves
3. **Custom Battles**: Let users set specific moves, abilities, and items
4. **Battle History**: Store and review previous test battles
5. **Performance Metrics**: Show detailed timing for each battle phase
6. **Ability Triggers**: Display when abilities activate (Intimidate, Flash Fire, etc.)

## Testing the Battle Tester

1. Start both backend and frontend servers
2. Navigate to the battle screen
3. Wait for a battle to be generated
4. Click the sword icon on the right side to expand Battle Tester
5. Click the "Simulate Battle" button
6. View the turn-by-turn breakdown

The Battle Tester provides transparency into PokeWave's battle system, helping players understand why certain Pokemon win or lose their matchups.