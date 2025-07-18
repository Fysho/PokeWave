import React from 'react';
import BattleView from '../battle/BattleView';

const GameDashboard: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">PokeWave</h1>
        <p className="text-xl text-muted-foreground">
          Predict the winner of Pokemon battles using AI simulation
        </p>
      </div>
      
      <BattleView />
    </div>
  );
};

export default GameDashboard;