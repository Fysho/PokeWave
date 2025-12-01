# Online Mode - Design Document

## Overview

Online Mode is a synchronized global battle prediction game where all players worldwide see the same Pokemon battle simultaneously and compete to make the most accurate predictions. Rounds run continuously on a 40-second cycle (30 seconds guessing + 10 seconds results), creating an always-on competitive experience.

## Core Concept

### The Experience
1. Every 30 seconds, a new Pokemon battle matchup appears
2. All connected players see the **exact same battle** at the **exact same time**
3. Players have 30 seconds to guess the win percentage (e.g., "Charizard wins 65% of battles")
4. After time expires, the actual simulation result is revealed
5. Players earn/lose Elo based on accuracy and rank among participants
6. 10 seconds of results display, then the next round begins

### Key Differentiators from Other Modes
- **Synchronized**: Everyone plays the same battle simultaneously
- **Competitive**: Elo-based ranking system
- **Social**: See other players, their ranks, and activity in real-time
- **Continuous**: Rounds run 24/7 whether anyone is playing or not

---

## Game Flow

### Round Lifecycle (40 seconds total)

```
┌─────────────────────────────────────────────────────────────────┐
│                        ROUND CYCLE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [0s]─────────────[30s]─────────────[40s]                       │
│    │                 │                 │                         │
│    │   GUESSING      │    RESULTS      │                         │
│    │   PHASE         │    PHASE        │                         │
│    │                 │                 │                         │
│    │ • Battle shown  │ • Answer reveal │                         │
│    │ • Timer counts  │ • Elo changes   │                         │
│    │ • Submit guess  │ • Leaderboard   │                         │
│    │ • See activity  │ • Next preview  │                         │
│    │                 │                 │                         │
└─────────────────────────────────────────────────────────────────┘
```

### Phase Details

#### Guessing Phase (30 seconds)
- Pokemon matchup displayed with full card details
- Slider/input for percentage guess (0-100%)
- "Pokemon A wins X% of battles"
- Countdown timer prominently displayed
- Player list shows who has submitted (checkmark indicator)
- Cannot change guess after submission
- No submission = treated as worst possible guess

#### Results Phase (10 seconds)
- Actual win percentage revealed with animation
- All player guesses shown
- Elo changes calculated and displayed (+/- points)
- Leaderboard updates
- Preview of next round's Pokemon appears at ~5 seconds

---

## Elo System

### Starting Point
- All players begin at **1000 Elo**
- Displayed alongside rank badge

### Rank Tiers

| Tier | Elo Range | Badge Color |
|------|-----------|-------------|
| Bronze | 0 - 1199 | Bronze/Brown |
| Silver | 1200 - 1399 | Silver/Gray |
| Gold | 1400 - 1599 | Gold/Yellow |
| Platinum | 1600 - 1799 | Light Blue |
| Diamond | 1800 - 1999 | Cyan/Teal |
| Master | 2000+ | Purple/Violet |

### Elo Calculation (Hybrid System)

Points gained/lost depend on two factors:
1. **Accuracy Score**: How close your guess was to the actual answer
2. **Rank Score**: How you performed compared to other players

#### Accuracy Score Formula
```
accuracy_error = |player_guess - actual_result|
accuracy_score = 100 - accuracy_error  // 0-100 scale
```

Example: Actual result is 65%, player guesses 70%
- Error = |70 - 65| = 5
- Accuracy Score = 100 - 5 = 95

#### Rank Score Formula
```
rank_percentile = (players_beaten / total_players) * 100
```

Example: 3rd place out of 10 players
- Players beaten = 7
- Rank Percentile = 70%

#### Combined Elo Change
```
base_change = 15  // Maximum points per round
accuracy_weight = 0.6
rank_weight = 0.4

// Normalize scores to -1 to +1 range
accuracy_factor = (accuracy_score - 50) / 50  // -1 to +1
rank_factor = (rank_percentile - 50) / 50      // -1 to +1

// Calculate final change
elo_change = base_change * (accuracy_weight * accuracy_factor + rank_weight * rank_factor)
```

