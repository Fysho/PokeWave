import React from 'react';
import { Card, Badge, Group, Text, Box, Stack, Title, useMantineTheme, useMantineColorScheme, Tooltip, ScrollArea } from '@mantine/core';
import { getTypeColor } from '../../utils/typeColors';
import { IconCrown } from '@tabler/icons-react';
import { PokemonBattleCard } from './BattleArena';

interface CompactBattleCardProps {
  pokemon: any;
  showResults: boolean;
  position: 'left' | 'right';
  winPercentage?: number;
  guessPercentage?: number;
  totalBattles?: number;
}

export const CompactBattleCard: React.FC<CompactBattleCardProps> = ({
  pokemon,
  showResults,
  position,
  winPercentage,
  guessPercentage,
  totalBattles
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  
  const displayWinPercentage = winPercentage !== undefined 
    ? winPercentage.toFixed(1) 
    : showResults 
      ? ((pokemon.wins / 100) * 100).toFixed(1) 
      : null;

  const calculateSpriteSize = () => {
    if (showResults) return 160;
    
    const effectiveGuess = guessPercentage !== undefined ? guessPercentage : 50;
    const minSize = 80;
    const maxSize = 200;
    
    const scaleFactor = position === 'left' 
      ? effectiveGuess / 100
      : (100 - effectiveGuess) / 100;
    
    const size = minSize + (maxSize - minSize) * scaleFactor;
    
    return Math.round(size);
  };

  const spriteSize = calculateSpriteSize();

  return (
    <Card 
      h="100%"
      p="sm"
      className={`
        relative transition-all duration-300
        ${showResults && pokemon.wins > 500 ? 'ring-2 ring-green-500' : ''}
      `}
    >
      <Stack gap="xs" h="100%">
        {/* Header with shiny badge and crown */}
        <Group justify="space-between" wrap="nowrap" h={20}>
          {pokemon.shiny ? (
            <Badge size="xs" variant="dot" color="yellow">✨</Badge>
          ) : (
            <Box w={20} />
          )}
          {showResults && pokemon.wins > 500 ? (
            <IconCrown size={16} color="var(--mantine-color-green-6)" />
          ) : (
            <Box w={16} />
          )}
        </Group>
        
        <Title order={5} size="h6" fw={600} tt="capitalize" ta="center" lineClamp={1}>
          {pokemon.name} Lv.{pokemon.level}
        </Title>

        {/* Sprite */}
        <Box 
          style={{
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {pokemon.sprites?.front ? (
            <Tooltip
              label={
                <Box style={{ width: '480px' }}>
                  <PokemonBattleCard
                    pokemon={pokemon}
                    showResults={false}
                    position={position}
                    totalBattles={totalBattles}
                  />
                </Box>
              }
              position="top"
              withArrow
              transitionProps={{ transition: 'fade', duration: 200 }}
              events={{ hover: true, focus: false, touch: false }}
              multiline
              width={500}
              styles={{
                tooltip: {
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none'
                }
              }}
            >
              <img 
                src={pokemon.shiny && pokemon.sprites.shiny ? pokemon.sprites.shiny : pokemon.sprites.front} 
                alt={pokemon.name}
                style={{
                  width: `${spriteSize}px`,
                  height: `${spriteSize}px`,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 8px rgb(0 0 0 / 0.15))',
                  cursor: 'pointer'
                }}
              />
            </Tooltip>
          ) : (
            <Box 
              w={spriteSize} 
              h={spriteSize} 
              bg={colorScheme === 'dark' ? 'dark.6' : 'gray.1'} 
              style={{ 
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center', 
                justifyContent: 'center'
              }}
            >
              <Text size="xs" c="gray.6">No Image</Text>
            </Box>
          )}
        </Box>

        {/* Types */}
        {pokemon.types && pokemon.types.length > 0 && (
          <Group justify="center" gap={4}>
            {pokemon.types.map((type: string) => (
              <Badge
                key={type}
                size="xs"
                variant="filled"
                color={getTypeColor(type)}
                tt="capitalize"
              >
                {type}
              </Badge>
            ))}
          </Group>
        )}

        {/* Battle Results */}
        {showResults && (
          <Box 
            bg={colorScheme === 'dark' ? 'dark.6' : 'gray.0'} 
            p="xs" 
            style={{ borderRadius: '4px' }}
            ta="center"
            mt="auto"
          >
            <Text size="xs" fw={700} c="blue.6">
              {displayWinPercentage}%
            </Text>
            <Text size="xs" c="gray.6">
              {pokemon.wins}/{totalBattles || 999}
            </Text>
          </Box>
        )}
      </Stack>
    </Card>
  );
};