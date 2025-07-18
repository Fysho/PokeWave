import { Router } from 'express';
import { getPokemon, getRandomPokemon } from '../controllers/pokemon.controller';

const router = Router();

// Get random Pokemon IDs (must be before /:id route)
router.get('/random', getRandomPokemon);

// Get specific Pokemon by ID
router.get('/:id', getPokemon);

export default router;