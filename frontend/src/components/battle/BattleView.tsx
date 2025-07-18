import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import PokemonCard from './PokemonCard';
import { useGameStore } from '../../store/gameStore';
import { BattleLoading } from '../ui/loading';
import { FadeIn, SlideIn, ResultReveal, Countup, StaggeredFadeIn, BounceIn } from '../ui/transitions';
import StreakCelebration from '../ui/streak-celebration';
import { Loader2, Swords, Trophy, Target, TrendingUp, Flame } from 'lucide-react';

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
  const [guessResult, setGuessResult] = useState<any>(null);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [lastStreakShown, setLastStreakShown] = useState(0);

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
    setGuessResult(null);
  }, [currentBattle]);

  useEffect(() => {
    // Show streak celebration when streak increases
    if (streak > lastStreakShown && streak >= 2) {
      setShowStreakCelebration(true);
      setLastStreakShown(streak);
    } else if (streak === 0) {
      setLastStreakShown(0);
    }
  }, [streak, lastStreakShown]);

  const handlePokemonSelect = (pokemonId: number) => {
    if (isLoading || showResults) return;
    setSelectedPokemon(pokemonId);
  };

  const handleSubmitGuess = async () => {
    if (!selectedPokemon || !currentBattle) return;
    
    try {
      const result = await submitGuess(selectedPokemon);
      setGuessResult(result);
      setShowResults(true);
      
      // Auto-generate new battle after showing results
      setTimeout(() => {
        generateNewBattle();
      }, 4000);
    } catch (error) {
      console.error('Error submitting guess:', error);
    }
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
    <>
      <FadeIn className="w-full max-w-4xl mx-auto space-y-6">
      {/* Stats Header */}
      <StaggeredFadeIn staggerDelay={0.1}>
        {[
          <Card key="score">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Score</span>
              </div>
              <div className="text-2xl font-bold">
                <Countup from={0} to={score} duration={1} />
              </div>
            </CardContent>
          </Card>,
          
          <Card key="streak" className={`transition-all ${streak > 0 ? 'ring-2 ring-red-300 dark:ring-red-700' : ''}`}>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2">
                {streak > 0 ? (
                  <Flame className={`h-4 w-4 ${streak > 2 ? 'text-red-500' : 'text-red-600'}`} />
                ) : (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm font-medium">Streak</span>
              </div>
              <div className={`text-2xl font-bold ${streak > 0 ? 'text-red-600' : ''}`}>
                <Countup from={0} to={streak} duration={1} />
              </div>
              {streak > 0 && (
                <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                  🔥 {streak >= 5 ? 'Legendary!' : 'On fire!'}
                </div>
              )}
            </CardContent>
          </Card>,
          
          <Card key="accuracy">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Accuracy</span>
              </div>
              <div className="text-2xl font-bold">{getAccuracy()}%</div>
            </CardContent>
          </Card>,
          
          <Card key="battles">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2">
                <Swords className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Battles</span>
              </div>
              <div className="text-2xl font-bold">
                <Countup from={0} to={totalGuesses} duration={1} />
              </div>
            </CardContent>
          </Card>
        ]}
      </StaggeredFadeIn>

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
            <BattleLoading 
              pokemon1Name={currentBattle?.pokemon1.name || 'Pokemon'}
              pokemon2Name={currentBattle?.pokemon2.name || 'Pokemon'}
              className="py-12"
            />
          ) : currentBattle ? (
            <div className="space-y-6">
              {/* Pokemon Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SlideIn direction="left" delay={0.2}>
                  <PokemonCard
                    pokemon={currentBattle.pokemon1}
                    onSelect={() => handlePokemonSelect(currentBattle.pokemon1.id)}
                    isSelected={selectedPokemon === currentBattle.pokemon1.id}
                    disabled={isLoading || showResults}
                    showResults={showResults}
                  />
                </SlideIn>
                
                <BounceIn delay={0.4} className="flex items-center justify-center">
                  <Badge variant="outline" className="text-lg font-bold px-4 py-2">
                    VS
                  </Badge>
                </BounceIn>
                
                <SlideIn direction="right" delay={0.2}>
                  <PokemonCard
                    pokemon={currentBattle.pokemon2}
                    onSelect={() => handlePokemonSelect(currentBattle.pokemon2.id)}
                    isSelected={selectedPokemon === currentBattle.pokemon2.id}
                    disabled={isLoading || showResults}
                    showResults={showResults}
                  />
                </SlideIn>
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
                  <div className="text-center space-y-4">
                    <div className="text-lg font-semibold">
                      Battle Results
                    </div>
                    
                    <ResultReveal 
                      isVisible={!!guessResult} 
                      isCorrect={guessResult?.isCorrect}
                      className={`p-4 rounded-lg border ${
                        guessResult?.isCorrect 
                          ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                          : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                      }`}
                    >
                      {guessResult && (
                        <>
                          <div className={`text-lg font-semibold ${
                            guessResult.isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                          }`}>
                            {guessResult.isCorrect ? '✅ Correct!' : '❌ Wrong!'}
                          </div>
                          <div className="text-sm mt-2">
                            {guessResult.message}
                          </div>
                          {guessResult.isCorrect && (
                            <div className="text-sm font-medium mt-2">
                              Points earned: +<Countup from={0} to={guessResult.points} duration={1} />
                            </div>
                          )}
                        </>
                      )}
                    </ResultReveal>
                    
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
    </FadeIn>

    {/* Streak Celebration */}
    <StreakCelebration
      streak={streak}
      isVisible={showStreakCelebration}
      onAnimationComplete={() => setShowStreakCelebration(false)}
    />
    </>
  );
};

export default BattleView;