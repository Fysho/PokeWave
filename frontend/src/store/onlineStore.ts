import { create } from 'zustand';
import type {
  OnlineStoreState,
  OnlineRoundState,
  OnlineUserStats,
  OnlinePlayer,
  OnlineRoundResults,
  OnlineGuessResult,
  LeaderboardEntry,
  TickData,
  NewRoundData,
  RoundResultsData
} from '../types/online';
import OnlineService from '../services/online';

interface OnlineStoreActions {
  // Connection actions
  setConnected: (connected: boolean) => void;
  setAuthenticated: (authenticated: boolean) => void;

  // Round state actions
  setRoundState: (state: OnlineRoundState | null) => void;
  updateTick: (tick: TickData) => void;
  handleNewRound: (data: NewRoundData) => void;
  handleRoundResults: (data: RoundResultsData) => void;

  // User state actions
  setUserStats: (stats: OnlineUserStats | null) => void;
  setCurrentGuess: (guess: number | null) => void;
  setHasSubmittedGuess: (submitted: boolean) => void;

  // Players actions
  setOnlinePlayers: (players: OnlinePlayer[]) => void;

  // Leaderboard actions
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;

  // API actions
  joinOnlineMode: () => Promise<void>;
  leaveOnlineMode: () => Promise<void>;
  submitGuess: (guess: number) => Promise<void>;
  fetchLeaderboard: (limit?: number) => Promise<void>;

  // UI state actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

const initialState: OnlineStoreState = {
  isConnected: false,
  isAuthenticated: false,
  roundState: null,
  userStats: null,
  currentGuess: null,
  hasSubmittedGuess: false,
  lastResults: null,
  myLastResult: null,
  onlinePlayers: [],
  leaderboard: [],
  isLoading: false,
  error: null
};

export const useOnlineStore = create<OnlineStoreState & OnlineStoreActions>((set, get) => ({
  ...initialState,

  // Connection actions
  setConnected: (connected) => set({ isConnected: connected }),
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),

  // Round state actions
  setRoundState: (roundState) => set({ roundState }),

  updateTick: (tick) => {
    const currentState = get().roundState;
    if (currentState) {
      set({
        roundState: {
          ...currentState,
          roundNumber: tick.roundNumber,
          phase: tick.phase,
          timeRemaining: tick.timeRemaining
        }
      });
    }
  },

  handleNewRound: (data) => {
    set({
      roundState: {
        roundNumber: data.roundNumber,
        phase: data.phase,
        timeRemaining: data.timeRemaining,
        pokemon1: data.pokemon1,
        pokemon2: data.pokemon2,
        totalParticipants: data.totalParticipants
      },
      currentGuess: null,
      hasSubmittedGuess: false,
      lastResults: null,
      myLastResult: null
    });
  },

  handleRoundResults: (data) => {
    const state = get();
    const userStats = state.userStats;

    // Find user's result if they participated
    let myResult: OnlineGuessResult | null = null;
    if (userStats) {
      // We need to match by comparing with the leaderboard or user ID
      // For now, we'll use a placeholder - this will be set when we have the user ID
      const userId = localStorage.getItem('auth-storage');
      if (userId) {
        try {
          const authState = JSON.parse(userId);
          const currentUserId = authState?.state?.user?.id;
          if (currentUserId) {
            myResult = data.results.find(r => r.userId === currentUserId) || null;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }

    // Update roundState with actual win percent
    const currentRoundState = state.roundState;
    if (currentRoundState) {
      set({
        roundState: {
          ...currentRoundState,
          actualWinPercent: data.actualWinPercent,
          phase: 'results'
        }
      });
    }

    set({
      lastResults: {
        roundNumber: data.roundNumber,
        actualWinPercent: data.actualWinPercent,
        results: data.results
      },
      myLastResult: myResult
    });

    // Update user stats if they participated and Elo changed
    if (myResult && state.userStats) {
      set({
        userStats: {
          ...state.userStats,
          elo: myResult.eloAfter,
          gamesPlayed: state.userStats.gamesPlayed + 1,
          wins: myResult.rankPosition <= Math.ceil(data.results.length / 2)
            ? state.userStats.wins + 1
            : state.userStats.wins
        }
      });
    }
  },

  // User state actions
  setUserStats: (userStats) => set({ userStats }),
  setCurrentGuess: (currentGuess) => set({ currentGuess }),
  setHasSubmittedGuess: (hasSubmittedGuess) => set({ hasSubmittedGuess }),

  // Players actions
  setOnlinePlayers: (onlinePlayers) => set({ onlinePlayers }),

  // Leaderboard actions
  setLeaderboard: (leaderboard) => set({ leaderboard }),

  // API actions
  joinOnlineMode: async () => {
    const state = get();
    if (state.isLoading) return;

    set({ isLoading: true, error: null });
    try {
      const response = await OnlineService.joinOnlineMode();
      set({
        roundState: response.roundState,
        userStats: response.userStats,
        isLoading: false
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to join online mode'
      });
      throw error;
    }
  },

  leaveOnlineMode: async () => {
    try {
      await OnlineService.leaveOnlineMode();
    } catch (error) {
      // Ignore leave errors
    }
    set({
      ...initialState,
      leaderboard: get().leaderboard // Keep leaderboard for reference
    });
  },

  submitGuess: async (guess: number) => {
    const state = get();
    if (!state.roundState || state.hasSubmittedGuess) return;

    set({ isLoading: true, error: null });
    try {
      await OnlineService.submitGuess(state.roundState.roundNumber, guess);
      set({
        currentGuess: guess,
        hasSubmittedGuess: true,
        isLoading: false
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to submit guess'
      });
      throw error;
    }
  },

  fetchLeaderboard: async (limit = 100) => {
    try {
      const leaderboard = await OnlineService.getLeaderboard(limit);
      set({ leaderboard });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch leaderboard' });
    }
  },

  // UI state actions
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Reset
  reset: () => set(initialState)
}));
