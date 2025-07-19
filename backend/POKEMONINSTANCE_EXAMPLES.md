# Pokemon Instance API - Example Request Bodies

## Basic Examples

### 1. Simple Pokemon (Default Everything)
```json
{
  "pokemonId": 25,
  "level": 50
}
```
This creates a level 50 Pikachu with:
- Perfect IVs (31 all)
- No EVs
- Random nature
- Random ability
- 4 most recent level-up moves
- 50% chance of random held item
- No status condition

### 2. Competitive Sweeper Build
```json
{
  "pokemonId": 445,
  "level": 100,
  "nature": "jolly",
  "evs": {
    "attack": 252,
    "speed": 252,
    "hp": 4
  },
  "heldItem": {
    "mode": "specific",
    "item": "Life Orb"
  },
  "ability": {
    "mode": "specific",
    "ability": "Rough Skin"
  }
}
```
This creates a competitive Garchomp with:
- Jolly nature (+Speed, -Special Attack)
- Max Attack and Speed EVs
- Life Orb for damage boost
- Rough Skin ability

### 3. Tank Build with Status
```json
{
  "pokemonId": 143,
  "level": 50,
  "nature": "careful",
  "evs": {
    "hp": 252,
    "specialDefense": 252,
    "defense": 4
  },
  "ivs": {
    "hp": 31,
    "attack": 0,
    "defense": 31,
    "specialAttack": 31,
    "specialDefense": 31,
    "speed": 31
  },
  "status": "asleep",
  "heldItem": {
    "mode": "specific",
    "item": "Leftovers"
  },
  "ability": {
    "mode": "specific",
    "ability": "Thick Fat"
  }
}
```
This creates a defensive Snorlax with:
- Careful nature (+Special Defense, -Special Attack)
- 0 Attack IV to minimize Foul Play damage
- Already asleep (for Sleep Talk strategies)
- Leftovers for recovery

### 4. No Item Build
```json
{
  "pokemonId": 130,
  "level": 50,
  "nature": "adamant",
  "heldItem": {
    "mode": "none"
  }
}
```
This creates a Gyarados with no held item (useful for Acrobatics or knock-off scenarios).

### 5. Custom Moves
```json
{
  "pokemonId": 6,
  "level": 100,
  "nature": "timid",
  "moves": {
    "mode": "specific",
    "moveList": ["Flamethrower", "Solar Beam", "Dragon Pulse", "Roost"]
  },
  "heldItem": {
    "mode": "specific",
    "item": "Charizardite Y"
  }
}
```
This creates a Charizard with specific moves for a Mega Charizard Y set.

### 6. Paralyzed Lead
```json
{
  "pokemonId": 25,
  "level": 50,
  "status": "paralyzed",
  "nature": "timid",
  "evs": {
    "specialAttack": 252,
    "speed": 252,
    "hp": 4
  },
  "heldItem": {
    "mode": "specific",
    "item": "Focus Sash"
  }
}
```
This creates a Pikachu that's already paralyzed (perhaps for Facade strategies).

### 7. Happiness-Based Build
```json
{
  "pokemonId": 242,
  "level": 50,
  "happiness": 0,
  "nature": "bold",
  "moves": {
    "mode": "specific",
    "moveList": ["Frustration", "Toxic", "Soft-Boiled", "Seismic Toss"]
  }
}
```
This creates a Blissey with 0 happiness for maximum Frustration damage.

### 8. Generation 1 Format
```json
{
  "pokemonId": 150,
  "level": 100,
  "generation": 1,
  "evs": {
    "specialAttack": 252,
    "speed": 252,
    "hp": 4
  }
}
```
This creates a Mewtwo with only Generation 1 moves available.

### 9. Burned Physical Attacker
```json
{
  "pokemonId": 68,
  "level": 50,
  "status": "burned",
  "nature": "adamant",
  "ability": {
    "mode": "specific",
    "ability": "Guts"
  },
  "heldItem": {
    "mode": "specific",
    "item": "Flame Orb"
  }
}
```
This creates a Machamp with Guts ability and burned status for boosted attack.

### 10. Perfect Hidden Power Build
```json
{
  "pokemonId": 135,
  "level": 50,
  "nature": "timid",
  "ivs": {
    "hp": 31,
    "attack": 30,
    "defense": 31,
    "specialAttack": 30,
    "specialDefense": 31,
    "speed": 31
  },
  "evs": {
    "specialAttack": 252,
    "speed": 252,
    "hp": 4
  }
}
```
This creates a Jolteon with IVs for Hidden Power Ice.

## Field Reference

### Status Options
- `"none"` - No status (default)
- `"paralyzed"` - Speed reduced to 50%, 25% chance of full paralysis
- `"burned"` - Attack halved, damage over time
- `"frozen"` - Cannot move until thawed
- `"poisoned"` - Damage over time
- `"badly poisoned"` - Increasing damage over time
- `"asleep"` - Cannot move for 1-3 turns

### Held Item Configuration
```json
"heldItem": {
  "mode": "none" | "random" | "specific",
  "item": "Item Name" // Only used if mode is "specific"
}
```

### Ability Configuration
```json
"ability": {
  "mode": "random" | "specific",
  "ability": "Ability Name" // Only used if mode is "specific"
}
```

### Moves Configuration
```json
"moves": {
  "mode": "auto" | "specific",
  "moveList": ["Move 1", "Move 2", "Move 3", "Move 4"] // Only used if mode is "specific"
}
```

### Nature List
Neutral: Hardy, Docile, Serious, Bashful, Quirky
+Attack: Lonely (-Defense), Brave (-Speed), Adamant (-Sp.Atk), Naughty (-Sp.Def)
+Defense: Bold (-Attack), Relaxed (-Speed), Impish (-Sp.Atk), Lax (-Sp.Def)
+Speed: Timid (-Attack), Hasty (-Defense), Jolly (-Sp.Atk), Naive (-Sp.Def)
+Sp.Atk: Modest (-Attack), Mild (-Defense), Quiet (-Speed), Rash (-Sp.Def)
+Sp.Def: Calm (-Attack), Gentle (-Defense), Sassy (-Speed), Careful (-Sp.Atk)