import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Title,
  Text,
  Stack,
  Grid,
  Card,
  Select,
  Group,
  Badge,
  Button,
  Loader,
  Center,
  ScrollArea,
  Image,
  NumberInput,
  Switch,
  Progress,
  RingProgress,
  useMantineColorScheme,
  Tooltip,
  ActionIcon,
  Combobox,
  InputBase,
  useCombobox
} from '@mantine/core';
import { IconSearch, IconRefresh, IconPlayerPlay, IconX } from '@tabler/icons-react';
import { getTypeColor } from '../../utils/typeColors';
import ApiService from '../../services/api';
import type { PokemonInstanceData } from '../../types/api';

interface PokemonData {
  id: number;
  name: string;
  types: string[];
  sprite: string;
}

interface SimulationResult {
  pokemon1Wins: number;
  pokemon2Wins: number;
  draws: number;
  winRate: number;
  totalBattles: number;
  executionTime: number;
}

const BattleLab: React.FC = () => {
  const { colorScheme } = useMantineColorScheme();

  // Pokemon selection state
  const [allPokemon, setAllPokemon] = useState<PokemonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pokemon1, setPokemon1] = useState<PokemonInstanceData | null>(null);
  const [pokemon2, setPokemon2] = useState<PokemonInstanceData | null>(null);
  const [pokemon1Search, setPokemon1Search] = useState('');
  const [pokemon2Search, setPokemon2Search] = useState('');

  // Battle settings
  const [generation, setGeneration] = useState<string>('9');
  const [level, setLevel] = useState<number>(50);
  const [withItems, setWithItems] = useState(true);
  const [battleCount, setBattleCount] = useState<number>(100);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  // Generation ranges
  const generations = [
    { value: '1', label: 'Generation 1 (Kanto)' },
    { value: '2', label: 'Generation 2 (Johto)' },
    { value: '3', label: 'Generation 3 (Hoenn)' },
    { value: '4', label: 'Generation 4 (Sinnoh)' },
    { value: '5', label: 'Generation 5 (Unova)' },
    { value: '6', label: 'Generation 6 (Kalos)' },
    { value: '7', label: 'Generation 7 (Alola)' },
    { value: '8', label: 'Generation 8 (Galar)' },
    { value: '9', label: 'Generation 9 (Paldea)' }
  ];

  const getGenerationMaxId = (gen: string): number => {
    switch (gen) {
      case '1': return 151;
      case '2': return 251;
      case '3': return 386;
      case '4': return 493;
      case '5': return 649;
      case '6': return 721;
      case '7': return 809;
      case '8': return 905;
      case '9': return 1025;
      default: return 151;
    }
  };

  // Load Pokemon data on mount
  useEffect(() => {
    loadPokemonData();
  }, []);

  const loadPokemonData = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getPokedexData();
      setAllPokemon(data);
    } catch (error) {
      console.error('Error loading Pokemon:', error);
      setAllPokemon([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter Pokemon based on generation and search
  const filteredPokemon1 = useMemo(() => {
    const maxId = getGenerationMaxId(generation);
    let filtered = allPokemon.filter(p => p.id <= maxId);

    if (pokemon1Search) {
      const searchLower = pokemon1Search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.id.toString().includes(searchLower)
      );
    }

    return filtered.slice(0, 50); // Limit results for performance
  }, [allPokemon, generation, pokemon1Search]);

  const filteredPokemon2 = useMemo(() => {
    const maxId = getGenerationMaxId(generation);
    let filtered = allPokemon.filter(p => p.id <= maxId);

    if (pokemon2Search) {
      const searchLower = pokemon2Search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.id.toString().includes(searchLower)
      );
    }

    return filtered.slice(0, 50);
  }, [allPokemon, generation, pokemon2Search]);

  // Load a specific Pokemon with full instance data
  const loadPokemonInstance = async (pokemonId: number, slot: 1 | 2) => {
    try {
      // Fetch Pokemon instance from the backend
      const response = await ApiService.getRandomPokemonWithInstances({
        generation: parseInt(generation),
        levelMode: 'fixed',
        level: level,
        itemMode: withItems ? 'random' : 'none'
      });

      // We got two Pokemon, but we only want one specific one
      // For now, we'll make a workaround by fetching and using the data
      // In a real implementation, you'd want an endpoint to fetch a specific Pokemon

      // Use the Pokemon data from allPokemon and construct instance
      const pokemonData = allPokemon.find(p => p.id === pokemonId);
      if (!pokemonData) return;

      // Create a mock instance with the data we have
      // The actual battle will be simulated with the correct Pokemon
      const instance: PokemonInstanceData = {
        id: pokemonId,
        name: pokemonData.name,
        species: pokemonData.name,
        level: level,
        types: pokemonData.types,
        ability: 'Unknown', // Will be determined by backend during simulation
        moves: ['???', '???', '???', '???'], // Will be determined by backend
        stats: {
          hp: 100,
          attack: 100,
          defense: 100,
          specialAttack: 100,
          specialDefense: 100,
          speed: 100
        },
        baseStats: {
          hp: 100,
          attack: 100,
          defense: 100,
          specialAttack: 100,
          specialDefense: 100,
          speed: 100
        },
        evs: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
        ivs: { hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 31 },
        nature: 'Hardy',
        sprites: {
          front: pokemonData.sprite || `/sprites/pokemon/${pokemonId}.png`,
          back: `/sprites/pokemon/back/${pokemonId}.png`,
          shiny: `/sprites/pokemon/shiny/${pokemonId}.png`
        }
      };

      if (slot === 1) {
        setPokemon1(instance);
        setPokemon1Search(pokemonData.name);
      } else {
        setPokemon2(instance);
        setPokemon2Search(pokemonData.name);
      }
    } catch (error) {
      console.error('Error loading Pokemon instance:', error);
    }
  };

  // Run the battle simulation
  const runSimulation = async () => {
    if (!pokemon1 || !pokemon2) {
      setSimulationError('Please select both Pokemon before running the simulation.');
      return;
    }

    setIsSimulating(true);
    setSimulationError(null);
    setSimulationResult(null);

    try {
      const response = await fetch('/api/battle/simulate-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: battleCount,
          pokemon1: {
            id: pokemon1.id,
            name: pokemon1.name,
            species: pokemon1.name,
            level: level,
            types: pokemon1.types
          },
          pokemon2: {
            id: pokemon2.id,
            name: pokemon2.name,
            species: pokemon2.name,
            level: level,
            types: pokemon2.types
          },
          generation: parseInt(generation)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to simulate battles');
      }

      const result = await response.json();
      setSimulationResult({
        pokemon1Wins: result.pokemon1Wins,
        pokemon2Wins: result.pokemon2Wins,
        draws: result.draws,
        winRate: result.winRate,
        totalBattles: result.battleCount,
        executionTime: result.executionTime
      });
    } catch (error) {
      console.error('Simulation error:', error);
      setSimulationError(error instanceof Error ? error.message : 'An error occurred during simulation');
    } finally {
      setIsSimulating(false);
    }
  };

  // Reset everything
  const resetLab = () => {
    setPokemon1(null);
    setPokemon2(null);
    setPokemon1Search('');
    setPokemon2Search('');
    setSimulationResult(null);
    setSimulationError(null);
  };

  // Pokemon Combobox Selector Component
  const PokemonComboboxSelector = ({
    slot,
    selectedPokemon,
    searchValue,
    onSearchChange,
    filteredList,
    onSelect,
    onClear
  }: {
    slot: 1 | 2;
    selectedPokemon: PokemonInstanceData | null;
    searchValue: string;
    onSearchChange: (value: string) => void;
    filteredList: PokemonData[];
    onSelect: (id: number) => void;
    onClear: () => void;
  }) => {
    const combobox = useCombobox({
      onDropdownClose: () => combobox.resetSelectedOption(),
    });

    const options = filteredList.map((p) => (
      <Combobox.Option value={p.id.toString()} key={p.id}>
        <Group gap="sm">
          <Image
            src={p.sprite || `/sprites/pokemon/${p.id}.png`}
            alt={p.name}
            w={40}
            h={40}
            fit="contain"
            style={{ imageRendering: 'pixelated' }}
          />
          <Box>
            <Text size="sm" fw={500} tt="capitalize">{p.name}</Text>
            <Text size="xs" c="dimmed">#{p.id}</Text>
          </Box>
          <Group gap={4} ml="auto">
            {p.types.map((type) => (
              <Badge
                key={type}
                size="xs"
                style={{ backgroundColor: getTypeColor(type) }}
              >
                {type}
              </Badge>
            ))}
          </Group>
        </Group>
      </Combobox.Option>
    ));

    return (
      <Card withBorder p="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={600} size="lg">Pokemon {slot}</Text>
            {selectedPokemon && (
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={onClear}
              >
                <IconX size={16} />
              </ActionIcon>
            )}
          </Group>

          {selectedPokemon ? (
            <Box ta="center">
              <Image
                src={selectedPokemon.sprites.front}
                alt={selectedPokemon.name}
                w={120}
                h={120}
                fit="contain"
                mx="auto"
                style={{ imageRendering: 'pixelated' }}
              />
              <Text fw={600} size="lg" tt="capitalize" mt="xs">
                {selectedPokemon.name}
              </Text>
              <Text size="sm" c="dimmed">#{selectedPokemon.id}</Text>
              <Group justify="center" gap="xs" mt="xs">
                {selectedPokemon.types.map((type: string) => (
                  <Badge
                    key={type}
                    style={{ backgroundColor: getTypeColor(type) }}
                    tt="capitalize"
                  >
                    {type}
                  </Badge>
                ))}
              </Group>
              <Text size="sm" c="dimmed" mt="xs">Level {level}</Text>
            </Box>
          ) : (
            <Combobox
              store={combobox}
              onOptionSubmit={(val) => {
                onSelect(parseInt(val));
                combobox.closeDropdown();
              }}
            >
              <Combobox.Target>
                <InputBase
                  leftSection={<IconSearch size={16} />}
                  rightSection={<Combobox.Chevron />}
                  rightSectionPointerEvents="none"
                  placeholder="Search Pokemon..."
                  value={searchValue}
                  onChange={(event) => {
                    onSearchChange(event.currentTarget.value);
                    combobox.openDropdown();
                    combobox.updateSelectedOptionIndex();
                  }}
                  onClick={() => combobox.openDropdown()}
                  onFocus={() => combobox.openDropdown()}
                  onBlur={() => combobox.closeDropdown()}
                />
              </Combobox.Target>

              <Combobox.Dropdown>
                <Combobox.Options>
                  <ScrollArea.Autosize mah={300} type="scroll">
                    {loading ? (
                      <Center p="xl">
                        <Loader size="sm" />
                      </Center>
                    ) : options.length === 0 ? (
                      <Combobox.Empty>No Pokemon found</Combobox.Empty>
                    ) : (
                      options
                    )}
                  </ScrollArea.Autosize>
                </Combobox.Options>
              </Combobox.Dropdown>
            </Combobox>
          )}
        </Stack>
      </Card>
    );
  };

  return (
    <Box maw={1400} mx="auto">
      {/* Header */}
      <Stack align="center" gap="md" mb="xl">
        <Title
          order={1}
          size="h1"
          fw={700}
          ta="center"
          style={{
            background: 'linear-gradient(135deg, var(--mantine-color-violet-6), var(--mantine-color-cyan-6))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Battle Lab
        </Title>
        <Text size="xl" c="dimmed" ta="center">
          Select any two Pokemon and simulate battles to see the results
        </Text>
      </Stack>

      <Grid gutter="lg">
        {/* Left Column - Pokemon Selection */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          {/* Pokemon Selection - Side by Side */}
          <Box pos="relative">
            <Grid gutter={{ base: 'md', md: 'xl' }} align="flex-start" justify="center">
              {/* Pokemon 1 Selector */}
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <PokemonComboboxSelector
                  slot={1}
                  selectedPokemon={pokemon1}
                  searchValue={pokemon1Search}
                  onSearchChange={setPokemon1Search}
                  filteredList={filteredPokemon1}
                  onSelect={(id) => loadPokemonInstance(id, 1)}
                  onClear={() => {
                    setPokemon1(null);
                    setPokemon1Search('');
                  }}
                />
              </Grid.Col>

              {/* VS Badge - Positioned absolutely on larger screens */}
              <Box
                pos="absolute"
                top="50%"
                left="50%"
                style={{
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10
                }}
                visibleFrom="sm"
              >
                <Box
                  w={64}
                  h={64}
                  style={{
                    background: 'linear-gradient(135deg, var(--mantine-color-violet-6), var(--mantine-color-cyan-6))',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--mantine-shadow-xl)',
                    border: '3px solid white'
                  }}
                >
                  <Text size="lg" fw={700} c="white">VS</Text>
                </Box>
              </Box>

              {/* Pokemon 2 Selector */}
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <PokemonComboboxSelector
                  slot={2}
                  selectedPokemon={pokemon2}
                  searchValue={pokemon2Search}
                  onSearchChange={setPokemon2Search}
                  filteredList={filteredPokemon2}
                  onSelect={(id) => loadPokemonInstance(id, 2)}
                  onClear={() => {
                    setPokemon2(null);
                    setPokemon2Search('');
                  }}
                />
              </Grid.Col>
            </Grid>

            {/* VS Badge for Mobile - shown below cards */}
            <Center mt="md" hiddenFrom="sm">
              <Badge size="xl" variant="filled" color="gray" radius="xl">VS</Badge>
            </Center>
          </Box>

          {/* Results Section */}
          {(simulationResult || isSimulating || simulationError) && (
            <Card withBorder mt="lg" p="lg">
              <Title order={4} mb="md">Simulation Results</Title>

              {isSimulating && (
                <Center py="xl">
                  <Stack align="center" gap="md">
                    <Loader size="lg" />
                    <Text c="dimmed">Simulating {battleCount} battles...</Text>
                  </Stack>
                </Center>
              )}

              {simulationError && (
                <Center py="xl">
                  <Stack align="center" gap="md">
                    <Text c="red" fw={500}>{simulationError}</Text>
                    <Button variant="light" onClick={runSimulation}>
                      Try Again
                    </Button>
                  </Stack>
                </Center>
              )}

              {simulationResult && !isSimulating && (
                <Stack gap="lg">
                  {/* Win Rate Ring */}
                  <Center>
                    <Group gap="xl">
                      <Stack align="center" gap="xs">
                        <RingProgress
                          size={140}
                          thickness={14}
                          roundCaps
                          sections={[
                            { value: simulationResult.winRate, color: 'blue' },
                            { value: (simulationResult.pokemon2Wins / simulationResult.totalBattles) * 100, color: 'red' },
                            { value: (simulationResult.draws / simulationResult.totalBattles) * 100, color: 'gray' }
                          ]}
                          label={
                            <Center>
                              <Stack gap={0} align="center">
                                <Text size="xl" fw={700}>{simulationResult.winRate.toFixed(1)}%</Text>
                                <Text size="xs" c="dimmed">{pokemon1?.name}</Text>
                              </Stack>
                            </Center>
                          }
                        />
                      </Stack>
                    </Group>
                  </Center>

                  {/* Detailed Stats */}
                  <Grid gutter="md">
                    <Grid.Col span={4}>
                      <Card withBorder p="md" ta="center">
                        <Text size="sm" c="dimmed">Pokemon 1 Wins</Text>
                        <Text size="xl" fw={700} c="blue">{simulationResult.pokemon1Wins}</Text>
                        <Text size="xs" c="dimmed" tt="capitalize">{pokemon1?.name}</Text>
                      </Card>
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Card withBorder p="md" ta="center">
                        <Text size="sm" c="dimmed">Draws</Text>
                        <Text size="xl" fw={700} c="gray">{simulationResult.draws}</Text>
                        <Text size="xs" c="dimmed">Ties</Text>
                      </Card>
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Card withBorder p="md" ta="center">
                        <Text size="sm" c="dimmed">Pokemon 2 Wins</Text>
                        <Text size="xl" fw={700} c="red">{simulationResult.pokemon2Wins}</Text>
                        <Text size="xs" c="dimmed" tt="capitalize">{pokemon2?.name}</Text>
                      </Card>
                    </Grid.Col>
                  </Grid>

                  {/* Progress Bar */}
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" c="blue" tt="capitalize">{pokemon1?.name}</Text>
                      <Text size="sm" c="red" tt="capitalize">{pokemon2?.name}</Text>
                    </Group>
                    <Progress.Root size="xl" radius="xl">
                      <Tooltip label={`${pokemon1?.name}: ${simulationResult.pokemon1Wins} wins`}>
                        <Progress.Section value={simulationResult.winRate} color="blue" />
                      </Tooltip>
                      <Tooltip label={`Draws: ${simulationResult.draws}`}>
                        <Progress.Section value={(simulationResult.draws / simulationResult.totalBattles) * 100} color="gray" />
                      </Tooltip>
                      <Tooltip label={`${pokemon2?.name}: ${simulationResult.pokemon2Wins} wins`}>
                        <Progress.Section value={(simulationResult.pokemon2Wins / simulationResult.totalBattles) * 100} color="red" />
                      </Tooltip>
                    </Progress.Root>
                  </Box>

                  {/* Execution Info */}
                  <Text size="xs" c="dimmed" ta="center">
                    {simulationResult.totalBattles} battles simulated in {simulationResult.executionTime}ms
                  </Text>
                </Stack>
              )}
            </Card>
          )}
        </Grid.Col>

        {/* Right Column - Settings */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            {/* Battle Settings Card */}
            <Card withBorder p="md">
              <Title order={4} mb="md">Battle Settings</Title>

              <Stack gap="md">
                <Select
                  label="Generation"
                  description="Pokemon and battle mechanics"
                  value={generation}
                  onChange={(value) => {
                    setGeneration(value || '9');
                    // Reset Pokemon selection when generation changes
                    setPokemon1(null);
                    setPokemon2(null);
                    setPokemon1Search('');
                    setPokemon2Search('');
                  }}
                  data={generations}
                />

                <NumberInput
                  label="Pokemon Level"
                  description="Both Pokemon will be this level"
                  value={level}
                  onChange={(value) => setLevel(typeof value === 'number' ? value : 50)}
                  min={1}
                  max={100}
                  step={1}
                />

                <NumberInput
                  label="Battle Count"
                  description="Number of battles to simulate"
                  value={battleCount}
                  onChange={(value) => setBattleCount(typeof value === 'number' ? value : 100)}
                  min={1}
                  max={1000}
                  step={10}
                />

                <Switch
                  label="Use Held Items"
                  description={withItems ? 'Pokemon will hold random items' : 'No held items'}
                  checked={withItems}
                  onChange={(e) => setWithItems(e.currentTarget.checked)}
                  color="teal"
                />
              </Stack>
            </Card>

            {/* Action Buttons */}
            <Stack gap="sm">
              <Button
                size="lg"
                fullWidth
                leftSection={<IconPlayerPlay size={20} />}
                onClick={runSimulation}
                loading={isSimulating}
                disabled={!pokemon1 || !pokemon2}
              >
                Run Simulation
              </Button>

              <Button
                variant="light"
                fullWidth
                leftSection={<IconRefresh size={18} />}
                onClick={resetLab}
                disabled={isSimulating}
              >
                Reset
              </Button>
            </Stack>

            {/* Info Card */}
            <Card withBorder p="md" bg={colorScheme === 'dark' ? 'dark.6' : 'gray.0'}>
              <Text size="sm" c="dimmed">
                The Battle Lab uses Pokemon Showdown's battle engine to simulate battles.
                Each battle is a full simulation with random moves, abilities, and items
                (if enabled). Results may vary between simulations due to randomness.
              </Text>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Box>
  );
};

export default BattleLab;