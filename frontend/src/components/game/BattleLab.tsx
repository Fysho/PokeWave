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
  useMantineTheme,
  Tooltip,
  ActionIcon,
  Combobox,
  InputBase,
  useCombobox,
  Divider,
  Accordion
} from '@mantine/core';
import { IconSearch, IconRefresh, IconPlayerPlay, IconX, IconSwords } from '@tabler/icons-react';
import { getTypeColor } from '../../utils/typeColors';
import ApiService from '../../services/api';
import type { PokemonInstanceData } from '../../types/api';
import BattleTurnDisplay from '../battle/BattleTurnDisplay';
import type { BattleTurn } from '../battle/BattleTurnDisplay';

interface PokemonData {
  id: number;
  name: string;
  types: string[];
  sprite: string;
}

interface ItemData {
  id: string;
  name: string;
  sprite: string;
}

// Battle-holdable items (common competitive items)
const BATTLE_ITEMS: ItemData[] = [
  { id: 'leftovers', name: 'Leftovers', sprite: '/sprites/items/leftovers.png' },
  { id: 'choice-band', name: 'Choice Band', sprite: '/sprites/items/choice-band.png' },
  { id: 'choice-scarf', name: 'Choice Scarf', sprite: '/sprites/items/choice-scarf.png' },
  { id: 'choice-specs', name: 'Choice Specs', sprite: '/sprites/items/choice-specs.png' },
  { id: 'life-orb', name: 'Life Orb', sprite: '/sprites/items/life-orb.png' },
  { id: 'focus-sash', name: 'Focus Sash', sprite: '/sprites/items/focus-sash.png' },
  { id: 'assault-vest', name: 'Assault Vest', sprite: '/sprites/items/assault-vest.png' },
  { id: 'eviolite', name: 'Eviolite', sprite: '/sprites/items/eviolite.png' },
  { id: 'black-sludge', name: 'Black Sludge', sprite: '/sprites/items/black-sludge.png' },
  { id: 'rocky-helmet', name: 'Rocky Helmet', sprite: '/sprites/items/rocky-helmet.png' },
  { id: 'light-clay', name: 'Light Clay', sprite: '/sprites/items/light-clay.png' },
  { id: 'sitrus-berry', name: 'Sitrus Berry', sprite: '/sprites/items/sitrus-berry.png' },
  { id: 'lum-berry', name: 'Lum Berry', sprite: '/sprites/items/lum-berry.png' },
  { id: 'aguav-berry', name: 'Aguav Berry', sprite: '/sprites/items/aguav-berry.png' },
  { id: 'figy-berry', name: 'Figy Berry', sprite: '/sprites/items/figy-berry.png' },
  { id: 'expert-belt', name: 'Expert Belt', sprite: '/sprites/items/expert-belt.png' },
  { id: 'muscle-band', name: 'Muscle Band', sprite: '/sprites/items/muscle-band.png' },
  { id: 'wise-glasses', name: 'Wise Glasses', sprite: '/sprites/items/wise-glasses.png' },
  { id: 'scope-lens', name: 'Scope Lens', sprite: '/sprites/items/scope-lens.png' },
  { id: 'shell-bell', name: 'Shell Bell', sprite: '/sprites/items/shell-bell.png' },
  { id: 'heavy-duty-boots', name: 'Heavy-Duty Boots', sprite: '/sprites/items/heavy-duty-boots.png' },
  { id: 'weakness-policy', name: 'Weakness Policy', sprite: '/sprites/items/weakness-policy.png' },
  { id: 'toxic-orb', name: 'Toxic Orb', sprite: '/sprites/items/toxic-orb.png' },
  { id: 'flame-orb', name: 'Flame Orb', sprite: '/sprites/items/flame-orb.png' },
  { id: 'air-balloon', name: 'Air Balloon', sprite: '/sprites/items/air-balloon.png' },
  { id: 'bright-powder', name: 'Bright Powder', sprite: '/sprites/items/bright-powder.png' },
  { id: 'mental-herb', name: 'Mental Herb', sprite: '/sprites/items/mental-herb.png' },
  { id: 'power-herb', name: 'Power Herb', sprite: '/sprites/items/power-herb.png' },
  { id: 'white-herb', name: 'White Herb', sprite: '/sprites/items/white-herb.png' },
  { id: 'kings-rock', name: "King's Rock", sprite: '/sprites/items/kings-rock.png' },
  { id: 'quick-claw', name: 'Quick Claw', sprite: '/sprites/items/quick-claw.png' },
  { id: 'metronome', name: 'Metronome', sprite: '/sprites/items/metronome.png' },
  { id: 'zoom-lens', name: 'Zoom Lens', sprite: '/sprites/items/zoom-lens.png' },
];

