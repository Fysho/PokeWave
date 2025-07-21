import { Router } from 'express';
import { getPokemon, getRandomPokemon, getRandomPokemonWithInstances } from '../controllers/pokemon.controller';

const router = Router();

// Get random Pokemon IDs (must be before /:id route)
router.get('/random', getRandomPokemon);

// Get random Pokemon with full instance data (must be before /:id route)
router.get('/random-instances', getRandomPokemonWithInstances);

// Get specific Pokemon by ID
router.get('/:id', getPokemon);

export default router;