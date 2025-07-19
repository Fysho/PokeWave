// Complete Pokemon data structure for battles
export interface CompletePokemon {
  // Basic info
  id: number;
  name: string;
  species: string; // Internal species name for battle engine
  level: number;
  
  // Battle properties
  types: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  moves: string[]; // Move IDs for battle engine
  moveNames: string[]; // Display names
  ability: string;
  abilityName: string; // Display name
  item?: string;
  itemName?: string; // Display name
  
  // Display properties
  sprites: {
    front: string;
    back: string;
    shiny: string;
  };
  
  // Battle results (updated after simulation)
  wins?: number;
}

import { Teams } from '@pkmn/sim';

// Function to create a team string for Pokemon Showdown
export function createTeamString(pokemon: CompletePokemon): string {
  // Create a proper set object that Teams.pack expects
  const set = {
    name: pokemon.name,
    species: pokemon.species,
    item: pokemon.item || '',
    ability: pokemon.ability,
    moves: pokemon.moves,
    nature: 'Hardy',
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    level: pokemon.level,
    gender: ''
  };

  // Use Teams.pack to create the proper team string
  const teamString = Teams.pack([set]);
  return teamString;
}