import { Router } from 'express';
import { getPokemon, getRandomPokemon, getRandomPokemonWithInstances } from '../controllers/pokemon.controller';
import { pokemonInstanceStore } from '../services/pokemon-instance-store.service';

const router = Router();

// Get random Pokemon IDs (must be before /:id route)
router.get('/random', getRandomPokemon);

// Get random Pokemon with full instance data (must be before /:id route)
router.get('/random-instances', getRandomPokemonWithInstances);

// Debug endpoint to check instance store
router.get('/instance-store/status', (req, res) => {
  res.json({
    instanceCount: pokemonInstanceStore.getStoreSize(),
    message: 'Pokemon instance store is operational'
  });
});

// Get specific Pokemon by ID
router.get('/:id', getPokemon);

export default router;