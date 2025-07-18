import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorMiddleware } from './middleware/error.middleware';
import { loggerMiddleware } from './middleware/logger.middleware';
import routes from './routes';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);

// Routes
app.use('/api', routes);

// Test endpoint to verify routing is working
app.get('/api/test', (_req: Request, res: Response) => {
  res.json({ message: 'Test endpoint working' });
});

// Direct Pokemon endpoint for testing
app.get('/api/pokemon/random', (_req: Request, res: Response) => {
  res.json({ pokemon1Id: 1, pokemon2Id: 2, generation: 9 });
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler (must be before error middleware)
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

// Start server
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

export default app;