This gives a range of approximately **-15 to +15 points** per round.

#### Solo Player Rule
- If only 1 player is participating, **no Elo change occurs**
- Player can still practice and see results
- Minimum 2 players required for Elo to be at stake

#### No Submission Penalty
- Treated as worst possible guess (100% error)
- Ranked last among all participants
- Will lose maximum Elo if others participate

---

## Player Display

### Active Players Panel

Shows all players currently in Online Mode:

```
┌─────────────────────────────────────┐
│ PLAYERS ONLINE (12)                 │
├─────────────────────────────────────┤
│ 🏆 Leaderboard                      │
├─────────────────────────────────────┤
│ [Pikachu] TrainerAsh    1847 💎 ✓  │
│ [Charizard] FireMaster  1723 💎    │
│ [Gengar] GhostHunter    1456 🥇 ✓  │
│ [Mewtwo] PsychicPro     1398 🥈    │
│ [Eevee] EvolutionFan    1244 🥈 ✓  │
│ [Snorlax] SleepyGamer   1189 🥉    │
│ ...                                 │
├─────────────────────────────────────┤
│ Your Rank: #5 of 12                 │
│ Your Elo: 1244 (Silver)             │
└─────────────────────────────────────┘
```

#### Player Row Elements
- **Pokemon Avatar**: Chosen Pokemon sprite (small, 32px)
- **Username**: Player's display name
- **Elo Number**: Current Elo rating
- **Rank Badge**: Tier icon (Bronze/Silver/Gold/etc.)
- **Activity Indicator**: ✓ = submitted guess this round

### Global Leaderboard

Available within Online Mode showing top players:

```
┌─────────────────────────────────────┐
│ 🏆 GLOBAL LEADERBOARD               │
├─────────────────────────────────────┤
│ #1  [Mewtwo] Champion99   2347 👑   │
│ #2  [Rayquaza] DragonLord 2298 👑   │
│ #3  [Arceus] GodTier      2156 👑   │
│ ...                                  │
│ #47 [Eevee] You           1244 🥈   │
│ ...                                  │
└─────────────────────────────────────┘
```

---

## Battle Configuration

### Fixed Settings for Online Mode
- **Generation**: 9 (Scarlet/Violet)
- **Level Mode**: Fixed at 50
- **Item Mode**: Random
- **Simulation Runs**: 1000 (for accurate win percentage)

These settings are fixed to ensure all players have the same experience and the game remains fair.

---

## UI Layout

