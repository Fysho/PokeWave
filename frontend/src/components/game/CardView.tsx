import React, { useState } from 'react';
import {
  Box,
  Title,
  Text,
  Stack,
  Grid,
  Button,
  Group,
  Card,
  Badge,
  Center,
  Loader,
  Divider,
  useMantineColorScheme
} from '@mantine/core';
import { IconRefresh, IconCards } from '@tabler/icons-react';
import { FadeIn } from '../ui/transitions';
import { FullCard, CompactCard, MiniCard, MovesOnlyCard, HoverDetailCard } from '../pokemon-cards';
import ApiService from '../../services/api';

/**
 * CardView - Visual tests tab for Pokemon card components
 *
 * Displays all card variants with randomly generated Pokemon pairs.
 * Use this to ensure consistent card usage across features.
 */

const CardView: React.FC = () => {
  const { colorScheme } = useMantineColorScheme();
  const [pokemon1, setPokemon1] = useState<any>(null);
  const [pokemon2, setPokemon2] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRandomPokemon = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ApiService.getRandomPokemonInstances({
        generation: 9,
        levelMode: 'fixed',
        level: 50,
        itemMode: 'random'
      });

      setPokemon1(response.pokemon1);
      setPokemon2(response.pokemon2);
    } catch (err) {
      console.error('Failed to fetch random Pokemon:', err);
      setError('Failed to load Pokemon. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box maw={1400} mx="auto">
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
                <IconCards size={40} />
                Card View
              </Group>
            </Title>
            <Text size="lg" c="dimmed" ta="center" maw={600}>
              Visual testing for all Pokemon card components. Use these card types
              consistently across features instead of creating new variants.
            </Text>
          </Stack>

          {/* Random Pokemon Button */}
          <Center>
            <Button
              size="lg"
              leftSection={isLoading ? <Loader size={20} color="white" /> : <IconRefresh size={20} />}
              onClick={fetchRandomPokemon}
              disabled={isLoading}
              variant="gradient"
              gradient={{ from: 'blue', to: 'grape' }}
            >
              {isLoading ? 'Loading...' : pokemon1 ? 'Get New Pokemon' : 'Get Random Pokemon'}
            </Button>
          </Center>

          {error && (
            <Center>
              <Badge color="red" size="lg">{error}</Badge>
            </Center>
          )}

          {/* Card Showcase */}
          {pokemon1 && pokemon2 && (
            <Stack gap="xl">
              {/* FullCard Section */}
              <Card withBorder p="lg">
                <Stack gap="md">
                  <Group justify="space-between" align="center">
                    <Box>
                      <Title order={3}>FullCard</Title>
                      <Text size="sm" c="dimmed">
                        Complete Pokemon display with all details
                      </Text>
                    </Box>
                    <Badge color="blue" size="lg">Battle Mode / Endless Mode</Badge>
                  </Group>
                  <Divider />
                  <Grid gutter="md">
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <FullCard
                        pokemon={pokemon1}
                        showResults={false}
                        position="left"
                        guessPercentage={60}
                        animate={false}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <FullCard
                        pokemon={pokemon2}
                        showResults={false}
                        position="right"
                        guessPercentage={40}
                        animate={false}
                      />
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Card>

              {/* CompactCard Section */}
              <Card withBorder p="lg">
                <Stack gap="md">
                  <Group justify="space-between" align="center">
                    <Box>
                      <Title order={3}>CompactCard</Title>
                      <Text size="sm" c="dimmed">
                        Condensed display for grid layouts (hover for full details)
                      </Text>
                    </Box>
                    <Badge color="green" size="lg">Daily Mode</Badge>
                  </Group>
                  <Divider />
                  <Grid gutter="md">
                    <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                      <CompactCard
                        pokemon={pokemon1}
                        showResults={false}
                        position="left"
                        guessPercentage={50}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                      <CompactCard
                        pokemon={pokemon2}
                        showResults={false}
                        position="right"
                        guessPercentage={50}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                      <CompactCard
                        pokemon={pokemon1}
                        showResults={true}
                        position="left"
                        winPercentage={65}
                      />
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Card>

              {/* MiniCard Section */}
              <Card withBorder p="lg">
                <Stack gap="md">
                  <Group justify="space-between" align="center">
                    <Box>
                      <Title order={3}>MiniCard</Title>
                      <Text size="sm" c="dimmed">
                        Minimal display for lists and compact views (hover for full details)
                      </Text>
                    </Box>
                    <Badge color="violet" size="lg">Lists / Search Results</Badge>
                  </Group>
                  <Divider />
                  <Group gap="md" wrap="wrap">
                    <MiniCard pokemon={pokemon1} />
                    <MiniCard pokemon={pokemon2} />
                    <MiniCard pokemon={pokemon1} showLevel={false} />
                    <MiniCard pokemon={pokemon2} showTypes={false} />
                    <MiniCard pokemon={pokemon1} spriteSize={64} />
                    <MiniCard pokemon={pokemon2} enableHoverDetail={false} />
                  </Group>
                </Stack>
              </Card>

              {/* MovesOnlyCard Section */}
              <Card withBorder p="lg">
                <Stack gap="md">
                  <Group justify="space-between" align="center">
                    <Box>
                      <Title order={3}>MovesOnlyCard</Title>
                      <Text size="sm" c="dimmed">
                        Focus on move information with detailed tooltips
                      </Text>
                    </Box>
                    <Badge color="orange" size="lg">Move Analysis</Badge>
                  </Group>
                  <Divider />
                  <Grid gutter="md">
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <MovesOnlyCard pokemon={pokemon1} />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <MovesOnlyCard pokemon={pokemon2} />
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Card>

              {/* HoverDetailCard Section */}
              <Card withBorder p="lg">
                <Stack gap="md">
                  <Group justify="space-between" align="center">
                    <Box>
                      <Title order={3}>HoverDetailCard</Title>
                      <Text size="sm" c="dimmed">
                        Detailed info shown on hover (used in MiniCard tooltips)
                      </Text>
                    </Box>
                    <Badge color="teal" size="lg">Tooltips / Popups</Badge>
                  </Group>
                  <Divider />
                  <Grid gutter="md">
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <HoverDetailCard pokemon={pokemon1} />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <HoverDetailCard pokemon={pokemon2} />
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Card>

              {/* Usage Guide */}
              <Card withBorder p="lg" bg={colorScheme === 'dark' ? 'dark.6' : 'gray.0'}>
                <Stack gap="md">
                  <Title order={3}>Usage Guide</Title>
                  <Divider />
                  <Grid gutter="md">
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Stack gap="xs">
                        <Text fw={600}>When to use each card:</Text>
                        <Text size="sm">
                          <strong>FullCard:</strong> Main battle views where users need all Pokemon information
                        </Text>
                        <Text size="sm">
                          <strong>CompactCard:</strong> Grid layouts like Daily Mode where space is limited but hover details are available
                        </Text>
                        <Text size="sm">
                          <strong>MiniCard:</strong> Lists, search results, or any compact display where hover provides full info
                        </Text>
                        <Text size="sm">
                          <strong>MovesOnlyCard:</strong> When analyzing or comparing move sets
                        </Text>
                        <Text size="sm">
                          <strong>HoverDetailCard:</strong> Used automatically by MiniCard; can also be used for custom tooltips
                        </Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Stack gap="xs">
                        <Text fw={600}>Import from:</Text>
                        <Card withBorder p="sm" bg={colorScheme === 'dark' ? 'dark.7' : 'white'}>
                          <Text size="sm" ff="monospace">
                            {`import { FullCard, CompactCard, MiniCard, MovesOnlyCard, HoverDetailCard } from '../pokemon-cards';`}
                          </Text>
                        </Card>
                        <Text size="sm" c="dimmed" mt="xs">
                          Always prefer using these existing card components instead of creating new variants.
                          If a new card type is needed, add it to this library and document it here.
                        </Text>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Card>
            </Stack>
          )}

          {/* Empty State */}
          {!pokemon1 && !pokemon2 && !isLoading && (
            <Card withBorder p="xl">
              <Center>
                <Stack align="center" gap="md">
                  <IconCards size={64} color="var(--mantine-color-gray-5)" />
                  <Title order={3} c="dimmed">No Pokemon Loaded</Title>
                  <Text c="dimmed" ta="center">
                    Click the button above to load random Pokemon and see all card variants.
                  </Text>
                </Stack>
              </Center>
            </Card>
          )}
        </Stack>
      </FadeIn>
    </Box>
  );
};

export default CardView;
