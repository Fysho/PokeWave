import React from 'react';
import { Card, Stack, Title, Text, Box, Code, ScrollArea, SimpleGrid } from '@mantine/core';
import { useGameStore } from '../../store/gameStore';

const PokeInfo: React.FC = () => {
  const { currentBattle } = useGameStore();

  if (!currentBattle) {
    return (
      <Box p="xl">
        <Title order={2}>Pokemon Debug Information</Title>
        <Text mt="md">No active battle. Start a battle to see debug information.</Text>
      </Box>
    );
  }

  const renderPokemonDebug = (pokemon: any, title: string) => {
    // Calculate total stats
    const totalStats = pokemon.stats ? Object.values(pokemon.stats).reduce((sum: number, stat: any) => sum + stat, 0) : 0;
    const totalBaseStats = pokemon.baseStats ? Object.values(pokemon.baseStats).reduce((sum: number, stat: any) => sum + stat, 0) : 0;

    return (
      <Card withBorder p="md">
        <Title order={3} mb="md">{title}</Title>
        
        <Stack gap="sm">
          {/* Basic Info */}
          <Box>
            <Title order={5}>Basic Info</Title>
            <Code block>{JSON.stringify({
              id: pokemon.id,
              name: pokemon.name,
              level: pokemon.level,
              types: pokemon.types,
              ability: pokemon.ability,
              item: pokemon.item
            }, null, 2)}</Code>
          </Box>

          {/* Battle Results */}
          <Box>
            <Title order={5}>Battle Performance</Title>
            <Code block>{JSON.stringify({
              wins: pokemon.wins,
              losses: currentBattle.totalBattles - pokemon.wins,
              winRate: ((pokemon.wins / currentBattle.totalBattles) * 100).toFixed(1) + '%'
            }, null, 2)}</Code>
          </Box>

          {/* Base Stats */}
          {pokemon.baseStats && (
            <Box>
              <Title order={5}>Base Stats (Total: {totalBaseStats})</Title>
              <Code block>{JSON.stringify(pokemon.baseStats, null, 2)}</Code>
            </Box>
          )}

          {/* IVs */}
          {pokemon.ivs && (
            <Box>
              <Title order={5}>IVs (Individual Values)</Title>
              <Code block>{JSON.stringify(pokemon.ivs, null, 2)}</Code>
            </Box>
          )}

          {/* EVs */}
          {pokemon.evs && (
            <Box>
              <Title order={5}>EVs (Effort Values)</Title>
              <Code block>{JSON.stringify(pokemon.evs, null, 2)}</Code>
            </Box>
          )}

          {/* Calculated Stats */}
          <Box>
            <Title order={5}>Calculated Stats (Total: {totalStats})</Title>
            <Code block>{JSON.stringify(pokemon.stats, null, 2)}</Code>
          </Box>

          {/* Current Moves */}
          <Box>
            <Title order={5}>Current Moves ({pokemon.moves.length})</Title>
            <Code block>{JSON.stringify(pokemon.moves, null, 2)}</Code>
          </Box>

          {/* Levelup Moves */}
          {pokemon.levelupMoves && pokemon.levelupMoves.length > 0 && (
            <Box>
              <Title order={5}>Levelup Moves ({pokemon.levelupMoves.length})</Title>
              <ScrollArea h={200}>
                <Code block>{JSON.stringify(pokemon.levelupMoves, null, 2)}</Code>
              </ScrollArea>
            </Box>
          )}

          {/* Sprites */}
          <Box>
            <Title order={5}>Sprite URLs</Title>
            <Code block>{JSON.stringify(pokemon.sprites, null, 2)}</Code>
          </Box>

          {/* Raw Data */}
          <Box>
            <Title order={5}>Raw Pokemon Data</Title>
            <ScrollArea h={300}>
              <Code block>{JSON.stringify(pokemon, null, 2)}</Code>
            </ScrollArea>
          </Box>
        </Stack>
      </Card>
    );
  };

  return (
    <Box p="xl">
      <Stack gap="xl">
        <Box>
          <Title order={2}>Pokemon Debug Information</Title>
          <Text c="dimmed">Raw data display for debugging purposes</Text>
        </Box>

        {/* Battle Info */}
        <Card withBorder p="md">
          <Title order={4} mb="sm">Battle Information</Title>
          <Code block>{JSON.stringify({
            battleId: currentBattle.battleId,
            totalBattles: currentBattle.totalBattles,
            winRate: currentBattle.winRate,
            executionTime: currentBattle.executionTime + 'ms'
          }, null, 2)}</Code>
        </Card>

        {/* Pokemon Cards */}
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          {renderPokemonDebug(currentBattle.pokemon1, 'Pokemon 1')}
          {renderPokemonDebug(currentBattle.pokemon2, 'Pokemon 2')}
        </SimpleGrid>

        {/* Full Battle Data */}
        <Card withBorder p="md">
          <Title order={4} mb="sm">Complete Battle Data</Title>
          <ScrollArea h={400}>
            <Code block>{JSON.stringify(currentBattle, null, 2)}</Code>
          </ScrollArea>
        </Card>
      </Stack>
    </Box>
  );
};

export default PokeInfo;