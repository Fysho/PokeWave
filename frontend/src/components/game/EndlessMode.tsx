import React, { useEffect, useRef, useState } from 'react';
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
  Loader
} from '@mantine/core';
import { IconInfinity, IconHeart, IconTrophy, IconFlame } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import BattleArena from '../battle/BattleArena';
import { useGameStore } from '../../store/gameStore';
import { useEndlessStore } from '../../store/endlessStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { FadeIn } from '../ui/transitions';
import LeaderboardService from '../../services/leaderboard';

interface EndlessModeProps {}

const EndlessMode: React.FC<EndlessModeProps> = () => {
  const { battleHistory, generateNewBattle, currentBattle } = useGameStore();
  const { battleSettings } = useSettingsStore();
  const { 
    endlessLives, 
    endlessScore, 
    endlessBattleCount,
    endlessHighScore,
    isEndlessActive,
    loseLife,
    addEndlessScore,
    incrementEndlessBattleCount,
    resetEndlessMode,
    setEndlessActive,
    updateHighScore
  } = useEndlessStore();

  const lastProcessedBattleRef = useRef<number>(-1);
  const [hasStarted, setHasStarted] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
  const { isAuthenticated } = useAuthStore();

  // Set endless mode as active when component mounts
  useEffect(() => {
    setEndlessActive(true);
    
    return () => {
      setEndlessActive(false);
      setHasStarted(false);
    };
  }, []);

  // Track battle results
  useEffect(() => {
    if (!isEndlessActive) return;
    
    if (battleHistory.length > 0 && battleHistory.length > lastProcessedBattleRef.current) {
      const lastBattle = battleHistory[battleHistory.length - 1];
      
      // Only process new battles
      if (lastProcessedBattleRef.current >= 0) {
        if (!lastBattle.isCorrect) {
          loseLife();
        }
        // Score is already updated in gameStore
        
        // Start next battle if still alive
        if (endlessLives > 1 || lastBattle.isCorrect) {
          incrementEndlessBattleCount();
        }
      }
      
      lastProcessedBattleRef.current = battleHistory.length;
    }
  }, [battleHistory, isEndlessActive]);

  // Check for game over and submit score
  useEffect(() => {
    if (endlessLives === 0 && !hasSubmittedScore && isAuthenticated && endlessScore > 0) {
      submitScoreToLeaderboard();
    }
    if (endlessLives === 0) {
      updateHighScore();
    }
  }, [endlessLives, hasSubmittedScore, isAuthenticated, endlessScore]);

  const submitScoreToLeaderboard = async () => {
    if (hasSubmittedScore || !isAuthenticated || endlessScore === 0) return;
    
    setIsSubmittingScore(true);
    try {
      await LeaderboardService.submitEndlessScore(endlessScore);
      setHasSubmittedScore(true);
      notifications.show({
        title: 'Score Submitted!',
        message: `Your score of ${endlessScore} has been added to the leaderboard!`,
        color: 'green'
      });
    } catch (error) {
      console.error('Failed to submit score:', error);
      notifications.show({
        title: 'Score Submission Failed',
        message: 'Could not submit your score to the leaderboard.',
        color: 'red'
      });
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const handleStartRun = async () => {
    resetEndlessMode();
    lastProcessedBattleRef.current = battleHistory.length;
    setEndlessActive(true);
    setHasStarted(true);
    await generateNewBattle(battleSettings); // Generate new battle for fresh start
    // Don't increment battle count here - it will be incremented when the battle is completed
  };

  const handleReset = () => {
    setHasStarted(false);
    setHasSubmittedScore(false);
    resetEndlessMode();
    lastProcessedBattleRef.current = battleHistory.length;
  };

  if (endlessLives === 0) {
    return (
      <Box maw={800} mx="auto">
        <FadeIn>
          <Stack align="center" gap="xl" mt="xl">
            <Title 
              order={1}
              size="h1"
              fw={700}
              ta="center"
              style={{
                background: 'linear-gradient(135deg, var(--mantine-color-red-6), var(--mantine-color-orange-6))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Game Over!
            </Title>
            
            <Card withBorder p="xl" w="100%">
              <Stack align="center" gap="md">
                <IconTrophy size={64} color="var(--mantine-color-yellow-6)" />
                <Title order={2}>Final Score: {endlessScore}</Title>
                <Text size="lg" c="dimmed">
                  You survived {endlessBattleCount - 1} battles in Endless Mode!
                </Text>
                
                {endlessHighScore > 0 && (
                  <Group gap="xs">
                    <IconFlame size={20} color="var(--mantine-color-orange-6)" />
                    <Text size="md" fw={600}>
                      High Score: {endlessHighScore}
                    </Text>
                  </Group>
                )}
                
                {isSubmittingScore && (
                  <Group gap="xs">
                    <Loader size="sm" />
                    <Text size="sm" c="dimmed">Submitting score to leaderboard...</Text>
                  </Group>
                )}
                
                {!isAuthenticated && endlessScore > 0 && (
                  <Text size="sm" c="dimmed" fs="italic">
                    Sign in to save your score to the leaderboard!
                  </Text>
                )}
                
                <Button 
                  size="lg" 
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'grape' }}
                  onClick={handleReset}
                  mt="md"
                >
                  Play Again
                </Button>
              </Stack>
            </Card>
          </Stack>
        </FadeIn>
      </Box>
    );
  }

  // Show start screen if not started yet
  if (!hasStarted) {
    return (
      <Box maw={800} mx="auto">
        <FadeIn>
          <Stack align="center" gap="xl" mt="xl">
            <Title 
              order={1}
              size="h1"
              fw={700}
              ta="center"
              style={{
                background: 'linear-gradient(135deg, var(--mantine-color-blue-6), var(--mantine-color-purple-6))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              <Group gap="xs">
                <IconInfinity size={40} />
                Endless Mode
              </Group>
            </Title>
            
            <Card withBorder p="xl" w="100%">
              <Stack align="center" gap="lg">
                <IconInfinity size={64} color="var(--mantine-color-purple-6)" />
                <Title order={2}>Survival Challenge</Title>
                <Text size="lg" c="dimmed" ta="center">
                  Test your Pokemon prediction skills! You start with 3 lives.
                  Each wrong prediction costs you a life. How long can you survive?
                </Text>
                
                {endlessHighScore > 0 && (
                  <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-purple-0)', borderColor: 'var(--mantine-color-purple-3)' }}>
                    <Group gap="xs">
                      <IconFlame size={24} color="var(--mantine-color-purple-6)" />
                      <Text size="lg" fw={600}>Your Best Score:</Text>
                      <Badge size="lg" color="purple" variant="filled">
                        {endlessHighScore}
                      </Badge>
                    </Group>
                  </Card>
                )}
                
                <Button 
                  size="xl" 
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'purple' }}
                  onClick={handleStartRun}
                  mt="md"
                  leftSection={<IconInfinity size={24} />}
                >
                  Start New Survival Run
                </Button>
              </Stack>
            </Card>
          </Stack>
        </FadeIn>
      </Box>
    );
  }

  return (
    <Box>
      <FadeIn>
        <Grid gutter="md">
          {/* Side stats */}
          <Grid.Col span={2}>
            <Stack gap="md" pos="sticky" top={20}>
              <Card withBorder p="md">
                <Stack align="center" gap="xs">
                  <IconHeart size={32} style={{ color: 'var(--mantine-color-red-6)' }} />
                  <Text size="sm" fw={600} c="dimmed">Lives</Text>
                  <Text size="xl" fw={700}>{endlessLives}</Text>
                </Stack>
              </Card>
              
              <Card withBorder p="md">
                <Stack align="center" gap="xs">
                  <IconTrophy size={32} style={{ color: 'var(--mantine-color-yellow-6)' }} />
                  <Text size="sm" fw={600} c="dimmed">Score</Text>
                  <Text size="xl" fw={700}>{endlessScore}</Text>
                </Stack>
              </Card>
              
              {endlessHighScore > 0 && (
                <Card withBorder p="md">
                  <Stack align="center" gap="xs">
                    <IconFlame size={32} style={{ color: 'var(--mantine-color-purple-6)' }} />
                    <Text size="sm" fw={600} c="dimmed">Best</Text>
                    <Text size="xl" fw={700}>{endlessHighScore}</Text>
                  </Stack>
                </Card>
              )}
            </Stack>
          </Grid.Col>

          {/* Main content */}
          <Grid.Col span={10}>
            {/* Battle Arena */}
            <BattleArena hideStats={true} />
          </Grid.Col>
        </Grid>
      </FadeIn>
    </Box>
  );
};

export default EndlessMode;