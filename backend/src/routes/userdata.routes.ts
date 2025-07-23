import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import * as userDataController from '../controllers/userdata.controller';

const router = Router();

// All user data routes require authentication
router.use(authMiddleware);

// Get all user data
router.get('/me', userDataController.getUserData);

// Sync Pokedex data
router.post('/pokedex/sync', userDataController.syncPokedex);

// Sync game stats
router.post('/stats/sync', userDataController.syncGameStats);

// Unlock a specific Pokemon
router.post('/pokedex/unlock', userDataController.unlockPokemon);

export default router;