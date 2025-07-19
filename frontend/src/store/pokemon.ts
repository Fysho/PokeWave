// Pokemon class to encapsulate all Pokemon data and behavior
export class Pokemon {
  // Basic properties
  public readonly id: number;
  public readonly name: string;
  public readonly level: number;
  public readonly types: string[];
  
  // Stats
  public readonly baseStats: Stats;
  public readonly ivs: Stats;
  public readonly evs: Stats;
  public readonly calculatedStats: Stats;
  
  // Battle properties
  public readonly moves: string[];
  public readonly ability: string;
  public readonly item?: string;
  
  // Display properties
  public readonly sprites: PokemonSprites;
  
  // Battle results
  public wins: number = 0;
  public losses: number = 0;
  public totalBattlesPlayed: number = 0;
  
  // Level-up moves
  public readonly levelupMoves: LevelupMove[];

  constructor(data: PokemonData) {
    this.id = data.id;
    this.name = data.name;
    this.level = data.level;
    this.types = data.types;
    
    this.baseStats = data.baseStats || data.stats;
    this.ivs = data.ivs || this.getDefaultIVs();
    this.evs = data.evs || this.getDefaultEVs();
    this.calculatedStats = data.stats;
    
    this.moves = data.moves;
    this.ability = data.ability || 'Unknown';
    this.item = data.item;
    
    this.sprites = data.sprites;
    this.wins = data.wins || 0;
    
    this.levelupMoves = data.levelupMoves || [];
  }

  // Getters for computed properties
  get winRate(): number {
    const totalBattles = this.wins + this.losses;
    return totalBattles === 0 ? 0 : (this.wins / totalBattles) * 100;
  }

  get totalBattles(): number {
    return this.wins + this.losses;
  }

  get totalBaseStats(): number {
    return Object.values(this.baseStats).reduce((sum, stat) => sum + stat, 0);
  }

  get totalCalculatedStats(): number {
    return Object.values(this.calculatedStats).reduce((sum, stat) => sum + stat, 0);
  }

  get primaryType(): string {
    return this.types[0] || 'normal';
  }

  get secondaryType(): string | null {
    return this.types[1] || null;
  }

  get isDualType(): boolean {
    return this.types.length > 1;
  }

  // Methods
  public recordWin(): void {
    this.wins++;
  }

  public recordLoss(): void {
    this.losses++;
  }

  public hasMove(moveName: string): boolean {
    return this.moves.some(move => move.toLowerCase() === moveName.toLowerCase());
  }

  public getMoveAtLevel(level: number): LevelupMove[] {
    return this.levelupMoves.filter(move => move.level === level);
  }

  public getMovesUpToLevel(level: number): LevelupMove[] {
    return this.levelupMoves.filter(move => move.level <= level);
  }

  public getStatValue(statName: keyof Stats): number {
    return this.calculatedStats[statName];
  }

  public getBaseStatValue(statName: keyof Stats): number {
    return this.baseStats[statName];
  }

  // Static factory method to create from API response
  public static fromApiResponse(data: any, totalBattles?: number): Pokemon {
    const pokemon = new Pokemon({
      id: data.id,
      name: data.name,
      level: data.level,
      types: data.types,
      baseStats: data.baseStats || data.stats,
      ivs: data.ivs,
      evs: data.evs,
      stats: data.stats,
      moves: data.moves,
      ability: data.ability,
      item: data.item,
      sprites: data.sprites,
      wins: data.wins,
      levelupMoves: data.levelupMoves
    });
    
    // If totalBattles is provided, calculate losses
    if (totalBattles !== undefined) {
      pokemon.totalBattlesPlayed = totalBattles;
      pokemon.losses = totalBattles - pokemon.wins;
    }
    
    return pokemon;
  }

  // Default values
  private getDefaultIVs(): Stats {
    return {
      hp: 31,
      attack: 31,
      defense: 31,
      specialAttack: 31,
      specialDefense: 31,
      speed: 31
    };
  }

  private getDefaultEVs(): Stats {
    return {
      hp: 0,
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0
    };
  }

