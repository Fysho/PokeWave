import { Router } from 'express';
import { simulateBattle, submitGuess, simulateSingleBattle } from '../controllers/battle.controller';

const router = Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Battle routes are working!', timestamp: new Date().toISOString() });
});

// Debug endpoint for testing battle simulation
router.post('/test-simulate', async (req, res) => {
  try {
    const { Dex } = require('@pkmn/dex');
    const dex = Dex.forGen(1);
    
    // Test getting species
    const allSpecies = dex.species.all();
    const pikachu = allSpecies.find((s: any) => s.num === 25);
    const charizard = allSpecies.find((s: any) => s.num === 6);
    
    res.json({
      message: 'Test successful',
      pikachu: pikachu ? { name: pikachu.name, types: pikachu.types } : null,
      charizard: charizard ? { name: charizard.name, types: charizard.types } : null
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    });
  }
});

// Simulate a battle between two Pokemon
router.post('/simulate', simulateBattle);

// Simulate a battle with Pokemon instances
router.post('/simulate-with-instances', async (req, res, next) => {
  try {
    console.log('/simulate-with-instances endpoint reached', {
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      message: 'Endpoint reached successfully',
      receivedData: {
        hasPokemon1: !!req.body.pokemon1,
        hasPokemon2: !!req.body.pokemon2,
        generation: req.body.generation
      }
    });
  } catch (error) {
    next(error);
  }
});

// Submit a guess for battle outcome
router.post('/guess', submitGuess);

// Simulate a single battle with turn-by-turn details
router.post('/simulate-single', simulateSingleBattle);

export default router;