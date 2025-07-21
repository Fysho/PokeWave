import React from 'react';
import { Card, Stack, Title, Text, Box, Code, ScrollArea, SimpleGrid, Table, Badge, Group } from '@mantine/core';
import { useGameStore } from '../../store/gameStore';
import { Pokemon } from '../../store/pokemon';

const PokeInfo: React.FC = () => {
  const { currentBattle, currentPokemon1, currentPokemon2 } = useGameStore();

  if (!currentBattle || !currentPokemon1 || !currentPokemon2) {
    return (
      <Box p="xl">
        <Title order={2}>Pokemon Debug Information</Title>
        <Text mt="md">No active battle. Start a battle to see debug information.</Text>
      </Box>
    );
  }

  const renderPokemonDebug = (pokemon: Pokemon, title: string) => {
    return (
      <Card withBorder p="md">
        <Title order={3} mb="md">{title}</Title>
        
        <Stack gap="sm">
          {/* Basic Info using Pokemon class */}
          <Box>
            <Title order={5}>Basic Info (Using Pokemon Class)</Title>
            <Table withTableBorder>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td fw={600}>ID</Table.Td>
                  <Table.Td>{pokemon.id}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={600}>Name</Table.Td>
                  <Table.Td>{pokemon.name}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={600}>Level</Table.Td>
                  <Table.Td>{pokemon.level}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={600}>Types</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Badge>{pokemon.primaryType}</Badge>
                      {pokemon.isDualType && <Badge>{pokemon.secondaryType}</Badge>}
                    </Group>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={600}>Ability</Table.Td>
                  <Table.Td>{pokemon.ability}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={600}>Item</Table.Td>
                  <Table.Td>{pokemon.item || 'None'}</Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Box>

          {/* Battle Performance using getters */}
          <Box>
            <Title order={5}>Battle Performance</Title>
            <Table withTableBorder>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td fw={600}>Wins</Table.Td>
                  <Table.Td>{pokemon.wins}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={600}>Losses</Table.Td>
                  <Table.Td>{pokemon.losses}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={600}>Total Battles</Table.Td>
                  <Table.Td>{pokemon.totalBattles}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={600}>Win Rate</Table.Td>
                  <Table.Td>{pokemon.winRate.toFixed(1)}%</Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Box>

          {/* Stats Breakdown */}
          <Box>
            <Title order={5}>Stats Breakdown</Title>
            <Table withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Stat</Table.Th>
                  <Table.Th>Base</Table.Th>
                  <Table.Th>IV</Table.Th>
                  <Table.Th>EV</Table.Th>
                  <Table.Th>Total</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const).map(stat => (
                  <Table.Tr key={stat}>
                    <Table.Td>{Pokemon.getStatDisplayName(stat)}</Table.Td>
                    <Table.Td>{pokemon.getBaseStatValue(stat)}</Table.Td>
                    <Table.Td>{pokemon.ivs[stat]}</Table.Td>
                    <Table.Td>{pokemon.evs[stat]}</Table.Td>
                    <Table.Td fw={700}>{pokemon.getStatValue(stat)}</Table.Td>
                  </Table.Tr>
                ))}
                <Table.Tr>
                  <Table.Td fw={700}>Total</Table.Td>
                  <Table.Td fw={700}>{pokemon.totalBaseStats}</Table.Td>
                  <Table.Td fw={700}>186</Table.Td>
                  <Table.Td fw={700}>0</Table.Td>
                  <Table.Td fw={700}>{pokemon.totalCalculatedStats}</Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Box>

          {/* Current Moves */}
          <Box>
            <Title order={5}>Current Moves ({pokemon.moves.length})</Title>
            <Stack gap="xs">
              {pokemon.moves.map((move, index) => (
                <Badge key={index} variant="dot" fullWidth>{move}</Badge>
              ))}
            </Stack>
          </Box>

          {/* Levelup Moves */}
          {pokemon.levelupMoves.length > 0 && (
            <Box>
              <Title order={5}>Levelup Moves ({pokemon.levelupMoves.length})</Title>
              <ScrollArea h={200}>
                <Table withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Level</Table.Th>
                      <Table.Th>Move</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pokemon.levelupMoves.map((moveData, index) => (
                      <Table.Tr key={index}>
                        <Table.Td>Lv. {moveData.level}</Table.Td>
                        <Table.Td>{moveData.move}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Box>
          )}

          {/* Sprites */}
          <Box>
            <Title order={5}>Sprites</Title>
            <Group gap="xs">
              <img src={pokemon.sprites.front} alt={`${pokemon.name} front`} width={64} height={64} />
              <img src={pokemon.sprites.back} alt={`${pokemon.name} back`} width={64} height={64} />
            </Group>
          </Box>

          {/* Class Method Examples */}
          <Box>
            <Title order={5}>Pokemon Class Method Examples</Title>
            <Code block>{JSON.stringify({
              "hasMove('Tackle')": pokemon.hasMove('Tackle'),
              "getMovesUpToLevel(10)": pokemon.getMovesUpToLevel(10),
              "calculateStatAtLevel('hp', 100)": pokemon.calculateStatAtLevel('hp', 100),
              "isDualType": pokemon.isDualType
            }, null, 2)}</Code>
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

        {/* Pokemon Cards using Pokemon Class */}
        <Title order={3} mb="md">Pokemon Data (Using Pokemon Class)</Title>
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          {renderPokemonDebug(currentPokemon1, 'Pokemon 1')}
          {renderPokemonDebug(currentPokemon2, 'Pokemon 2')}
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