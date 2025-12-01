/**
 * Online WebSocket Gateway
 *
 * Handles real-time communication for Online Mode including:
 * - Player presence tracking
 * - Round state broadcasting
 * - Phase transition notifications
 * - Player list updates
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { onlineRoundService } from '../services/online-round.service';
import { onlineEloService } from '../services/online-elo.service';
import { OnlinePhase, OnlinePlayer } from '../types/online.types';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

class OnlineWebSocketGateway {
  private io: SocketIOServer | null = null;
  private tickInterval: NodeJS.Timeout | null = null;
  private lastPhase: OnlinePhase = 'guessing';
  private lastRound: number = 0;
  private isRunning: boolean = false;

  /**
   * Initialize the WebSocket server
   */
  initialize(server: HTTPServer): void {
    if (this.io) {
      logger.warn('WebSocket gateway already initialized');
      return;
    }

    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      path: '/ws/online'
    });

    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket as AuthenticatedSocket);
    });

    // Start the tick loop
    this.startTickLoop();

    logger.info('Online WebSocket gateway initialized');
  }

  /**
   * Handle new socket connection
   */
  private async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    logger.debug(`WebSocket connected: ${socket.id}`);

    // Handle authentication
    socket.on('authenticate', async (data: { token: string }) => {
      try {
        const userId = await this.verifyToken(data.token);
        if (userId) {
          socket.userId = userId;

          // Get username
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { username: true }
          });
          socket.username = user?.username;

          // Join the online room
          socket.join('online-room');

          // Update presence
          await this.updatePresence(userId, socket.id, true);

          // Broadcast updated player list
          await this.broadcastPlayerList();

          // Send current round state
          const currentState = await onlineRoundService.getCurrentRoundState();
          socket.emit('round-state', currentState);

          socket.emit('authenticated', { success: true, userId });
          logger.info(`User ${socket.username} (${userId}) authenticated via WebSocket`);
        } else {
          socket.emit('authenticated', { success: false, error: 'Invalid token' });
        }
      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        socket.emit('authenticated', { success: false, error: 'Authentication failed' });
      }
    });

    // Handle heartbeat
    socket.on('heartbeat', async () => {
      if (socket.userId) {
        await this.updatePresence(socket.userId, socket.id, false);
      }
    });

    // Handle guess submission notification
    socket.on('guess-submitted', async () => {
      if (socket.userId) {
        await prisma.onlinePresence.updateMany({
          where: { userId: socket.userId },
          data: { hasSubmitted: true }
        });
        await this.broadcastPlayerList();
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      if (socket.userId) {
        await prisma.onlinePresence.deleteMany({
          where: { userId: socket.userId }
        });
        await this.broadcastPlayerList();
        logger.debug(`User ${socket.username} disconnected from Online Mode`);
      }
    });

    // Send current state to newly connected socket (before auth)
    try {
      const currentState = await onlineRoundService.getCurrentRoundState();
      socket.emit('round-state', currentState);
    } catch (error) {
      logger.error('Error sending initial state:', error);
    }
  }

  /**
   * Verify JWT token and return user ID
   */
  private async verifyToken(token: string): Promise<string | null> {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        logger.error('JWT_SECRET not configured');
        return null;
      }

      const decoded = jwt.verify(token, secret) as { id: string };
      return decoded.id;
    } catch (error) {
      logger.debug('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Update player presence
   */
  private async updatePresence(userId: string, socketId: string, isNew: boolean): Promise<void> {
    const currentRound = onlineRoundService.getCurrentRoundNumber();

    await prisma.onlinePresence.upsert({
      where: { userId },
      update: {
        socketId,
        lastSeen: new Date(),
        currentRound,
        hasSubmitted: isNew ? false : undefined
      },
      create: {
        userId,
        socketId,
        currentRound,
        hasSubmitted: false
      }
    });
  }

  /**
   * Start the tick loop (runs every second)
   */
  private startTickLoop(): void {
    if (this.tickInterval || this.isRunning) return;

    this.isRunning = true;
    this.lastRound = onlineRoundService.getCurrentRoundNumber();
    this.lastPhase = onlineRoundService.getCurrentPhase();

    this.tickInterval = setInterval(async () => {
      try {
        await this.tick();
      } catch (error) {
        logger.error('Error in WebSocket tick:', error);
      }
    }, 1000);

    logger.info('WebSocket tick loop started');
  }

  /**
   * Tick handler - broadcasts time updates and handles phase transitions
   */
  private async tick(): Promise<void> {
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

    // Broadcast tick update to all connected clients
    this.io.to('online-room').emit('tick', {
      roundNumber: currentRound,
      phase: currentPhase,
      timeRemaining
    });
  }

  /**
   * Handle transition from guessing to results phase
   */
  private async handlePhaseTransitionToResults(roundNumber: number): Promise<void> {
    logger.info(`Processing results for round ${roundNumber}`);

    try {
      // Get round data
      const round = await prisma.onlineRound.findUnique({
        where: { roundNumber }
      });

      if (!round) {
        logger.error(`Round ${roundNumber} not found for results processing`);
        return;
      }

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
      await this.broadcastPlayerList();

      logger.info(`Round ${roundNumber} results broadcast to ${results.length} participants`);
    } catch (error) {
      logger.error(`Error processing results for round ${roundNumber}:`, error);
    }
  }

  /**
   * Handle new round start
   */
  private async handleNewRound(roundNumber: number): Promise<void> {
    logger.info(`Starting new round ${roundNumber}`);

    try {
      const state = await onlineRoundService.getOrCreateRound(roundNumber);

      // Broadcast new round to all clients
      this.io?.to('online-room').emit('new-round', {
        roundNumber: state.roundNumber,
        phase: 'guessing',
        timeRemaining: onlineRoundService.getTimeRemaining(),
        pokemon1: state.pokemon1Data,
        pokemon2: state.pokemon2Data,
        totalParticipants: 0
      });

      // Broadcast updated player list
      await this.broadcastPlayerList();
    } catch (error) {
      logger.error(`Error handling new round ${roundNumber}:`, error);
    }
  }

  /**
   * Broadcast player list to all connected clients
   */
  private async broadcastPlayerList(): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - 60000);

      const onlinePlayers = await prisma.onlinePresence.findMany({
        where: { lastSeen: { gte: cutoff } }
      });

      if (onlinePlayers.length === 0) {
        this.io?.to('online-room').emit('players-update', []);
        return;
      }

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

      const players: OnlinePlayer[] = onlinePlayers.map(p => {
        const user = userMap.get(p.userId);
        return {
          userId: p.userId,
          username: user?.username || 'Unknown',
          elo: user?.onlineElo?.elo || 1000,
          rank: (user?.onlineElo?.rank || 'bronze') as any,
          avatarPokemonId: user?.avatarPokemonId || 25,
          avatarSprite: user?.avatarSprite || '',
          hasSubmitted: p.hasSubmitted,
          isOnline: true
        };
      });

      // Sort by Elo (highest first)
      players.sort((a, b) => b.elo - a.elo);

      this.io?.to('online-room').emit('players-update', players);
    } catch (error) {
      logger.error('Error broadcasting player list:', error);
    }
  }

  /**
   * Get the number of connected clients
   */
  getConnectedCount(): number {
    if (!this.io) return 0;
    const room = this.io.sockets.adapter.rooms.get('online-room');
    return room?.size || 0;
  }

  /**
   * Shutdown the WebSocket gateway
   */
  shutdown(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    this.isRunning = false;

    if (this.io) {
      this.io.close();
      this.io = null;
    }

    logger.info('Online WebSocket gateway shutdown');
  }
}

export const onlineWebSocketGateway = new OnlineWebSocketGateway();