  // Utility method to get display-friendly stat name
  public static getStatDisplayName(statName: keyof Stats): string {
    const displayNames: Record<keyof Stats, string> = {
      hp: 'HP',
      attack: 'Attack',
      defense: 'Defense',
      specialAttack: 'Special Attack',
      specialDefense: 'Special Defense',
      speed: 'Speed'
    };
    return displayNames[statName];
  }

  // Calculate what the stat would be at a different level
  public calculateStatAtLevel(statName: keyof Stats, level: number): number {
    const baseStat = this.baseStats[statName];
    const iv = this.ivs[statName];
    const ev = this.evs[statName];
    
    if (statName === 'hp') {
      return Math.floor(((2 * baseStat + iv + (ev / 4)) * level / 100) + level + 10);
    } else {
      return Math.floor(((2 * baseStat + iv + (ev / 4)) * level / 100) + 5);
    }
  }
}

// Type definitions
export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface PokemonSprites {
  front: string;
  back: string;
  shiny: string;
}

export interface LevelupMove {
  level: number;
  move: string;
}

export interface PokemonData {
  id: number;
  name: string;
  level: number;
  types: string[];
  baseStats?: Stats;
  ivs?: Stats;
  evs?: Stats;
  stats: Stats;
  moves: string[];
  ability?: string;
  item?: string;
  sprites: PokemonSprites;
  wins?: number;
  levelupMoves?: LevelupMove[];
}

// Type effectiveness chart (for future use)
export class TypeEffectiveness {
  private static readonly typeChart: Record<string, Record<string, number>> = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fighting: { normal: 2, rock: 2, steel: 2, ice: 2, dark: 2, flying: 0.5, poison: 0.5, bug: 0.5, psychic: 0.5, fairy: 0.5, ghost: 0 },
    flying: { fighting: 2, bug: 2, grass: 2, rock: 0.5, steel: 0.5, electric: 0.5 },
    poison: { grass: 2, fairy: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0 },
    ground: { poison: 2, rock: 2, steel: 2, fire: 2, electric: 2, flying: 0, bug: 0.5, grass: 0.5 },
    rock: { flying: 2, bug: 2, fire: 2, ice: 2, fighting: 0.5, ground: 0.5, steel: 0.5 },
    bug: { grass: 2, psychic: 2, dark: 2, fighting: 0.5, flying: 0.5, poison: 0.5, ghost: 0.5, steel: 0.5, fire: 0.5, fairy: 0.5 },
    ghost: { ghost: 2, psychic: 2, normal: 0, dark: 0.5 },
    steel: { rock: 2, ice: 2, fairy: 2, steel: 0.5, fire: 0.5, water: 0.5, electric: 0.5 },
    fire: { bug: 2, steel: 2, grass: 2, ice: 2, rock: 0.5, fire: 0.5, water: 0.5, dragon: 0.5 },
    water: { ground: 2, rock: 2, fire: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
    grass: { ground: 2, rock: 2, water: 2, flying: 0.5, poison: 0.5, bug: 0.5, steel: 0.5, fire: 0.5, grass: 0.5, dragon: 0.5 },
    electric: { flying: 2, water: 2, ground: 0, grass: 0.5, electric: 0.5, dragon: 0.5 },
    psychic: { fighting: 2, poison: 2, steel: 0.5, psychic: 0.5, dark: 0 },
    ice: { flying: 2, ground: 2, grass: 2, dragon: 2, steel: 0.5, fire: 0.5, water: 0.5, ice: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { ghost: 2, psychic: 2, fighting: 0.5, dark: 0.5, fairy: 0.5 },
    fairy: { fighting: 2, dragon: 2, dark: 2, poison: 0.5, steel: 0.5, fire: 0.5 }
  };

  public static getEffectiveness(attackingType: string, defendingType: string): number {
    const effectiveness = this.typeChart[attackingType.toLowerCase()]?.[defendingType.toLowerCase()];
    return effectiveness !== undefined ? effectiveness : 1; // Default to neutral (1x) effectiveness
  }

  public static getTypeMatchupMultiplier(attackingType: string, defendingTypes: string[]): number {
    let multiplier = 1;
    for (const defendingType of defendingTypes) {
      multiplier *= this.getEffectiveness(attackingType, defendingType);
    }
    return multiplier;
  }
}