import { Router } from 'express';
import pokemonRoutes from './pokemon.routes';
import battleRoutes from './battle.routes';
import pokemonInfoRoutes from './pokemoninfo.routes';

const router = Router();

// Mount route modules
router.use('/pokemon', pokemonRoutes);
router.use('/battle', battleRoutes);
router.use('/pokemoninfo', pokemonInfoRoutes);

export default router;