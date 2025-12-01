import React from 'react';
import {
  Box,
  Card,
  Stack,
  Title,
  Text,
  Badge,
  Group,
  ThemeIcon,
  List,
  Divider,
  Alert,
  useMantineColorScheme,
  SimpleGrid,
  Paper
} from '@mantine/core';
import {
  IconSwords,
  IconInfinity,
  IconCalendar,
  IconFlask,
  IconCrown,
  IconPokeball,
  IconAlertTriangle,
  IconSparkles,
  IconTarget,
  IconBrain,
  IconTrophy
} from '@tabler/icons-react';

const AboutPage: React.FC = () => {
  const { colorScheme } = useMantineColorScheme();

  const gameModes = [
    {
      icon: IconSwords,
      title: 'Battle Mode',
      description: 'Predict which Pokemon will win in a 1v1 battle. Each battle uses Pokemon Showdown\'s battle simulator for accurate results.',
      color: 'blue'
    },
    {
      icon: IconInfinity,
      title: 'Endless Mode',
      description: 'Test your knowledge in a survival challenge. How many correct predictions can you make in a row? Compete on the global leaderboard!',
      color: 'grape'
    },
    {
      icon: IconCalendar,
      title: 'Daily Challenge',
      description: 'A new set of battles every day! Complete the daily challenge and compare your score with other trainers.',
      color: 'orange'
    },
    {
      icon: IconFlask,
      title: 'Battle Lab',
      description: 'Create custom battles with specific Pokemon, levels, and moves. Experiment and learn which Pokemon counter each other.',
      color: 'teal'
    }
  ];

  const features = [
    {
      icon: IconPokeball,
      title: 'All 1025 Pokemon',
      description: 'Every Pokemon from Gen 1 to Gen 9 is included with accurate stats, types, and movesets.'
    },
    {
      icon: IconBrain,
      title: 'AI Battle Simulation',
      description: 'Battles are simulated using Pokemon Showdown\'s battle engine for realistic results.'
    },
    {
      icon: IconCrown,
      title: 'Global Leaderboards',
      description: 'Compete with trainers worldwide and climb the Endless Mode rankings.'
    },
    {
      icon: IconTrophy,
      title: 'Pokedex Tracking',
      description: 'Track which Pokemon you\'ve correctly predicted and collect them in your personal Pokedex.'
    }
  ];

  return (
    <Box maw={900} mx="auto">
      {/* Hero Section */}
      <Stack align="center" gap="md" mb="xl">
        <Group gap="xs" align="center">
          <Title
            order={1}
            size="3rem"
            fw={700}
            style={{
              background: 'linear-gradient(135deg, var(--mantine-color-blue-6), var(--mantine-color-grape-6))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            PokeWave
          </Title>
          <Badge
            size="lg"
            variant="gradient"
            gradient={{ from: 'grape', to: 'blue', deg: 135 }}
          >
            beta
          </Badge>
        </Group>
        <Text size="xl" c="dimmed" ta="center" maw={600}>
          The ultimate Pokemon battle prediction game. Test your knowledge of Pokemon matchups
          and prove you're the best trainer!
        </Text>
      </Stack>

      {/* Beta Warning */}
      <Alert
        icon={<IconAlertTriangle size={20} />}
        title="Beta Version"
        color="yellow"
        variant="light"
        mb="xl"
        radius="md"
      >
        <Text size="sm">
          PokeWave is currently in <strong>beta</strong>. This means the game is still under active development
          and some features may change. When the game officially launches out of beta:
        </Text>
        <List size="sm" mt="xs" spacing="xs">
          <List.Item>
            <strong>Database reset:</strong> All user accounts, scores, and progress will be cleared for a fresh start
          </List.Item>
          <List.Item>
            <strong>New features:</strong> Generation-specific mechanics (e.g., Mega Evolution, Z-Moves, Dynamax, Terastallization)
          </List.Item>
          <List.Item>
            <strong>Improved battle accuracy:</strong> Enhanced AI and more nuanced battle predictions
          </List.Item>
          <List.Item>
            <strong>More game modes:</strong> Team battles, themed challenges, and tournaments
          </List.Item>
        </List>
        <Text size="sm" mt="sm" c="dimmed">
          Thank you for being an early tester! Your feedback helps make PokeWave better.
        </Text>
      </Alert>

      {/* How to Play */}
      <Card withBorder mb="xl" radius="md">
        <Stack gap="md">
          <Group gap="xs">
            <ThemeIcon size="lg" variant="light" color="blue">
              <IconTarget size={20} />
            </ThemeIcon>
            <Title order={2} size="h3">How to Play</Title>
          </Group>

          <Divider />

          <List spacing="md" size="md">
            <List.Item icon={
              <ThemeIcon color="blue" size={24} radius="xl">
                <Text size="xs" fw={700}>1</Text>
              </ThemeIcon>
            }>
              <Text fw={500}>View the Matchup</Text>
              <Text size="sm" c="dimmed">
                Two Pokemon will appear on screen. Study their types, stats, and abilities.
              </Text>
            </List.Item>

            <List.Item icon={
              <ThemeIcon color="blue" size={24} radius="xl">
                <Text size="xs" fw={700}>2</Text>
              </ThemeIcon>
            }>
              <Text fw={500}>Make Your Prediction</Text>
              <Text size="sm" c="dimmed">
                Click on the Pokemon you think will win the battle. Consider type matchups,
                base stats, and potential movesets.
              </Text>
            </List.Item>

            <List.Item icon={
              <ThemeIcon color="blue" size={24} radius="xl">
                <Text size="xs" fw={700}>3</Text>
              </ThemeIcon>
            }>
              <Text fw={500}>Watch the Battle</Text>
              <Text size="sm" c="dimmed">
                The battle is simulated using Pokemon Showdown's engine. See the turn-by-turn
                breakdown of what happened!
              </Text>
            </List.Item>

            <List.Item icon={
              <ThemeIcon color="blue" size={24} radius="xl">
                <Text size="xs" fw={700}>4</Text>
              </ThemeIcon>
            }>
              <Text fw={500}>Learn and Improve</Text>
              <Text size="sm" c="dimmed">
                Review the battle log to understand why certain Pokemon win. Use Battle Lab
                to experiment with different matchups!
              </Text>
            </List.Item>
          </List>
        </Stack>
      </Card>

      {/* Game Modes */}
      <Title order={2} size="h3" mb="md">
        <Group gap="xs">
          <IconSparkles size={24} />
          Game Modes
        </Group>
      </Title>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="xl">
        {gameModes.map((mode) => (
          <Paper
            key={mode.title}
            withBorder
            p="md"
            radius="md"
            style={{
              backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'white'
            }}
          >
            <Group gap="sm" mb="xs">
              <ThemeIcon size="lg" variant="light" color={mode.color}>
                <mode.icon size={20} />
              </ThemeIcon>
              <Text fw={600}>{mode.title}</Text>
            </Group>
            <Text size="sm" c="dimmed">
              {mode.description}
            </Text>
          </Paper>
        ))}
      </SimpleGrid>

      {/* Features */}
      <Title order={2} size="h3" mb="md">
        <Group gap="xs">
          <IconTrophy size={24} />
          Features
        </Group>
      </Title>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="xl">
        {features.map((feature) => (
          <Paper
            key={feature.title}
            withBorder
            p="md"
            radius="md"
            style={{
              backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'white'
            }}
          >
            <Group gap="sm" mb="xs">
              <ThemeIcon size="lg" variant="light" color="grape">
                <feature.icon size={20} />
              </ThemeIcon>
              <Text fw={600}>{feature.title}</Text>
            </Group>
            <Text size="sm" c="dimmed">
              {feature.description}
            </Text>
          </Paper>
        ))}
      </SimpleGrid>

      {/* Tips */}
      <Card withBorder radius="md" mb="xl">
        <Stack gap="md">
          <Group gap="xs">
            <ThemeIcon size="lg" variant="light" color="teal">
              <IconBrain size={20} />
            </ThemeIcon>
            <Title order={2} size="h3">Tips for Success</Title>
          </Group>

          <Divider />

          <List spacing="sm" size="sm">
            <List.Item>
              <strong>Type matchups matter:</strong> A super-effective STAB move can often determine the winner
            </List.Item>
            <List.Item>
              <strong>Speed is crucial:</strong> The faster Pokemon usually attacks first, which can be decisive
            </List.Item>
            <List.Item>
              <strong>Don't just look at types:</strong> A Pokemon's base stats and moveset matter too
            </List.Item>
            <List.Item>
              <strong>Learn common threats:</strong> Some Pokemon consistently outperform their stats suggest
            </List.Item>
            <List.Item>
              <strong>Use Battle Lab:</strong> Test specific matchups you're unsure about to learn
            </List.Item>
          </List>
        </Stack>
      </Card>

      {/* Footer */}
      <Text ta="center" c="dimmed" size="sm" mb="xl">
        PokeWave is a fan-made project and is not affiliated with Nintendo, Game Freak, or The Pokemon Company.
        <br />
        Pokemon and Pokemon character names are trademarks of Nintendo.
      </Text>
    </Box>
  );
};

export default AboutPage;
