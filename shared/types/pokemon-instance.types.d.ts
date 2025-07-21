export interface PokemonInstance {
    name: string;
    species: string;
    forme: string | null;
    gender: "M" | "F" | "N";
    shiny: boolean;
    level: number;
    happiness: number;
    ability: string;
    abilitySlot: number;
    item: string;
    pokeball: string;
    teraType: string;
    gigantamax: boolean;
    canGigantamax: boolean;
    isDynamaxed: boolean;
    zMove: string | null;
    zMoveFrom: string | null;
    megaEvo: string | null;
    moves: string[];
    moveData: Array<{
        move: string;
        pp: number;
        maxpp: number;
    }>;
    evs: {
        hp: number;
        atk: number;
        def: number;
        spa: number;
        spd: number;
        spe: number;
    };
    ivs: {
        hp: number;
        atk: number;
        def: number;
        spa: number;
        spd: number;
        spe: number;
    };
    nature: string;
    hpType: string | null;
    hpIVs: any | null;
    status: string | null;
    statusData: any | null;
    volatileStatus: string[];
    boosts: {
        atk: number;
        def: number;
        spa: number;
        spd: number;
        spe: number;
        accuracy: number;
        evasion: number;
    };
    toxicCounter: number;
    subHP: number | null;
    fainted: boolean;
    currentHP: number | null;
    maxHP: number | null;
    faintedThisTurn: boolean;
    teamIndex: number;
    hidden: boolean;
}
export interface PokemonInstanceData {
    id: number;
    name: string;
    species: string;
    level: number;
    types: string[];
    ability: string;
    item?: string;
    moves: string[];
    stats: {
        hp: number;
        attack: number;
        defense: number;
        specialAttack: number;
        specialDefense: number;
        speed: number;
    };
    baseStats: {
        hp: number;
        attack: number;
        defense: number;
        specialAttack: number;
        specialDefense: number;
        speed: number;
    };
    evs: {
        hp: number;
        attack: number;
        defense: number;
        specialAttack: number;
        specialDefense: number;
        speed: number;
    };
    ivs: {
        hp: number;
        attack: number;
        defense: number;
        specialAttack: number;
        specialDefense: number;
        speed: number;
    };
    nature: string;
    sprites: {
        front: string;
        back: string;
        shiny: string;
    };
}
//# sourceMappingURL=pokemon-instance.types.d.ts.map