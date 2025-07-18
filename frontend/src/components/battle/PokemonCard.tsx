import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { BattleResult } from '../../types/api';

interface PokemonCardProps {
  pokemon: BattleResult['pokemon1'] | BattleResult['pokemon2'];
  types?: string[];
  sprite?: string;
  onSelect?: () => void;
  isSelected?: boolean;
  disabled?: boolean;
  showResults?: boolean;
}

const PokemonCard: React.FC<PokemonCardProps> = ({
  pokemon,
  types = [],
  sprite,
  onSelect,
  isSelected = false,
  disabled = false,
  showResults = false,
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
    <Card 
      className={`
        relative transition-all duration-200 hover:shadow-lg cursor-pointer
        ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <CardContent className="p-4">
        <div className="flex flex-col items-center space-y-3">
          {/* Pokemon Image */}
          <div className="relative">
            {sprite ? (
              <img 
                src={sprite} 
                alt={pokemon.name}
                className="w-24 h-24 object-contain"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  No Image
                </span>
              </div>
            )}
            
            {/* Level Badge */}
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 text-xs"
            >
              Lv.{pokemon.level}
            </Badge>
          </div>

          {/* Pokemon Name */}
          <h3 className="text-lg font-semibold text-center capitalize">
            {pokemon.name}
          </h3>

          {/* Types */}
          {types.length > 0 && (
            <div className="flex gap-1 flex-wrap justify-center">
              {types.map((type) => (
                <Badge
                  key={type}
                  className={`${getTypeColor(type)} text-white text-xs capitalize`}
                >
                  {type}
                </Badge>
              ))}
            </div>
          )}

          {/* Battle Results */}
          {showResults && (
            <div className="text-center space-y-1">
              <div className="text-sm font-medium">
                {pokemon.wins}/1000 wins
              </div>
              <div className="text-lg font-bold text-primary">
                {winPercentage}%
              </div>
            </div>
          )}

          {/* Select Button */}
          {onSelect && !showResults && (
            <Button
              onClick={onSelect}
              disabled={disabled}
              variant={isSelected ? "default" : "outline"}
              className="w-full"
            >
              {isSelected ? 'Selected' : 'Choose Winner'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PokemonCard;