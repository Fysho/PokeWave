import React from 'react';
import { Card, Grid, Stack, Title, Text, Group, Box, Badge, Progress, Table, ScrollArea, Image, Divider } from '@mantine/core';
import { IconSword, IconShield, IconZap, IconSparkles, IconHeart, IconActivity } from '@tabler/icons-react';
import { useGameStore } from '../../store/gameStore';
import { FadeIn } from '../ui/transitions';

const PokeInfo: React.FC = () => {
  const { currentBattle } = useGameStore();

  if (!currentBattle) {
    return (
      <Box maw={1200} mx="auto">
        <Stack align="center" gap="md" mb="xl">
          <Title 
            order={1}
            size="h1"
            fw={700}
            ta="center"
            style={{
              background: 'linear-gradient(135deg, var(--mantine-color-blue-6), var(--mantine-color-grape-6))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Pokemon Debug Information
          </Title>
          <Text size="xl" c="dimmed" ta="center">
            No active battle. Start a battle to see detailed Pokemon information.
          </Text>
        </Stack>
      </Box>
    );
  }

  const getStatIcon = (statName: string) => {
    switch (statName) {
      case 'hp': return <IconHeart size={16} />;
      case 'attack': return <IconSword size={16} />;
      case 'defense': return <IconShield size={16} />;
      case 'specialAttack': return <IconSparkles size={16} />;
      case 'specialDefense': return <IconActivity size={16} />;
      case 'speed': return <IconZap size={16} />;
      default: return null;
    }
  };

  const getStatColor = (value: number, max: number = 255) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return 'green';
    if (percentage >= 60) return 'yellow';
    if (percentage >= 40) return 'orange';
    return 'red';
  };

  const renderPokemonCard = (pokemon: typeof currentBattle.pokemon1, title: string) => {
    const baseStats = pokemon.baseStats || pokemon.stats;
    const totalBaseStats = Object.values(baseStats).reduce((sum, stat) => sum + stat, 0);
    const totalStats = Object.values(pokemon.stats).reduce((sum, stat) => sum + stat, 0);

    return (
      <Card withBorder shadow="sm">
        <Card.Section p="md">
          <Title order={3} ta="center">{title}</Title>
        </Card.Section>
        
        <Card.Section inheritPadding pb="xs">
          <Stack gap="md">
            {/* Basic Info */}
            <Group justify="center">
              <Image
                src={pokemon.sprites.front}
                width={120}
                height={120}
                fit="contain"
                fallbackSrc="/pokeball.png"
              />
            </Group>
            
            <Stack gap="xs">
              <Group justify="space-between">
                <Text fw={600}>Name:</Text>
                <Text>{pokemon.name}</Text>
              </Group>
              
              <Group justify="space-between">
                <Text fw={600}>ID:</Text>
                <Text>#{pokemon.id}</Text>
              </Group>
              
              <Group justify="space-between">
                <Text fw={600}>Level:</Text>
                <Badge size="lg" variant="filled">{pokemon.level}</Badge>
              </Group>
              
              <Group justify="space-between">
                <Text fw={600}>Types:</Text>
                <Group gap="xs">
                  {pokemon.types.map((type) => (
                    <Badge key={type} variant="light" tt="capitalize">
                      {type}
                    </Badge>
                  ))}
                </Group>
              </Group>

              {pokemon.ability && (
                <Group justify="space-between">
                  <Text fw={600}>Ability:</Text>
                  <Badge variant="outline" tt="capitalize">{pokemon.ability}</Badge>
                </Group>
              )}
            </Stack>

            <Divider />

            {/* Detailed Stats Table */}
            <Stack gap="xs">
              <Title order={5}>Complete Stats Breakdown</Title>
              <ScrollArea>
                <Table fontSize="xs" withTableBorder withColumnBorders>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Stat</Table.Th>
                      <Table.Th ta="center">Base</Table.Th>
                      <Table.Th ta="center">IV</Table.Th>
                      <Table.Th ta="center">EV</Table.Th>
                      <Table.Th ta="center">Total</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'].map((statName) => (
                      <Table.Tr key={statName}>
                        <Table.Td>
                          <Group gap="xs">
                            {getStatIcon(statName)}
                            <Text size="xs" tt="capitalize">
                              {statName.replace(/([A-Z])/g, ' $1').trim()}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td ta="center" fw={600}>
                          {pokemon.baseStats?.[statName as keyof typeof pokemon.baseStats] || 'N/A'}
                        </Table.Td>
                        <Table.Td ta="center">
                          {pokemon.ivs?.[statName as keyof typeof pokemon.ivs] || 31}
                        </Table.Td>
                        <Table.Td ta="center">
                          {pokemon.evs?.[statName as keyof typeof pokemon.evs] || 0}
                        </Table.Td>
                        <Table.Td ta="center" fw={700}>
                          {pokemon.stats[statName as keyof typeof pokemon.stats]}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                    <Table.Tr>
                      <Table.Td fw={700}>Total</Table.Td>
                      <Table.Td ta="center" fw={700}>{totalBaseStats}</Table.Td>
                      <Table.Td ta="center" fw={700}>186</Table.Td>
                      <Table.Td ta="center" fw={700}>0</Table.Td>
                      <Table.Td ta="center" fw={700}>{totalStats}</Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Stack>

            <Divider />

            {/* Levelup Moves */}
            {pokemon.levelupMoves && pokemon.levelupMoves.length > 0 && (
              <>
                <Stack gap="xs">
                  <Title order={5}>Levelup Moves ({pokemon.levelupMoves.length})</Title>
                  <ScrollArea h={200}>
                    <Table fontSize="xs" withTableBorder>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Level</Table.Th>
                          <Table.Th>Move</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {pokemon.levelupMoves.map((moveData, index) => (
                          <Table.Tr key={index}>
                            <Table.Td fw={600}>Lv. {moveData.level}</Table.Td>
                            <Table.Td>{moveData.move}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                </Stack>
                <Divider />
              </>
            )}

            {/* Current Moves */}
            <Stack gap="xs">
              <Title order={5}>Current Moves ({pokemon.moves.length})</Title>
              <Stack gap="xs">
                {pokemon.moves.map((move, index) => (
                  <Badge key={index} variant="dot" fullWidth>{move}</Badge>
                ))}
              </Stack>
            </Stack>

            <Divider />

            {/* Battle Results */}
            <Stack gap="xs">
              <Title order={5}>Battle Performance</Title>
              <Group justify="space-between">
                <Text size="sm">Wins:</Text>
                <Badge color={pokemon.wins > currentBattle.totalBattles / 2 ? 'green' : 'red'}>
                  {pokemon.wins} / {currentBattle.totalBattles}
                </Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Win Rate:</Text>
                <Badge color={pokemon.wins > currentBattle.totalBattles / 2 ? 'green' : 'red'}>
                  {((pokemon.wins / currentBattle.totalBattles) * 100).toFixed(1)}%
                </Badge>
              </Group>
            </Stack>

            {/* Additional Debug Info */}
            <Stack gap="xs">
              <Title order={5}>Additional Information</Title>
              <Table fontSize="xs">
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td>Nature</Table.Td>
                    <Table.Td>Hardy (neutral)</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>Item</Table.Td>
                    <Table.Td>{pokemon.item || 'None'}</Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </Stack>
          </Stack>
        </Card.Section>
      </Card>
    );
  };

  return (
    <FadeIn>
      <Box maw={1200} mx="auto">
        <Stack align="center" gap="md" mb="xl">
          <Title 
            order={1}
            size="h1"
            fw={700}
            ta="center"
            style={{
              background: 'linear-gradient(135deg, var(--mantine-color-blue-6), var(--mantine-color-grape-6))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Pokemon Debug Information
          </Title>
          <Text size="xl" c="dimmed" ta="center">
            Detailed information about the current battle Pokemon
          </Text>
        </Stack>

        {/* Battle Summary */}
        <Card withBorder shadow="sm" mb="xl">
          <Card.Section p="md">
            <Title order={4}>Battle Summary</Title>
          </Card.Section>
          <Card.Section inheritPadding pb="md">
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">Battle ID</Text>
                  <Text size="xs" ff="monospace">{currentBattle.battleId}</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">Total Battles</Text>
                  <Badge size="lg" variant="filled">{currentBattle.totalBattles}</Badge>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">Execution Time</Text>
                  <Badge size="lg" variant="light">{currentBattle.executionTime}ms</Badge>
                </Stack>
              </Grid.Col>
            </Grid>
          </Card.Section>
        </Card>

        {/* Pokemon Cards */}
        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, lg: 6 }}>
            {renderPokemonCard(currentBattle.pokemon1, 'Pokemon 1')}
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 6 }}>
            {renderPokemonCard(currentBattle.pokemon2, 'Pokemon 2')}
          </Grid.Col>
        </Grid>
      </Box>
    </FadeIn>
  );
};

export default PokeInfo;