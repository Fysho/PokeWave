# Pokemon Instance API Endpoint

## Overview
The Pokemon Instance endpoint creates a battle-ready Pokemon with calculated stats based on level, IVs (Individual Values), and EVs (Effort Values). It automatically selects the 4 most recently learned moves and a random ability.

## Endpoint
```
POST /api/pokemoninstance
```

## Request Body

```json
{
  "pokemonId": 25,
  "level": 50,
  "ivs": {
    "hp": 31,
    "attack": 31,
    "defense": 31,
    "specialAttack": 31,
    "specialDefense": 31,
    "speed": 31
  },
  "evs": {
    "hp": 0,
    "attack": 0,
    "defense": 0,
    "specialAttack": 0,
    "specialDefense": 0,
    "speed": 0
  },
  "generation": 9
}
```

### Parameters

- `pokemonId` (required): Pokemon ID (National Dex number)
- `level` (required): Pokemon level (1-100)
- `ivs` (optional): Individual Values for each stat (0-31). Defaults to 31 for all stats.
- `evs` (optional): Effort Values for each stat (0-252, max 510 total). Defaults to 0 for all stats.
- `generation` (optional): Generation number (1-9). Defaults to 9.

### Stat Properties (for ivs and evs)
- `hp`: Hit Points
- `attack`: Attack
- `defense`: Defense
- `specialAttack`: Special Attack
- `specialDefense`: Special Defense
- `speed`: Speed

## Response Format

```json
{
  "id": 25,
  "name": "Pikachu",
  "level": 50,
  "types": ["electric"],
  "ability": "Static",
  "moves": [
    "Wild Charge",
    "Thunder",
    "Light Screen",
    "Discharge"
  ],
  "stats": {
    "hp": 110,
    "attack": 75,
    "defense": 60,
    "specialAttack": 70,
    "specialDefense": 70,
    "speed": 110
  },
  "baseStats": {
    "hp": 35,
    "attack": 55,
    "defense": 40,
    "specialAttack": 50,
    "specialDefense": 50,
    "speed": 90
  },
  "ivs": {
    "hp": 31,
    "attack": 31,
    "defense": 31,
    "specialAttack": 31,
    "specialDefense": 31,
    "speed": 31
  },
  "evs": {
    "hp": 0,
    "attack": 0,
    "defense": 0,
    "specialAttack": 0,
    "specialDefense": 0,
    "speed": 0
  },
  "sprites": {
    "front": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
    "back": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/25.png",
    "shiny": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png"
  }
}
```

## Features

### Stat Calculation
Stats are calculated using the official Pokemon stat formula:
- **HP**: floor(((2 * base + IV + floor(EV/4)) * level / 100) + level + 10)
- **Other stats**: floor(((2 * base + IV + floor(EV/4)) * level / 100) + 5) * nature

Note: Currently uses neutral nature (1.0 multiplier) for all stats.

### Move Selection
- Selects the 4 most recently learned moves at or below the Pokemon's level
- Moves are generation-specific (only includes moves available in the specified generation)
- If fewer than 4 moves are available, returns all available moves

### Ability Selection
- Randomly selects from all available abilities (primary, secondary, and hidden)
- Each ability has equal chance of being selected

## Examples

### Create a basic Pokemon with default IVs/EVs
```bash
curl -X POST http://localhost:4000/api/pokemoninstance \
  -H "Content-Type: application/json" \
  -d '{
    "pokemonId": 25,
    "level": 50
  }'
```

### Create a competitive Pokemon with custom EVs
```bash
curl -X POST http://localhost:4000/api/pokemoninstance \
  -H "Content-Type: application/json" \
  -d '{
    "pokemonId": 445,
    "level": 100,
    "evs": {
      "attack": 252,
      "speed": 252,
      "hp": 4
    }
  }'
```

### Create a Pokemon with specific IVs for Hidden Power
```bash
curl -X POST http://localhost:4000/api/pokemoninstance \
  -H "Content-Type: application/json" \
  -d '{
    "pokemonId": 65,
    "level": 50,
    "ivs": {
      "hp": 31,
      "attack": 30,
      "defense": 31,
      "specialAttack": 30,
      "specialDefense": 31,
      "speed": 31
    }
  }'
```

### Create a Generation 1 Pokemon
```bash
curl -X POST http://localhost:4000/api/pokemoninstance \
  -H "Content-Type: application/json" \
  -d '{
    "pokemonId": 150,
    "level": 70,
    "generation": 1
  }'
```

## Validation Rules

### IVs (Individual Values)
- Each stat IV must be between 0 and 31
- Defaults to 31 (perfect) if not specified

### EVs (Effort Values)
- Each stat EV must be between 0 and 252
- Total EVs across all stats cannot exceed 510
- Defaults to 0 if not specified

### Level
- Must be between 1 and 100

### Generation
- Must be between 1 and 9
- Affects which moves are available

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid Pokemon ID"
}
```

Possible causes:
- Invalid or missing Pokemon ID
- Level outside 1-100 range
- IVs outside 0-31 range
- EVs outside 0-252 range or total > 510
- Invalid generation number

### 404 Not Found
```json
{
  "error": "Pokemon with ID 9999 not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create Pokemon instance"
}
```

## Use Cases

1. **Battle Simulation**: Create specific Pokemon builds for testing battle outcomes
2. **Team Building**: Generate Pokemon with competitive EV spreads
3. **Training Calculators**: Show Pokemon stats at different levels with various EV investments
4. **Breeding Tools**: Display potential stats with different IV combinations
5. **Game Planning**: Preview Pokemon stats before training in-game

## Notes

- Shedinja always has 1 HP regardless of level, IVs, or EVs
- The ability is randomly selected each time, even with the same inputs
- Moves are the 4 most recent level-up moves, not necessarily the optimal moveset
- Currently uses neutral nature; nature support could be added in the future