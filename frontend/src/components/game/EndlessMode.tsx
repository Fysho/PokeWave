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
  Button
} from '@mantine/core';
import { IconInfinity, IconHeart, IconTrophy, IconFlame } from '@tabler/icons-react';
import BattleArena from '../battle/BattleArena';
import { useGameStore } from '../../store/gameStore';
import { useEndlessStore } from '../../store/endlessStore';
import { useSettingsStore } from '../../store/settingsStore';
import { FadeIn } from '../ui/transitions';

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

  // Check for game over
  useEffect(() => {
    if (endlessLives === 0) {
      updateHighScore();
    }
  }, [endlessLives]);

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
        {/* Header with Endless Mode title and stats */}
        <Stack align="center" gap="md" mb="xl">
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
          
          {/* Lives and Score Display */}
          <Group gap="xl">
            <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-red-0)', borderColor: 'var(--mantine-color-red-3)' }}>
              <Group gap="xs">
                <IconHeart size={24} color="var(--mantine-color-red-6)" />
                <Text size="lg" fw={600}>Lives:</Text>
                <Badge size="lg" color="red" variant="filled">
                  {endlessLives}
                </Badge>
              </Group>
            </Card>
            
            <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-yellow-0)', borderColor: 'var(--mantine-color-yellow-3)' }}>
              <Group gap="xs">
                <IconTrophy size={24} color="var(--mantine-color-yellow-6)" />
                <Text size="lg" fw={600}>Score:</Text>
                <Badge size="lg" color="yellow" variant="filled">
                  {endlessScore}
                </Badge>
              </Group>
            </Card>
            
            <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-blue-0)', borderColor: 'var(--mantine-color-blue-3)' }}>
              <Group gap="xs">
                <Text size="lg" fw={600}>Battle #</Text>
                <Badge size="lg" color="blue" variant="filled">
                  {endlessBattleCount}
                </Badge>
              </Group>
            </Card>
            
            {endlessHighScore > 0 && (
              <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-purple-0)', borderColor: 'var(--mantine-color-purple-3)' }}>
                <Group gap="xs">
                  <IconFlame size={24} color="var(--mantine-color-purple-6)" />
                  <Text size="lg" fw={600}>Best:</Text>
                  <Badge size="lg" color="purple" variant="filled">
                    {endlessHighScore}
                  </Badge>
                </Group>
              </Card>
            )}
          </Group>
          
          <Text size="md" c="dimmed" ta="center">
            Predict correctly to continue! Wrong predictions cost you a life.
          </Text>
        </Stack>

        {/* Battle Arena */}
        <BattleArena />
      </FadeIn>
    </Box>
  );
};

export default EndlessMode;