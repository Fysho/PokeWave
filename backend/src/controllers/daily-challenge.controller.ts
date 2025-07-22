import { Request, Response } from 'express';
import { dailyChallengeService } from '../services/daily-challenge.service';
import { DailyChallengeResponse } from '../types/daily-challenge.types';
import logger from '../utils/logger';

export class DailyChallengeController {
  /**
   * Get today's daily challenge
   */
  async getTodaysChallenge(req: Request, res: Response): Promise<void> {
    try {
      const challenge = await dailyChallengeService.getTodaysChallenge();
      
      const response: DailyChallengeResponse = {
        challenge,
        isToday: true,
        dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' })
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error getting today\'s challenge:', error);
      res.status(500).json({ 
        error: 'Failed to get today\'s daily challenge' 
      });
    }
  }

  /**
   * Get daily challenge for a specific date
   */
  async getChallengeByDate(req: Request, res: Response): Promise<void> {
    try {
      const { date } = req.params;
      
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400).json({ 
          error: 'Invalid date format. Use YYYY-MM-DD' 
        });
        return;
      }
      
      const challengeDate = new Date(date + 'T00:00:00');
      const challenge = await dailyChallengeService.getDailyChallenge(challengeDate);
      
      if (!challenge) {
        res.status(404).json({ 
          error: 'Daily challenge not found for this date' 
        });
        return;
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      challengeDate.setHours(0, 0, 0, 0);
      
      const response: DailyChallengeResponse = {
        challenge,
        isToday: challengeDate.getTime() === today.getTime(),
        dayOfWeek: challengeDate.toLocaleDateString('en-US', { weekday: 'long' })
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error getting challenge by date:', error);
      res.status(500).json({ 
        error: 'Failed to get daily challenge' 
      });
    }
  }

  /**
   * Get available daily challenges (past 7 days + today + next 2 days)
   */
  async getAvailableChallenges(req: Request, res: Response): Promise<void> {
    try {
      const today = new Date();
      const challenges = [];
      
      // Get past 7 days
      for (let i = 7; i >= 1; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const challenge = await dailyChallengeService.getDailyChallenge(date);
        if (challenge) {
          challenges.push({
            date: challenge.date,
            dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
            isToday: false,
            isPast: true,
            isFuture: false
          });
        }
      }
      
      // Add today
      const todayChallenge = await dailyChallengeService.getTodaysChallenge();
      challenges.push({
        date: todayChallenge.date,
        dayOfWeek: today.toLocaleDateString('en-US', { weekday: 'long' }),
        isToday: true,
        isPast: false,
        isFuture: false
      });
      
      // Get next 2 days
      for (let i = 1; i <= 2; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const challenge = await dailyChallengeService.getDailyChallenge(date);
        if (challenge) {
          challenges.push({
            date: challenge.date,
            dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
            isToday: false,
            isPast: false,
            isFuture: true
          });
        }
      }
      
      res.json({ challenges });
    } catch (error) {
      logger.error('Error getting available challenges:', error);
      res.status(500).json({ 
        error: 'Failed to get available challenges' 
      });
    }
  }

  /**
   * Refresh all daily challenges (admin endpoint)
   */
  async refreshChallenges(req: Request, res: Response): Promise<void> {
    try {
      await dailyChallengeService.refreshAllChallenges();
      res.json({ 
        message: 'Daily challenges refreshed successfully' 
      });
    } catch (error) {
      logger.error('Error refreshing challenges:', error);
      res.status(500).json({ 
        error: 'Failed to refresh daily challenges' 
      });
    }
  }
}

export const dailyChallengeController = new DailyChallengeController();