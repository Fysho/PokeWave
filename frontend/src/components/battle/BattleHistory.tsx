import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { FadeIn, SlideIn } from '../ui/transitions';
import { Trophy, Target, Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface BattleHistoryEntry {
  id: string;
  pokemon1: {
    id: number;
    name: string;
    wins: number;
  };
  pokemon2: {
    id: number;
    name: string;
    wins: number;
  };
  userGuess: number;
  correctAnswer: number;
  isCorrect: boolean;
  points: number;
  winRate: number;
  timestamp: Date;
  executionTime: number;
}

interface BattleHistoryProps {
  history: BattleHistoryEntry[];
  maxEntries?: number;
  className?: string;
}

const BattleHistory: React.FC<BattleHistoryProps> = ({
  history,
  maxEntries = 10,
  className = ''
}) => {
  const displayHistory = history.slice(-maxEntries).reverse();

  const getStreakData = () => {
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].isCorrect) {
        tempStreak++;
        if (i === history.length - 1) {
          currentStreak = tempStreak;
        }
      } else {
        maxStreak = Math.max(maxStreak, tempStreak);
        tempStreak = 0;
      }
    }
    maxStreak = Math.max(maxStreak, tempStreak);

    return { currentStreak, maxStreak };
  };

  const { currentStreak, maxStreak } = getStreakData();

  const getAccuracy = () => {
    if (history.length === 0) return 0;
    const correct = history.filter(entry => entry.isCorrect).length;
    return ((correct / history.length) * 100).toFixed(1);
  };

  const getTotalPoints = () => {
    return history.reduce((total, entry) => total + entry.points, 0);
  };

  const getAverageExecutionTime = () => {
    if (history.length === 0) return 0;
    const total = history.reduce((sum, entry) => sum + entry.executionTime, 0);
    return Math.round(total / history.length);
  };

  return (
    <FadeIn className={`space-y-4 ${className}`}>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Trophy className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Points</span>
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {getTotalPoints()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Accuracy</span>
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {getAccuracy()}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Best Streak</span>
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {maxStreak}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Avg Time</span>
            </div>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {getAverageExecutionTime()}ms
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Battle History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Battles</span>
            <Badge variant="outline" className="ml-auto">
              {history.length} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No battles yet. Start playing to see your history!
            </div>
          ) : (
            <ScrollArea className="h-[400px] w-full">
              <div className="space-y-3">
                {displayHistory.map((entry, index) => (
                  <SlideIn
                    key={entry.id}
                    direction="up"
                    delay={index * 0.05}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      entry.isCorrect
                        ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                        : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {entry.isCorrect ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">
                          {entry.pokemon1.name} vs {entry.pokemon2.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={entry.isCorrect ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {entry.isCorrect ? `+${entry.points}` : '0'} pts
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {entry.executionTime}ms
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Your guess:</div>
                        <div className="font-medium">
                          {entry.userGuess === entry.pokemon1.id ? entry.pokemon1.name : entry.pokemon2.name}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Actual winner:</div>
                        <div className="font-medium">
                          {entry.correctAnswer === entry.pokemon1.id ? entry.pokemon1.name : entry.pokemon2.name}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-muted-foreground">
                      Win rate: {entry.winRate.toFixed(1)}% | 
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </div>
                  </SlideIn>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </FadeIn>
  );
};

export default BattleHistory;