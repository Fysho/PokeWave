import React, { useEffect, useState } from 'react';
import {
  Box,
  Title,
  Text,
  Stack,
  Center,
  Card,
  Group,
  Badge,
  Button,
  Grid,
  Loader,
  Progress,
  Avatar,
  Tooltip,
  useMantineTheme,
  useMantineColorScheme,
  RingProgress,
  Paper,
  Divider,
  ScrollArea
} from '@mantine/core';
import {
  IconWifi,
  IconWifiOff,
  IconUsers,
  IconTrophy,
  IconClock,
  IconCheck,
  IconX,
  IconArrowUp,
  IconArrowDown,
  IconMinus,
  IconLogin,
  IconChartBar,
  IconCrown
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useOnlineStore } from '../../store/onlineStore';
import { useAuthStore } from '../../store/authStore';
import { useOnlineSocket } from '../../hooks/useOnlineSocket';
import { FadeIn, SlideIn, BounceIn } from '../ui/transitions';
import { TypeColorSlider } from '../ui/TypeColorSlider';
import { getTypeColor } from '../../utils/typeColors';
import {
  RANK_COLORS,
  RANK_LABELS,
  type RankTier,
  type OnlinePlayer
} from '../../types/online';

// Rank badge component
const RankBadge: React.FC<{ rank: RankTier; size?: 'sm' | 'md' | 'lg' }> = ({ rank, size = 'md' }) => {
  return (
    <Badge
      size={size}
      variant="filled"
      style={{ backgroundColor: RANK_COLORS[rank] }}
    >
      {RANK_LABELS[rank]}
    </Badge>
  );
};

