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
  NumberInput
} from '@mantine/core';
import { IconSearch, IconPokeball, IconFilter, IconX } from '@tabler/icons-react';
import { FadeIn } from '../ui/transitions';
import { getTypeColor } from '../../utils/typeColors';
import ApiService from '../../services/api';

interface PokemonData {
  id: number;
  name: string;
  types: string[];
  sprite: string;
}

interface PokedexProps {}

// Static Pokemon data for Gen 1 (can be expanded)
// This is more efficient than making 151+ API calls
const GEN1_POKEMON_DATA = [
  { id: 1, name: "Bulbasaur", types: ["grass", "poison"] },
  { id: 2, name: "Ivysaur", types: ["grass", "poison"] },
  { id: 3, name: "Venusaur", types: ["grass", "poison"] },
  { id: 4, name: "Charmander", types: ["fire"] },
  { id: 5, name: "Charmeleon", types: ["fire"] },
  { id: 6, name: "Charizard", types: ["fire", "flying"] },
  { id: 7, name: "Squirtle", types: ["water"] },
  { id: 8, name: "Wartortle", types: ["water"] },
  { id: 9, name: "Blastoise", types: ["water"] },
  { id: 10, name: "Caterpie", types: ["bug"] },
  { id: 11, name: "Metapod", types: ["bug"] },
  { id: 12, name: "Butterfree", types: ["bug", "flying"] },
  { id: 13, name: "Weedle", types: ["bug", "poison"] },
  { id: 14, name: "Kakuna", types: ["bug", "poison"] },
  { id: 15, name: "Beedrill", types: ["bug", "poison"] },
  { id: 16, name: "Pidgey", types: ["normal", "flying"] },
  { id: 17, name: "Pidgeotto", types: ["normal", "flying"] },
  { id: 18, name: "Pidgeot", types: ["normal", "flying"] },
  { id: 19, name: "Rattata", types: ["normal"] },
  { id: 20, name: "Raticate", types: ["normal"] },
  { id: 21, name: "Spearow", types: ["normal", "flying"] },
  { id: 22, name: "Fearow", types: ["normal", "flying"] },
  { id: 23, name: "Ekans", types: ["poison"] },
  { id: 24, name: "Arbok", types: ["poison"] },
  { id: 25, name: "Pikachu", types: ["electric"] },
  { id: 26, name: "Raichu", types: ["electric"] },
  { id: 27, name: "Sandshrew", types: ["ground"] },
  { id: 28, name: "Sandslash", types: ["ground"] },
  { id: 29, name: "Nidoran♀", types: ["poison"] },
  { id: 30, name: "Nidorina", types: ["poison"] },
  { id: 31, name: "Nidoqueen", types: ["poison", "ground"] },
  { id: 32, name: "Nidoran♂", types: ["poison"] },
  { id: 33, name: "Nidorino", types: ["poison"] },
  { id: 34, name: "Nidoking", types: ["poison", "ground"] },
  { id: 35, name: "Clefairy", types: ["fairy"] },
  { id: 36, name: "Clefable", types: ["fairy"] },
  { id: 37, name: "Vulpix", types: ["fire"] },
  { id: 38, name: "Ninetales", types: ["fire"] },
  { id: 39, name: "Jigglypuff", types: ["normal", "fairy"] },
  { id: 40, name: "Wigglytuff", types: ["normal", "fairy"] },
  { id: 41, name: "Zubat", types: ["poison", "flying"] },
  { id: 42, name: "Golbat", types: ["poison", "flying"] },
  { id: 43, name: "Oddish", types: ["grass", "poison"] },
  { id: 44, name: "Gloom", types: ["grass", "poison"] },
  { id: 45, name: "Vileplume", types: ["grass", "poison"] },
  { id: 46, name: "Paras", types: ["bug", "grass"] },
  { id: 47, name: "Parasect", types: ["bug", "grass"] },
  { id: 48, name: "Venonat", types: ["bug", "poison"] },
  { id: 49, name: "Venomoth", types: ["bug", "poison"] },
  { id: 50, name: "Diglett", types: ["ground"] },
  { id: 51, name: "Dugtrio", types: ["ground"] },
  { id: 52, name: "Meowth", types: ["normal"] },
  { id: 53, name: "Persian", types: ["normal"] },
  { id: 54, name: "Psyduck", types: ["water"] },
  { id: 55, name: "Golduck", types: ["water"] },
  { id: 56, name: "Mankey", types: ["fighting"] },
  { id: 57, name: "Primeape", types: ["fighting"] },
  { id: 58, name: "Growlithe", types: ["fire"] },
  { id: 59, name: "Arcanine", types: ["fire"] },
  { id: 60, name: "Poliwag", types: ["water"] },
  { id: 61, name: "Poliwhirl", types: ["water"] },
  { id: 62, name: "Poliwrath", types: ["water", "fighting"] },
  { id: 63, name: "Abra", types: ["psychic"] },
  { id: 64, name: "Kadabra", types: ["psychic"] },
  { id: 65, name: "Alakazam", types: ["psychic"] },
  { id: 66, name: "Machop", types: ["fighting"] },
  { id: 67, name: "Machoke", types: ["fighting"] },
  { id: 68, name: "Machamp", types: ["fighting"] },
  { id: 69, name: "Bellsprout", types: ["grass", "poison"] },
  { id: 70, name: "Weepinbell", types: ["grass", "poison"] },
  { id: 71, name: "Victreebel", types: ["grass", "poison"] },
  { id: 72, name: "Tentacool", types: ["water", "poison"] },
  { id: 73, name: "Tentacruel", types: ["water", "poison"] },
  { id: 74, name: "Geodude", types: ["rock", "ground"] },
  { id: 75, name: "Graveler", types: ["rock", "ground"] },
  { id: 76, name: "Golem", types: ["rock", "ground"] },
  { id: 77, name: "Ponyta", types: ["fire"] },
  { id: 78, name: "Rapidash", types: ["fire"] },
  { id: 79, name: "Slowpoke", types: ["water", "psychic"] },
  { id: 80, name: "Slowbro", types: ["water", "psychic"] },
  { id: 81, name: "Magnemite", types: ["electric", "steel"] },
  { id: 82, name: "Magneton", types: ["electric", "steel"] },
  { id: 83, name: "Farfetch'd", types: ["normal", "flying"] },
  { id: 84, name: "Doduo", types: ["normal", "flying"] },
  { id: 85, name: "Dodrio", types: ["normal", "flying"] },
  { id: 86, name: "Seel", types: ["water"] },
  { id: 87, name: "Dewgong", types: ["water", "ice"] },
  { id: 88, name: "Grimer", types: ["poison"] },
  { id: 89, name: "Muk", types: ["poison"] },
  { id: 90, name: "Shellder", types: ["water"] },
  { id: 91, name: "Cloyster", types: ["water", "ice"] },
  { id: 92, name: "Gastly", types: ["ghost", "poison"] },
  { id: 93, name: "Haunter", types: ["ghost", "poison"] },
  { id: 94, name: "Gengar", types: ["ghost", "poison"] },
  { id: 95, name: "Onix", types: ["rock", "ground"] },
  { id: 96, name: "Drowzee", types: ["psychic"] },
  { id: 97, name: "Hypno", types: ["psychic"] },
  { id: 98, name: "Krabby", types: ["water"] },
  { id: 99, name: "Kingler", types: ["water"] },
  { id: 100, name: "Voltorb", types: ["electric"] },
  { id: 101, name: "Electrode", types: ["electric"] },
  { id: 102, name: "Exeggcute", types: ["grass", "psychic"] },
  { id: 103, name: "Exeggutor", types: ["grass", "psychic"] },
  { id: 104, name: "Cubone", types: ["ground"] },
  { id: 105, name: "Marowak", types: ["ground"] },
  { id: 106, name: "Hitmonlee", types: ["fighting"] },
  { id: 107, name: "Hitmonchan", types: ["fighting"] },
  { id: 108, name: "Lickitung", types: ["normal"] },
  { id: 109, name: "Koffing", types: ["poison"] },
  { id: 110, name: "Weezing", types: ["poison"] },
  { id: 111, name: "Rhyhorn", types: ["ground", "rock"] },
  { id: 112, name: "Rhydon", types: ["ground", "rock"] },
  { id: 113, name: "Chansey", types: ["normal"] },
  { id: 114, name: "Tangela", types: ["grass"] },
  { id: 115, name: "Kangaskhan", types: ["normal"] },
  { id: 116, name: "Horsea", types: ["water"] },
  { id: 117, name: "Seadra", types: ["water"] },
  { id: 118, name: "Goldeen", types: ["water"] },
  { id: 119, name: "Seaking", types: ["water"] },
  { id: 120, name: "Staryu", types: ["water"] },
  { id: 121, name: "Starmie", types: ["water", "psychic"] },
  { id: 122, name: "Mr. Mime", types: ["psychic", "fairy"] },
  { id: 123, name: "Scyther", types: ["bug", "flying"] },
  { id: 124, name: "Jynx", types: ["ice", "psychic"] },
  { id: 125, name: "Electabuzz", types: ["electric"] },
  { id: 126, name: "Magmar", types: ["fire"] },
  { id: 127, name: "Pinsir", types: ["bug"] },
  { id: 128, name: "Tauros", types: ["normal"] },
  { id: 129, name: "Magikarp", types: ["water"] },
  { id: 130, name: "Gyarados", types: ["water", "flying"] },
  { id: 131, name: "Lapras", types: ["water", "ice"] },
  { id: 132, name: "Ditto", types: ["normal"] },
  { id: 133, name: "Eevee", types: ["normal"] },
  { id: 134, name: "Vaporeon", types: ["water"] },
  { id: 135, name: "Jolteon", types: ["electric"] },
  { id: 136, name: "Flareon", types: ["fire"] },
  { id: 137, name: "Porygon", types: ["normal"] },
  { id: 138, name: "Omanyte", types: ["rock", "water"] },
  { id: 139, name: "Omastar", types: ["rock", "water"] },
  { id: 140, name: "Kabuto", types: ["rock", "water"] },
  { id: 141, name: "Kabutops", types: ["rock", "water"] },
  { id: 142, name: "Aerodactyl", types: ["rock", "flying"] },
  { id: 143, name: "Snorlax", types: ["normal"] },
  { id: 144, name: "Articuno", types: ["ice", "flying"] },
  { id: 145, name: "Zapdos", types: ["electric", "flying"] },
  { id: 146, name: "Moltres", types: ["fire", "flying"] },
  { id: 147, name: "Dratini", types: ["dragon"] },
  { id: 148, name: "Dragonair", types: ["dragon"] },
  { id: 149, name: "Dragonite", types: ["dragon", "flying"] },
  { id: 150, name: "Mewtwo", types: ["psychic"] },
  { id: 151, name: "Mew", types: ["psychic"] }
];

