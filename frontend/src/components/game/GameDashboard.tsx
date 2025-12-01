import React, { useState } from 'react';
import BattleArena from '../battle/BattleArena';
import MainLayout from '../layout/MainLayout';
import PokeInfo from '../debug/PokeInfo';
import EndlessMode from './EndlessMode';
import OnlineMode from './OnlineMode';
import Pokedex from '../pokedex/Pokedex';
import DailyMode from './DailyMode';
import BattleLab from './BattleLab';
import CardView from './CardView';
import Profile from '../profile/Profile';
import AdminDashboard from '../admin/AdminDashboard';
import AboutPage from '../about/AboutPage';
import { useGameStore } from '../../store/gameStore';
import { useAuthStore } from '../../store/authStore';
import { usePokedexStore } from '../../store/pokedexStore';
import { 
  IconChartBar, 
  IconTrophy, 
  IconCalendar, 
  IconCrown, 
  IconUsers, 
  IconTool,
  IconClock,
  IconUser,
  IconPencil,
  IconSearch,
  IconInfinity
} from '@tabler/icons-react';
import { Card, Button, Stack, Title, Text, Grid, Group, Box, Center, Badge, Modal, ScrollArea, ActionIcon, Image, TextInput, Table, Avatar, Loader, useMantineColorScheme } from '@mantine/core';
import { FadeIn } from '../ui/transitions';
import { pokemonNames, getPokemonName } from '../../data/pokemonNames';
import LeaderboardService from '../../services/leaderboard';

const GameDashboard: React.FC = () => {
  const { colorScheme } = useMantineColorScheme();
  const [activeTab, setActiveTab] = useState<string>('battle');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const { battleHistory, score, streak, totalGuesses, correctGuesses } = useGameStore();
  const { user, isAuthenticated } = useAuthStore();
  const { unlockedPokemon, unlockedShinyPokemon } = usePokedexStore();

  const getAccuracy = () => {
    if (totalGuesses === 0) return 0;
    return ((correctGuesses / totalGuesses) * 100).toFixed(1);
  };

  // Fetch leaderboard data when tab changes to leaderboard
  React.useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const data = await LeaderboardService.getEndlessLeaderboard(50);
      setLeaderboardData(data.leaderboard);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoadingLeaderboard(false);
    }
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
                Endless Mode Leaderboard
              </Title>
              <Text size="xl" c="dimmed" ta="center">
                Top trainers with the highest Endless Mode scores
              </Text>
            </Stack>
            
            <Card withBorder>
              <Card.Section>
                {isLoadingLeaderboard ? (
                  <Center p="xl">
                    <Stack align="center" gap="md">
                      <Loader size="lg" />
                      <Text c="dimmed">Loading leaderboard...</Text>
                    </Stack>
                  </Center>
                ) : leaderboardData.length === 0 ? (
                  <Center p="xl">
                    <Stack align="center" gap="md">
                      <IconCrown size={64} color="var(--mantine-color-gray-6)" />
                      <Title order={3}>No Scores Yet</Title>
                      <Text c="dimmed" ta="center">
                        Be the first to set a high score in Endless Mode!
                      </Text>
                    </Stack>
                  </Center>
                ) : (
                  <Table highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Rank</Table.Th>
                        <Table.Th>Trainer</Table.Th>
                        <Table.Th>High Score</Table.Th>
                        <Table.Th>Total Runs</Table.Th>
                        <Table.Th>Last Played</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {leaderboardData.map((entry, index) => {
                        const isCurrentUser = user?.id === entry.userId;
                        const rank = index + 1;
                        const medalColor = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? '#CD7F32' : undefined;
                        
                        return (
                          <Table.Tr 
                            key={entry.userId} 
                            style={{ 
                              backgroundColor: isCurrentUser 
                                ? colorScheme === 'dark' 
                                  ? 'rgba(34, 139, 230, 0.15)' 
                                  : 'var(--mantine-color-blue-0)' 
                                : undefined 
                            }}
                          >
                            <Table.Td>
                              <Group gap="xs">
                                {rank <= 3 ? (
                                  <Badge
                                    size="lg"
                                    variant="filled"
                                    style={{ backgroundColor: medalColor }}
                                  >
                                    #{rank}
                                  </Badge>
                                ) : (
                                  <Text fw={600}>#{rank}</Text>
                                )}
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="sm">
                                <Avatar
                                  src={entry.avatarSprite || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'}
                                  size="sm"
                                  radius="xl"
                                />
                                <Text fw={isCurrentUser ? 700 : 500}>
                                  {entry.username}
                                  {isCurrentUser && (
                                    <Badge size="xs" color="blue" ml="xs" variant="light">
                                      You
                                    </Badge>
                                  )}
                                </Text>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Text fw={700} size="lg" c={rank <= 3 ? medalColor : undefined}>
                                {entry.highScore}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text c="dimmed">{entry.totalRuns}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text c="dimmed">
                                {new Date(entry.lastPlayed).toLocaleDateString()}
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                )}
              </Card.Section>
            </Card>
            
            {isAuthenticated && user && leaderboardData.length > 0 && !leaderboardData.find(e => e.userId === user.id) && (
              <Card withBorder mt="lg">
                <Card.Section p="md">
                  <Center>
                    <Stack align="center" gap="xs">
                      <Text c="dimmed" ta="center">
                        You haven't set a score yet. Play Endless Mode to get on the leaderboard!
                      </Text>
                      <Button 
                        variant="light" 
                        onClick={() => setActiveTab('endless')}
                        leftSection={<IconInfinity size={16} />}
                      >
                        Play Endless Mode
                      </Button>
                    </Stack>
                  </Center>
                </Card.Section>
              </Card>
            )}
          </Box>
        );
      
      case 'daily':
        return <DailyMode />;
      
      case 'pokeinfo':
        return <PokeInfo />;
      
      case 'endless':
        return <EndlessMode />;

      case 'online':
        return <OnlineMode />;

      case 'pokedex':
        return <Pokedex />;

      case 'battlelab':
        return <BattleLab />;

      case 'cardview':
        return <CardView />;

      case 'profile':
        return <Profile />;

      case 'admin':
        return <AdminDashboard />;

      case 'about':
        return <AboutPage />;

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