import React, { useState } from 'react';
import BattleArena from '../battle/BattleArena';
import BattleHistory from '../battle/BattleHistory';
import MainLayout from '../layout/MainLayout';
import { useGameStore } from '../../store/gameStore';
import { BarChart3, Trophy, Calendar, Crown, Users, Construction, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FadeIn } from '../ui/transitions';

const GameDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('battle');
  const { battleHistory, score, streak, totalGuesses, correctGuesses } = useGameStore();

  const getAccuracy = () => {
    if (totalGuesses === 0) return 0;
    return ((correctGuesses / totalGuesses) * 100).toFixed(1);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'battle':
        return <BattleArena />;
      
      case 'history':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Battle History
              </h1>
              <p className="text-xl text-muted-foreground">
                Review your Pokemon battle predictions and track your progress
              </p>
            </div>
            <BattleHistory history={battleHistory} />
          </div>
        );
      
      case 'stats':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Statistics
              </h1>
              <p className="text-xl text-muted-foreground">
                Detailed analytics and insights about your battle performance
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-yellow-500/10 border-yellow-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
                    Total Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {score}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-500/10 border-red-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-red-600" />
                    Best Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {Math.max(streak, ...battleHistory.map(b => b.isCorrect ? 1 : 0))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-500/10 border-blue-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-blue-600" />
                    Accuracy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {getAccuracy()}%
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-500/10 border-purple-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-purple-600" />
                    Total Battles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {totalGuesses}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-center">Performance Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
                  <p className="text-muted-foreground">
                    Coming soon! Detailed charts, win rate trends, and Pokemon type analysis.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'leaderboard':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Leaderboard
              </h1>
              <p className="text-xl text-muted-foreground">
                Compete with players worldwide and climb the ranks
              </p>
            </div>
            
            <Card>
              <CardContent className="py-16">
                <div className="text-center">
                  <Crown className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Global Rankings</h3>
                  <p className="text-muted-foreground mb-6">
                    Coming soon! Challenge other trainers and see how you rank globally.
                  </p>
                  <Button variant="outline" disabled>
                    <Users className="mr-2 h-4 w-4" />
                    Sign Up for Rankings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'daily':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Daily Challenges
              </h1>
              <p className="text-xl text-muted-foreground">
                Take on special challenges and earn exclusive rewards
              </p>
            </div>
            
            <Card>
              <CardContent className="py-16">
                <div className="text-center">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Daily Challenges</h3>
                  <p className="text-muted-foreground mb-6">
                    New challenges every day with unique Pokemon battles and bonus rewards.
                  </p>
                  <Button variant="outline" disabled>
                    <Construction className="mr-2 h-4 w-4" />
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      default:
        return <BattleArena />;
    }
  };

  return (
    <MainLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      battleCount={battleHistory.length}
    >
      <FadeIn>
        {renderContent()}
      </FadeIn>
    </MainLayout>
  );
};

export default GameDashboard;