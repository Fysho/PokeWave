import { Router } from 'express';
import { getRandomPokemon, getRandomPokemonWithInstances, getPokedex, getPokemonById, getAvailableMovesForPokemon, updatePokemonInstanceMove, getCachedBattle } from '../controllers/pokemon.controller';

const router = Router();

// Get random Pokemon IDs (must be before /:id route)
router.get('/random', getRandomPokemon);

// Get random Pokemon with full instance data (must be before /:id route)
router.get('/random-instances', getRandomPokemonWithInstances);

// Get cached battle with pre-generated Pokemon instances
router.get('/cached-battle', getCachedBattle);

// Get all Pokemon for Pokedex (must be before /:id route)
router.get('/pokedex', getPokedex);

// Debug endpoint to check instance store
router.get('/instance-store/status', (req, res) => {
  res.json({
    message: 'status endpoint is not used'
  });
});

// Get specific Pokemon by ID
router.get('/:id', getPokemonById);

// Get available moves for a Pokemon
router.get('/:id/available-moves', getAvailableMovesForPokemon);

// Update Pokemon instance move
router.post('/:id/update-move', updatePokemonInstanceMove);

export default router;