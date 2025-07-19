import { Router } from 'express';
import { getPokemonInfo } from '../controllers/pokemoninfo.controller';

const router = Router();

// Get Pokemon info by ID with optional generation
router.get('/:id', getPokemonInfo);

export default router;