{
  "name": "Defaultmon",            // Custom nickname shown in battle. Can be anything; defaults to species name.
  "species": "Pikachu",            // The Pokémon species identifier (must match Showdown's species list).
  "forme": null,                   // Alternate form (e.g., "Alola", "Galar", "Mega"). Null means base form.
  "gender": "N",                   // Gender of the Pokémon: "M" (male), "F" (female), or "N" (genderless).
  "shiny": false,                  // Boolean flag indicating if the Pokémon is shiny.
  "level": 100,                    // The Pokémon's level (1–100). Defaults to 100 if not specified.
  "happiness": 255,                // Friendship value (0–255). Affects moves like Return or Frustration.
  "ability": "Static",             // Active ability the Pokémon uses (must be valid for its species).
  "abilitySlot": 0,                // Ability slot index: 0 (primary), 1 (secondary), or 2 (hidden ability).
  "item": "",                      // Held item (e.g., "Leftovers"). Empty string means no item.
  "pokeball": "pokeball",          // Cosmetic detail of which Poké Ball it was "caught" in.
  "teraType": "Normal",            // Tera type used when Terastallizing (Gen 9).
  "gigantamax": false,             // Boolean flag if this Pokémon's sprite should be its G-Max variant.
  "canGigantamax": false,          // Indicates if this species is capable of G-Max (even if not currently active).
  "isDynamaxed": false,            // If true, Pokémon is currently Dynamaxed (mid-battle only).
  "zMove": null,                   // Name of assigned Z-Move (for Z-crystals in Gen 7).
  "zMoveFrom": null,               // The original move converted into the Z-Move (if applicable).
  "megaEvo": null,                 // Mega Evolution form name (e.g., "Charizard-Mega-X").

  "moves": [                       // List of up to 4 moves this Pokémon can use in battle.
    "tackle"
  ],
  "moveData": [                    // Optional detailed data for each move (used for custom PP setups).
    { "move": "tackle", "pp": 35, "maxpp": 35 }
  ],

  "evs": {                         // Effort Values (EVs) distribution (0–252 per stat, max 510 total).
    "hp": 0,                       // EVs affecting max HP.
    "atk": 0,                      // EVs affecting physical attack stat.
    "def": 0,                      // EVs affecting physical defense stat.
    "spa": 0,                      // EVs affecting special attack stat.
    "spd": 0,                      // EVs affecting special defense stat.
    "spe": 0                       // EVs affecting speed stat.
  },
  "ivs": {                         // Individual Values (IVs) distribution (0–31 per stat).
    "hp": 0,                       // IV for max HP.
    "atk": 0,                      // IV for physical attack.
    "def": 0,                      // IV for physical defense.
    "spa": 0,                      // IV for special attack.
    "spd": 0,                      // IV for special defense.
    "spe": 0                       // IV for speed.
  },
  "nature": "Hardy",               // Nature that modifies stats (Hardy is neutral).
  "hpType": null,                  // Hidden Power type (Gen 7 and earlier).
  "hpIVs": null,                   // IV overrides for Hidden Power type (legacy mechanic).

  "status": null,                  // Current status condition: "brn", "par", "slp", "psn", "tox", "frz", or null.
  "statusData": null,              // Extra status data (e.g., sleep turn counter).
  "volatileStatus": [],            // Temporary conditions (e.g., "confusion", "substitute").
  "boosts": {                      // Current in-battle stat stage changes (-6 to +6 per stat).
    "atk": 0,                      // Attack stage boost.
    "def": 0,                      // Defense stage boost.
    "spa": 0,                      // Special attack stage boost.
    "spd": 0,                      // Special defense stage boost.
    "spe": 0,                      // Speed stage boost.
    "accuracy": 0,                 // Accuracy stage boost.
    "evasion": 0                   // Evasion stage boost.
  },
  "toxicCounter": 0,               // Toxic damage turn counter (if badly poisoned).
  "subHP": null,                   // HP of substitute (if active).
  "fainted": false,                // If Pokémon is fainted.

  "currentHP": null,               // Current HP value (used in battle snapshots).
  "maxHP": null,                   // Max HP value (used in battle snapshots).
  "faintedThisTurn": false,        // Tracks if the Pokémon fainted this turn (for certain mechanics).
  "teamIndex": 1,                  // Position of this Pokémon in the team (1–6).

  "hidden": false                  // Internal flag for hiding a Pokémon's info (not commonly used).
}