### Desktop Layout
```
┌────────────────────────────────────────────────────────────────────┐
│ ONLINE MODE                                    Round #1234         │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────┐  ┌──────────────────┐ │
│  │                                         │  │ PLAYERS (12)     │ │
│  │     [Pokemon A]     vs    [Pokemon B]   │  │                  │ │
│  │                                         │  │ TrainerAsh  1847 │ │
│  │     FullCard              FullCard      │  │ FireMaster  1723 │ │
│  │                                         │  │ GhostHunter 1456 │ │
│  │                                         │  │ ...              │ │
│  └─────────────────────────────────────────┘  │                  │ │
│                                                │                  │ │
│  ┌─────────────────────────────────────────┐  │──────────────────│ │
│  │                                         │  │ LEADERBOARD      │ │
│  │  Who wins more often?                   │  │                  │ │
│  │                                         │  │ #1 Champion  2347│ │
│  │  [Pokemon A] wins [====|====] % of time │  │ #2 Dragon    2298│ │
│  │                                         │  │ #3 GodTier   2156│ │
│  │        [SUBMIT GUESS]                   │  │ ...              │ │
│  │                                         │  │ #47 You     1244 │ │
│  │           ⏱️ 0:24                        │  │                  │ │
│  └─────────────────────────────────────────┘  └──────────────────┘ │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout
- Pokemon cards stack vertically
- Player panel becomes collapsible drawer
- Guess slider full-width
- Timer prominent at top

---

## Authentication Requirement

Online Mode requires players to be logged in because:
1. Elo must be persisted to player accounts
2. Pokemon avatar selection is per-account
3. Prevents abuse (multiple anonymous entries)
4. Enables global leaderboard tracking

Non-logged-in users see a prompt:
```
┌─────────────────────────────────────┐
│ 🔒 LOGIN REQUIRED                   │
│                                     │
│ Online Mode requires an account to  │
│ track your Elo and compete with     │
│ players worldwide.                  │
│                                     │
│ [LOGIN]  [CREATE ACCOUNT]           │
└─────────────────────────────────────┘
```

---

## Synchronization Architecture

### Server-Authoritative Design
- Server maintains the **single source of truth** for:
  - Current round number
  - Current battle matchup
  - Round phase (guessing/results)
  - Time remaining
  - All player guesses
  - Elo calculations

### Clock Synchronization
- Rounds are tied to server UTC time
- Round N starts at: `epoch + (N * 40 seconds)`
- Clients sync to server time on connect
- Minor drift tolerance (±1 second)

### Round Calculation
```javascript
const ROUND_DURATION = 40; // seconds
const GUESS_DURATION = 30; // seconds

function getCurrentRound() {
  const now = Math.floor(Date.now() / 1000);
  return Math.floor(now / ROUND_DURATION);
}

function getPhase() {
  const now = Math.floor(Date.now() / 1000);
  const secondsIntoRound = now % ROUND_DURATION;
  return secondsIntoRound < GUESS_DURATION ? 'guessing' : 'results';
}

function getTimeRemaining() {
  const now = Math.floor(Date.now() / 1000);
  const secondsIntoRound = now % ROUND_DURATION;
  if (secondsIntoRound < GUESS_DURATION) {
    return GUESS_DURATION - secondsIntoRound;
  }
  return ROUND_DURATION - secondsIntoRound;
}
```

---

## Data Models

### OnlineRound
```typescript
interface OnlineRound {
  roundNumber: number;
  pokemon1: PokemonInstance;
  pokemon2: PokemonInstance;
  actualWinPercentage: number;  // Result of 1000 simulations
  startTime: Date;
  endTime: Date;
  guesses: PlayerGuess[];
}
```

### PlayerGuess
```typescript
interface PlayerGuess {
  odlayerId: string
  odloundNumber: number;
  odlrguess: number;  // 0-100 percentage
  submittedAt: Date;
  accuracyScore?: number;  // Calculated after round
  rankScore?: number;
  eloChange?: number;
}
```

### OnlinePlayer
```typescript
interface OnlinePlayer {
  userId: string;
  username: string;
  elo: number;
  rank: RankTier;
  avatarPokemon: string;  // Pokemon name for sprite
  isOnline: boolean;
  hasSubmittedThisRound: boolean;
  lastActive: Date;
}
```

### RankTier
```typescript
type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';
```

---

## Edge Cases

### Late Joiners
- Can join mid-round
- See current battle and remaining time
- Can submit guess if time remains
- If <5 seconds left, may skip to next round

### Disconnections
- Treated as no submission if disconnected during guess phase
- Reconnecting shows current round state
- Elo changes applied regardless of connection status

### Round Boundaries
- Guesses within 1 second of deadline accepted
- Server processes all guesses, then calculates results
- Results phase shows final rankings

### Empty Rounds
- If 0 players online, round still advances
- Battle result still calculated and stored
- No Elo changes occur

---

## Future Considerations (Out of Scope)

These features are not part of initial implementation but could be added later:
- Seasonal rankings with resets
- Tournament mode (elimination brackets)
- Chat/emotes during rounds
- Spectator mode
- Replay viewing
- Achievement system
- Daily/weekly challenges within Online Mode
- Friend challenges