interface SampleBattle {
  winner: string;
  turns: BattleTurn[];
  totalTurns: number;
  finalHP1: number;
  finalHP2: number;
  executionTime: number;
  pokemon1: { name: string; level: number };
  pokemon2: { name: string; level: number };
}

interface SimulationResult {
  pokemon1Wins: number;
  pokemon2Wins: number;
  draws: number;
  winRate: number;
  totalBattles: number;
  executionTime: number;
  sampleBattle?: SampleBattle;
  pokemon1Instance?: PokemonInstanceData;
  pokemon2Instance?: PokemonInstanceData;
}

const BattleLab: React.FC = () => {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  // Pokemon selection state
  const [allPokemon, setAllPokemon] = useState<PokemonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pokemon1, setPokemon1] = useState<PokemonInstanceData | null>(null);
  const [pokemon2, setPokemon2] = useState<PokemonInstanceData | null>(null);
  const [pokemon1Search, setPokemon1Search] = useState('');
  const [pokemon2Search, setPokemon2Search] = useState('');

  // Item selection state
  const [pokemon1Item, setPokemon1Item] = useState<ItemData | null>(null);
  const [pokemon2Item, setPokemon2Item] = useState<ItemData | null>(null);
  const [pokemon1ItemSearch, setPokemon1ItemSearch] = useState('');
  const [pokemon2ItemSearch, setPokemon2ItemSearch] = useState('');

  // Battle settings
  const [generation, setGeneration] = useState<string>('9');
  const [level, setLevel] = useState<number>(50);
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

  // Filter items based on search
  const filteredItems1 = useMemo(() => {
    if (!pokemon1ItemSearch) return BATTLE_ITEMS;
    const searchLower = pokemon1ItemSearch.toLowerCase();
    return BATTLE_ITEMS.filter(item =>
      item.name.toLowerCase().includes(searchLower)
    );
  }, [pokemon1ItemSearch]);

  const filteredItems2 = useMemo(() => {
    if (!pokemon2ItemSearch) return BATTLE_ITEMS;
    const searchLower = pokemon2ItemSearch.toLowerCase();
    return BATTLE_ITEMS.filter(item =>
      item.name.toLowerCase().includes(searchLower)
    );
  }, [pokemon2ItemSearch]);

  // Load a specific Pokemon with full instance data
  const loadPokemonInstance = async (pokemonId: number, slot: 1 | 2) => {
    try {
      // Fetch Pokemon instance from the backend
      const response = await ApiService.getRandomPokemonWithInstances({
        generation: parseInt(generation),
        levelMode: 'fixed',
        level: level,
        itemMode: 'none' // Items are now selected manually
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
            level: level,
            item: pokemon1Item?.name
          },
          pokemon2: {
            id: pokemon2.id,
            name: pokemon2.name,
            level: level,
            item: pokemon2Item?.name
          },
          generation: parseInt(generation),
          level: level,
          withItems: true // Always true since we're manually selecting items
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
        executionTime: result.executionTime,
        sampleBattle: result.sampleBattle,
        pokemon1Instance: result.pokemon1Instance,
        pokemon2Instance: result.pokemon2Instance
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
    setPokemon1Item(null);
    setPokemon2Item(null);
    setPokemon1ItemSearch('');
    setPokemon2ItemSearch('');
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
    onClear,
    selectedItem,
    itemSearchValue,
    onItemSearchChange,
    filteredItems,
    onItemSelect,
    onItemClear
  }: {
    slot: 1 | 2;
    selectedPokemon: PokemonInstanceData | null;
    searchValue: string;
    onSearchChange: (value: string) => void;
    filteredList: PokemonData[];
    onSelect: (id: number) => void;
    onClear: () => void;
    selectedItem: ItemData | null;
    itemSearchValue: string;
    onItemSearchChange: (value: string) => void;
    filteredItems: ItemData[];
    onItemSelect: (item: ItemData) => void;
    onItemClear: () => void;
  }) => {
    const combobox = useCombobox({
      onDropdownClose: () => combobox.resetSelectedOption(),
    });

    const itemCombobox = useCombobox({
      onDropdownClose: () => itemCombobox.resetSelectedOption(),
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

    const itemOptions = filteredItems.map((item) => (
      <Combobox.Option value={item.id} key={item.id}>
        <Group gap="sm">
          <Image
            src={item.sprite}
            alt={item.name}
            w={24}
            h={24}
            fit="contain"
            style={{ imageRendering: 'pixelated' }}
          />
          <Text size="sm">{item.name}</Text>
        </Group>
      </Combobox.Option>
    ));

    return (
      <Card withBorder p="md">
        <Stack gap="md">
          <Text fw={600} size="lg">Pokemon {slot}</Text>

          {/* Always show the combobox to allow changing selection */}
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
                rightSection={
                  selectedPokemon ? (
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClear();
                      }}
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  ) : (
                    <Combobox.Chevron />
                  )
                }
                rightSectionPointerEvents={selectedPokemon ? "all" : "none"}
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

          {/* Show selected Pokemon preview with item icon */}
          {selectedPokemon && (
            <Box ta="center" pos="relative">
              <Box pos="relative" display="inline-block">
                <Image
                  src={selectedPokemon.sprites.front}
                  alt={selectedPokemon.name}
                  w={100}
                  h={100}
                  fit="contain"
                  mx="auto"
                  style={{ imageRendering: 'pixelated' }}
                />
                {/* Item icon in top right */}
                {selectedItem && (
                  <Tooltip label={selectedItem.name} position="top">
                    <Box
                      pos="absolute"
                      top={0}
                      right={0}
                      style={{
                        transform: 'translate(25%, -25%)',
                        background: colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'white',
                        borderRadius: '50%',
                        padding: 4,
                        border: `2px solid ${colorScheme === 'dark' ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-3)'}`,
                        boxShadow: 'var(--mantine-shadow-sm)'
                      }}
                    >
                      <Image
                        src={selectedItem.sprite}
                        alt={selectedItem.name}
                        w={28}
                        h={28}
                        fit="contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </Box>
                  </Tooltip>
                )}
              </Box>
              <Group justify="center" gap="xs" mt="xs">
                {selectedPokemon.types.map((type: string) => (
                  <Badge
                    key={type}
                    size="sm"
                    style={{ backgroundColor: getTypeColor(type) }}
                    tt="capitalize"
                  >
                    {type}
                  </Badge>
                ))}
              </Group>
              <Text size="sm" c="dimmed" mt="xs">Level {level}</Text>
            </Box>
          )}

          {/* Item selection dropdown */}
          {selectedPokemon && (
            <Combobox
              store={itemCombobox}
              onOptionSubmit={(val) => {
                const item = BATTLE_ITEMS.find(i => i.id === val);
                if (item) onItemSelect(item);
                itemCombobox.closeDropdown();
              }}
            >
              <Combobox.Target>
                <InputBase
                  label="Held Item"
                  leftSection={
                    selectedItem ? (
                      <Image
                        src={selectedItem.sprite}
                        alt={selectedItem.name}
                        w={20}
                        h={20}
                        fit="contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : null
                  }
                  rightSection={
                    selectedItem ? (
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemClear();
                        }}
                      >
                        <IconX size={14} />
                      </ActionIcon>
                    ) : (
                      <Combobox.Chevron />
                    )
                  }
                  rightSectionPointerEvents={selectedItem ? "all" : "none"}
                  placeholder="No item (click to select)"
                  value={selectedItem ? selectedItem.name : itemSearchValue}
                  onChange={(event) => {
                    onItemSearchChange(event.currentTarget.value);
                    itemCombobox.openDropdown();
                    itemCombobox.updateSelectedOptionIndex();
                  }}
                  onClick={() => itemCombobox.openDropdown()}
                  onFocus={() => itemCombobox.openDropdown()}
                  onBlur={() => itemCombobox.closeDropdown()}
                />
              </Combobox.Target>

              <Combobox.Dropdown>
                <Combobox.Options>
                  <ScrollArea.Autosize mah={200} type="scroll">
                    {itemOptions.length === 0 ? (
                      <Combobox.Empty>No items found</Combobox.Empty>
                    ) : (
                      itemOptions
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
                    setPokemon1Item(null);
                    setPokemon1ItemSearch('');
                  }}
                  selectedItem={pokemon1Item}
                  itemSearchValue={pokemon1ItemSearch}
                  onItemSearchChange={setPokemon1ItemSearch}
                  filteredItems={filteredItems1}
                  onItemSelect={(item) => {
                    setPokemon1Item(item);
                    setPokemon1ItemSearch('');
                  }}
                  onItemClear={() => {
                    setPokemon1Item(null);
                    setPokemon1ItemSearch('');
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
                    setPokemon2Item(null);
                    setPokemon2ItemSearch('');
                  }}
                  selectedItem={pokemon2Item}
                  itemSearchValue={pokemon2ItemSearch}
                  onItemSearchChange={setPokemon2ItemSearch}
                  filteredItems={filteredItems2}
                  onItemSelect={(item) => {
                    setPokemon2Item(item);
                    setPokemon2ItemSearch('');
                  }}
                  onItemClear={() => {
                    setPokemon2Item(null);
                    setPokemon2ItemSearch('');
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

                  {/* Sample Battle Breakdown */}
                  {simulationResult.sampleBattle && (
                    <>
                      <Divider my="md" />
                      <Accordion variant="contained">
                        <Accordion.Item value="sample-battle">
                          <Accordion.Control icon={<IconSwords size={16} />}>
                            <Group gap="xs">
                              <Text fw={600} size="sm">Sample Battle Breakdown</Text>
                              <Badge
                                size="sm"
                                variant="filled"
                                color={simulationResult.sampleBattle.winner === 'draw' ? 'gray' : (simulationResult.sampleBattle.winner === pokemon1?.name ? 'blue' : 'red')}
                              >
                                {simulationResult.sampleBattle.winner === 'draw' ? 'Draw' : `${simulationResult.sampleBattle.winner} wins`}
                              </Badge>
                            </Group>
                          </Accordion.Control>
                          <Accordion.Panel>
                            <Stack gap="xs">
                              <Group justify="space-between">
                                <Text size="xs" c="dimmed">
                                  {simulationResult.sampleBattle.turns?.length || 0} turns
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {simulationResult.sampleBattle.executionTime}ms
                                </Text>
                              </Group>

                              <ScrollArea.Autosize mah={400} type="scroll">
                                <BattleTurnDisplay
                                  turns={simulationResult.sampleBattle.turns || []}
                                  pokemon1Name={pokemon1?.name}
                                  pokemon2Name={pokemon2?.name}
                                  pokemon1HP={simulationResult.pokemon1Instance?.stats?.hp}
                                  pokemon2HP={simulationResult.pokemon2Instance?.stats?.hp}
                                  showBattleStart={true}
                                />
                              </ScrollArea.Autosize>
                            </Stack>
                          </Accordion.Panel>
                        </Accordion.Item>
                      </Accordion>
                    </>
                  )}
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