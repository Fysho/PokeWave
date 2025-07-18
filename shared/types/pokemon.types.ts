export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  abilities: string[];
  sprites: {
    front: string;
    back: string;
    shiny: string;
  };
}

export interface GetPokemonResponse extends Pokemon {}

export interface GetRandomPokemonResponse {
  pokemon1Id: number;
  pokemon2Id: number;
  generation?: number;
}