import { Router } from 'express';
import { 
  getAllMoves, 
  getMoveById, 
  getMovesByType, 
  getMovesByCategory,
  getMovesForPokemon,
  searchMoves,
  getMoveStoreStatus,
  refreshMoveStore
} from '../controllers/pokemon-moves.controller';

const router = Router();

// Get move store status
router.get('/status', getMoveStoreStatus);

// Get all moves
router.get('/', getAllMoves);

// Search moves by query
router.get('/search', searchMoves);

// Get moves by type
router.get('/type/:type', getMovesByType);

// Get moves by category (physical, special, status)
router.get('/category/:category', getMovesByCategory);

// Get moves for a specific Pokemon
router.get('/pokemon/:pokemonName', getMovesForPokemon);

// Refresh move store (admin endpoint)
router.post('/refresh', refreshMoveStore);

// Get specific move by name (must be last due to :name parameter)
router.get('/:name', getMoveById);

export default router;