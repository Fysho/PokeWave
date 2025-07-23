import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AuthService from '../services/auth';

interface PokedexData {
  unlockedPokemon: number[];
  unlockedShinyPokemon: number[];
  pokemonCounts: [number, number][];
  shinyPokemonCounts: [number, number][];
}

interface GameStats {
  totalBattles: number;
  totalCorrectGuesses: number;
  highestStreak: number;
  endlessHighScore: number;
  dailyChallengeScores: { [date: string]: number };
}

interface User {
  id: string;
  username: string;
  createdAt: string;
  avatarPokemonId?: number;
  avatarSprite?: string;
  pokedex?: PokedexData;
  gameStats?: GameStats;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  
  // Actions
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  signOut: () => void;
  checkAuth: () => Promise<boolean>;
  updateAvatar: (pokemonId: number, sprite: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      signIn: async (username: string, password: string) => {
        try {
          const response = await AuthService.signIn(username, password);
          set({
            user: response.user,
            isAuthenticated: true,
            token: response.token
          });
        } catch (error) {
          throw error;
        }
      },

      signUp: async (username: string, password: string) => {
        try {
          const response = await AuthService.signUp(username, password);
          set({
            user: response.user,
            isAuthenticated: true,
            token: response.token
          });
        } catch (error) {
          throw error;
        }
      },

      signOut: () => {
        set({
          user: null,
          isAuthenticated: false,
          token: null
        });
      },

      checkAuth: async () => {
        // Check if user is still authenticated by verifying with backend
        const state = get();
        if (!state.token) {
          set({ isAuthenticated: false, user: null });
          return false;
        }

        try {
          // Verify token with backend
          const response = await AuthService.getProfile();
          // Update user data with latest from backend
          set({
            user: response.user,
            isAuthenticated: true
          });
          return true;
        } catch (error) {
          // Token is invalid or expired
          set({ 
            isAuthenticated: false, 
            user: null,
            token: null 
          });
          return false;
        }
      },

      updateAvatar: async (pokemonId: number, sprite: string) => {
        const state = get();
        if (!state.user) return;
        
        try {
          // Send update to backend
          const response = await AuthService.updateAvatar(pokemonId, sprite);
          
          // Update local state with response
          set({
            user: response.user
          });
        } catch (error) {
          // If backend fails, still update locally for better UX
          set({
            user: {
              ...state.user,
              avatarPokemonId: pokemonId,
              avatarSprite: sprite
            }
          });
          throw error;
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);