import { Router } from 'express';
import pokemonRoutes from './pokemon.routes';
import battleRoutes from './battle.routes';

const router = Router();

// Mount route modules
router.use('/pokemon', pokemonRoutes);
router.use('/battle', battleRoutes);

export default router;