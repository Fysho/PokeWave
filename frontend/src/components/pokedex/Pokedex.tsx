import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Title, 
  Text, 
  Stack, 
  Grid,
  Card,
  TextInput,
  Select,
  Group,
  Badge,
  Button,
  Loader,
  Center,
  ScrollArea,
  Image,
  Tooltip,
  ActionIcon,
  NumberInput,
  Switch
} from '@mantine/core';
import { IconSearch, IconPokeball, IconFilter, IconX, IconTrash } from '@tabler/icons-react';
import { FadeIn } from '../ui/transitions';
import { getTypeColor } from '../../utils/typeColors';
import ApiService from '../../services/api';
import { usePokedexStore } from '../../store/pokedexStore';

interface PokemonData {
  id: number;
  name: string;
  types: string[];
  sprite: string;
}

interface PokedexProps {}

const Pokedex: React.FC<PokedexProps> = () => {
  const [allPokemon, setAllPokemon] = useState<PokemonData[]>([]);
  const [pokemon, setPokemon] = useState<PokemonData[]>([]);
  const [filteredPokemon, setFilteredPokemon] = useState<PokemonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedGeneration, setSelectedGeneration] = useState<string>('1');
  const [hoveredPokemon, setHoveredPokemon] = useState<number | null>(null);
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [showShinyMode, setShowShinyMode] = useState(false);
  
  const { 
    isPokemonUnlocked, 
    isShinyPokemonUnlocked,
    getPokemonCount, 
    getShinyPokemonCount,
    getUnlockedCount, 
    getUnlockedShinyCount,
    getTotalPokemonCount, 
    resetPokedex 
  } = usePokedexStore();

  // Pokemon type list
  const pokemonTypes = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice',
    'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
    'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
  ];

  // Generation ranges
  const generations = [
    { value: 'all', label: 'All Generations' },
    { value: '1', label: 'Generation I (1-151)' },
    { value: '2', label: 'Generation II (152-251)' },
    { value: '3', label: 'Generation III (252-386)' },
    { value: '4', label: 'Generation IV (387-493)' },
    { value: '5', label: 'Generation V (494-649)' },
    { value: '6', label: 'Generation VI (650-721)' },
    { value: '7', label: 'Generation VII (722-809)' },
    { value: '8', label: 'Generation VIII (810-905)' },
    { value: '9', label: 'Generation IX (906-1025)' }
  ];

  const getGenerationRange = (gen: string): [number, number] => {
    switch (gen) {
      case '1': return [1, 151];
      case '2': return [152, 251];
      case '3': return [252, 386];
      case '4': return [387, 493];
      case '5': return [494, 649];
      case '6': return [650, 721];
      case '7': return [722, 809];
      case '8': return [810, 905];
      case '9': return [906, 1025];
      default: return [1, 151];
    }
  };

  // Load all Pokemon data on mount
  useEffect(() => {
    loadAllPokemonData();
  }, []);

  // Filter Pokemon based on generation
  useEffect(() => {
    filterByGeneration();
  }, [selectedGeneration, allPokemon]);

  const loadAllPokemonData = async () => {
    setLoading(true);
    try {
      // Fetch all Pokemon data from backend
      const data = await ApiService.getPokedexData();
      setAllPokemon(data);
      setPokemon(data);
      setFilteredPokemon(data);
    } catch (error) {
      console.error('Error loading Pokemon:', error);
      // Fallback: show empty state
      setAllPokemon([]);
      setPokemon([]);
      setFilteredPokemon([]);
    } finally {
      setLoading(false);
    }
  };

  const filterByGeneration = () => {
    if (selectedGeneration === 'all') {
      setPokemon(allPokemon);
    } else {
      const [min, max] = getGenerationRange(selectedGeneration);
      const filtered = allPokemon.filter(p => p.id >= min && p.id <= max);
      setPokemon(filtered);
    }
  };

  // Filter Pokemon based on search and filters
  useEffect(() => {
    let filtered = [...pokemon];
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toString().includes(searchQuery)
      );
    }
    
    // Type filter
    if (selectedType) {
      filtered = filtered.filter(p => p.types.includes(selectedType));
    }
    
    // Generation filter
    if (selectedGeneration !== 'all') {
      const [min, max] = getGenerationRange(selectedGeneration);
      filtered = filtered.filter(p => p.id >= min && p.id <= max);
    }
    
    // Unlocked filter
    if (showUnlockedOnly) {
      if (showShinyMode) {
        filtered = filtered.filter(p => isShinyPokemonUnlocked(p.id));
      } else {
        filtered = filtered.filter(p => isPokemonUnlocked(p.id));
      }
    }
    
    setFilteredPokemon(filtered);
  }, [searchQuery, selectedType, selectedGeneration, pokemon, showUnlockedOnly, showShinyMode, isPokemonUnlocked, isShinyPokemonUnlocked]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType(null);
    setSelectedGeneration('1');
    setShowUnlockedOnly(false);
  };

  const hasActiveFilters = searchQuery || selectedType || selectedGeneration !== '1' || showUnlockedOnly;

  if (loading) {
    return (
      <Center h="60vh">
        <Stack align="center" gap="md">
          <Loader size="xl" />
          <Text size="lg" c="dimmed">Loading Pokédex...</Text>
        </Stack>
      </Center>
    );
  }

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
                background: 'linear-gradient(135deg, var(--mantine-color-red-6), var(--mantine-color-dark-4))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              <Group gap="xs">
                <IconPokeball size={40} />
                Pokédex
              </Group>
            </Title>
            <Text size="xl" c="dimmed" ta="center">
              Browse all {allPokemon.length > 0 ? allPokemon.length : ''} Pokémon in numerical order
            </Text>
            <Text size="md" c="dimmed" ta="center">
              {showShinyMode 
                ? `${getUnlockedShinyCount()} / ${getTotalPokemonCount()} Shiny Pokémon unlocked`
                : `${getUnlockedCount()} / ${getTotalPokemonCount()} Pokémon unlocked`
              }
            </Text>
            <Group justify="center" gap="sm">
              <Button
                variant={showShinyMode ? "filled" : "light"}
                color="yellow"
                size="sm"
                onClick={() => setShowShinyMode(!showShinyMode)}
              >
                {showShinyMode ? "✨ Shiny Mode" : "Normal Mode"}
              </Button>
              <Button
                variant="subtle"
                color="red"
                size="sm"
                leftSection={<IconTrash size={16} />}
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear your Pokédex? This will reset all collected Pokémon.')) {
                    resetPokedex();
                  }
                }}
              >
                Clear Pokédex
              </Button>
            </Group>
          </Stack>

          {/* Filters */}
          <Card withBorder p="md">
            <Stack gap="md">
              {/* Search and Generation */}
              <Group grow align="flex-end">
                <TextInput
                  placeholder="Search by name or number..."
                  leftSection={<IconSearch size={16} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  size="md"
                />
                <Select
                  placeholder="Select generation"
                  data={generations}
                  value={selectedGeneration}
                  onChange={(value) => setSelectedGeneration(value || 'all')}
                  size="md"
                  clearable
                  onClear={() => setSelectedGeneration('all')}
                />
              </Group>

              {/* Type Filter */}
              <Stack gap="xs">
                <Text size="sm" fw={600} c="dimmed">Filter by Type:</Text>
                <Group gap="xs">
                  {pokemonTypes.map(type => (
                    <Badge
                      key={type}
                      size="lg"
                      variant={selectedType === type ? "filled" : "light"}
                      color={getTypeColor(type)}
                      onClick={() => setSelectedType(selectedType === type ? null : type)}
                      style={{ 
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      {type}
                    </Badge>
                  ))}
                </Group>
              </Stack>

              {/* Toggle Unlocked Only */}
              <Switch
                label="Show only unlocked Pokémon"
                checked={showUnlockedOnly}
                onChange={(event) => setShowUnlockedOnly(event.currentTarget.checked)}
                size="md"
              />

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Showing {filteredPokemon.length} of {pokemon.length} Pokémon
                  </Text>
                  <ActionIcon 
                    variant="subtle" 
                    color="gray" 
                    onClick={clearFilters}
                    size="lg"
                  >
                    <IconX size={16} />
                  </ActionIcon>
                </Group>
              )}
            </Stack>
          </Card>

          {/* Pokemon Grid */}
          <Grid gutter="md">
            {filteredPokemon.map((poke) => (
              <Grid.Col key={poke.id} span={{ base: 6, xs: 4, sm: 3, md: 2.4, lg: 2 }}>
                <Card 
                  withBorder 
                  p="sm"
                  style={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    transform: hoveredPokemon === poke.id ? 'translateY(-4px)' : 'none',
                    boxShadow: hoveredPokemon === poke.id ? 'var(--mantine-shadow-lg)' : 'none',
                    opacity: showShinyMode 
                      ? (isShinyPokemonUnlocked(poke.id) ? 1 : 0.4)
                      : (isPokemonUnlocked(poke.id) ? 1 : 0.4),
                    filter: showShinyMode
                      ? (isShinyPokemonUnlocked(poke.id) ? 'none' : 'grayscale(100%)')
                      : (isPokemonUnlocked(poke.id) ? 'none' : 'grayscale(100%)')
                  }}
                  onMouseEnter={() => setHoveredPokemon(poke.id)}
                  onMouseLeave={() => setHoveredPokemon(null)}
                >
                  <Stack align="center" gap="xs">
                    {/* Pokemon Number */}
                    <Text size="sm" c="dimmed" fw={600}>
                      #{String(poke.id).padStart(3, '0')}
                    </Text>

                    {/* Pokemon Sprite */}
                    <Box 
                      w={96} 
                      h={96} 
                      style={{ position: 'relative' }}
                    >
                      {poke.sprite ? (
                        <Image
                          src={showShinyMode ? poke.sprite.replace('/pokemon/', '/pokemon/shiny/') : poke.sprite}
                          alt={poke.name}
                          fit="contain"
                          style={{
                            imageRendering: 'pixelated',
                            filter: hoveredPokemon === poke.id ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none'
                          }}
                        />
                      ) : (
                        <Center h="100%" bg="gray.1" style={{ borderRadius: '8px' }}>
                          <IconPokeball size={48} color="var(--mantine-color-gray-5)" />
                        </Center>
                      )}
                      {/* Pokemon Count */}
                      {(showShinyMode ? getShinyPokemonCount(poke.id) : getPokemonCount(poke.id)) > 0 && (
                        <Text
                          size="md"
                          fw={700}
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            fontSize: '16px',
                            textShadow: '0 0 3px rgba(255,255,255,0.9), 0 0 6px rgba(255,255,255,0.7)',
                            color: 'var(--mantine-color-text)'
                          }}
                        >
                          {showShinyMode ? getShinyPokemonCount(poke.id) : getPokemonCount(poke.id)}
                        </Text>
                      )}
                    </Box>

                    {/* Pokemon Name */}
                    <Text size="sm" fw={600} tt="capitalize" ta="center">
                      {poke.name}
                    </Text>

                    {/* Pokemon Types */}
                    <Group gap={4} justify="center">
                      {poke.types.map((type) => (
                        <Badge
                          key={type}
                          size="sm"
                          variant="filled"
                          color={getTypeColor(type)}
                          style={{ textTransform: 'capitalize' }}
                        >
                          {type}
                        </Badge>
                      ))}
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>

          {/* No Results */}
          {filteredPokemon.length === 0 && !loading && (
            <Center py="xl">
              <Stack align="center" gap="md">
                <IconPokeball size={64} color="var(--mantine-color-gray-5)" />
                <Title order={3}>No Pokémon found</Title>
                <Text c="dimmed">
                  Try adjusting your filters
                </Text>
              </Stack>
            </Center>
          )}
        </Stack>
      </FadeIn>
    </Box>
  );
};

export default Pokedex;