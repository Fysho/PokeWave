import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PokedexStore {
  unlockedPokemon: Set<number>;
  unlockPokemon: (pokemonId: number) => void;
  unlockMultiplePokemon: (pokemonIds: number[]) => void;
  isPokemonUnlocked: (pokemonId: number) => boolean;
  getUnlockedCount: () => number;
  getTotalPokemonCount: () => number;
  resetPokedex: () => void;
}

const TOTAL_POKEMON = 1025;

export const usePokedexStore = create<PokedexStore>()(
  persist(
    (set, get) => ({
      unlockedPokemon: new Set<number>(),
      
      unlockPokemon: (pokemonId: number) => {
        set((state) => {
          const newUnlocked = new Set(state.unlockedPokemon);
          newUnlocked.add(pokemonId);
          return { unlockedPokemon: newUnlocked };
        });
      },
      
      unlockMultiplePokemon: (pokemonIds: number[]) => {
        set((state) => {
          const newUnlocked = new Set(state.unlockedPokemon);
          pokemonIds.forEach(id => newUnlocked.add(id));
          return { unlockedPokemon: newUnlocked };
        });
      },
      
      isPokemonUnlocked: (pokemonId: number) => {
        return get().unlockedPokemon.has(pokemonId);
      },
      
      getUnlockedCount: () => {
        return get().unlockedPokemon.size;
      },
      
      getTotalPokemonCount: () => {
        return TOTAL_POKEMON;
      },
      
      resetPokedex: () => {
        set({ unlockedPokemon: new Set<number>() });
      },
    }),
    {
      name: 'pokedex-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return {
            state: {
              ...state,
              unlockedPokemon: new Set(state.unlockedPokemon || []),
            },
          };
        },
        setItem: (name, value) => {
          const { state } = value as { state: PokedexStore };
          const serialized = {
            state: {
              ...state,
              unlockedPokemon: Array.from(state.unlockedPokemon),
            },
          };
          localStorage.setItem(name, JSON.stringify(serialized));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);