import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PokedexStore {
  unlockedPokemon: Set<number>;
  pokemonCounts: Map<number, number>;
  unlockPokemon: (pokemonId: number) => void;
  unlockMultiplePokemon: (pokemonIds: number[]) => void;
  isPokemonUnlocked: (pokemonId: number) => boolean;
  getPokemonCount: (pokemonId: number) => number;
  getUnlockedCount: () => number;
  getTotalPokemonCount: () => number;
  resetPokedex: () => void;
}

const TOTAL_POKEMON = 1025;

export const usePokedexStore = create<PokedexStore>()(
  persist(
    (set, get) => ({
      unlockedPokemon: new Set<number>(),
      pokemonCounts: new Map<number, number>(),
      
      unlockPokemon: (pokemonId: number) => {
        set((state) => {
          const newUnlocked = new Set(state.unlockedPokemon);
          newUnlocked.add(pokemonId);
          
          const newCounts = new Map(state.pokemonCounts);
          const currentCount = newCounts.get(pokemonId) || 0;
          newCounts.set(pokemonId, currentCount + 1);
          
          return { unlockedPokemon: newUnlocked, pokemonCounts: newCounts };
        });
      },
      
      unlockMultiplePokemon: (pokemonIds: number[]) => {
        set((state) => {
          const newUnlocked = new Set(state.unlockedPokemon);
          const newCounts = new Map(state.pokemonCounts);
          
          pokemonIds.forEach(id => {
            newUnlocked.add(id);
            const currentCount = newCounts.get(id) || 0;
            newCounts.set(id, currentCount + 1);
          });
          
          return { unlockedPokemon: newUnlocked, pokemonCounts: newCounts };
        });
      },
      
      isPokemonUnlocked: (pokemonId: number) => {
        return get().unlockedPokemon.has(pokemonId);
      },
      
      getPokemonCount: (pokemonId: number) => {
        return get().pokemonCounts.get(pokemonId) || 0;
      },
      
      getUnlockedCount: () => {
        return get().unlockedPokemon.size;
      },
      
      getTotalPokemonCount: () => {
        return TOTAL_POKEMON;
      },
      
      resetPokedex: () => {
        set({ unlockedPokemon: new Set<number>(), pokemonCounts: new Map<number, number>() });
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
              pokemonCounts: new Map(state.pokemonCounts || []),
            },
          };
        },
        setItem: (name, value) => {
          const { state } = value as { state: PokedexStore };
          const serialized = {
            state: {
              ...state,
              unlockedPokemon: Array.from(state.unlockedPokemon),
              pokemonCounts: Array.from(state.pokemonCounts),
            },
          };
          localStorage.setItem(name, JSON.stringify(serialized));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);