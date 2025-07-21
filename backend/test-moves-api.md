# Pokemon Moves API Test Examples

## Base URL
```
http://localhost:4000/api/moves
```

## Endpoints

### 1. Get Move Store Status
```bash
curl http://localhost:4000/api/moves/status
```

### 2. Get All Moves (with pagination)
```bash
# Get first 20 moves
curl "http://localhost:4000/api/moves?limit=20&offset=0"

# Get moves of a specific type
curl "http://localhost:4000/api/moves?type=fire&limit=10"

# Get moves by category
curl "http://localhost:4000/api/moves?category=physical&limit=10"
```

### 3. Get Specific Move
```bash
# Get details for Thunder Shock
curl http://localhost:4000/api/moves/thunder-shock

# Get details for Tackle
curl http://localhost:4000/api/moves/tackle
```

### 4. Get Moves by Type
```bash
# Get all electric type moves
curl http://localhost:4000/api/moves/type/electric

# Get fire type moves with pagination
curl "http://localhost:4000/api/moves/type/fire?limit=10&offset=0"
```

### 5. Get Moves by Category
```bash
# Get physical moves
curl http://localhost:4000/api/moves/category/physical

# Get special moves
curl http://localhost:4000/api/moves/category/special

# Get status moves
curl http://localhost:4000/api/moves/category/status
```

### 6. Get Moves for a Pokemon
```bash
# Get moves that Pikachu can learn
curl http://localhost:4000/api/moves/pokemon/pikachu

# Get moves that Charizard can learn
curl http://localhost:4000/api/moves/pokemon/charizard
```

### 7. Search Moves
```bash
# Search for moves containing "thunder"
curl "http://localhost:4000/api/moves/search?q=thunder"

# Search for moves with "paralyze" in their effect
curl "http://localhost:4000/api/moves/search?q=paralyze"
```

### 8. Refresh Move Store (Admin)
```bash
# Force refresh the move store
curl -X POST http://localhost:4000/api/moves/refresh
```

## Example Response Format

### Move Detail Response
```json
{
  "id": 84,
  "name": "thunder-shock",
  "type": "electric",
  "category": "special",
  "power": 40,
  "accuracy": 100,
  "pp": 30,
  "priority": 0,
  "damageClass": "special",
  "effectChance": 10,
  "effectEntries": [
    "Inflicts regular damage. Has a 10% chance to paralyze the target."
  ],
  "target": "selected-pokemon",
  "generation": "generation-i",
  "learnedByPokemon": ["pikachu", "raichu", "magnemite", "magneton", ...]
}
```

### List Response Format
```json
{
  "moves": [...],
  "total": 826,
  "offset": 0,
  "limit": 20
}
```