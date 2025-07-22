import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Title, 
  Text, 
  Stack, 
  Grid, 
  Button, 
  Group,
  Card,
  Slider,
  Center,
  Loader,
  Alert,
  Drawer,
  ScrollArea,
  ActionIcon,
  Badge,
  UnstyledButton,
  Collapse,
  Paper
} from '@mantine/core';
import { IconSwords, IconCalendar, IconAlertCircle, IconChevronRight, IconHistory, IconChevronLeft } from '@tabler/icons-react';
import { CompactBattleCard } from '../battle/CompactBattleCard';
import { FadeIn } from '../ui/transitions';
import { useGameStore } from '../../store/gameStore';
import { BattleLoading } from '../ui/loading';
import { TypeColorSlider } from '../ui/TypeColorSlider';
import ApiService from '../../services/api';
import { useDailyChallengeStore } from '../../store/dailyChallengeStore';

interface DailyBattle {
  id: number;
  battleId: string;
  pokemon1: any;
  pokemon2: any;
  winRate: number;
  totalBattles: number;
  executionTime: number;
}

interface AvailableChallenge {
  date: string;
  dayOfWeek: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
}

const DailyMode: React.FC = () => {
  const { currentBattle, isLoading, generateNewBattle } = useGameStore();
  const { saveScore, getBestScore } = useDailyChallengeStore();
  const [dailyBattles, setDailyBattles] = useState<DailyBattle[]>([]);
  const [loadingBattles, setLoadingBattles] = useState(true);
  const [guesses, setGuesses] = useState<number[]>([50, 50, 50, 50, 50, 50]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challengeDate, setChallengeDate] = useState<string>('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [availableChallenges, setAvailableChallenges] = useState<AvailableChallenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentScore, setCurrentScore] = useState<number | null>(null);

  // Fetch today's challenge on mount
  useEffect(() => {
    fetchTodaysChallenge();
    fetchAvailableChallenges();
  }, []);

  const fetchTodaysChallenge = async () => {
    setLoadingBattles(true);
    setError(null);
    
    try {
      const response = await ApiService.getTodaysChallenge();
      const battles: DailyBattle[] = response.challenge.battles.map((battle, index) => ({
        id: index,
        battleId: battle.battleId,
        pokemon1: battle.pokemon1,
        pokemon2: battle.pokemon2,
        winRate: battle.winRate,
        totalBattles: battle.totalBattles,
        executionTime: battle.executionTime
      }));
      
      setDailyBattles(battles);
      setChallengeDate(response.challenge.date);
      setSelectedDate(response.challenge.date);
    } catch (err) {
      console.error('Failed to fetch daily challenge:', err);
      setError('Failed to load today\'s challenge. Please try again later.');
    } finally {
      setLoadingBattles(false);
    }
  };

  const fetchAvailableChallenges = async () => {
    setLoadingChallenges(true);
    try {
      const response = await ApiService.getAvailableChallenges();
      setAvailableChallenges(response.challenges);
    } catch (err) {
      console.error('Failed to fetch available challenges:', err);
    } finally {
      setLoadingChallenges(false);
    }
  };

  const fetchChallengeByDate = async (date: string) => {
    setLoadingBattles(true);
    setError(null);
    setSubmitted(false);
    setGuesses([50, 50, 50, 50, 50, 50]);
    setCurrentScore(null);
    
    try {
      const response = await ApiService.getChallengeByDate(date);
      const battles: DailyBattle[] = response.challenge.battles.map((battle, index) => ({
        id: index,
        battleId: battle.battleId,
        pokemon1: battle.pokemon1,
        pokemon2: battle.pokemon2,
        winRate: battle.winRate,
        totalBattles: battle.totalBattles,
        executionTime: battle.executionTime
      }));
      
      setDailyBattles(battles);
      setChallengeDate(response.challenge.date);
      setSelectedDate(date);
      setIsPanelOpen(false);
    } catch (err) {
      console.error('Failed to fetch challenge:', err);
      setError('Failed to load challenge. Please try again later.');
    } finally {
      setLoadingBattles(false);
    }
  };

  const handleGuessChange = (index: number, value: number) => {
    const newGuesses = [...guesses];
    newGuesses[index] = value;
    setGuesses(newGuesses);
  };

  const handleSubmit = () => {
    // Calculate score: sum of absolute difference between guess and actual win percentage
    let totalScore = 0;
    
    dailyBattles.forEach((battle, index) => {
      const actualWinPercentage = battle.winRate * 100;
      const guessPercentage = guesses[index];
      const difference = Math.abs(actualWinPercentage - guessPercentage);
      totalScore += difference;
    });
    
    // Round to 2 decimal places
    totalScore = Math.round(totalScore * 100) / 100;
    
    // Save the score
    if (challengeDate) {
      saveScore(challengeDate, totalScore, guesses);
    }
    
    setCurrentScore(totalScore);
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setGuesses([50, 50, 50, 50, 50, 50]);
    setCurrentScore(null);
    fetchTodaysChallenge();
  };

  if (loadingBattles) {
    return (
      <Center h="60vh">
        <Stack align="center" gap="md">
          <Loader size="xl" />
          <Text size="lg" c="dimmed">Loading today's challenge...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="60vh">
        <Stack align="center" gap="md">
          <Alert 
            icon={<IconAlertCircle size={16} />}
            title="Error"
            color="red"
            maw={500}
          >
            {error}
          </Alert>
          <Button onClick={fetchTodaysChallenge} variant="outline">
            Try Again
          </Button>
        </Stack>
      </Center>
    );
  }

  return (
    <Box style={{ display: 'flex', gap: '20px', position: 'relative' }}>
      {/* Expandable Panel */}
      <Paper
        withBorder
        style={{
          position: 'sticky',
          top: 20,
          height: 'fit-content',
          maxHeight: 'calc(100vh - 40px)',
          transition: 'all 0.3s ease',
          width: isPanelOpen ? '280px' : '50px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Group p="sm" justify={isPanelOpen ? "space-between" : "center"}>
          <ActionIcon
            variant="subtle"
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            size="lg"
          >
            {isPanelOpen ? <IconChevronLeft size={20} /> : <IconHistory size={20} />}
          </ActionIcon>
          
          {isPanelOpen && (
            <Text fw={600} size="sm">Past Challenges</Text>
          )}
        </Group>
        
        {isPanelOpen && (
          <ScrollArea h="100%" px="sm" pb="sm">
            <Stack gap="xs">
              {loadingChallenges ? (
                <Center py="md">
                  <Loader size="sm" />
                </Center>
              ) : (
                availableChallenges.map((challenge) => (
                  <UnstyledButton
                    key={challenge.date}
                    onClick={() => fetchChallengeByDate(challenge.date)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 
                        selectedDate === challenge.date 
                          ? 'var(--mantine-color-blue-light)' 
                          : challenge.isToday 
                            ? 'var(--mantine-color-green-light)'
                            : 'transparent',
                      border: '1px solid',
                      borderColor: 
                        selectedDate === challenge.date
                          ? 'var(--mantine-color-blue-6)'
                          : 'var(--mantine-color-gray-3)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedDate !== challenge.date && !challenge.isToday) {
                        e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedDate !== challenge.date && !challenge.isToday) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Box>
                        <Text size="sm" fw={500}>
                          {challenge.dayOfWeek}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {new Date(challenge.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </Text>
                      </Box>
                      <Stack gap={4} align="flex-end">
                        {challenge.isToday && (
                          <Badge size="xs" color="green">Today</Badge>
                        )}
                        {(() => {
                          const bestScore = getBestScore(challenge.date);
                          return bestScore ? (
                            <Text size="xs" fw={600} c="blue">
                              Best: {bestScore.score}
                            </Text>
                          ) : null;
                        })()}
                      </Stack>
                    </Group>
                  </UnstyledButton>
                ))
              )}
            </Stack>
          </ScrollArea>
        )}
      </Paper>

      {/* Main Content */}
      <Box style={{ flex: 1 }} maw={1400} mx="auto">
        <FadeIn>
          <Stack gap="xl">
            {/* Header */}
            <Stack align="center" gap="md">
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
                  <Group gap="xs">
                    <IconCalendar size={40} />
                    Daily Challenge
                  </Group>
                </Title>
                {challengeDate && (
                  <Stack gap="xs" align="center">
                    <Text size="lg" ta="center" c="dimmed">
                      {new Date(challengeDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Text>
                    {(() => {
                      const bestScore = getBestScore(challengeDate);
                      return bestScore && !submitted ? (
                        <Badge size="md" variant="light" color="blue">
                          Best Score: {bestScore.score}
                        </Badge>
                      ) : null;
                    })()}
                  </Stack>
                )}
              </Stack>

          {/* Battle Grid */}
          <Grid gutter="md">
            {dailyBattles.map((battle, index) => (
              <Grid.Col key={battle.id} span={{ base: 12, sm: 6, lg: 4 }}>
                <Card withBorder p="md">
                  <Stack gap="md">
                    <Grid gutter="sm">
                      <Grid.Col span={5}>
                        <CompactBattleCard
                          pokemon={{
                            ...battle.pokemon1,
                            wins: Math.round(battle.winRate * battle.totalBattles)
                          }}
                          showResults={submitted}
                          position="left"
                          guessPercentage={guesses[index]}
                          winPercentage={battle.winRate * 100}
                          totalBattles={battle.totalBattles}
                        />
                      </Grid.Col>
                      
                      <Grid.Col span={2}>
                        <Center h="100%" style={{ minHeight: '250px' }}>
                          <IconSwords size={24} color="var(--mantine-color-gray-6)" />
                        </Center>
                      </Grid.Col>
                      
                      <Grid.Col span={5}>
                        <CompactBattleCard
                          pokemon={{
                            ...battle.pokemon2,
                            wins: Math.round((1 - battle.winRate) * battle.totalBattles)
                          }}
                          showResults={submitted}
                          position="right"
                          guessPercentage={guesses[index]}
                          winPercentage={(1 - battle.winRate) * 100}
                          totalBattles={battle.totalBattles}
                        />
                      </Grid.Col>
                    </Grid>

                    <Box style={{ marginTop: submitted ? '25px' : '0' }}>
                      <TypeColorSlider
                        value={guesses[index]}
                        onChange={(value) => handleGuessChange(index, value)}
                        leftType={battle.pokemon1.types?.[0] || 'normal'}
                        rightType={battle.pokemon2.types?.[0] || 'normal'}
                        min={0}
                        max={100}
                        step={1}
                        disabled={submitted}
                        correctValue={submitted ? Math.round(battle.winRate * 100) : undefined}
                        showCorrectIndicator={submitted}
                      />
                    </Box>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>

          {/* Submit/Reset Button */}
          <Stack align="center" gap="md" mt="lg">
            {submitted && currentScore !== null && (
              <Card withBorder p="md">
                <Stack align="center" gap="xs">
                  <Text size="lg" fw={600}>Your Score</Text>
                  <Text size="2xl" fw={700} c="blue">
                    {currentScore}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Lower is better - {currentScore < 100 ? 'Great job!' : currentScore < 200 ? 'Good try!' : 'Keep practicing!'}
                  </Text>
                  {(() => {
                    const bestScore = getBestScore(challengeDate);
                    if (bestScore && bestScore.score < currentScore) {
                      return (
                        <Text size="sm" c="dimmed">
                          Your best: {bestScore.score}
                        </Text>
                      );
                    }
                    return null;
                  })()}
                </Stack>
              </Card>
            )}
            
            <Group justify="center">
              {!submitted ? (
                <Button 
                  size="lg" 
                  onClick={handleSubmit}
                  leftSection={<IconSwords size={20} />}
                >
                  Submit All Guesses
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={handleReset}
                >
                  Try New Daily Challenge
                </Button>
              )}
            </Group>
          </Stack>
        </Stack>
      </FadeIn>
      </Box>
    </Box>
  );
};

export default DailyMode;