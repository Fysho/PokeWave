import { api } from './api';
import type {
  OnlineRoundState,
  OnlineUserStats,
  LeaderboardEntry,
  OnlinePlayer,
  GuessSubmitResponse,
  JoinOnlineModeResponse,
  OnlineRoundResults
} from '../types/online';

class OnlineService {
  /**
   * Get current round state
   */
  static async getCurrentRound(): Promise<OnlineRoundState> {
    try {
      const response = await api.get<OnlineRoundState>('/online/round/current');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get current round');
    }
  }

  /**
   * Submit a guess for the current round
   */
  static async submitGuess(roundNumber: number, guess: number): Promise<GuessSubmitResponse> {
    try {
      const response = await api.post<GuessSubmitResponse>('/online/guess', {
        roundNumber,
        guess
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to submit guess');
    }
  }

  /**
   * Get results for a specific round
   */
  static async getRoundResults(roundNumber: number): Promise<OnlineRoundResults & {
    pokemon1: any;
    pokemon2: any;
    totalParticipants: number;
  }> {
    try {
      const response = await api.get(`/online/round/${roundNumber}/results`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get round results');
    }
  }

  /**
   * Get global leaderboard
   */
  static async getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    try {
      const response = await api.get<LeaderboardEntry[]>(`/online/leaderboard?limit=${limit}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get leaderboard');
    }
  }

  /**
   * Get authenticated user's online stats
   */
  static async getUserStats(): Promise<OnlineUserStats> {
    try {
      const response = await api.get<OnlineUserStats>('/online/stats');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get user stats');
    }
  }

  /**
   * Get currently online players
   */
  static async getOnlinePlayers(): Promise<OnlinePlayer[]> {
    try {
      const response = await api.get<OnlinePlayer[]>('/online/players');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get online players');
    }
  }

  /**
   * Update player presence (keep-alive)
   */
  static async heartbeat(): Promise<{ success: boolean }> {
    try {
      const response = await api.post<{ success: boolean }>('/online/heartbeat');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update presence');
    }
  }

  /**
   * Join online mode
   */
  static async joinOnlineMode(): Promise<JoinOnlineModeResponse> {
    try {
      const response = await api.post<JoinOnlineModeResponse>('/online/join');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to join online mode');
    }
  }

  /**
   * Leave online mode
   */
  static async leaveOnlineMode(): Promise<{ success: boolean }> {
    try {
      const response = await api.post<{ success: boolean }>('/online/leave');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to leave online mode');
    }
  }
}

export default OnlineService;
