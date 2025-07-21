import { Router } from 'express';
import { getPokemon, getRandomPokemon, getRandomPokemonWithInstances } from '../controllers/pokemon.controller';

const router = Router();

// Get random Pokemon IDs (must be before /:id route)
router.get('/random', getRandomPokemon);

// Get random Pokemon with full instance data (must be before /:id route)
router.get('/random-instances', getRandomPokemonWithInstances);

// Debug endpoint to check instance store
router.get('/instance-store/status', (req, res) => {
  res.json({
    message: 'status endpoint is not used'
  });
});

// Get specific Pokemon by ID
router.get('/:id', getPokemon);

export default router;