// Type effectiveness chart for Pokemon
// Based on Gen 6+ type chart (includes Fairy type)

export interface TypeEffectiveness {
  weakTo: string[];        // Takes 2x damage from these types
  resistantTo: string[];   // Takes 0.5x damage from these types
  immuneTo: string[];      // Takes 0x damage from these types
}

const typeChart: Record<string, TypeEffectiveness> = {
  normal: {
    weakTo: ['fighting'],
    resistantTo: [],
    immuneTo: ['ghost']
  },
  fire: {
    weakTo: ['water', 'ground', 'rock'],
    resistantTo: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'],
    immuneTo: []
  },
  water: {
    weakTo: ['electric', 'grass'],
    resistantTo: ['fire', 'water', 'ice', 'steel'],
    immuneTo: []
  },
  electric: {
    weakTo: ['ground'],
    resistantTo: ['electric', 'flying', 'steel'],
    immuneTo: []
  },
  grass: {
    weakTo: ['fire', 'ice', 'poison', 'flying', 'bug'],
    resistantTo: ['water', 'electric', 'grass', 'ground'],
    immuneTo: []
  },
  ice: {
    weakTo: ['fire', 'fighting', 'rock', 'steel'],
    resistantTo: ['ice'],
    immuneTo: []
  },
  fighting: {
    weakTo: ['flying', 'psychic', 'fairy'],
    resistantTo: ['bug', 'rock', 'dark'],
    immuneTo: []
  },
  poison: {
    weakTo: ['ground', 'psychic'],
    resistantTo: ['grass', 'fighting', 'poison', 'bug', 'fairy'],
    immuneTo: []
  },
  ground: {
    weakTo: ['water', 'grass', 'ice'],
    resistantTo: ['poison', 'rock'],
    immuneTo: ['electric']
  },
  flying: {
    weakTo: ['electric', 'ice', 'rock'],
    resistantTo: ['grass', 'fighting', 'bug'],
    immuneTo: ['ground']
  },
  psychic: {
    weakTo: ['bug', 'ghost', 'dark'],
    resistantTo: ['fighting', 'psychic'],
    immuneTo: []
  },
  bug: {
    weakTo: ['fire', 'flying', 'rock'],
    resistantTo: ['grass', 'fighting', 'ground'],
    immuneTo: []
  },
  rock: {
    weakTo: ['water', 'grass', 'fighting', 'ground', 'steel'],
    resistantTo: ['normal', 'fire', 'poison', 'flying'],
    immuneTo: []
  },
  ghost: {
    weakTo: ['ghost', 'dark'],
    resistantTo: ['poison', 'bug'],
    immuneTo: ['normal', 'fighting']
  },
  dragon: {
    weakTo: ['ice', 'dragon', 'fairy'],
    resistantTo: ['fire', 'water', 'electric', 'grass'],
    immuneTo: []
  },
  dark: {
    weakTo: ['fighting', 'bug', 'fairy'],
    resistantTo: ['ghost', 'dark'],
    immuneTo: ['psychic']
  },
  steel: {
    weakTo: ['fire', 'fighting', 'ground'],
    resistantTo: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'],
    immuneTo: ['poison']
  },
  fairy: {
    weakTo: ['poison', 'steel'],
    resistantTo: ['fighting', 'bug', 'dark'],
    immuneTo: ['dragon']
  }
};

export function getTypeEffectiveness(type: string): TypeEffectiveness {
  return typeChart[type.toLowerCase()] || { weakTo: [], resistantTo: [], immuneTo: [] };
}

// Calculate combined type effectiveness for dual-type Pokemon
export function getCombinedTypeEffectiveness(type1: string, type2?: string): TypeEffectiveness {
  if (!type2 || type1 === type2) {
    return getTypeEffectiveness(type1);
  }

  const effectiveness1 = getTypeEffectiveness(type1);
  const effectiveness2 = getTypeEffectiveness(type2);

  // Calculate combined effectiveness
  const damageMultipliers: Record<string, number> = {};
  
  // Get all types
  const allTypes = Object.keys(typeChart);
  
  // Calculate damage multiplier for each type
  for (const attackType of allTypes) {
    let multiplier = 1;
    
    // Check type 1
    if (effectiveness1.immuneTo.includes(attackType)) {
      multiplier *= 0;
    } else if (effectiveness1.weakTo.includes(attackType)) {
      multiplier *= 2;
    } else if (effectiveness1.resistantTo.includes(attackType)) {
      multiplier *= 0.5;
    }
    
    // Check type 2
    if (effectiveness2.immuneTo.includes(attackType)) {
      multiplier *= 0;
    } else if (effectiveness2.weakTo.includes(attackType)) {
      multiplier *= 2;
    } else if (effectiveness2.resistantTo.includes(attackType)) {
      multiplier *= 0.5;
    }
    
    damageMultipliers[attackType] = multiplier;
  }
  
  // Categorize based on final multipliers
  const weakTo: string[] = [];
  const resistantTo: string[] = [];
  const immuneTo: string[] = [];
  
  for (const [type, multiplier] of Object.entries(damageMultipliers)) {
    if (multiplier === 0) {
      immuneTo.push(type);
    } else if (multiplier > 1) {
      weakTo.push(type);
    } else if (multiplier < 1) {
      resistantTo.push(type);
    }
  }
  
  return { weakTo, resistantTo, immuneTo };
}

// Format type list for display
export function formatTypeList(types: string[]): string {
  if (types.length === 0) return 'None';
  return types.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');
}

// Get type names as an array (for rendering with colors)
export function getTypeArray(types: string[]): string[] {
  return types;
}