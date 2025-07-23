import { api } from './api';

interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarPokemonId?: number;
  avatarSprite?: string;
  highScore: number;
  lastPlayed: string;
  totalRuns: number;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  totalPlayers: number;
}

interface UserStats {
  highScore: number;
  totalRuns: number;
  averageScore: number;
  lastPlayed: string | null;
  rank: number;
}

class LeaderboardService {
  static async submitEndlessScore(score: number): Promise<any> {
    try {
      const response = await api.post('/leaderboard/endless/submit', { score });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to submit score');
    }
  }

  static async getEndlessLeaderboard(limit: number = 100): Promise<LeaderboardResponse> {
    try {
      const response = await api.get<LeaderboardResponse>('/leaderboard/endless', {
        params: { limit }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch leaderboard');
    }
  }

  static async getUserEndlessStats(userId?: string): Promise<{ userId: string; stats: UserStats }> {
    try {
      const url = userId 
        ? `/leaderboard/endless/stats/${userId}`
        : '/leaderboard/endless/stats';
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user stats');
    }
  }

  static async getRecentScores(limit: number = 10): Promise<{ recentScores: any[] }> {
    try {
      const response = await api.get('/leaderboard/recent', {
        params: { limit }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch recent scores');
    }
  }
}

export default LeaderboardService;