import React, { useState } from 'react';
import BattleView from '../battle/BattleView';
import BattleHistory from '../battle/BattleHistory';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { FadeIn } from '../ui/transitions';
import { History, Play, BarChart3 } from 'lucide-react';

const GameDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'battle' | 'history' | 'stats'>('battle');
  const { battleHistory } = useGameStore();

  const tabs = [
    { id: 'battle', label: 'Battle', icon: Play },
    { id: 'history', label: 'History', icon: History },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <FadeIn>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">PokeWave</h1>
          <p className="text-xl text-muted-foreground">
            Predict the winner of Pokemon battles using AI simulation
          </p>
        </div>
      </FadeIn>

      {/* Tab Navigation */}
      <FadeIn delay={0.2}>
        <Card className="mb-6">
          <CardContent className="p-2">
            <div className="flex space-x-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.id === 'history' && battleHistory.length > 0 && (
                      <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                        {battleHistory.length}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Tab Content */}
      <FadeIn delay={0.4}>
        {activeTab === 'battle' && <BattleView />}
        {activeTab === 'history' && <BattleHistory history={battleHistory} />}
        {activeTab === 'stats' && (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Advanced Stats</h3>
            <p className="text-muted-foreground">
              Coming soon! Detailed analytics and insights about your battle performance.
            </p>
          </div>
        )}
      </FadeIn>
    </div>
  );
};

export default GameDashboard;