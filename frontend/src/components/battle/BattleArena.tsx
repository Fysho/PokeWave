import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useGameStore } from '../../store/gameStore';
import { BattleLoading } from '../ui/loading';
import { FadeIn, SlideIn, ResultReveal, BounceIn, ScaleIn } from '../ui/transitions';
import StreakCelebration from '../ui/streak-celebration';
import { 
  Loader2, 
  Swords, 
  Trophy, 
  Target, 
  TrendingUp, 
  Flame, 
  Zap,
  Crown,
  Star,
  Timer,
  RotateCcw
} from 'lucide-react';

interface PokemonBattleCardProps {
  pokemon: any;
  onSelect: () => void;
  isSelected: boolean;
  disabled: boolean;
  showResults: boolean;
  position: 'left' | 'right';
}

const PokemonBattleCard: React.FC<PokemonBattleCardProps> = ({
  pokemon,
  onSelect,
  isSelected,
  disabled,
  showResults,
  position
}) => {
  const getTypeColor = (type: string): string => {
    const typeColors: { [key: string]: string } = {
      normal: 'bg-gray-400',
      fire: 'bg-red-500',
      water: 'bg-blue-500',
      electric: 'bg-yellow-400',
      grass: 'bg-green-500',
      ice: 'bg-blue-200',
      fighting: 'bg-red-700',
      poison: 'bg-purple-500',
      ground: 'bg-yellow-600',
      flying: 'bg-indigo-400',
      psychic: 'bg-pink-500',
      bug: 'bg-green-400',
      rock: 'bg-yellow-800',
      ghost: 'bg-purple-700',
      dragon: 'bg-indigo-700',
      dark: 'bg-gray-800',
      steel: 'bg-gray-500',
      fairy: 'bg-pink-300',
    };
    return typeColors[type.toLowerCase()] || 'bg-gray-400';
  };

  const winPercentage = showResults ? ((pokemon.wins / 1000) * 100).toFixed(1) : null;

  return (
    <SlideIn 
      direction={position === 'left' ? 'left' : 'right'} 
      delay={0.3}
      className="w-full"
    >
      <Card 
        className={`
          relative transition-all duration-300 cursor-pointer group h-full
          ${isSelected ? 'ring-4 ring-blue-500 bg-blue-50 dark:bg-blue-950 scale-105' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-2xl hover:scale-[1.02]'}
          ${showResults && pokemon.wins > 500 ? 'ring-2 ring-green-500' : ''}
        `}
        onClick={!disabled ? onSelect : undefined}
      >
        <CardHeader className="text-center pb-4">
          <div className="relative mx-auto mb-4">
            {pokemon.sprites?.front ? (
              <div className="relative">
                <img 
                  src={pokemon.sprites.front} 
                  alt={pokemon.name}
                  className="w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 object-contain mx-auto drop-shadow-2xl hover:scale-110 transition-transform duration-300"
                />
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center animate-bounce">
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  No Image
                </span>
              </div>
            )}
            
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -left-2 bg-white dark:bg-gray-800 border-2 text-lg px-3 py-1"
            >
              Lv.{pokemon.level}
            </Badge>
          </div>
          
          <CardTitle className="text-3xl md:text-4xl font-bold capitalize text-center">
            {pokemon.name}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Types */}
          {pokemon.types && pokemon.types.length > 0 && (
            <div className="flex gap-3 justify-center flex-wrap">
              {pokemon.types.map((type) => (
                <Badge
                  key={type}
                  className={`${getTypeColor(type)} text-white font-bold capitalize px-4 py-2 text-base shadow-lg hover:scale-110 transition-transform`}
                >
                  {type}
                </Badge>
              ))}
            </div>
          )}

          {/* Battle Results */}
          {showResults && (
            <ScaleIn delay={0.5}>
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4 text-center">
                <div className="text-sm text-muted-foreground mb-1">Battle Results</div>
                <div className="text-3xl font-bold text-primary mb-1">
                  {winPercentage}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {pokemon.wins}/1000 wins
                </div>
              </div>
            </ScaleIn>
          )}

          {/* Select Button */}
          {!showResults && (
            <Button
              onClick={onSelect}
              disabled={disabled}
              variant={isSelected ? "default" : "outline"}
              className={`w-full h-14 text-lg font-bold transition-all ${
                isSelected 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                  : 'hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900 dark:hover:to-purple-900'
              }`}
              size="lg"
            >
              {isSelected ? (
                <>
                  <Crown className="mr-2 h-6 w-6" />
                  My Pick to Win!
                </>
              ) : (
                <>
                  <Target className="mr-2 h-6 w-6" />
                  Choose This Fighter
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </SlideIn>
  );
};

const BattleArena: React.FC = () => {
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
    if (!currentBattle && !isLoading) {
      generateNewBattle();
    }
  }, [currentBattle, isLoading, generateNewBattle]);

  useEffect(() => {
    setSelectedPokemon(null);
    setShowResults(false);
    setGuessResult(null);
  }, [currentBattle]);

  useEffect(() => {
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
      
      setTimeout(() => {
        generateNewBattle();
      }, 5000);
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Battle Error</h2>
          <p className="text-muted-foreground max-w-md">{error}</p>
        </div>
        <Button onClick={clearError} variant="outline" size="lg">
          <RotateCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Title Section */}
        <FadeIn>
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Battle Arena
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose your champion! Predict which Pokemon will dominate in an epic 1000-battle simulation.
            </p>
          </div>
        </FadeIn>

        {/* Stats Bar */}
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800">
              <CardContent className="p-4 text-center">
                <Trophy className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  {score}
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">Score</div>
              </CardContent>
            </Card>

            <Card className={`transition-all ${streak > 0 ? 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 ring-2 ring-red-300' : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700'}`}>
              <CardContent className="p-4 text-center">
                {streak > 0 ? (
                  <Flame className="h-6 w-6 text-red-600 mx-auto mb-2" />
                ) : (
                  <Zap className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                )}
                <div className={`text-2xl font-bold ${streak > 0 ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  {streak}
                </div>
                <div className={`text-sm ${streak > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {streak > 0 ? `🔥 Streak` : 'Streak'}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
              <CardContent className="p-4 text-center">
                <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {getAccuracy()}%
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Accuracy</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800">
              <CardContent className="p-4 text-center">
                <Swords className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {totalGuesses}
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">Battles</div>
              </CardContent>
            </Card>
          </div>
        </FadeIn>

        {/* Battle Arena */}
        <FadeIn delay={0.4}>
          <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
            <CardContent className="p-6 md:p-8 lg:p-12 relative">
              {isLoading ? (
                <div className="py-16">
                  <BattleLoading 
                    pokemon1Name={currentBattle?.pokemon1.name || 'Pokemon'} 
                    pokemon2Name={currentBattle?.pokemon2.name || 'Pokemon'} 
                    className="py-8"
                  />
                </div>
              ) : currentBattle ? (
                <div className="space-y-8">
                  {/* Pokemon Battle */}
                  <div className="relative">
                    {/* VS Badge for Mobile */}
                    <div className="md:hidden text-center mb-4">
                      <BounceIn delay={0.5}>
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-lg">
                          <span className="text-lg font-bold">VS</span>
                        </div>
                      </BounceIn>
                      <div className="text-sm text-muted-foreground mt-2">
                        {currentBattle.totalBattles} battle simulation
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 lg:gap-16 items-center justify-center max-w-6xl mx-auto">
                    {/* Pokemon 1 */}
                    <PokemonBattleCard
                      pokemon={currentBattle.pokemon1}
                      onSelect={() => handlePokemonSelect(currentBattle.pokemon1.id)}
                      isSelected={selectedPokemon === currentBattle.pokemon1.id}
                      disabled={isLoading || showResults}
                      showResults={showResults}
                      position="left"
                    />

                    {/* VS Badge - Positioned absolutely on larger screens */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden md:block z-10">
                      <BounceIn delay={0.5}>
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full w-20 h-20 lg:w-24 lg:h-24 flex items-center justify-center shadow-2xl border-4 border-white dark:border-gray-800">
                          <span className="text-xl lg:text-2xl font-bold">VS</span>
                        </div>
                      </BounceIn>
                    </div>

                    {/* Pokemon 2 */}
                    <PokemonBattleCard
                      pokemon={currentBattle.pokemon2}
                      onSelect={() => handlePokemonSelect(currentBattle.pokemon2.id)}
                      isSelected={selectedPokemon === currentBattle.pokemon2.id}
                      disabled={isLoading || showResults}
                      showResults={showResults}
                      position="right"
                    />
                  </div>
                  
                  {/* Battle Info for Desktop */}
                  <div className="hidden md:block text-center mt-4">
                    <div className="text-sm text-muted-foreground">
                      {currentBattle.totalBattles} battle simulation
                    </div>
                  </div>
                </div>

                  {/* Action Buttons */}
                  <div className="text-center space-y-4">
                    {!showResults ? (
                      <div className="flex justify-center gap-4">
                        <Button
                          onClick={handleSubmitGuess}
                          disabled={!selectedPokemon || isLoading}
                          className="px-8 py-3 text-lg font-semibold"
                          size="lg"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Simulating...
                            </>
                          ) : (
                            <>
                              <Swords className="mr-2 h-5 w-5" />
                              Submit Prediction
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={handleNewBattle}
                          variant="outline"
                          disabled={isLoading}
                          className="px-6 py-3"
                          size="lg"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          New Battle
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <ResultReveal 
                          isVisible={!!guessResult} 
                          isCorrect={guessResult?.isCorrect}
                          className="max-w-md mx-auto"
                        >
                          {guessResult && (
                            <Card className={`${
                              guessResult.isCorrect 
                                ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-300' 
                                : 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 border-red-300'
                            }`}>
                              <CardContent className="p-6 text-center">
                                <div className={`text-2xl font-bold mb-2 ${
                                  guessResult.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                                }`}>
                                  {guessResult.isCorrect ? '🎉 Correct!' : '❌ Wrong!'}
                                </div>
                                <div className="text-muted-foreground mb-2">
                                  {guessResult.message}
                                </div>
                                {guessResult.isCorrect && (
                                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                    +{guessResult.points} points earned!
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </ResultReveal>

                        <div className="text-sm text-muted-foreground">
                          <Timer className="inline h-4 w-4 mr-1" />
                          Simulation completed in {currentBattle.executionTime}ms
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Swords className="h-8 w-8 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Battle Available</h3>
                  <p className="text-muted-foreground mb-4">Ready to start your Pokemon battle prediction journey?</p>
                  <Button onClick={handleNewBattle} size="lg">
                    <Star className="mr-2 h-5 w-5" />
                    Start First Battle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Streak Celebration */}
      <StreakCelebration
        streak={streak}
        isVisible={showStreakCelebration}
        onAnimationComplete={() => setShowStreakCelebration(false)}
      />
    </>
  );
};

export default BattleArena;