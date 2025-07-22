import React, { useState } from 'react';
import BattleArena from '../battle/BattleArena';
import MainLayout from '../layout/MainLayout';
import PokeInfo from '../debug/PokeInfo';
import EndlessMode from './EndlessMode';
import Pokedex from '../pokedex/Pokedex';
import DailyMode from './DailyMode';
import { useGameStore } from '../../store/gameStore';
import { 
  IconChartBar, 
  IconTrophy, 
  IconCalendar, 
  IconCrown, 
  IconUsers, 
  IconTool,
  IconClock
} from '@tabler/icons-react';
import { Card, Button, Stack, Title, Text, Grid, Group, Box, Center } from '@mantine/core';
import { FadeIn } from '../ui/transitions';

const GameDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('battle');
  const { battleHistory, score, streak, totalGuesses, correctGuesses } = useGameStore();

  const getAccuracy = () => {
    if (totalGuesses === 0) return 0;
    return ((correctGuesses / totalGuesses) * 100).toFixed(1);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'battle':
        return <BattleArena />;
      
      case 'history':
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
                Battle History
              </Title>
              <Text size="xl" c="dimmed" ta="center">
                Review your Pokemon battle predictions and track your progress
              </Text>
            </Stack>
            <Card withBorder>
              <Card.Section p="xl">
                <Center>
                  <Stack align="center" gap="md">
                    <IconClock size={64} color="var(--mantine-color-gray-6)" />
                    <Title order={3}>Battle History</Title>
                    <Text c="dimmed" ta="center">
                      Battle history feature is being rebuilt with Mantine components.
                    </Text>
                  </Stack>
                </Center>
              </Card.Section>
            </Card>
          </Box>
        );
      
      case 'stats':
        return (
          <Box maw={1000} mx="auto">
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
                Statistics
              </Title>
              <Text size="xl" c="dimmed" ta="center">
                Detailed analytics and insights about your battle performance
              </Text>
            </Stack>
            
            <Grid gutter="lg" mb="xl">
              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-yellow-0)', borderColor: 'var(--mantine-color-yellow-3)' }}>
                  <Group gap="xs" mb="xs">
                    <IconTrophy size={20} color="var(--mantine-color-yellow-6)" />
                    <Text size="lg" fw={600}>Total Score</Text>
                  </Group>
                  <Text size="xl" fw={700}>{score}</Text>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-red-0)', borderColor: 'var(--mantine-color-red-3)' }}>
                  <Group gap="xs" mb="xs">
                    <IconTrophy size={20} color="var(--mantine-color-red-6)" />
                    <Text size="lg" fw={600}>Best Streak</Text>
                  </Group>
                  <Text size="xl" fw={700}>{Math.max(streak, ...battleHistory.map(b => b.isCorrect ? 1 : 0))}</Text>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-blue-0)', borderColor: 'var(--mantine-color-blue-3)' }}>
                  <Group gap="xs" mb="xs">
                    <IconTrophy size={20} color="var(--mantine-color-blue-6)" />
                    <Text size="lg" fw={600}>Accuracy</Text>
                  </Group>
                  <Text size="xl" fw={700}>{getAccuracy()}%</Text>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-grape-0)', borderColor: 'var(--mantine-color-grape-3)' }}>
                  <Group gap="xs" mb="xs">
                    <IconTrophy size={20} color="var(--mantine-color-grape-6)" />
                    <Text size="lg" fw={600}>Total Battles</Text>
                  </Group>
                  <Text size="xl" fw={700}>{totalGuesses}</Text>
                </Card>
              </Grid.Col>
            </Grid>

            <Card withBorder>
              <Card.Section p="md">
                <Title order={3} ta="center">Performance Insights</Title>
              </Card.Section>
              <Card.Section p="xl">
                <Center>
                  <Stack align="center" gap="md">
                    <IconChartBar size={64} color="var(--mantine-color-gray-6)" />
                    <Title order={3}>Advanced Analytics</Title>
                    <Text c="dimmed" ta="center">
                      Coming soon! Detailed charts, win rate trends, and Pokemon type analysis.
                    </Text>
                  </Stack>
                </Center>
              </Card.Section>
            </Card>
          </Box>
        );
      
      case 'leaderboard':
        return (
          <Box maw={1000} mx="auto">
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
                Leaderboard
              </Title>
              <Text size="xl" c="dimmed" ta="center">
                Compete with players worldwide and climb the ranks
              </Text>
            </Stack>
            
            <Card withBorder>
              <Card.Section p="xl">
                <Center>
                  <Stack align="center" gap="md">
                    <IconCrown size={64} color="var(--mantine-color-gray-6)" />
                    <Title order={3}>Global Rankings</Title>
                    <Text c="dimmed" ta="center" mb="md">
                      Coming soon! Challenge other trainers and see how you rank globally.
                    </Text>
                    <Button variant="outline" disabled leftSection={<IconUsers size={16} />}>
                      Sign Up for Rankings
                    </Button>
                  </Stack>
                </Center>
              </Card.Section>
            </Card>
          </Box>
        );
      
      case 'daily':
        return <DailyMode />;
      
      case 'pokeinfo':
        return <PokeInfo />;
      
      case 'endless':
        return <EndlessMode />;
      
      case 'pokedex':
        return <Pokedex />;
      
      default:
        return null; // Prevent duplicate rendering
    }
  };

  return (
    <MainLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      battleCount={battleHistory.length}
    >
      <FadeIn>
        {renderContent()}
      </FadeIn>
    </MainLayout>
  );
};

export default GameDashboard;