# Online Mode - Implementation Document

## Overview

This document provides a detailed technical implementation plan for Online Mode. It covers database schema changes, backend services, WebSocket implementation, frontend components, and the deployment strategy.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Backend Implementation](#backend-implementation)
4. [WebSocket Implementation](#websocket-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [API Endpoints](#api-endpoints)
7. [Elo Calculation Service](#elo-calculation-service)
8. [Round Management Service](#round-management-service)
9. [Testing Strategy](#testing-strategy)
10. [Implementation Phases](#implementation-phases)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (React)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  OnlineMode Component                                                    │
│  ├── BattleDisplay (FullCard x2)                                        │
│  ├── GuessSlider                                                        │
│  ├── Timer                                                              │
│  ├── PlayerList                                                         │
│  └── Leaderboard                                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
              HTTP REST                        WebSocket
              (Initial load,                   (Real-time updates)
               Submit guess)                        │
                    │                               │
┌───────────────────┴───────────────────────────────┴─────────────────────┐
│                          BACKEND (Node.js/Express)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │ OnlineRound     │  │ OnlineWebSocket  │  │ EloCalculation         │  │
│  │ Service         │  │ Service          │  │ Service                │  │
│  │                 │  │                  │  │                        │  │
│  │ • Round mgmt    │  │ • Connection mgmt│  │ • Score calculation    │  │
│  │ • Battle gen    │  │ • Broadcasting   │  │ • Rank computation     │  │
│  │ • Phase timing  │  │ • Player tracking│  │ • Elo adjustments      │  │
│  └────────┬────────┘  └────────┬─────────┘  └───────────┬────────────┘  │
│           │                    │                        │               │
│           └────────────────────┼────────────────────────┘               │
│                                │                                         │
│                    ┌───────────┴───────────┐                            │
│                    │     PostgreSQL        │                            │
│                    │     (Prisma ORM)      │                            │
│                    └───────────────────────┘                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Server-Authoritative**: All round timing, battle generation, and Elo calculations happen server-side
2. **WebSocket for Real-Time**: Player presence, guess submissions, and phase transitions use WebSockets
3. **REST for Actions**: Guess submission and initial data load use REST endpoints
4. **Time-Based Rounds**: Round number derived from Unix timestamp (deterministic)
5. **Prisma ORM**: Consistent with existing codebase

---

## Database Schema

### New Prisma Models

Add to `backend/prisma/schema.prisma`:

```prisma
// Online Mode Elo rating for users
model OnlineElo {
  id              String   @id @default(uuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  elo             Int      @default(1000)
  rank            String   @default("bronze") // bronze, silver, gold, platinum, diamond, master
  gamesPlayed     Int      @default(0)
  wins            Int      @default(0)  // Rounds where player ranked top 50%

  // Best/worst performance
  highestElo      Int      @default(1000)
  lowestElo       Int      @default(1000)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([elo(sort: Desc)])
  @@index([rank])
}

// Online Mode round data
model OnlineRound {
  id              String   @id @default(uuid())
  roundNumber     Int      @unique

  // Battle configuration (stored as JSON for flexibility)
  pokemon1Data    Json     // Full Pokemon instance data
  pokemon2Data    Json     // Full Pokemon instance data

  // Simulation result
  actualWinPercent Float   // 0-100, result of 1000 simulations

  // Round timing
  startTime       DateTime
  endTime         DateTime

  // Stats
  totalParticipants Int    @default(0)

  createdAt       DateTime @default(now())

  // Relations
  guesses         OnlineGuess[]

  @@index([roundNumber])
  @@index([startTime])
}

// Individual player guesses for online rounds
model OnlineGuess {
  id              String   @id @default(uuid())

  roundId         String
  round           OnlineRound @relation(fields: [roundId], references: [id], onDelete: Cascade)

  userId          String

  guess           Float    // 0-100 percentage
  submittedAt     DateTime @default(now())

  // Calculated after round ends
  accuracyScore   Float?   // 0-100, how close to actual
  rankPosition    Int?     // 1st, 2nd, 3rd, etc.
  eloChange       Int?     // +/- points
  eloBefore       Int?     // Elo before this round
  eloAfter        Int?     // Elo after this round

  @@unique([roundId, odlaerId])
  @@index([roundId])
  @@index([userId])
  @@index([submittedAt])
}

// Online player presence (for real-time tracking)
model OnlinePresence {
  id              String   @id @default(uuid())
  userId          String   @unique

  socketId        String?  // WebSocket connection ID
  lastSeen        DateTime @default(now())
  currentRound    Int?     // Which round they're viewing
  hasSubmitted    Boolean  @default(false) // Submitted this round?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([lastSeen])
}
```

### Update User Model

Add relation to existing User model:

```prisma
model User {
  // ... existing fields ...

  // Add new relation
  onlineElo         OnlineElo?
}
```

### Migration Commands

```bash
cd backend
npx prisma migrate dev --name add_online_mode_tables
npx prisma generate
```

---

## Backend Implementation

### File Structure

```
backend/src/
├── services/
│   ├── online-round.service.ts      # Round management, battle generation
│   ├── online-elo.service.ts        # Elo calculations
│   ├── online-websocket.service.ts  # WebSocket handling
│   └── online-leaderboard.service.ts # Global leaderboard
├── controllers/
│   └── online.controller.ts         # REST endpoints
├── routes/
│   └── online.routes.ts             # Route definitions
├── types/
│   └── online.types.ts              # TypeScript interfaces
└── websocket/
    └── online.gateway.ts            # WebSocket gateway
```

### Types Definition

Create `backend/src/types/online.types.ts`:

```typescript
export interface OnlineRoundState {
  roundNumber: number;
  phase: 'guessing' | 'results';
  timeRemaining: number;
  pokemon1: PokemonInstance;
  pokemon2: PokemonInstance;
  actualWinPercent?: number; // Only revealed in results phase
  totalParticipants: number;
}

export interface OnlinePlayer {
  userId: string;
  username: string;
  elo: number;
  rank: RankTier;
  avatarPokemon: string;
  avatarSprite: string;
  hasSubmitted: boolean;
  isOnline: boolean;
}

export interface OnlineGuessSubmission {
  roundNumber: number;
  guess: number; // 0-100
}

export interface OnlineGuessResult {
  odlaerId: string;
  username: string;
  guess: number;
  accuracyScore: number;
  rankPosition: number;
  eloChange: number;
  eloBefore: number;
  eloAfter: number;
}

export interface OnlineRoundResults {
  roundNumber: number;
  actualWinPercent: number;
  guesses: OnlineGuessResult[];
  nextRoundPreview?: {
    pokemon1Name: string;
    pokemon2Name: string;
  };
}

export type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';

export const RANK_THRESHOLDS: Record<RankTier, { min: number; max: number }> = {
  bronze: { min: 0, max: 1199 },
  silver: { min: 1200, max: 1399 },
  gold: { min: 1400, max: 1599 },
  platinum: { min: 1600, max: 1799 },
  diamond: { min: 1800, max: 1999 },
  master: { min: 2000, max: Infinity }
};

export const ONLINE_CONFIG = {
  ROUND_DURATION: 40,      // Total round duration in seconds
  GUESS_DURATION: 30,      // Time for guessing phase
  RESULTS_DURATION: 10,    // Time for results phase
  SIMULATION_COUNT: 1000,  // Number of battle simulations
  BASE_ELO_CHANGE: 15,     // Maximum Elo change per round
  ACCURACY_WEIGHT: 0.6,    // Weight for accuracy in Elo calculation
  RANK_WEIGHT: 0.4,        // Weight for rank in Elo calculation
  MIN_PLAYERS_FOR_ELO: 2,  // Minimum players for Elo to change
  GENERATION: 9,           // Pokemon generation
  LEVEL: 50,               // Fixed battle level
  ITEM_MODE: 'random'      // Item assignment mode
};
```

### Round Management Service

Create `backend/src/services/online-round.service.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { pokemonService } from './pokemon.service';
import { showdownService } from './showdown.service';
import { ONLINE_CONFIG, OnlineRoundState } from '../types/online.types';
import logger from '../utils/logger';

class OnlineRoundService {
  private prisma: PrismaClient;
  private roundCache: Map<number, OnlineRoundState> = new Map();
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Calculate current round number based on Unix timestamp
   */
  getCurrentRoundNumber(): number {
    const now = Math.floor(Date.now() / 1000);
    return Math.floor(now / ONLINE_CONFIG.ROUND_DURATION);
  }

  /**
   * Get current phase (guessing or results)
   */
  getCurrentPhase(): 'guessing' | 'results' {
    const now = Math.floor(Date.now() / 1000);
    const secondsIntoRound = now % ONLINE_CONFIG.ROUND_DURATION;
    return secondsIntoRound < ONLINE_CONFIG.GUESS_DURATION ? 'guessing' : 'results';
  }

  /**
   * Get time remaining in current phase
   */
  getTimeRemaining(): number {
    const now = Math.floor(Date.now() / 1000);
    const secondsIntoRound = now % ONLINE_CONFIG.ROUND_DURATION;

    if (secondsIntoRound < ONLINE_CONFIG.GUESS_DURATION) {
      return ONLINE_CONFIG.GUESS_DURATION - secondsIntoRound;
    }
    return ONLINE_CONFIG.ROUND_DURATION - secondsIntoRound;
  }

  /**
   * Get or create round data for a specific round number
   */
  async getOrCreateRound(roundNumber: number): Promise<OnlineRoundState> {
    // Check cache first
    if (this.roundCache.has(roundNumber)) {
      return this.roundCache.get(roundNumber)!;
    }

    // Check database
    let round = await this.prisma.onlineRound.findUnique({
      where: { roundNumber }
    });

    if (!round) {
      // Generate new round
      round = await this.generateRound(roundNumber);
    }

    const state: OnlineRoundState = {
      roundNumber: round.roundNumber,
      phase: this.getCurrentPhase(),
      timeRemaining: this.getTimeRemaining(),
      pokemon1: round.pokemon1Data as any,
      pokemon2: round.pokemon2Data as any,
      actualWinPercent: this.getCurrentPhase() === 'results' ? round.actualWinPercent : undefined,
      totalParticipants: round.totalParticipants
    };

    // Cache the round
    this.roundCache.set(roundNumber, state);

    // Clean old cache entries (keep last 5 rounds)
    if (this.roundCache.size > 5) {
      const oldestRound = Math.min(...this.roundCache.keys());
      this.roundCache.delete(oldestRound);
    }

    return state;
  }

  /**
   * Generate a new round with Pokemon and simulation
   */
  private async generateRound(roundNumber: number): Promise<any> {
    logger.info(`Generating online round ${roundNumber}`);

    // Generate deterministic seed from round number
    const seed = roundNumber;

    // Get random Pokemon pair
    const pokemon1 = await pokemonService.getRandomPokemonInstance({
      generation: ONLINE_CONFIG.GENERATION,
      levelMode: 'fixed',
      level: ONLINE_CONFIG.LEVEL,
      itemMode: ONLINE_CONFIG.ITEM_MODE,
      seed: seed
    });

    const pokemon2 = await pokemonService.getRandomPokemonInstance({
      generation: ONLINE_CONFIG.GENERATION,
      levelMode: 'fixed',
      level: ONLINE_CONFIG.LEVEL,
      itemMode: ONLINE_CONFIG.ITEM_MODE,
      seed: seed + 1000000 // Different seed for second Pokemon
    });

    // Run battle simulation (1000 times for accuracy)
    const result = await showdownService.simulateBattle(
      pokemon1,
      pokemon2,
      ONLINE_CONFIG.SIMULATION_COUNT
    );

    // Calculate round timing
    const startTime = new Date(roundNumber * ONLINE_CONFIG.ROUND_DURATION * 1000);
    const endTime = new Date((roundNumber + 1) * ONLINE_CONFIG.ROUND_DURATION * 1000);

    // Store in database
    const round = await this.prisma.onlineRound.create({
      data: {
        roundNumber,
        pokemon1Data: pokemon1,
        pokemon2Data: pokemon2,
        actualWinPercent: result.pokemon1WinRate * 100,
        startTime,
        endTime,
        totalParticipants: 0
      }
    });

    logger.info(`Online round ${roundNumber} generated: ${pokemon1.name} vs ${pokemon2.name}`);
    return round;
  }

  /**
   * Pre-generate upcoming rounds (call this on server startup and periodically)
   */
  async preGenerateRounds(count: number = 5): Promise<void> {
    const currentRound = this.getCurrentRoundNumber();

    for (let i = 0; i < count; i++) {
      const roundNumber = currentRound + i;
      const exists = await this.prisma.onlineRound.findUnique({
        where: { roundNumber }
      });

      if (!exists) {
        await this.generateRound(roundNumber);
      }
    }
  }

  /**
   * Start the round generation loop
   */
  startRoundLoop(): void {
    if (this.intervalId) return;

    // Generate initial rounds
    this.preGenerateRounds(10);

    // Check every 5 seconds for new rounds needed
    this.intervalId = setInterval(() => {
      this.preGenerateRounds(5);
    }, 5000);

    logger.info('Online round generation loop started');
  }

  /**
   * Stop the round generation loop
   */
  stopRoundLoop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Online round generation loop stopped');
    }
  }

  /**
   * Get current round state (for REST API)
   */
  async getCurrentRoundState(): Promise<OnlineRoundState> {
    const roundNumber = this.getCurrentRoundNumber();
    return this.getOrCreateRound(roundNumber);
  }
}

export const onlineRoundService = new OnlineRoundService();
```

### Elo Calculation Service

Create `backend/src/services/online-elo.service.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { ONLINE_CONFIG, RANK_THRESHOLDS, RankTier, OnlineGuessResult } from '../types/online.types';
import logger from '../utils/logger';

class OnlineEloService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get rank tier from Elo
   */
  getRankFromElo(elo: number): RankTier {
    for (const [rank, { min, max }] of Object.entries(RANK_THRESHOLDS)) {
      if (elo >= min && elo <= max) {
        return rank as RankTier;
      }
    }
    return 'bronze';
  }

  /**
   * Get or create Elo record for user
   */
  async getOrCreateElo(userId: string): Promise<{ elo: number; rank: RankTier }> {
    let eloRecord = await this.prisma.onlineElo.findUnique({
      where: { userId }
    });

    if (!eloRecord) {
      eloRecord = await this.prisma.onlineElo.create({
        data: {
          userId,
          elo: 1000,
          rank: 'bronze'
        }
      });
    }

    return {
      elo: eloRecord.elo,
      rank: eloRecord.rank as RankTier
    };
  }

  /**
   * Calculate accuracy score (0-100)
   */
  calculateAccuracyScore(guess: number, actual: number): number {
    const error = Math.abs(guess - actual);
    return Math.max(0, 100 - error);
  }

  /**
   * Calculate rank score (0-100) based on position
   */
  calculateRankScore(position: number, totalPlayers: number): number {
    if (totalPlayers <= 1) return 50; // Neutral if alone
    const playersBeat = totalPlayers - position;
    return (playersBeat / (totalPlayers - 1)) * 100;
  }

  /**
   * Calculate Elo change for a player
   */
  calculateEloChange(accuracyScore: number, rankScore: number): number {
    // Normalize scores to -1 to +1 range
    const accuracyFactor = (accuracyScore - 50) / 50;
    const rankFactor = (rankScore - 50) / 50;

    // Weighted combination
    const change = ONLINE_CONFIG.BASE_ELO_CHANGE * (
      ONLINE_CONFIG.ACCURACY_WEIGHT * accuracyFactor +
      ONLINE_CONFIG.RANK_WEIGHT * rankFactor
    );

    return Math.round(change);
  }

  /**
   * Process all guesses for a completed round
   */
  async processRoundResults(roundId: string, actualWinPercent: number): Promise<OnlineGuessResult[]> {
    // Get all guesses for this round
    const guesses = await this.prisma.onlineGuess.findMany({
      where: { roundId },
      orderBy: { submittedAt: 'asc' }
    });

    if (guesses.length === 0) {
      return [];
    }

    // Calculate accuracy scores and sort by accuracy
    const guessesWithAccuracy = guesses.map(g => ({
      ...g,
      accuracyScore: this.calculateAccuracyScore(g.guess, actualWinPercent)
    }));

    // Sort by accuracy score (highest first) to determine rank
    guessesWithAccuracy.sort((a, b) => b.accuracyScore - a.accuracyScore);

    // Assign rank positions
    guessesWithAccuracy.forEach((g, index) => {
      (g as any).rankPosition = index + 1;
    });

    // Calculate Elo changes (only if 2+ players)
    const applyEloChanges = guesses.length >= ONLINE_CONFIG.MIN_PLAYERS_FOR_ELO;
    const results: OnlineGuessResult[] = [];

    for (const guess of guessesWithAccuracy) {
      // Get current Elo
      const { elo: currentElo } = await this.getOrCreateElo(guess.userId);

      // Calculate rank score
      const rankScore = this.calculateRankScore(
        (guess as any).rankPosition,
        guesses.length
      );

      // Calculate Elo change
      const eloChange = applyEloChanges
        ? this.calculateEloChange(guess.accuracyScore, rankScore)
        : 0;

      const newElo = currentElo + eloChange;

      // Update database
      await this.prisma.$transaction([
        // Update guess record
        this.prisma.onlineGuess.update({
          where: { id: guess.id },
          data: {
            accuracyScore: guess.accuracyScore,
            rankPosition: (guess as any).rankPosition,
            eloChange,
            eloBefore: currentElo,
            eloAfter: newElo
          }
        }),
        // Update Elo record (if changes apply)
        ...(applyEloChanges ? [
          this.prisma.onlineElo.update({
            where: { odlaerId: guess.userId },
            data: {
              elo: newElo,
              rank: this.getRankFromElo(newElo),
              gamesPlayed: { increment: 1 },
              wins: (guess as any).rankPosition <= Math.ceil(guesses.length / 2)
                ? { increment: 1 }
                : undefined,
              highestElo: newElo > currentElo ? newElo : undefined,
              lowestElo: newElo < currentElo ? newElo : undefined
            }
          })
        ] : [])
      ]);

      // Get username for result
      const user = await this.prisma.user.findUnique({
        where: { id: guess.userId },
        select: { username: true }
      });

      results.push({
        userId: guess.userId,
        username: user?.username || 'Unknown',
        guess: guess.guess,
        accuracyScore: guess.accuracyScore,
        rankPosition: (guess as any).rankPosition,
        eloChange,
        eloBefore: currentElo,
        eloAfter: newElo
      });
    }

    // Update round participant count
    await this.prisma.onlineRound.update({
      where: { id: roundId },
      data: { totalParticipants: guesses.length }
    });

    logger.info(`Processed round ${roundId}: ${guesses.length} participants`);
    return results;
  }

  /**
   * Get global leaderboard
   */
  async getLeaderboard(limit: number = 100): Promise<any[]> {
    const topPlayers = await this.prisma.onlineElo.findMany({
      take: limit,
      orderBy: { elo: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            avatarPokemonId: true,
            avatarSprite: true
          }
        }
      }
    });

    return topPlayers.map((p, index) => ({
      rank: index + 1,
      userId: p.userId,
      username: p.user.username,
      elo: p.elo,
      tier: p.rank,
      gamesPlayed: p.gamesPlayed,
      wins: p.wins,
      avatarPokemonId: p.user.avatarPokemonId,
      avatarSprite: p.user.avatarSprite
    }));
  }

  /**
   * Get user's leaderboard position
   */
  async getUserPosition(userId: string): Promise<number> {
    const userElo = await this.prisma.onlineElo.findUnique({
      where: { userId }
    });

    if (!userElo) return -1;

    const higherCount = await this.prisma.onlineElo.count({
      where: {
        elo: { gt: userElo.elo }
      }
    });

    return higherCount + 1;
  }
}

export const onlineEloService = new OnlineEloService();
```

### Controller

Create `backend/src/controllers/online.controller.ts`:

```typescript
import { Request, Response } from 'express';
import { onlineRoundService } from '../services/online-round.service';
import { onlineEloService } from '../services/online-elo.service';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export const onlineController = {
  /**
   * Get current round state
   */
  async getCurrentRound(req: Request, res: Response) {
    try {
      const state = await onlineRoundService.getCurrentRoundState();
      res.json(state);
    } catch (error) {
      logger.error('Error getting current round:', error);
      res.status(500).json({ error: 'Failed to get current round' });
    }
  },

  /**
   * Submit a guess for the current round
   */
  async submitGuess(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { roundNumber, guess } = req.body;

      // Validate guess
      if (typeof guess !== 'number' || guess < 0 || guess > 100) {
        return res.status(400).json({ error: 'Guess must be a number between 0 and 100' });
      }

      // Verify we're in guessing phase for this round
      const currentRound = onlineRoundService.getCurrentRoundNumber();
      const currentPhase = onlineRoundService.getCurrentPhase();

      if (roundNumber !== currentRound) {
        return res.status(400).json({ error: 'Round has ended' });
      }

      if (currentPhase !== 'guessing') {
        return res.status(400).json({ error: 'Guessing phase has ended' });
      }

      // Get round from database
      const round = await prisma.onlineRound.findUnique({
        where: { roundNumber }
      });

      if (!round) {
        return res.status(404).json({ error: 'Round not found' });
      }

      // Check for existing guess
      const existingGuess = await prisma.onlineGuess.findUnique({
        where: {
          roundId_userId: {
            roundId: round.id,
            userId
          }
        }
      });

      if (existingGuess) {
        return res.status(400).json({ error: 'You have already submitted a guess' });
      }

      // Create guess
      const newGuess = await prisma.onlineGuess.create({
        data: {
          roundId: round.id,
          userId,
          guess
        }
      });

      res.json({
        success: true,
        guessId: newGuess.id,
        roundNumber,
        guess
      });
    } catch (error) {
      logger.error('Error submitting guess:', error);
      res.status(500).json({ error: 'Failed to submit guess' });
    }
  },

  /**
   * Get round results
   */
  async getRoundResults(req: Request, res: Response) {
    try {
      const { roundNumber } = req.params;
      const roundNum = parseInt(roundNumber, 10);

      const round = await prisma.onlineRound.findUnique({
        where: { roundNumber: roundNum },
        include: {
          guesses: {
            orderBy: { rankPosition: 'asc' }
          }
        }
      });

      if (!round) {
        return res.status(404).json({ error: 'Round not found' });
      }

      // Get usernames for all guesses
      const userIds = round.guesses.map(g => g.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true }
      });
      const userMap = new Map(users.map(u => [u.id, u.username]));

      res.json({
        roundNumber: round.roundNumber,
        actualWinPercent: round.actualWinPercent,
        totalParticipants: round.totalParticipants,
        guesses: round.guesses.map(g => ({
          userId: g.userId,
          username: userMap.get(g.userId) || 'Unknown',
          guess: g.guess,
          accuracyScore: g.accuracyScore,
          rankPosition: g.rankPosition,
          eloChange: g.eloChange,
          eloBefore: g.eloBefore,
          eloAfter: g.eloAfter
        }))
      });
    } catch (error) {
      logger.error('Error getting round results:', error);
      res.status(500).json({ error: 'Failed to get round results' });
    }
  },

  /**
   * Get global leaderboard
   */
  async getLeaderboard(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 100;
      const leaderboard = await onlineEloService.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      logger.error('Error getting leaderboard:', error);
      res.status(500).json({ error: 'Failed to get leaderboard' });
    }
  },

  /**
   * Get user's online stats
   */
  async getUserStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { elo, rank } = await onlineEloService.getOrCreateElo(userId);
      const position = await onlineEloService.getUserPosition(userId);

      const eloRecord = await prisma.onlineElo.findUnique({
        where: { userId }
      });

      res.json({
        elo,
        rank,
        position,
        gamesPlayed: eloRecord?.gamesPlayed || 0,
        wins: eloRecord?.wins || 0,
        highestElo: eloRecord?.highestElo || 1000,
        lowestElo: eloRecord?.lowestElo || 1000
      });
    } catch (error) {
      logger.error('Error getting user stats:', error);
      res.status(500).json({ error: 'Failed to get user stats' });
    }
  },

  /**
   * Get online players
   */
  async getOnlinePlayers(req: Request, res: Response) {
    try {
      // Get players active in last 60 seconds
      const cutoff = new Date(Date.now() - 60000);

      const onlinePlayers = await prisma.onlinePresence.findMany({
        where: {
          lastSeen: { gte: cutoff }
        },
        orderBy: { lastSeen: 'desc' }
      });

      const userIds = onlinePlayers.map(p => p.userId);

      // Get user details and Elo
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          username: true,
          avatarPokemonId: true,
          avatarSprite: true,
          onlineElo: true
        }
      });

      const userMap = new Map(users.map(u => [u.id, u]));

      const players = onlinePlayers.map(p => {
        const user = userMap.get(p.userId);
        return {
          userId: p.userId,
          username: user?.username || 'Unknown',
          elo: user?.onlineElo?.elo || 1000,
          rank: user?.onlineElo?.rank || 'bronze',
          avatarPokemonId: user?.avatarPokemonId || 25,
          avatarSprite: user?.avatarSprite,
          hasSubmitted: p.hasSubmitted,
          isOnline: true
        };
      });

      // Sort by Elo
      players.sort((a, b) => b.elo - a.elo);

      res.json(players);
    } catch (error) {
      logger.error('Error getting online players:', error);
      res.status(500).json({ error: 'Failed to get online players' });
    }
  }
};
```

### Routes

Create `backend/src/routes/online.routes.ts`:

```typescript
import { Router } from 'express';
import { onlineController } from '../controllers/online.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/round/current', onlineController.getCurrentRound);
router.get('/round/:roundNumber/results', onlineController.getRoundResults);
router.get('/leaderboard', onlineController.getLeaderboard);
router.get('/players', onlineController.getOnlinePlayers);

// Authenticated routes
router.post('/guess', authMiddleware, onlineController.submitGuess);
router.get('/stats', authMiddleware, onlineController.getUserStats);

export default router;
```

### Register Routes

Update `backend/src/routes/index.ts`:

```typescript
import onlineRoutes from './online.routes';

// Add to router
router.use('/online', onlineRoutes);
```

---

## WebSocket Implementation

### WebSocket Gateway

Create `backend/src/websocket/online.gateway.ts`:

```typescript
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { onlineRoundService } from '../services/online-round.service';
import { onlineEloService } from '../services/online-elo.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

class OnlineWebSocketGateway {
  private io: SocketIOServer | null = null;
  private tickInterval: NodeJS.Timeout | null = null;
  private lastPhase: string = 'guessing';
  private lastRound: number = 0;

  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      },
      path: '/ws/online'
    });

    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });

    // Start tick loop (every second)
    this.startTickLoop();

    logger.info('Online WebSocket gateway initialized');
  }

  private async handleConnection(socket: Socket) {
    logger.debug(`WebSocket connected: ${socket.id}`);

    // Handle authentication
    socket.on('authenticate', async (data: { token: string }) => {
      try {
        // Verify token and get user ID (implement based on your auth system)
        const userId = await this.verifyToken(data.token);
        if (userId) {
          (socket as any).userId = userId;
          socket.join('online-room');

          // Update presence
          await this.updatePresence(userId, socket.id, true);

          // Broadcast updated player list
          this.broadcastPlayerList();

          socket.emit('authenticated', { success: true });
        } else {
          socket.emit('authenticated', { success: false, error: 'Invalid token' });
        }
      } catch (error) {
        socket.emit('authenticated', { success: false, error: 'Authentication failed' });
      }
    });

    // Handle heartbeat
    socket.on('heartbeat', async () => {
      const userId = (socket as any).userId;
      if (userId) {
        await this.updatePresence(userId, socket.id, false);
      }
    });

    // Handle guess submission notification
    socket.on('guess-submitted', async () => {
      const userId = (socket as any).userId;
      if (userId) {
        await prisma.onlinePresence.updateMany({
          where: { userId },
          data: { hasSubmitted: true }
        });
        this.broadcastPlayerList();
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      const userId = (socket as any).userId;
      if (userId) {
        await prisma.onlinePresence.deleteMany({
          where: { userId }
        });
        this.broadcastPlayerList();
      }
      logger.debug(`WebSocket disconnected: ${socket.id}`);
    });

    // Send current state
    const currentState = await onlineRoundService.getCurrentRoundState();
    socket.emit('round-state', currentState);
  }

  private async verifyToken(token: string): Promise<string | null> {
    // Implement based on your JWT verification
    // This is a placeholder
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded.id;
    } catch {
      return null;
    }
  }

  private async updatePresence(userId: string, socketId: string, isNew: boolean) {
    await prisma.onlinePresence.upsert({
      where: { userId },
      update: {
        socketId,
        lastSeen: new Date(),
        currentRound: onlineRoundService.getCurrentRoundNumber(),
        hasSubmitted: isNew ? false : undefined
      },
      create: {
        userId,
        socketId,
        currentRound: onlineRoundService.getCurrentRoundNumber(),
        hasSubmitted: false
      }
    });
  }

  private startTickLoop() {
    this.tickInterval = setInterval(async () => {
      await this.tick();
    }, 1000);
  }

  private async tick() {
    if (!this.io) return;

    const currentRound = onlineRoundService.getCurrentRoundNumber();
    const currentPhase = onlineRoundService.getCurrentPhase();
    const timeRemaining = onlineRoundService.getTimeRemaining();

    // Check for phase transition
    if (this.lastRound !== currentRound || this.lastPhase !== currentPhase) {
      if (currentPhase === 'results' && this.lastPhase === 'guessing') {
        // Guessing phase just ended - process results
        await this.handlePhaseTransitionToResults(this.lastRound);
      } else if (currentPhase === 'guessing' && this.lastPhase === 'results') {
        // New round started
        await this.handleNewRound(currentRound);
      }

      this.lastRound = currentRound;
      this.lastPhase = currentPhase;
    }

    // Broadcast tick update
    this.io.to('online-room').emit('tick', {
      roundNumber: currentRound,
      phase: currentPhase,
      timeRemaining
    });
  }

  private async handlePhaseTransitionToResults(roundNumber: number) {
    logger.info(`Processing results for round ${roundNumber}`);

    // Get round data
    const round = await prisma.onlineRound.findUnique({
      where: { roundNumber }
    });

    if (!round) return;

    // Process Elo changes
    const results = await onlineEloService.processRoundResults(
      round.id,
      round.actualWinPercent
    );

    // Broadcast results
    this.io?.to('online-room').emit('round-results', {
      roundNumber,
      actualWinPercent: round.actualWinPercent,
      results
    });

    // Reset hasSubmitted for all players
    await prisma.onlinePresence.updateMany({
      data: { hasSubmitted: false }
    });

    // Broadcast updated player list (with new Elos)
    this.broadcastPlayerList();
  }

  private async handleNewRound(roundNumber: number) {
    logger.info(`Starting new round ${roundNumber}`);

    const state = await onlineRoundService.getOrCreateRound(roundNumber);

    // Broadcast new round
    this.io?.to('online-room').emit('new-round', state);

    // Broadcast updated player list
    this.broadcastPlayerList();
  }

  private async broadcastPlayerList() {
    const cutoff = new Date(Date.now() - 60000);

    const onlinePlayers = await prisma.onlinePresence.findMany({
      where: { lastSeen: { gte: cutoff } }
    });

    const userIds = onlinePlayers.map(p => p.userId);

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        avatarPokemonId: true,
        avatarSprite: true,
        onlineElo: true
      }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    const players = onlinePlayers.map(p => {
      const user = userMap.get(p.userId);
      return {
        userId: p.userId,
        username: user?.username || 'Unknown',
        elo: user?.onlineElo?.elo || 1000,
        rank: user?.onlineElo?.rank || 'bronze',
        avatarPokemonId: user?.avatarPokemonId || 25,
        avatarSprite: user?.avatarSprite,
        hasSubmitted: p.hasSubmitted
      };
    });

    players.sort((a, b) => b.elo - a.elo);

    this.io?.to('online-room').emit('players-update', players);
  }

  shutdown() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
    }
    this.io?.close();
    logger.info('Online WebSocket gateway shutdown');
  }
}

export const onlineWebSocketGateway = new OnlineWebSocketGateway();
```

### Update app.ts for WebSocket

Update `backend/src/app.ts`:

```typescript
import { createServer } from 'http';
import { onlineWebSocketGateway } from './websocket/online.gateway';
import { onlineRoundService } from './services/online-round.service';

// Create HTTP server from Express app
const server = createServer(app);

// Initialize WebSocket gateway
onlineWebSocketGateway.initialize(server);

// Start online round generation
onlineRoundService.startRoundLoop();

// Use server.listen instead of app.listen
server.listen(PORT, async () => {
  // ... existing initialization code
});

// Update shutdown handlers
process.on('SIGTERM', async () => {
  onlineRoundService.stopRoundLoop();
  onlineWebSocketGateway.shutdown();
  // ... rest of shutdown
});
```

---

## Frontend Implementation

### File Structure

```
frontend/src/
├── components/
│   └── online/
│       ├── OnlineMode.tsx           # Main container
│       ├── OnlineBattle.tsx         # Battle display
│       ├── OnlineGuessSlider.tsx    # Guess input
│       ├── OnlineTimer.tsx          # Countdown timer
│       ├── OnlinePlayerList.tsx     # Active players
│       ├── OnlineLeaderboard.tsx    # Global rankings
│       ├── OnlineResults.tsx        # Round results
│       └── OnlineRankBadge.tsx      # Rank tier badge
├── hooks/
│   └── useOnlineSocket.ts           # WebSocket hook
├── services/
│   └── online.service.ts            # API calls
├── stores/
│   └── onlineStore.ts               # Zustand store
└── types/
    └── online.types.ts              # TypeScript interfaces
```

### Types

Create `frontend/src/types/online.types.ts`:

```typescript
export interface OnlineRoundState {
  roundNumber: number;
  phase: 'guessing' | 'results';
  timeRemaining: number;
  pokemon1: PokemonInstance;
  pokemon2: PokemonInstance;
  actualWinPercent?: number;
  totalParticipants: number;
}

export interface OnlinePlayer {
  userId: string;
  username: string;
  elo: number;
  rank: RankTier;
  avatarPokemonId: number;
  avatarSprite: string;
  hasSubmitted: boolean;
}

export interface OnlineGuessResult {
  userId: string;
  username: string;
  guess: number;
  accuracyScore: number;
  rankPosition: number;
  eloChange: number;
  eloBefore: number;
  eloAfter: number;
}

export interface OnlineUserStats {
  elo: number;
  rank: RankTier;
  position: number;
  gamesPlayed: number;
  wins: number;
  highestElo: number;
  lowestElo: number;
}

export type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';

export const RANK_COLORS: Record<RankTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
  master: '#9B59B6'
};

export const RANK_NAMES: Record<RankTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  diamond: 'Diamond',
  master: 'Master'
};
```

### Zustand Store

Create `frontend/src/stores/onlineStore.ts`:

```typescript
import { create } from 'zustand';
import { OnlineRoundState, OnlinePlayer, OnlineGuessResult, OnlineUserStats } from '../types/online.types';

interface OnlineState {
  // Connection
  isConnected: boolean;
  isAuthenticated: boolean;

  // Round state
  currentRound: OnlineRoundState | null;
  timeRemaining: number;
  phase: 'guessing' | 'results';

  // Player state
  myGuess: number | null;
  hasSubmitted: boolean;
  myStats: OnlineUserStats | null;

  // Players
  onlinePlayers: OnlinePlayer[];
  leaderboard: OnlinePlayer[];

  // Results
  roundResults: OnlineGuessResult[] | null;
  myResult: OnlineGuessResult | null;

  // Actions
  setConnected: (connected: boolean) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setCurrentRound: (round: OnlineRoundState) => void;
  setTimeRemaining: (time: number) => void;
  setPhase: (phase: 'guessing' | 'results') => void;
  setMyGuess: (guess: number | null) => void;
  setHasSubmitted: (submitted: boolean) => void;
  setMyStats: (stats: OnlineUserStats | null) => void;
  setOnlinePlayers: (players: OnlinePlayer[]) => void;
  setLeaderboard: (players: OnlinePlayer[]) => void;
  setRoundResults: (results: OnlineGuessResult[] | null) => void;
  resetRound: () => void;
}

export const useOnlineStore = create<OnlineState>((set, get) => ({
  // Initial state
  isConnected: false,
  isAuthenticated: false,
  currentRound: null,
  timeRemaining: 30,
  phase: 'guessing',
  myGuess: null,
  hasSubmitted: false,
  myStats: null,
  onlinePlayers: [],
  leaderboard: [],
  roundResults: null,
  myResult: null,

  // Actions
  setConnected: (connected) => set({ isConnected: connected }),
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  setCurrentRound: (round) => set({
    currentRound: round,
    phase: round.phase,
    timeRemaining: round.timeRemaining
  }),
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  setPhase: (phase) => set({ phase }),
  setMyGuess: (guess) => set({ myGuess: guess }),
  setHasSubmitted: (submitted) => set({ hasSubmitted: submitted }),
  setMyStats: (stats) => set({ myStats: stats }),
  setOnlinePlayers: (players) => set({ onlinePlayers: players }),
  setLeaderboard: (players) => set({ leaderboard: players }),
  setRoundResults: (results) => {
    const userId = get().myStats?.odlaerId;
    const myResult = results?.find(r => r.userId === userId) || null;
    set({ roundResults: results, myResult });
  },
  resetRound: () => set({
    myGuess: null,
    hasSubmitted: false,
    roundResults: null,
    myResult: null
  })
}));
```

### WebSocket Hook

Create `frontend/src/hooks/useOnlineSocket.ts`:

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useOnlineStore } from '../stores/onlineStore';
import { useAuthStore } from '../stores/authStore';

const SOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:4000';

export const useOnlineSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { token, isAuthenticated } = useAuthStore();
  const {
    setConnected,
    setAuthenticated,
    setCurrentRound,
    setTimeRemaining,
    setPhase,
    setOnlinePlayers,
    setRoundResults,
    resetRound
  } = useOnlineStore();

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    socketRef.current = io(SOCKET_URL, {
      path: '/ws/online',
      transports: ['websocket']
    });

    socketRef.current.on('connect', () => {
      setConnected(true);

      // Authenticate if we have a token
      if (token) {
        socketRef.current?.emit('authenticate', { token });
      }
    });

    socketRef.current.on('authenticated', (data) => {
      setAuthenticated(data.success);
    });

    socketRef.current.on('round-state', (state) => {
      setCurrentRound(state);
    });

    socketRef.current.on('tick', (data) => {
      setTimeRemaining(data.timeRemaining);
      setPhase(data.phase);
    });

    socketRef.current.on('new-round', (state) => {
      resetRound();
      setCurrentRound(state);
    });

    socketRef.current.on('round-results', (data) => {
      setRoundResults(data.results);
    });

    socketRef.current.on('players-update', (players) => {
      setOnlinePlayers(players);
    });

    socketRef.current.on('disconnect', () => {
      setConnected(false);
      setAuthenticated(false);
    });

    // Start heartbeat
    const heartbeatInterval = setInterval(() => {
      socketRef.current?.emit('heartbeat');
    }, 10000);

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [token]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
    setAuthenticated(false);
  }, []);

  const notifyGuessSubmitted = useCallback(() => {
    socketRef.current?.emit('guess-submitted');
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    connect,
    disconnect,
    notifyGuessSubmitted,
    socket: socketRef.current
  };
};
```

### API Service

Create `frontend/src/services/online.service.ts`:

```typescript
import axios from 'axios';

const API_BASE = '/api/online';

export const onlineService = {
  async getCurrentRound() {
    const response = await axios.get(`${API_BASE}/round/current`);
    return response.data;
  },

  async submitGuess(roundNumber: number, guess: number) {
    const response = await axios.post(`${API_BASE}/guess`, {
      roundNumber,
      guess
    });
    return response.data;
  },

  async getRoundResults(roundNumber: number) {
    const response = await axios.get(`${API_BASE}/round/${roundNumber}/results`);
    return response.data;
  },

  async getLeaderboard(limit: number = 100) {
    const response = await axios.get(`${API_BASE}/leaderboard`, {
      params: { limit }
    });
    return response.data;
  },

  async getUserStats() {
    const response = await axios.get(`${API_BASE}/stats`);
    return response.data;
  },

  async getOnlinePlayers() {
    const response = await axios.get(`${API_BASE}/players`);
    return response.data;
  }
};
```

### Main Component

Create `frontend/src/components/online/OnlineMode.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import {
  Box, Stack, Grid, Title, Text, Card, Badge, Button,
  Center, Loader, Alert, Group
} from '@mantine/core';
import { IconWifi, IconWifiOff, IconLock } from '@tabler/icons-react';
import { useAuthStore } from '../../stores/authStore';
import { useOnlineStore } from '../../stores/onlineStore';
import { useOnlineSocket } from '../../hooks/useOnlineSocket';
import { onlineService } from '../../services/online.service';
import { FullCard } from '../pokemon-cards';
import OnlineTimer from './OnlineTimer';
import OnlineGuessSlider from './OnlineGuessSlider';
import OnlinePlayerList from './OnlinePlayerList';
import OnlineLeaderboard from './OnlineLeaderboard';
import OnlineResults from './OnlineResults';
import OnlineRankBadge from './OnlineRankBadge';

const OnlineMode: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const {
    isConnected,
    currentRound,
    phase,
    timeRemaining,
    myGuess,
    hasSubmitted,
    myStats,
    onlinePlayers,
    roundResults,
    setMyGuess,
    setHasSubmitted,
    setMyStats,
    setLeaderboard
  } = useOnlineStore();

  const { connect, disconnect, notifyGuessSubmitted } = useOnlineSocket();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Connect on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      connect();
      loadUserStats();
      loadLeaderboard();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated]);

  const loadUserStats = async () => {
    try {
      const stats = await onlineService.getUserStats();
      setMyStats(stats);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const leaderboard = await onlineService.getLeaderboard(50);
      setLeaderboard(leaderboard);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  const handleSubmitGuess = async () => {
    if (!currentRound || myGuess === null || hasSubmitted) return;

    setIsSubmitting(true);
    try {
      await onlineService.submitGuess(currentRound.roundNumber, myGuess);
      setHasSubmitted(true);
      notifyGuessSubmitted();
    } catch (error) {
      console.error('Failed to submit guess:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Not logged in
  if (!isAuthenticated) {
    return (
      <Center h={400}>
        <Card withBorder p="xl" maw={400}>
          <Stack align="center" gap="md">
            <IconLock size={48} color="gray" />
            <Title order={3}>Login Required</Title>
            <Text c="dimmed" ta="center">
              Online Mode requires an account to track your Elo rating
              and compete with players worldwide.
            </Text>
            <Group>
              <Button variant="filled">Login</Button>
              <Button variant="outline">Create Account</Button>
            </Group>
          </Stack>
        </Card>
      </Center>
    );
  }

  // Loading/Connecting
  if (!isConnected || !currentRound) {
    return (
      <Center h={400}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Connecting to Online Mode...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Box maw={1600} mx="auto" p="md">
      <Grid gutter="md">
        {/* Main Battle Area */}
        <Grid.Col span={{ base: 12, lg: 9 }}>
          <Stack gap="md">
            {/* Header */}
            <Card withBorder p="md">
              <Group justify="space-between" align="center">
                <Group gap="md">
                  <Badge
                    size="lg"
                    color={isConnected ? 'green' : 'red'}
                    leftSection={isConnected ? <IconWifi size={14} /> : <IconWifiOff size={14} />}
                  >
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                  <Text fw={600}>Round #{currentRound.roundNumber}</Text>
                </Group>
                <Group gap="md">
                  {myStats && (
                    <>
                      <OnlineRankBadge rank={myStats.rank} />
                      <Text fw={700}>{myStats.elo} Elo</Text>
                    </>
                  )}
                </Group>
              </Group>
            </Card>

            {/* Timer */}
            <OnlineTimer
              phase={phase}
              timeRemaining={timeRemaining}
            />

            {/* Battle Display */}
            <Card withBorder p="lg">
              <Grid gutter="md">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <FullCard
                    pokemon={currentRound.pokemon1}
                    position="left"
                    showResults={phase === 'results'}
                    guessPercentage={phase === 'results' ? currentRound.actualWinPercent : undefined}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <FullCard
                    pokemon={currentRound.pokemon2}
                    position="right"
                    showResults={phase === 'results'}
                    guessPercentage={phase === 'results' ? (100 - (currentRound.actualWinPercent || 0)) : undefined}
                  />
                </Grid.Col>
              </Grid>
            </Card>

            {/* Guess Input (Guessing Phase) */}
            {phase === 'guessing' && (
              <OnlineGuessSlider
                pokemon1Name={currentRound.pokemon1.name}
                pokemon2Name={currentRound.pokemon2.name}
                value={myGuess}
                onChange={setMyGuess}
                onSubmit={handleSubmitGuess}
                hasSubmitted={hasSubmitted}
                isSubmitting={isSubmitting}
                disabled={hasSubmitted || timeRemaining <= 1}
              />
            )}

            {/* Results (Results Phase) */}
            {phase === 'results' && roundResults && (
              <OnlineResults
                actualWinPercent={currentRound.actualWinPercent!}
                results={roundResults}
                myUserId={user?.id}
              />
            )}
          </Stack>
        </Grid.Col>

        {/* Sidebar */}
        <Grid.Col span={{ base: 12, lg: 3 }}>
          <Stack gap="md">
            {/* Online Players */}
            <OnlinePlayerList
              players={onlinePlayers}
              myUserId={user?.id}
            />

            {/* Leaderboard */}
            <OnlineLeaderboard
              myUserId={user?.id}
              myPosition={myStats?.position}
            />
          </Stack>
        </Grid.Col>
      </Grid>
    </Box>
  );
};

export default OnlineMode;
```

---

## API Endpoints

### Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/online/round/current` | No | Get current round state |
| POST | `/api/online/guess` | Yes | Submit a guess |
| GET | `/api/online/round/:roundNumber/results` | No | Get round results |
| GET | `/api/online/leaderboard` | No | Get global leaderboard |
| GET | `/api/online/stats` | Yes | Get user's online stats |
| GET | `/api/online/players` | No | Get online players |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `authenticate` | Client→Server | Authenticate with token |
| `authenticated` | Server→Client | Auth result |
| `heartbeat` | Client→Server | Keep-alive ping |
| `guess-submitted` | Client→Server | Notify guess submitted |
| `round-state` | Server→Client | Full round state |
| `tick` | Server→Client | Time/phase update |
| `new-round` | Server→Client | New round started |
| `round-results` | Server→Client | Round results |
| `players-update` | Server→Client | Player list update |

---

## Testing Strategy

### Unit Tests

1. **Elo Calculation**
   - Accuracy score calculation
   - Rank score calculation
   - Combined Elo change
   - Edge cases (solo player, tied scores)

2. **Round Management**
   - Round number calculation
   - Phase determination
   - Time remaining calculation

### Integration Tests

1. **API Endpoints**
   - Guess submission validation
   - Round results retrieval
   - Leaderboard queries

2. **WebSocket**
   - Connection/authentication flow
   - Event broadcasting
   - Player presence tracking

### E2E Tests

1. **Full Game Flow**
   - Join online mode
   - Wait for round
   - Submit guess
   - View results
   - Verify Elo change

---

## Implementation Phases

### Phase 1: Database & Core Services (2-3 days)
- [ ] Add Prisma schema changes
- [ ] Run migrations
- [ ] Implement `online-round.service.ts`
- [ ] Implement `online-elo.service.ts`
- [ ] Add basic controller and routes

### Phase 2: WebSocket Infrastructure (2-3 days)
- [ ] Set up Socket.IO
- [ ] Implement `online.gateway.ts`
- [ ] Add tick loop and phase transitions
- [ ] Implement player presence tracking

### Phase 3: Frontend Components (3-4 days)
- [ ] Create Zustand store
- [ ] Implement WebSocket hook
- [ ] Build OnlineMode container
- [ ] Build sub-components (Timer, GuessSlider, PlayerList, etc.)
- [ ] Add navigation/routing

### Phase 4: Integration & Polish (2-3 days)
- [ ] Connect frontend to backend
- [ ] Add animations and transitions
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Mobile responsiveness

### Phase 5: Testing & Launch (2-3 days)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Performance testing
- [ ] Bug fixes
- [ ] Documentation

**Total Estimated Time: 11-16 days**

---

## Dependencies

### Backend
- `socket.io` - WebSocket server
- Existing: `@prisma/client`, `express`, `jsonwebtoken`

### Frontend
- `socket.io-client` - WebSocket client
- Existing: `zustand`, `@mantine/core`, `axios`

### Install Commands

```bash
# Backend
cd backend
npm install socket.io

# Frontend
cd frontend
npm install socket.io-client
```

---

## Notes

1. **Scalability**: For high traffic, consider Redis for presence/caching and horizontal scaling of WebSocket servers
2. **Time Sync**: Consider using NTP or server time sync for better accuracy
3. **Rate Limiting**: Add rate limiting to prevent guess spam
4. **Reconnection**: Implement reconnection logic with exponential backoff
5. **Offline Handling**: Handle network interruptions gracefully
