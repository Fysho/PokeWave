import express, { Application, Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorMiddleware } from './middleware/error.middleware';
import { loggerMiddleware } from './middleware/logger.middleware';
import routes from './routes';
import logger from './utils/logger';
import { pokemonMoveStoreService } from './services/pokemon-move-store.service';
import { pokemonItemStoreService } from './services/pokemon-item-store.service';
import { pokemonAbilityStoreService } from './services/pokemon-ability-store.service';
import { dailyChallengeService } from './services/daily-challenge.service';
import { battleCacheService } from './services/battle-cache.service';
import { onlineRoundService } from './services/online-round.service';
import { onlineWebSocketGateway } from './websocket/online.gateway';
import { initializeServices, shutdownServices } from './services/service-factory';

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();

// Create HTTP server for both Express and WebSocket
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);

// Routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler (must be after all routes)
app.use((req: Request, res: Response) => {
  logger.warn(`Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

// Initialize WebSocket gateway
onlineWebSocketGateway.initialize(httpServer);

// Start server
const PORT = process.env.PORT || 4000;
const server = httpServer.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  
  // Initialize services (database connection if enabled)
  try {
    await initializeServices();
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    // Continue anyway - will use in-memory storage
  }
  
  // Initialize Pokemon stores
  logger.info('Initializing Pokemon data stores...');
  
  // Initialize all stores in parallel
  const storePromises = [
    pokemonMoveStoreService.initialize().catch(error => {
      logger.error('Failed to initialize Pokemon move store:', error);
    }),
    pokemonItemStoreService.initialize().catch(error => {
      logger.error('Failed to initialize Pokemon item store:', error);
    }),
    pokemonAbilityStoreService.initialize().catch(error => {
      logger.error('Failed to initialize Pokemon ability store:', error);
    })
  ];
  
  await Promise.all(storePromises);
  logger.info('Pokemon data stores initialization complete');
  
  // Initialize daily challenges
  logger.info('Initializing daily challenges...');
  try {
    await dailyChallengeService.initializeDailyChallenges();
    logger.info('Daily challenges initialization complete');
  } catch (error) {
    logger.error('Failed to initialize daily challenges:', error);
  }
  
  // Initialize battle cache
  logger.info('Initializing battle cache...');
  try {
    await battleCacheService.initialize();
    logger.info('Battle cache initialization complete');
  } catch (error) {
    logger.error('Failed to initialize battle cache:', error);
  }

  // Initialize Online Mode round generation
  logger.info('Initializing Online Mode...');
  try {
    await onlineRoundService.startRoundLoop();
    logger.info('Online Mode initialization complete');
  } catch (error) {
    logger.error('Failed to initialize Online Mode:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');

  // Stop Online Mode
  onlineRoundService.stopRoundLoop();
  onlineWebSocketGateway.shutdown();

  // Shutdown services (database connection if enabled)
  await shutdownServices();

  server.close(() => {
    logger.info('HTTP server closed');
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');

  // Stop Online Mode
  onlineRoundService.stopRoundLoop();
  onlineWebSocketGateway.shutdown();

  // Shutdown services (database connection if enabled)
  await shutdownServices();

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;