import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import PokemonCard from './PokemonCard';
import { useGameStore } from '../../store/gameStore';
import { Loader2, Swords, Trophy, Target, TrendingUp } from 'lucide-react';

const BattleView: React.FC = () => {
  const {
    currentBattle,
    isLoading,
    error,
    score,
    streak,
    totalGuesses,
    correctGuesses,
    generateNewBattle,
    submitGuess,
    clearError,
  } = useGameStore();

  const [selectedPokemon, setSelectedPokemon] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    // Generate first battle on mount
    if (!currentBattle && !isLoading) {
      generateNewBattle();
    }
  }, [currentBattle, isLoading, generateNewBattle]);

  useEffect(() => {
    // Reset selection when new battle is generated
    setSelectedPokemon(null);
    setShowResults(false);
  }, [currentBattle]);

  const handlePokemonSelect = (pokemonId: number) => {
    if (isLoading || showResults) return;
    setSelectedPokemon(pokemonId);
  };

  const handleSubmitGuess = async () => {
    if (!selectedPokemon || !currentBattle) return;
    
    await submitGuess(selectedPokemon);
    setShowResults(true);
    
    // Auto-generate new battle after showing results
    setTimeout(() => {
      generateNewBattle();
    }, 3000);
  };

  const handleNewBattle = () => {
    generateNewBattle();
  };

  const getAccuracy = () => {
    if (totalGuesses === 0) return 0;
    return ((correctGuesses / totalGuesses) * 100).toFixed(1);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-red-500 text-center">
          <p className="text-lg font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
        <Button onClick={clearError} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Score</span>
            </div>
            <div className="text-2xl font-bold">{score}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Streak</span>
            </div>
            <div className="text-2xl font-bold">{streak}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Accuracy</span>
            </div>
            <div className="text-2xl font-bold">{getAccuracy()}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Swords className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Battles</span>
            </div>
            <div className="text-2xl font-bold">{totalGuesses}</div>
          </CardContent>
        </Card>
      </div>

      {/* Battle Arena */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center space-x-2">
            <Swords className="h-5 w-5" />
            <span>Pokemon Battle Prediction</span>
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Choose which Pokemon you think will win the battle!
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Generating battle...</span>
            </div>
          ) : currentBattle ? (
            <div className="space-y-6">
              {/* Pokemon Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PokemonCard
                  pokemon={currentBattle.pokemon1}
                  types={[]} // We'll need to fetch this from API or include in response
                  onSelect={() => handlePokemonSelect(currentBattle.pokemon1.id)}
                  isSelected={selectedPokemon === currentBattle.pokemon1.id}
                  disabled={isLoading || showResults}
                  showResults={showResults}
                />
                
                <div className="flex items-center justify-center">
                  <Badge variant="outline" className="text-lg font-bold px-4 py-2">
                    VS
                  </Badge>
                </div>
                
                <PokemonCard
                  pokemon={currentBattle.pokemon2}
                  types={[]} // We'll need to fetch this from API or include in response
                  onSelect={() => handlePokemonSelect(currentBattle.pokemon2.id)}
                  isSelected={selectedPokemon === currentBattle.pokemon2.id}
                  disabled={isLoading || showResults}
                  showResults={showResults}
                />
              </div>

              {/* Battle Actions */}
              <div className="flex justify-center space-x-4">
                {!showResults ? (
                  <>
                    <Button
                      onClick={handleSubmitGuess}
                      disabled={!selectedPokemon || isLoading}
                      className="px-8"
                    >
                      Submit Guess
                    </Button>
                    <Button
                      onClick={handleNewBattle}
                      variant="outline"
                      disabled={isLoading}
                    >
                      New Battle
                    </Button>
                  </>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="text-lg font-semibold">
                      Battle Results
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Simulation completed in {currentBattle.executionTime}ms
                    </div>
                  </div>
                )}
              </div>

              {/* Battle Info */}
              <div className="text-center text-sm text-muted-foreground">
                <p>Battle ID: {currentBattle.battleId}</p>
                <p>Simulation: {currentBattle.totalBattles} battles</p>
                <p>Winner: {currentBattle.pokemon1.wins > currentBattle.pokemon2.wins ? currentBattle.pokemon1.name : currentBattle.pokemon2.name}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No battle available</p>
              <Button onClick={handleNewBattle} className="mt-4">
                Generate Battle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BattleView;