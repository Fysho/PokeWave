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
    const baseStats = pokemon.stats;
    const totalStats = Object.values(baseStats).reduce((sum, stat) => sum + stat, 0);

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

            {/* Base Stats */}
            <Stack gap="xs">
              <Title order={5}>Base Stats (Total: {totalStats})</Title>
              {Object.entries(baseStats).map(([statName, value]) => (
                <Stack key={statName} gap={4}>
                  <Group justify="space-between">
                    <Group gap="xs">
                      {getStatIcon(statName)}
                      <Text size="sm" tt="capitalize">
                        {statName.replace(/([A-Z])/g, ' $1').trim()}
                      </Text>
                    </Group>
                    <Text size="sm" fw={600}>{value}</Text>
                  </Group>
                  <Progress 
                    value={(value / 255) * 100} 
                    color={getStatColor(value)}
                    size="sm"
                  />
                </Stack>
              ))}
            </Stack>

            <Divider />

            {/* Moves */}
            <Stack gap="xs">
              <Title order={5}>Moves ({pokemon.moves.length})</Title>
              <ScrollArea h={100}>
                <Stack gap="xs">
                  {pokemon.moves.map((move, index) => (
                    <Badge key={index} variant="dot" fullWidth>{move}</Badge>
                  ))}
                </Stack>
              </ScrollArea>
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
              <Title order={5}>Debug Information</Title>
              <ScrollArea h={100}>
                <Table fontSize="xs">
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td>IVs</Table.Td>
                      <Table.Td>31 (all stats)</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>EVs</Table.Td>
                      <Table.Td>0 (all stats)</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>Nature</Table.Td>
                      <Table.Td>Hardy (neutral)</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>Item</Table.Td>
                      <Table.Td>None</Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </ScrollArea>
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