import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import UserDataService from '../services/userdata';
import { useAuthStore } from './authStore';

interface PokedexStore {
  unlockedPokemon: Set<number>;
  unlockedShinyPokemon: Set<number>;
  pokemonCounts: Map<number, number>;
  shinyPokemonCounts: Map<number, number>;
  unlockPokemon: (pokemonId: number, isShiny?: boolean) => void;
  unlockMultiplePokemon: (pokemonIds: number[], areShiny?: boolean[]) => void;
  isPokemonUnlocked: (pokemonId: number) => boolean;
  isShinyPokemonUnlocked: (pokemonId: number) => boolean;
  getPokemonCount: (pokemonId: number) => number;
  getShinyPokemonCount: (pokemonId: number) => number;
  getUnlockedCount: () => number;
  getUnlockedShinyCount: () => number;
  getTotalPokemonCount: () => number;
  resetPokedex: () => void;
  syncWithBackend: () => Promise<void>;
  loadFromBackend: () => Promise<void>;
}

const TOTAL_POKEMON = 1025;

export const usePokedexStore = create<PokedexStore>()(
  persist(
    (set, get) => ({
      unlockedPokemon: new Set<number>(),
      unlockedShinyPokemon: new Set<number>(),
      pokemonCounts: new Map<number, number>(),
      shinyPokemonCounts: new Map<number, number>(),
      
      unlockPokemon: async (pokemonId: number, isShiny?: boolean) => {
        set((state) => {
          const newUnlocked = new Set(state.unlockedPokemon);
          const newUnlockedShiny = new Set(state.unlockedShinyPokemon);
          const newCounts = new Map(state.pokemonCounts);
          const newShinyCounts = new Map(state.shinyPokemonCounts);
          
          if (isShiny) {
            newUnlockedShiny.add(pokemonId);
            const currentShinyCount = newShinyCounts.get(pokemonId) || 0;
            newShinyCounts.set(pokemonId, currentShinyCount + 1);
          }
          
          newUnlocked.add(pokemonId);
          const currentCount = newCounts.get(pokemonId) || 0;
          newCounts.set(pokemonId, currentCount + 1);
          
          return { 
            unlockedPokemon: newUnlocked, 
            unlockedShinyPokemon: newUnlockedShiny,
            pokemonCounts: newCounts,
            shinyPokemonCounts: newShinyCounts
          };
        });

        // Sync with backend if authenticated
        const authState = useAuthStore.getState();
        if (authState.isAuthenticated) {
          try {
            await UserDataService.unlockPokemon(pokemonId, isShiny || false);
          } catch (error) {
            console.error('Failed to sync Pokemon unlock with backend:', error);
          }
        }
      },
      
      unlockMultiplePokemon: (pokemonIds: number[], areShiny?: boolean[]) => {
        set((state) => {
          const newUnlocked = new Set(state.unlockedPokemon);
          const newUnlockedShiny = new Set(state.unlockedShinyPokemon);
          const newCounts = new Map(state.pokemonCounts);
          const newShinyCounts = new Map(state.shinyPokemonCounts);
          
          pokemonIds.forEach((id, index) => {
            const isShiny = areShiny?.[index] || false;
            
            if (isShiny) {
              newUnlockedShiny.add(id);
              const currentShinyCount = newShinyCounts.get(id) || 0;
              newShinyCounts.set(id, currentShinyCount + 1);
            }
            
            newUnlocked.add(id);
            const currentCount = newCounts.get(id) || 0;
            newCounts.set(id, currentCount + 1);
          });
          
          return { 
            unlockedPokemon: newUnlocked, 
            unlockedShinyPokemon: newUnlockedShiny,
            pokemonCounts: newCounts,
            shinyPokemonCounts: newShinyCounts
          };
        });
      },
      
      isPokemonUnlocked: (pokemonId: number) => {
        return get().unlockedPokemon.has(pokemonId);
      },
      
      isShinyPokemonUnlocked: (pokemonId: number) => {
        return get().unlockedShinyPokemon.has(pokemonId);
      },
      
      getPokemonCount: (pokemonId: number) => {
        return get().pokemonCounts.get(pokemonId) || 0;
      },
      
      getShinyPokemonCount: (pokemonId: number) => {
        return get().shinyPokemonCounts.get(pokemonId) || 0;
      },
      
      getUnlockedCount: () => {
        return get().unlockedPokemon.size;
      },
      
      getUnlockedShinyCount: () => {
        return get().unlockedShinyPokemon.size;
      },
      
      getTotalPokemonCount: () => {
        return TOTAL_POKEMON;
      },
      
      resetPokedex: () => {
        set({ 
          unlockedPokemon: new Set<number>(), 
          unlockedShinyPokemon: new Set<number>(),
          pokemonCounts: new Map<number, number>(),
          shinyPokemonCounts: new Map<number, number>()
        });
      },

      syncWithBackend: async () => {
        const state = get();
        const authState = useAuthStore.getState();
        
        if (!authState.isAuthenticated) return;

        try {
          const pokedexData = UserDataService.convertPokedexToApiFormat(
            state.unlockedPokemon,
            state.unlockedShinyPokemon,
            state.pokemonCounts,
            state.shinyPokemonCounts
          );
          
          await UserDataService.syncPokedex(pokedexData);
        } catch (error) {
          console.error('Failed to sync Pokedex with backend:', error);
        }
      },

      loadFromBackend: async () => {
        const authState = useAuthStore.getState();
        
        if (!authState.isAuthenticated) return;

        try {
          const userData = await UserDataService.getUserData();
          if (userData.pokedex) {
            const converted = UserDataService.convertApiToPokedexFormat(userData.pokedex);
            set({
              unlockedPokemon: converted.unlockedPokemon,
              unlockedShinyPokemon: converted.unlockedShinyPokemon,
              pokemonCounts: converted.pokemonCounts,
              shinyPokemonCounts: converted.shinyPokemonCounts
            });
          }
        } catch (error) {
          console.error('Failed to load Pokedex from backend:', error);
        }
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
              unlockedShinyPokemon: new Set(state.unlockedShinyPokemon || []),
              pokemonCounts: new Map(state.pokemonCounts || []),
              shinyPokemonCounts: new Map(state.shinyPokemonCounts || []),
            },
          };
        },
        setItem: (name, value) => {
          const { state } = value as { state: PokedexStore };
          const serialized = {
            state: {
              ...state,
              unlockedPokemon: Array.from(state.unlockedPokemon),
              unlockedShinyPokemon: Array.from(state.unlockedShinyPokemon),
              pokemonCounts: Array.from(state.pokemonCounts),
              shinyPokemonCounts: Array.from(state.shinyPokemonCounts),
            },
          };
          localStorage.setItem(name, JSON.stringify(serialized));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);