const Pokedex: React.FC<PokedexProps> = () => {
  const [pokemon, setPokemon] = useState<PokemonData[]>([]);
  const [filteredPokemon, setFilteredPokemon] = useState<PokemonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedGeneration, setSelectedGeneration] = useState<string>('1');
  const [hoveredPokemon, setHoveredPokemon] = useState<number | null>(null);

  // Pokemon type list
  const pokemonTypes = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice',
    'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
    'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
  ];

  // Generation ranges
  const generations = [
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

  // Load Pokemon data based on generation
  useEffect(() => {
    loadPokemonData();
  }, [selectedGeneration]);

  const loadPokemonData = async () => {
    setLoading(true);
    try {
      // For now, we'll use static data for Gen 1
      // In a production app, you'd load this from the backend
      if (selectedGeneration === '1') {
        const pokemonWithSprites = GEN1_POKEMON_DATA.map(p => ({
          ...p,
          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`
        }));
        setPokemon(pokemonWithSprites);
        setFilteredPokemon(pokemonWithSprites);
      } else {
        // For other generations, show a message
        setPokemon([]);
        setFilteredPokemon([]);
      }
    } catch (error) {
      console.error('Error loading Pokemon:', error);
    } finally {
      setLoading(false);
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
    
    setFilteredPokemon(filtered);
  }, [searchQuery, selectedType, selectedGeneration, pokemon]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType(null);
    setSelectedGeneration('all');
  };

  const hasActiveFilters = searchQuery || selectedType || selectedGeneration !== 'all';

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
              Browse all Pokémon in numerical order
            </Text>
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
                    boxShadow: hoveredPokemon === poke.id ? 'var(--mantine-shadow-lg)' : 'none'
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
                          src={poke.sprite}
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
                <Title order={3}>
                  {selectedGeneration !== '1' ? 'Coming Soon!' : 'No Pokémon found'}
                </Title>
                <Text c="dimmed">
                  {selectedGeneration !== '1' 
                    ? `Generation ${selectedGeneration} Pokémon will be added in a future update`
                    : 'Try adjusting your filters'
                  }
                </Text>
                {selectedGeneration !== '1' && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedGeneration('1')}
                  >
                    View Generation I
                  </Button>
                )}
              </Stack>
            </Center>
          )}
        </Stack>
      </FadeIn>
    </Box>
  );
};

export default Pokedex;