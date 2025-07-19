import { Router } from 'express';
import { getPokemonInstance } from '../controllers/pokemoninstance.controller';

const router = Router();

// Create Pokemon instance with calculated stats
router.post('/', getPokemonInstance);

export default router;