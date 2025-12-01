import React, { useState, useEffect } from 'react';
import {
  Card,
  Stack,
  Title,
  Text,
  Group,
  Badge,
  Button,
  Table,
  Avatar,
  Loader,
  Center,
  Grid,
  Progress,
  Tabs,
  ActionIcon,
  Box,
  Paper,
  RingProgress,
  SimpleGrid,
  ScrollArea,
  useMantineColorScheme,
  Tooltip,
  Alert,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconUsers,
  IconChartBar,
  IconTrophy,
  IconCalendar,
  IconDatabase,
  IconServer,
  IconRefresh,
  IconSword,
  IconPokeball,
  IconCrown,
  IconActivity,
  IconClock,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconTrash,
  IconSparkles,
} from '@tabler/icons-react';
import AdminService, {
  type DashboardSummary,
  type UserOverview,
  type PokedexInsights,
  type LeaderboardManagement,
} from '../../services/admin';

const AdminDashboard: React.FC = () => {
  const { colorScheme } = useMantineColorScheme();
  const [activeTab, setActiveTab] = useState<string | null>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [users, setUsers] = useState<UserOverview[]>([]);
  const [pokedexInsights, setPokedexInsights] = useState<PokedexInsights | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardManagement | null>(null);

  // Fetch all data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [summary, usersResponse, insights, leaderboard] = await Promise.all([
        AdminService.getDashboardSummary(),
        AdminService.getAllUsers(),
        AdminService.getPokedexInsights(),
        AdminService.getLeaderboardManagement(),
      ]);
      setDashboardData(summary);
      setUsers(usersResponse.users);
      setPokedexInsights(insights);
      setLeaderboardData(leaderboard);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load admin dashboard data',
        color: 'red',
        icon: <IconX />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Refresh specific data
  const handleRefreshBattleCache = async () => {
    setIsRefreshing(true);
    try {
      const result = await AdminService.refreshBattleCache();
      notifications.show({
        title: 'Cache Refreshed',
        message: `Battle cache refreshed: ${result.cacheSize}/${result.targetSize} battles`,
        color: 'green',
        icon: <IconCheck />,
      });
      await fetchData();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to refresh battle cache',
        color: 'red',
        icon: <IconX />,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefreshDailyChallenges = async () => {
    setIsRefreshing(true);
    try {
      await AdminService.refreshDailyChallenges();
      notifications.show({
        title: 'Challenges Refreshed',
        message: 'Daily challenges have been regenerated',
        color: 'green',
        icon: <IconCheck />,
      });
      await fetchData();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to refresh daily challenges',
        color: 'red',
        icon: <IconX />,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResetUserScore = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to reset ${username}'s leaderboard score?`)) return;

    try {
      await AdminService.resetUserScore(userId);
      notifications.show({
        title: 'Score Reset',
        message: `${username}'s score has been reset`,
        color: 'green',
        icon: <IconCheck />,
      });
      await fetchData();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to reset user score',
        color: 'red',
        icon: <IconX />,
      });
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <Center h={400}>
        <Stack align="center" gap="md">
          <Loader size="xl" />
          <Text c="dimmed">Loading admin dashboard...</Text>
        </Stack>
      </Center>
    );
  }

  if (!dashboardData) {
    return (
      <Alert color="red" icon={<IconAlertTriangle />}>
        Failed to load dashboard data. Please try again.
      </Alert>
    );
  }

  const { gameAnalytics, systemHealth, dailyChallengeStats, battleStats } = dashboardData;

  return (
    <Box maw={1400} mx="auto">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Stack gap={4}>
            <Title
              order={1}
              style={{
                background: 'linear-gradient(135deg, var(--mantine-color-red-6), var(--mantine-color-orange-6))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Admin Dashboard
            </Title>
            <Text c="dimmed">System monitoring and management tools</Text>
          </Stack>
          <Badge size="lg" variant="light" color="red">
            Admin Only
          </Badge>
        </Group>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<IconChartBar size={16} />}>
              Overview
            </Tabs.Tab>
            <Tabs.Tab value="users" leftSection={<IconUsers size={16} />}>
              Users ({users.length})
            </Tabs.Tab>
            <Tabs.Tab value="battles" leftSection={<IconSword size={16} />}>
              Battles
            </Tabs.Tab>
            <Tabs.Tab value="leaderboard" leftSection={<IconTrophy size={16} />}>
              Leaderboard
            </Tabs.Tab>
            <Tabs.Tab value="pokedex" leftSection={<IconPokeball size={16} />}>
              Pokedex
            </Tabs.Tab>
            <Tabs.Tab value="system" leftSection={<IconServer size={16} />}>
              System
            </Tabs.Tab>
          </Tabs.List>

          {/* Overview Tab */}
          <Tabs.Panel value="overview" pt="lg">
            <Stack gap="lg">
              {/* Quick Stats */}
              <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }}>
                <StatCard
                  title="Total Users"
                  value={gameAnalytics.totalUsers}
                  icon={<IconUsers size={24} />}
                  color="blue"
                />
                <StatCard
                  title="Battles Played"
                  value={gameAnalytics.totalBattlesPlayed}
                  icon={<IconSword size={24} />}
                  color="grape"
                />
                <StatCard
                  title="Avg Accuracy"
                  value={`${gameAnalytics.averageAccuracy}%`}
                  icon={<IconChartBar size={24} />}
                  color="green"
                />
                <StatCard
                  title="Top Score"
                  value={gameAnalytics.topEndlessScore}
                  icon={<IconCrown size={24} />}
                  color="yellow"
                />
                <StatCard
                  title="Active Today"
                  value={gameAnalytics.activeUsersToday}
                  icon={<IconActivity size={24} />}
                  color="teal"
                />
              </SimpleGrid>

              {/* Charts Row */}
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card withBorder>
                    <Title order={4} mb="md">User Activity</Title>
                    <Group gap="xl">
                      <RingProgress
                        size={120}
                        thickness={12}
                        sections={[
                          { value: (gameAnalytics.activeUsersToday / Math.max(gameAnalytics.totalUsers, 1)) * 100, color: 'teal' },
                        ]}
                        label={
                          <Center>
                            <Stack gap={0} align="center">
                              <Text size="lg" fw={700}>{gameAnalytics.activeUsersToday}</Text>
                              <Text size="xs" c="dimmed">Today</Text>
                            </Stack>
                          </Center>
                        }
                      />
                      <Stack gap="xs">
                        <Group gap="xs">
                          <Badge color="teal" variant="dot" />
                          <Text size="sm">Active Today: {gameAnalytics.activeUsersToday}</Text>
                        </Group>
                        <Group gap="xs">
                          <Badge color="blue" variant="dot" />
                          <Text size="sm">Active This Week: {gameAnalytics.activeUsersWeek}</Text>
                        </Group>
                        <Group gap="xs">
                          <Badge color="gray" variant="dot" />
                          <Text size="sm">Total Users: {gameAnalytics.totalUsers}</Text>
                        </Group>
                      </Stack>
                    </Group>
                  </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card withBorder>
                    <Title order={4} mb="md">Win Rate Distribution</Title>
                    <Stack gap="xs">
                      {battleStats.winRateDistribution.map((bucket) => (
                        <Group key={bucket.range} justify="space-between">
                          <Text size="sm">{bucket.range}</Text>
                          <Group gap="xs">
                            <Progress
                              value={(bucket.count / Math.max(battleStats.cachedBattleCount, 1)) * 100}
                              size="lg"
                              w={150}
                              color="blue"
                            />
                            <Text size="sm" fw={500} w={30}>{bucket.count}</Text>
                          </Group>
                        </Group>
                      ))}
                    </Stack>
                  </Card>
                </Grid.Col>
              </Grid>

              {/* System Status */}
              <Card withBorder>
                <Group justify="space-between" mb="md">
                  <Title order={4}>System Status</Title>
                  <Badge
                    color={systemHealth.redisConnected ? 'green' : 'red'}
                    variant="light"
                  >
                    {systemHealth.redisConnected ? 'All Systems Operational' : 'Redis Disconnected'}
                  </Badge>
                </Group>
                <SimpleGrid cols={{ base: 2, sm: 4 }}>
                  <MiniStat label="Uptime" value={formatUptime(systemHealth.uptime)} />
                  <MiniStat label="Memory" value={`${systemHealth.memoryUsage.heapUsed}MB`} />
                  <MiniStat label="Cache" value={`${systemHealth.battleCacheSize}/${systemHealth.battleCacheTarget}`} />
                  <MiniStat label="Daily Challenges" value={systemHealth.dailyChallengesActive.toString()} />
                </SimpleGrid>
              </Card>
            </Stack>
          </Tabs.Panel>

          {/* Users Tab */}
          <Tabs.Panel value="users" pt="lg">
            <Card withBorder>
              <Group justify="space-between" mb="md">
                <Title order={4}>Registered Users ({users.length})</Title>
                <Button
                  variant="light"
                  leftSection={<IconRefresh size={16} />}
                  onClick={fetchData}
                  loading={isLoading}
                >
                  Refresh
                </Button>
              </Group>
              <ScrollArea h={500}>
                <Table highlightOnHover striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>User</Table.Th>
                      <Table.Th>Joined</Table.Th>
                      <Table.Th>Battles</Table.Th>
                      <Table.Th>Accuracy</Table.Th>
                      <Table.Th>Best Streak</Table.Th>
                      <Table.Th>Endless High</Table.Th>
                      <Table.Th>Pokedex</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {users.map((user) => (
                      <Table.Tr key={user.id}>
                        <Table.Td>
                          <Group gap="sm">
                            <Avatar
                              src={user.avatarSprite || '/sprites/front/25.png'}
                              size="sm"
                              radius="xl"
                            />
                            <Text fw={500}>{user.username}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </Text>
                        </Table.Td>
                        <Table.Td>{user.stats?.totalBattles || 0}</Table.Td>
                        <Table.Td>
                          {user.stats && user.stats.totalBattles > 0
                            ? `${((user.stats.totalCorrectGuesses / user.stats.totalBattles) * 100).toFixed(1)}%`
                            : '-'}
                        </Table.Td>
                        <Table.Td>{user.stats?.highestStreak || 0}</Table.Td>
                        <Table.Td>
                          <Badge color="grape" variant="light">
                            {user.stats?.endlessHighScore || 0}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            <Text size="sm">{user.pokedexCount?.unlocked || 0}</Text>
                            {(user.pokedexCount?.shiny || 0) > 0 && (
                              <Badge size="xs" color="yellow" variant="light">
                                <IconSparkles size={10} /> {user.pokedexCount?.shiny}
                              </Badge>
                            )}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Card>
          </Tabs.Panel>

          {/* Battles Tab */}
          <Tabs.Panel value="battles" pt="lg">
            <Stack gap="lg">
              <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <StatCard
                  title="Cached Battles"
                  value={battleStats.cachedBattleCount}
                  icon={<IconDatabase size={24} />}
                  color="blue"
                />
                <StatCard
                  title="Avg Win Rate"
                  value={`${battleStats.averageWinRate}%`}
                  icon={<IconChartBar size={24} />}
                  color="green"
                />
                <StatCard
                  title="Daily Challenges"
                  value={dailyChallengeStats.totalChallenges}
                  icon={<IconCalendar size={24} />}
                  color="grape"
                />
                <StatCard
                  title="Today's Battles"
                  value={dailyChallengeStats.todaysChallenge?.battlesCount || 6}
                  icon={<IconSword size={24} />}
                  color="orange"
                />
              </SimpleGrid>

              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card withBorder>
                    <Group justify="space-between" mb="md">
                      <Title order={4}>Battle Cache</Title>
                      <Button
                        variant="light"
                        leftSection={<IconRefresh size={16} />}
                        onClick={handleRefreshBattleCache}
                        loading={isRefreshing}
                        color="blue"
                      >
                        Refresh Cache
                      </Button>
                    </Group>
                    <Stack gap="md">
                      <Progress
                        value={(battleStats.cachedBattleCount / systemHealth.battleCacheTarget) * 100}
                        size="xl"
                        color="blue"
                      />
                      <Text c="dimmed" size="sm">
                        {battleStats.cachedBattleCount} / {systemHealth.battleCacheTarget} battles cached
                      </Text>
                    </Stack>
                  </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card withBorder>
                    <Group justify="space-between" mb="md">
                      <Title order={4}>Daily Challenges</Title>
                      <Button
                        variant="light"
                        leftSection={<IconRefresh size={16} />}
                        onClick={handleRefreshDailyChallenges}
                        loading={isRefreshing}
                        color="grape"
                      >
                        Regenerate All
                      </Button>
                    </Group>
                    <Stack gap="xs">
                      <Text size="sm">Available dates: {dailyChallengeStats.availableDates.length}</Text>
                      <Group gap="xs" wrap="wrap">
                        {dailyChallengeStats.availableDates.map((date) => (
                          <Badge key={date} variant="outline" size="sm">
                            {date}
                          </Badge>
                        ))}
                      </Group>
                    </Stack>
                  </Card>
                </Grid.Col>
              </Grid>

              {/* Recent Battles */}
              <Card withBorder>
                <Title order={4} mb="md">Cached Battle Pool</Title>
                <ScrollArea h={300}>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Pokemon 1</Table.Th>
                        <Table.Th>Pokemon 2</Table.Th>
                        <Table.Th>Win Rate</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {battleStats.recentBattles.map((battle) => (
                        <Table.Tr key={battle.id}>
                          <Table.Td>{battle.pokemon1}</Table.Td>
                          <Table.Td>{battle.pokemon2}</Table.Td>
                          <Table.Td>
                            <Badge color={battle.winRate > 50 ? 'green' : battle.winRate < 50 ? 'red' : 'gray'}>
                              {battle.winRate.toFixed(1)}%
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Card>
            </Stack>
          </Tabs.Panel>

          {/* Leaderboard Tab */}
          <Tabs.Panel value="leaderboard" pt="lg">
            <Stack gap="lg">
              <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <StatCard
                  title="Total Players"
                  value={leaderboardData?.totalPlayers || 0}
                  icon={<IconUsers size={24} />}
                  color="blue"
                />
                <StatCard
                  title="Total Runs"
                  value={leaderboardData?.totalRuns || 0}
                  icon={<IconActivity size={24} />}
                  color="grape"
                />
                <StatCard
                  title="Avg High Score"
                  value={leaderboardData?.averageHighScore || 0}
                  icon={<IconChartBar size={24} />}
                  color="green"
                />
                <StatCard
                  title="Suspicious"
                  value={leaderboardData?.suspiciousScores.length || 0}
                  icon={<IconAlertTriangle size={24} />}
                  color={leaderboardData?.suspiciousScores.length ? 'red' : 'gray'}
                />
              </SimpleGrid>

              {/* Suspicious Scores Alert */}
              {leaderboardData && leaderboardData.suspiciousScores.length > 0 && (
                <Alert color="red" icon={<IconAlertTriangle />} title="Suspicious Scores Detected">
                  {leaderboardData.suspiciousScores.length} user(s) have scores above 100 which may indicate cheating.
                </Alert>
              )}

              {/* Top Players */}
              <Card withBorder>
                <Title order={4} mb="md">Top Players</Title>
                <ScrollArea h={400}>
                  <Table highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Rank</Table.Th>
                        <Table.Th>Player</Table.Th>
                        <Table.Th>High Score</Table.Th>
                        <Table.Th>Total Runs</Table.Th>
                        <Table.Th>Last Played</Table.Th>
                        <Table.Th>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {leaderboardData?.topPlayers.map((player, index) => {
                        const rank = index + 1;
                        const medalColor = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? '#CD7F32' : undefined;
                        const isSuspicious = player.highScore > 100;

                        return (
                          <Table.Tr key={player.userId} style={isSuspicious ? { backgroundColor: 'rgba(255, 0, 0, 0.1)' } : undefined}>
                            <Table.Td>
                              {rank <= 3 ? (
                                <Badge size="lg" style={{ backgroundColor: medalColor }}>
                                  #{rank}
                                </Badge>
                              ) : (
                                <Text fw={600}>#{rank}</Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Group gap="sm">
                                <Avatar
                                  src={player.avatarSprite || '/sprites/front/25.png'}
                                  size="sm"
                                  radius="xl"
                                />
                                <Text fw={500}>{player.username}</Text>
                                {isSuspicious && (
                                  <Tooltip label="Suspicious score">
                                    <IconAlertTriangle size={16} color="red" />
                                  </Tooltip>
                                )}
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Badge color={isSuspicious ? 'red' : 'grape'} variant="light" size="lg">
                                {player.highScore}
                              </Badge>
                            </Table.Td>
                            <Table.Td>{player.totalRuns}</Table.Td>
                            <Table.Td>
                              <Text size="sm" c="dimmed">
                                {new Date(player.lastPlayed).toLocaleDateString()}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Tooltip label="Reset score">
                                <ActionIcon
                                  color="red"
                                  variant="light"
                                  onClick={() => handleResetUserScore(player.userId, player.username)}
                                >
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Tooltip>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Card>
            </Stack>
          </Tabs.Panel>

          {/* Pokedex Tab */}
          <Tabs.Panel value="pokedex" pt="lg">
            <Stack gap="lg">
              <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <StatCard
                  title="Total Unlocks"
                  value={pokedexInsights?.totalUnlocks || 0}
                  icon={<IconPokeball size={24} />}
                  color="blue"
                />
                <StatCard
                  title="Shiny Unlocks"
                  value={pokedexInsights?.totalShinyUnlocks || 0}
                  icon={<IconSparkles size={24} />}
                  color="yellow"
                />
                <StatCard
                  title="Avg per User"
                  value={pokedexInsights?.averageUnlocksPerUser || 0}
                  icon={<IconChartBar size={24} />}
                  color="green"
                />
                <StatCard
                  title="Avg Shinies"
                  value={pokedexInsights?.averageShinyPerUser || 0}
                  icon={<IconSparkles size={24} />}
                  color="grape"
                />
              </SimpleGrid>

              {/* Completion Rates */}
              <Card withBorder>
                <Title order={4} mb="md">Completion Rates</Title>
                <SimpleGrid cols={{ base: 2, sm: 4 }}>
                  <Paper p="md" withBorder>
                    <Text size="xl" fw={700} c="red">{pokedexInsights?.completionRates.under25 || 0}</Text>
                    <Text size="sm" c="dimmed">&lt;25% Complete</Text>
                  </Paper>
                  <Paper p="md" withBorder>
                    <Text size="xl" fw={700} c="orange">{pokedexInsights?.completionRates.under50 || 0}</Text>
                    <Text size="sm" c="dimmed">25-50% Complete</Text>
                  </Paper>
                  <Paper p="md" withBorder>
                    <Text size="xl" fw={700} c="blue">{pokedexInsights?.completionRates.under75 || 0}</Text>
                    <Text size="sm" c="dimmed">50-75% Complete</Text>
                  </Paper>
                  <Paper p="md" withBorder>
                    <Text size="xl" fw={700} c="green">{pokedexInsights?.completionRates.complete || 0}</Text>
                    <Text size="sm" c="dimmed">75%+ Complete</Text>
                  </Paper>
                </SimpleGrid>
              </Card>

              <Grid>
                {/* Most Unlocked */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card withBorder>
                    <Title order={4} mb="md">Most Unlocked Pokemon</Title>
                    <ScrollArea h={300}>
                      <Stack gap="xs">
                        {pokedexInsights?.mostUnlockedPokemon.map((pokemon, index) => (
                          <Group key={pokemon.id} justify="space-between">
                            <Group gap="sm">
                              <Avatar
                                src={`/sprites/front/${pokemon.id}.png`}
                                size="sm"
                                radius="xl"
                              />
                              <Text size="sm">{pokemon.name}</Text>
                            </Group>
                            <Badge color="blue" variant="light">{pokemon.count}</Badge>
                          </Group>
                        ))}
                      </Stack>
                    </ScrollArea>
                  </Card>
                </Grid.Col>

                {/* Shiny Rankings */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card withBorder>
                    <Title order={4} mb="md">Top Shiny Catches</Title>
                    <ScrollArea h={300}>
                      <Stack gap="xs">
                        {pokedexInsights?.shinyRankings.length === 0 ? (
                          <Text c="dimmed" ta="center">No shiny Pokemon caught yet</Text>
                        ) : (
                          pokedexInsights?.shinyRankings.map((pokemon) => (
                            <Group key={pokemon.id} justify="space-between">
                              <Group gap="sm">
                                <Avatar
                                  src={`/sprites/front/shiny/${pokemon.id}.png`}
                                  size="sm"
                                  radius="xl"
                                />
                                <Text size="sm">{pokemon.name}</Text>
                                <IconSparkles size={14} color="gold" />
                              </Group>
                              <Badge color="yellow" variant="light">{pokemon.count}</Badge>
                            </Group>
                          ))
                        )}
                      </Stack>
                    </ScrollArea>
                  </Card>
                </Grid.Col>
              </Grid>
            </Stack>
          </Tabs.Panel>

          {/* System Tab */}
          <Tabs.Panel value="system" pt="lg">
            <Stack gap="lg">
              {/* System Status */}
              <Card withBorder>
                <Group justify="space-between" mb="md">
                  <Title order={4}>System Health</Title>
                  <Badge
                    size="lg"
                    color={systemHealth.redisConnected ? 'green' : 'red'}
                    variant="light"
                  >
                    {systemHealth.redisConnected ? 'Healthy' : 'Degraded'}
                  </Badge>
                </Group>

                <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }}>
                  <Paper p="md" withBorder>
                    <Group gap="xs">
                      <IconClock size={20} />
                      <Text size="sm" c="dimmed">Uptime</Text>
                    </Group>
                    <Text size="xl" fw={700}>{formatUptime(systemHealth.uptime)}</Text>
                  </Paper>

                  <Paper p="md" withBorder>
                    <Group gap="xs">
                      <IconServer size={20} />
                      <Text size="sm" c="dimmed">Node Version</Text>
                    </Group>
                    <Text size="xl" fw={700}>{systemHealth.nodeVersion}</Text>
                  </Paper>

                  <Paper p="md" withBorder>
                    <Group gap="xs">
                      <IconActivity size={20} />
                      <Text size="sm" c="dimmed">Environment</Text>
                    </Group>
                    <Badge size="lg" color={systemHealth.environment === 'production' ? 'red' : 'blue'}>
                      {systemHealth.environment}
                    </Badge>
                  </Paper>

                  <Paper p="md" withBorder>
                    <Group gap="xs">
                      <IconDatabase size={20} />
                      <Text size="sm" c="dimmed">Redis</Text>
                    </Group>
                    <Badge size="lg" color={systemHealth.redisConnected ? 'green' : 'red'}>
                      {systemHealth.redisConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </Paper>
                </SimpleGrid>
              </Card>

              {/* Memory Usage */}
              <Card withBorder>
                <Title order={4} mb="md">Memory Usage</Title>
                <SimpleGrid cols={{ base: 2, sm: 4 }}>
                  <Paper p="md" withBorder>
                    <Text size="sm" c="dimmed">Heap Used</Text>
                    <Text size="xl" fw={700}>{systemHealth.memoryUsage.heapUsed} MB</Text>
                    <Progress
                      value={(systemHealth.memoryUsage.heapUsed / systemHealth.memoryUsage.heapTotal) * 100}
                      color="blue"
                      mt="xs"
                    />
                  </Paper>

                  <Paper p="md" withBorder>
                    <Text size="sm" c="dimmed">Heap Total</Text>
                    <Text size="xl" fw={700}>{systemHealth.memoryUsage.heapTotal} MB</Text>
                  </Paper>

                  <Paper p="md" withBorder>
                    <Text size="sm" c="dimmed">External</Text>
                    <Text size="xl" fw={700}>{systemHealth.memoryUsage.external} MB</Text>
                  </Paper>

                  <Paper p="md" withBorder>
                    <Text size="sm" c="dimmed">RSS</Text>
                    <Text size="xl" fw={700}>{systemHealth.memoryUsage.rss} MB</Text>
                  </Paper>
                </SimpleGrid>
              </Card>

              {/* Cache Status */}
              <Card withBorder>
                <Title order={4} mb="md">Cache Status</Title>
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper p="md" withBorder>
                      <Group justify="space-between" mb="xs">
                        <Text>Battle Cache</Text>
                        <Badge color="blue">{systemHealth.battleCacheSize}/{systemHealth.battleCacheTarget}</Badge>
                      </Group>
                      <Progress
                        value={(systemHealth.battleCacheSize / systemHealth.battleCacheTarget) * 100}
                        size="lg"
                        color="blue"
                      />
                    </Paper>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper p="md" withBorder>
                      <Group justify="space-between" mb="xs">
                        <Text>Daily Challenges</Text>
                        <Badge color="grape">{systemHealth.dailyChallengesActive}/10</Badge>
                      </Group>
                      <Progress
                        value={(systemHealth.dailyChallengesActive / 10) * 100}
                        size="lg"
                        color="grape"
                      />
                    </Paper>
                  </Grid.Col>
                </Grid>
              </Card>

              {/* Server Time */}
              <Card withBorder>
                <Group justify="space-between">
                  <Text c="dimmed">Server Time</Text>
                  <Text fw={500}>{new Date(systemHealth.serverTime).toLocaleString()}</Text>
                </Group>
              </Card>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Box>
  );
};

// Helper Components
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <Paper p="md" withBorder>
    <Group justify="space-between" align="flex-start">
      <Stack gap={4}>
        <Text size="sm" c="dimmed">{title}</Text>
        <Text size="xl" fw={700}>{value}</Text>
      </Stack>
      <Box c={color}>{icon}</Box>
    </Group>
  </Paper>
);

const MiniStat: React.FC<{
  label: string;
  value: string;
}> = ({ label, value }) => (
  <Stack gap={2}>
    <Text size="xs" c="dimmed">{label}</Text>
    <Text fw={600}>{value}</Text>
  </Stack>
);

export default AdminDashboard;