// Player card component
const PlayerCard: React.FC<{ player: OnlinePlayer; isCurrentUser?: boolean }> = ({ player, isCurrentUser }) => {
  const { colorScheme } = useMantineColorScheme();

  return (
    <Paper
      p="xs"
      withBorder
      style={{
        backgroundColor: isCurrentUser
          ? colorScheme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'
          : undefined,
        borderColor: isCurrentUser ? 'var(--mantine-color-blue-5)' : undefined
      }}
    >
      <Group gap="sm" wrap="nowrap">
        <Avatar
          src={player.avatarSprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${player.avatarPokemonId}.png`}
          size="sm"
          radius="xl"
        />
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" wrap="nowrap">
            <Text size="sm" fw={600} truncate style={{ flex: 1 }}>
              {player.username}
              {isCurrentUser && <Text span c="dimmed" size="xs"> (you)</Text>}
            </Text>
            {player.hasSubmitted && (
              <IconCheck size={14} color="var(--mantine-color-green-6)" />
            )}
          </Group>
          <Group gap="xs">
            <RankBadge rank={player.rank} size="sm" />
            <Text size="xs" c="dimmed">{player.elo}</Text>
          </Group>
        </Stack>
      </Group>
    </Paper>
  );
};

// Online players list
const OnlinePlayersList: React.FC = () => {
  const { onlinePlayers, userStats } = useOnlineStore();
  const { user } = useAuthStore();

  return (
    <Card withBorder h="100%">
      <Card.Section withBorder p="sm">
        <Group gap="xs">
          <IconUsers size={18} />
          <Text fw={600}>Online Players</Text>
          <Badge size="sm" variant="light">{onlinePlayers.length}</Badge>
        </Group>
      </Card.Section>
      <Card.Section p="sm">
        <ScrollArea h={300}>
          <Stack gap="xs">
            {onlinePlayers.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="md">
                No players online
              </Text>
            ) : (
              onlinePlayers.map((player) => (
                <PlayerCard
                  key={player.userId}
                  player={player}
                  isCurrentUser={player.userId === user?.id}
                />
              ))
            )}
          </Stack>
        </ScrollArea>
      </Card.Section>
    </Card>
  );
};

// Timer component
const RoundTimer: React.FC = () => {
  const { roundState } = useOnlineStore();
  const theme = useMantineTheme();

  if (!roundState) return null;

  const isGuessing = roundState.phase === 'guessing';
  const totalTime = isGuessing ? 30 : 10;
  const progress = (roundState.timeRemaining / totalTime) * 100;
  const isUrgent = roundState.timeRemaining <= 5;

  return (
    <Card withBorder p="md">
      <Stack align="center" gap="sm">
        <Group gap="xs">
          <IconClock size={20} color={isUrgent ? 'var(--mantine-color-red-6)' : undefined} />
          <Text size="sm" fw={600}>
            {isGuessing ? 'Guessing Phase' : 'Results Phase'}
          </Text>
        </Group>
        <RingProgress
          size={100}
          thickness={8}
          roundCaps
          sections={[
            {
              value: progress,
              color: isUrgent ? 'red' : isGuessing ? 'blue' : 'green'
            }
          ]}
          label={
            <Text ta="center" size="xl" fw={700} c={isUrgent ? 'red' : undefined}>
              {roundState.timeRemaining}s
            </Text>
          }
        />
        <Text size="xs" c="dimmed">
          Round #{roundState.roundNumber}
        </Text>
      </Stack>
    </Card>
  );
};

// User stats card
const UserStatsCard: React.FC = () => {
  const { userStats, myLastResult } = useOnlineStore();
  const { colorScheme } = useMantineColorScheme();

  if (!userStats) return null;

  const winRate = userStats.gamesPlayed > 0
    ? ((userStats.wins / userStats.gamesPlayed) * 100).toFixed(1)
    : '0.0';

  return (
    <Card withBorder p="md">
      <Stack gap="sm">
        <Group gap="xs">
          <IconChartBar size={18} />
          <Text fw={600}>Your Stats</Text>
        </Group>
        <Divider />
        <Group justify="space-between">
          <Text size="sm">Elo</Text>
          <Group gap="xs">
            <Text fw={700}>{userStats.elo}</Text>
            <RankBadge rank={userStats.rank} size="sm" />
          </Group>
        </Group>
        <Group justify="space-between">
          <Text size="sm">Position</Text>
          <Badge variant="light">#{userStats.position}</Badge>
        </Group>
        <Group justify="space-between">
          <Text size="sm">Games</Text>
          <Text fw={600}>{userStats.gamesPlayed}</Text>
        </Group>
        <Group justify="space-between">
          <Text size="sm">Win Rate</Text>
          <Text fw={600} c={parseFloat(winRate) >= 50 ? 'green' : 'red'}>{winRate}%</Text>
        </Group>
        {myLastResult && (
          <>
            <Divider label="Last Round" labelPosition="center" />
            <Group justify="space-between">
              <Text size="sm">Position</Text>
              <Badge variant="light">#{myLastResult.rankPosition}</Badge>
            </Group>
            <Group justify="space-between">
              <Text size="sm">Elo Change</Text>
              <Group gap={4}>
                {myLastResult.eloChange > 0 ? (
                  <IconArrowUp size={14} color="var(--mantine-color-green-6)" />
                ) : myLastResult.eloChange < 0 ? (
                  <IconArrowDown size={14} color="var(--mantine-color-red-6)" />
                ) : (
                  <IconMinus size={14} color="var(--mantine-color-gray-6)" />
                )}
                <Text
                  fw={600}
                  c={myLastResult.eloChange > 0 ? 'green' : myLastResult.eloChange < 0 ? 'red' : 'dimmed'}
                >
                  {myLastResult.eloChange > 0 ? '+' : ''}{myLastResult.eloChange}
                </Text>
              </Group>
            </Group>
          </>
        )}
      </Stack>
    </Card>
  );
};

// Pokemon battle card (simplified for online mode)
const OnlinePokemonCard: React.FC<{
  pokemon: any;
  position: 'left' | 'right';
  winPercentage?: number;
  showResults: boolean;
}> = ({ pokemon, position, winPercentage, showResults }) => {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  if (!pokemon) return null;

  return (
    <SlideIn direction={position} delay={0.2}>
      <Card withBorder h="100%">
        <Stack align="center" gap="sm">
          <Text size="sm" c="dimmed">Lv.{pokemon.level}</Text>
          <Title order={3} tt="capitalize" ta="center">{pokemon.name}</Title>

          <Box
            style={{
              width: 180,
              height: 180,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {pokemon.sprites?.front ? (
              <img
                src={pokemon.shiny && pokemon.sprites.shiny ? pokemon.sprites.shiny : pokemon.sprites.front}
                alt={pokemon.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))'
                }}
              />
            ) : (
              <Box
                w={120}
                h={120}
                bg={colorScheme === 'dark' ? 'dark.6' : 'gray.1'}
                style={{ borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text size="sm" c="dimmed">No Image</Text>
              </Box>
            )}
          </Box>

          <Group gap="xs" justify="center">
            {pokemon.types?.map((type: string) => (
              <Badge
                key={type}
                variant="filled"
                color={getTypeColor(type)}
                tt="capitalize"
              >
                {type}
              </Badge>
            ))}
          </Group>

          {pokemon.ability && (
            <Badge variant="light" color="blue" tt="capitalize">
              {pokemon.ability}
            </Badge>
          )}

          {pokemon.item && (
            <Badge variant="outline" color="teal" tt="capitalize">
              {pokemon.item}
            </Badge>
          )}

          {showResults && winPercentage !== undefined && (
            <BounceIn delay={0.3}>
              <Badge
                size="xl"
                variant="filled"
                color={winPercentage >= 50 ? 'green' : 'red'}
              >
                {winPercentage.toFixed(1)}%
              </Badge>
            </BounceIn>
          )}
        </Stack>
      </Card>
    </SlideIn>
  );
};

// Results display
const ResultsDisplay: React.FC = () => {
  const { lastResults, roundState } = useOnlineStore();
  const { user } = useAuthStore();

  if (!lastResults || !roundState) return null;

  return (
    <FadeIn>
      <Card withBorder p="lg" mt="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={600}>Round #{lastResults.roundNumber} Results</Text>
            <Badge size="lg" variant="filled" color="teal">
              Actual: {lastResults.actualWinPercent.toFixed(1)}%
            </Badge>
          </Group>

          <Divider />

          <ScrollArea h={200}>
            <Stack gap="xs">
              {lastResults.results.map((result, index) => {
                const isCurrentUser = result.userId === user?.id;
                return (
                  <Paper
                    key={result.userId}
                    p="sm"
                    withBorder
                    style={{
                      backgroundColor: isCurrentUser ? 'rgba(59, 130, 246, 0.1)' : undefined,
                      borderColor: isCurrentUser ? 'var(--mantine-color-blue-5)' : undefined
                    }}
                  >
                    <Group justify="space-between">
                      <Group gap="sm">
                        <Badge variant="light">#{result.rankPosition}</Badge>
                        <Text fw={isCurrentUser ? 700 : 500}>
                          {result.username}
                          {isCurrentUser && <Text span c="dimmed" size="xs"> (you)</Text>}
                        </Text>
                      </Group>
                      <Group gap="md">
                        <Tooltip label="Your guess">
                          <Text size="sm">{result.guess.toFixed(1)}%</Text>
                        </Tooltip>
                        <Tooltip label="Accuracy score">
                          <Badge variant="light" color="blue">
                            {result.accuracyScore.toFixed(0)}
                          </Badge>
                        </Tooltip>
                        <Group gap={4}>
                          {result.eloChange > 0 ? (
                            <IconArrowUp size={14} color="var(--mantine-color-green-6)" />
                          ) : result.eloChange < 0 ? (
                            <IconArrowDown size={14} color="var(--mantine-color-red-6)" />
                          ) : (
                            <IconMinus size={14} color="var(--mantine-color-gray-6)" />
                          )}
                          <Text
                            fw={600}
                            c={result.eloChange > 0 ? 'green' : result.eloChange < 0 ? 'red' : 'dimmed'}
                          >
                            {result.eloChange > 0 ? '+' : ''}{result.eloChange}
                          </Text>
                        </Group>
                      </Group>
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
          </ScrollArea>
        </Stack>
      </Card>
    </FadeIn>
  );
};

// Main Online Mode component
const OnlineMode: React.FC = () => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const { isAuthenticated, user } = useAuthStore();

  const {
    isConnected,
    isAuthenticated: isWsAuthenticated,
    roundState,
    userStats,
    currentGuess,
    hasSubmittedGuess,
    lastResults,
    isLoading,
    error,
    joinOnlineMode,
    submitGuess,
    setCurrentGuess,
    setError
  } = useOnlineStore();

  const { connect, disconnect, notifyGuessSubmitted } = useOnlineSocket({ autoConnect: false });

  const [guessValue, setGuessValue] = useState(50);
  const [hasJoined, setHasJoined] = useState(false);

  // Join online mode when authenticated
  useEffect(() => {
    if (isAuthenticated && !hasJoined) {
      handleJoin();
    }
  }, [isAuthenticated]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // Reset guess when new round starts
  useEffect(() => {
    if (roundState?.phase === 'guessing' && !hasSubmittedGuess) {
      setGuessValue(50);
    }
  }, [roundState?.roundNumber, roundState?.phase]);

  const handleJoin = async () => {
    try {
      await joinOnlineMode();
      connect();
      setHasJoined(true);
    } catch (error: any) {
      notifications.show({
        title: 'Failed to Join',
        message: error.message || 'Could not join online mode',
        color: 'red'
      });
    }
  };

  const handleSubmitGuess = async () => {
    if (!roundState || hasSubmittedGuess || roundState.phase !== 'guessing') return;

    try {
      await submitGuess(guessValue);
      notifyGuessSubmitted();
      notifications.show({
        title: 'Guess Submitted!',
        message: `Your guess: ${guessValue}%`,
        color: 'green'
      });
    } catch (error: any) {
      notifications.show({
        title: 'Failed to Submit',
        message: error.message || 'Could not submit guess',
        color: 'red'
      });
    }
  };

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <Box maw={800} mx="auto">
        <FadeIn>
          <Stack align="center" gap="xl" mt="xl">
            <Title
              order={1}
              style={{
                background: 'linear-gradient(135deg, var(--mantine-color-blue-6), var(--mantine-color-grape-6))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              <Group gap="xs">
                <IconUsers size={40} />
                Online Mode
              </Group>
            </Title>

            <Card withBorder p="xl" w="100%">
              <Stack align="center" gap="lg">
                <IconLogin size={64} color="var(--mantine-color-blue-6)" />
                <Title order={2}>Sign In Required</Title>
                <Text size="lg" c="dimmed" ta="center">
                  You need to be signed in to play Online Mode.
                  Compete against players worldwide in real-time battles!
                </Text>
                <Button
                  size="lg"
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'grape' }}
                  leftSection={<IconLogin size={20} />}
                  component="a"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    // Trigger sign in modal - assuming there's a global way to do this
                    notifications.show({
                      title: 'Sign In',
                      message: 'Please use the Sign In button in the header',
                      color: 'blue'
                    });
                  }}
                >
                  Sign In to Play
                </Button>
              </Stack>
            </Card>
          </Stack>
        </FadeIn>
      </Box>
    );
  }

  // Loading state
  if (isLoading && !roundState) {
    return (
      <Center mih="60vh">
        <Stack align="center" gap="md">
          <Loader size="xl" />
          <Text c="dimmed">Connecting to Online Mode...</Text>
        </Stack>
      </Center>
    );
  }

  // Connection status
  const ConnectionStatus = () => (
    <Group gap="xs">
      {isConnected ? (
        <>
          <IconWifi size={16} color="var(--mantine-color-green-6)" />
          <Text size="sm" c="green">Connected</Text>
        </>
      ) : (
        <>
          <IconWifiOff size={16} color="var(--mantine-color-red-6)" />
          <Text size="sm" c="red">Disconnected</Text>
        </>
      )}
    </Group>
  );

  const showResults = roundState?.phase === 'results';
  const canSubmit = roundState?.phase === 'guessing' && !hasSubmittedGuess && isConnected;

  return (
    <Box>
      <FadeIn>
        {/* Header */}
        <Group justify="space-between" mb="lg">
          <Group gap="md">
            <Title order={2}>
              <Group gap="xs">
                <IconUsers size={28} />
                Online Mode
              </Group>
            </Title>
            <ConnectionStatus />
          </Group>
          {roundState && (
            <Badge size="lg" variant="light">
              {roundState.totalParticipants} players this round
            </Badge>
          )}
        </Group>

        <Grid gutter="md">
          {/* Left sidebar - Timer and Stats */}
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Stack gap="md">
              <RoundTimer />
              <UserStatsCard />
            </Stack>
          </Grid.Col>

          {/* Main content - Battle */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            {roundState ? (
              <Stack gap="md">
                {/* Pokemon battle display */}
                <Grid gutter="md">
                  <Grid.Col span={6}>
                    <OnlinePokemonCard
                      pokemon={roundState.pokemon1}
                      position="left"
                      winPercentage={showResults ? roundState.actualWinPercent : undefined}
                      showResults={showResults}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <OnlinePokemonCard
                      pokemon={roundState.pokemon2}
                      position="right"
                      winPercentage={showResults ? 100 - (roundState.actualWinPercent || 0) : undefined}
                      showResults={showResults}
                    />
                  </Grid.Col>
                </Grid>

                {/* VS Badge */}
                <Center>
                  <Box
                    w={60}
                    h={60}
                    bg="linear-gradient(135deg, var(--mantine-color-blue-5), var(--mantine-color-grape-5))"
                    c="white"
                    style={{
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: -40,
                      marginBottom: -40,
                      zIndex: 10,
                      position: 'relative',
                      boxShadow: 'var(--mantine-shadow-lg)'
                    }}
                  >
                    <Text size="lg" fw={700}>VS</Text>
                  </Box>
                </Center>

                {/* Guess slider */}
                <Card withBorder p="lg">
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Stack gap={2}>
                        <Text fw={600}>{roundState.pokemon1?.name}</Text>
                        <Text size="xl" fw={700} c="blue">
                          {hasSubmittedGuess ? currentGuess : guessValue}%
                        </Text>
                      </Stack>
                      <Text size="xl" fw={700}>VS</Text>
                      <Stack gap={2} align="flex-end">
                        <Text fw={600}>{roundState.pokemon2?.name}</Text>
                        <Text size="xl" fw={700} c="grape">
                          {100 - (hasSubmittedGuess ? (currentGuess || 50) : guessValue)}%
                        </Text>
                      </Stack>
                    </Group>

                    <Box py="md">
                      <TypeColorSlider
                        value={hasSubmittedGuess ? (currentGuess || 50) : guessValue}
                        onChange={(value) => !hasSubmittedGuess && setGuessValue(value)}
                        leftType={roundState.pokemon1?.types?.[0] || 'normal'}
                        rightType={roundState.pokemon2?.types?.[0] || 'normal'}
                        min={0}
                        max={100}
                        step={1}
                        disabled={!canSubmit}
                        correctValue={showResults ? roundState.actualWinPercent : undefined}
                        showCorrectIndicator={showResults}
                        isCorrect={showResults && currentGuess !== null
                          ? Math.abs(currentGuess - (roundState.actualWinPercent || 0)) <= 10
                          : false
                        }
                      />
                    </Box>

                    <Center>
                      {hasSubmittedGuess ? (
                        <Badge size="lg" color="green" leftSection={<IconCheck size={14} />}>
                          Guess Submitted - Waiting for results...
                        </Badge>
                      ) : canSubmit ? (
                        <Button
                          size="lg"
                          variant="gradient"
                          gradient={{ from: 'blue', to: 'grape' }}
                          onClick={handleSubmitGuess}
                          disabled={!canSubmit}
                        >
                          Submit Guess
                        </Button>
                      ) : (
                        <Badge size="lg" color="gray">
                          {showResults ? 'Viewing Results' : 'Waiting for next round...'}
                        </Badge>
                      )}
                    </Center>
                  </Stack>
                </Card>

                {/* Results */}
                {showResults && lastResults && <ResultsDisplay />}
              </Stack>
            ) : (
              <Card withBorder p="xl">
                <Center py="xl">
                  <Stack align="center" gap="md">
                    <Loader size="lg" />
                    <Text c="dimmed">Loading round data...</Text>
                  </Stack>
                </Center>
              </Card>
            )}
          </Grid.Col>

          {/* Right sidebar - Online players */}
          <Grid.Col span={{ base: 12, md: 3 }}>
            <OnlinePlayersList />
          </Grid.Col>
        </Grid>
      </FadeIn>
    </Box>
  );
};

export default OnlineMode;
