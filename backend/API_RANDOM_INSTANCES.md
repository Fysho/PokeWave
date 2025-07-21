# Random Pokemon Instances API

## Endpoint: `GET /api/pokemon/random-instances`

This endpoint returns two random Pokemon with complete battle-ready data including stats, moves, abilities, items, and more.

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `generation` | number | 1 | Pokemon generation (1-9) |
| `level_mode` | string | "fixed" | Level mode: "fixed" or "random" |
| `random_levels` | boolean | false | Alternative way to enable random levels |
| `level` | number | 50 | Fixed level when using fixed mode (1-100) |
| `min_level` | number | 1 | Minimum level when using random mode (1-100) |
| `max_level` | number | 100 | Maximum level when using random mode (1-100) |
| `item_mode` | string | "random" | Item mode: "random" or "none" |
| `no_items` | boolean | false | Alternative way to disable items (sets item_mode to "none") |

## Examples

### Fixed Level (Default)
```bash
# Both Pokemon at level 50
GET /api/pokemon/random-instances

# Both Pokemon at level 75
GET /api/pokemon/random-instances?level=75

# Gen 3 Pokemon at level 100
GET /api/pokemon/random-instances?generation=3&level=100
```

### Random Levels
```bash
# Random levels between 1-100
GET /api/pokemon/random-instances?random_levels=true

# Random levels between 50-80
GET /api/pokemon/random-instances?level_mode=random&min_level=50&max_level=80

# Gen 5 Pokemon with random levels 25-75
GET /api/pokemon/random-instances?generation=5&random_levels=true&min_level=25&max_level=75
```

### Item Settings
```bash
# No held items
GET /api/pokemon/random-instances?item_mode=none

# No items (alternative)
GET /api/pokemon/random-instances?no_items=true

# Random items (default - 50% chance)
GET /api/pokemon/random-instances?item_mode=random

# Combine with other settings
GET /api/pokemon/random-instances?generation=3&level=100&no_items=true
GET /api/pokemon/random-instances?random_levels=true&min_level=45&max_level=55&item_mode=none
```

## Response Format

```json
{
  "pokemon1": {
    "id": 25,
    "name": "Pikachu",
    "species": "Pikachu",
    "level": 50,
    "types": ["electric"],
    "ability": "Static",
    "item": "Light Ball",
    "moves": ["Thunder Shock", "Quick Attack", "Thunder Wave", "Electro Ball"],
    "stats": {
      "hp": 95,
      "attack": 75,
      "defense": 60,
      "specialAttack": 70,
      "specialDefense": 60,
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
    "evs": {
      "hp": 0,
      "attack": 0,
      "defense": 0,
      "specialAttack": 0,
      "specialDefense": 0,
      "speed": 0
    },
    "ivs": {
      "hp": 31,
      "attack": 31,
      "defense": 31,
      "specialAttack": 31,
      "specialDefense": 31,
      "speed": 31
    },
    "nature": "Timid",
    "sprites": {
      "front": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
      "back": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/25.png",
      "shiny": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png"
    }
  },
  "pokemon2": {
    // Same structure as pokemon1
  },
  "generation": 1
}
```

## Pokemon Instance Details

Each Pokemon instance includes:

- **Basic Info**: ID, name, species, level, types
- **Battle Stats**: Calculated stats including IVs, EVs, and nature effects
- **Base Stats**: Raw species base stats
- **Abilities**: Randomly selected from available abilities
- **Items**: Based on item_mode:
  - "random": 50% chance of having a competitive held item
  - "none": No held items
- **Moves**: Up to 4 moves from the Pokemon's level-up learnset
- **IVs**: Always perfect (31) for all stats
- **EVs**: Always untrained (0) for all stats
- **Nature**: Randomly selected from all 25 natures
- **Sprites**: Front, back, and shiny sprite URLs from PokeAPI

## Notes

- Pokemon IDs are selected based on the generation parameter
- The same Pokemon will not be selected twice in one request
- Moves are selected from the Pokemon's level-up learnset at or below their current level
- Stats are calculated using the standard Pokemon stat formula with IVs, EVs, and nature