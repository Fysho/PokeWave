import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Slider, Group, Text, Grid, Box, Stack, Title, Center, Loader, useMantineTheme, useMantineColorScheme } from '@mantine/core';
import { useGameStore } from '../../store/gameStore';
import { useSettingsStore } from '../../store/settingsStore';
import { BattleLoading } from '../ui/loading';
import { FadeIn, SlideIn, ResultReveal, BounceIn, ScaleIn } from '../ui/transitions';
import StreakCelebration from '../ui/streak-celebration';
import { 
  IconSwords, 
  IconTrophy, 
  IconTarget, 
  IconFlame, 
  IconBolt,
  IconCrown,
  IconStar,
  IconClock,
  IconRotateClockwise2
} from '@tabler/icons-react';

interface PokemonBattleCardProps {
  pokemon: any;
  showResults: boolean;
  position: 'left' | 'right';
  winPercentage?: number;
  guessPercentage?: number;
}

const PokemonBattleCard: React.FC<PokemonBattleCardProps> = ({
  pokemon,
  showResults,
  position,
  winPercentage,
  guessPercentage
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const formatItemName = (item: string): string => {
    // Map of item IDs to proper display names
    const itemNames: { [key: string]: string } = {
      'leftovers': 'Leftovers',
      'choiceband': 'Choice Band',
      'choicescarf': 'Choice Scarf',
      'choicespecs': 'Choice Specs',
      'lifeorb': 'Life Orb',
      'focussash': 'Focus Sash',
      'assaultvest': 'Assault Vest',
      'eviolite': 'Eviolite',
      'blacksludge': 'Black Sludge',
      'rockyhelmet': 'Rocky Helmet',
      'lightclay': 'Light Clay',
      'sitrusberry': 'Sitrus Berry'
    };
    
    return itemNames[item.toLowerCase()] || item.replace(/([A-Z])/g, ' $1').trim();
  };

  const getTypeColor = (type: string): string => {
    const typeColors: { [key: string]: string } = {
      normal: 'gray',
      fire: 'red',
      water: 'blue',
      electric: 'yellow',
      grass: 'green',
      ice: 'cyan',
      fighting: 'red',
      poison: 'grape',
      ground: 'orange',
      flying: 'indigo',
      psychic: 'pink',
      bug: 'lime',
      rock: 'orange',
      ghost: 'violet',
      dragon: 'indigo',
      dark: 'dark',
      steel: 'gray',
      fairy: 'pink',
    };
    return typeColors[type.toLowerCase()] || 'gray';
  };

  const displayWinPercentage = winPercentage !== undefined ? winPercentage.toFixed(1) : showResults ? ((pokemon.wins / 100) * 100).toFixed(1) : null;

  // Calculate dynamic sprite size based on guess percentage
  const calculateSpriteSize = () => {
    if (guessPercentage === undefined || guessPercentage === null || showResults) return 320; // Default size when showing results (2x bigger)
    
    const minSize = 240; // 2x bigger (was 120)
    const maxSize = 400; // 2x bigger (was 200)
    
    // For left pokemon (position === 'left'), size increases with guessPercentage
    // For right pokemon (position === 'right'), size decreases with guessPercentage
    const percentage = position === 'left' ? guessPercentage : (100 - guessPercentage);
    
    // Scale the size based on percentage (0-100)
    // At 50%, both should be base size (320px)
    // At 0%, size should be minSize (240px)
    // At 100%, size should be maxSize (400px)
    const scaleFactor = percentage / 100;
    const size = minSize + (maxSize - minSize) * scaleFactor;
    
    return Math.round(size);
  };

  const spriteSize = calculateSpriteSize();

  return (
    <SlideIn 
      direction={position === 'left' ? 'left' : 'right'} 
      delay={0.3}
      className="w-full"
    >
      <Card 
        className={`
          relative transition-all duration-300 group h-full
          ${showResults && pokemon.wins > 500 ? 'ring-2 ring-green-500' : ''}
        `}
      >
        <Card.Section p="lg">
          <Box 
            pos="relative" 
            ta="center" 
            mb="md"
            style={{
              height: '360px', // Fixed height container to prevent UI shifting (reduced whitespace)
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {pokemon.sprites?.front ? (
              <Box pos="relative">
                <img 
                  src={pokemon.sprites.front} 
                  alt={pokemon.name}
                  className="pokemon-sprite"
                  style={{
                    width: `${spriteSize}px`,
                    height: `${spriteSize}px`,
                    objectFit: 'contain',
                    margin: '0 auto',
                    filter: 'drop-shadow(0 25px 25px rgb(0 0 0 / 0.15))',
                    transition: 'transform 0.3s ease, width 0.3s ease, height 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLImageElement>) => (e.currentTarget.style.transform = 'scale(1.1)')}
                  onMouseLeave={(e: React.MouseEvent<HTMLImageElement>) => (e.currentTarget.style.transform = 'scale(1)')}
                />
                {showResults && pokemon.wins > 500 && (
                  <Box 
                    pos="absolute" 
                    top={-8} 
                    right={-8} 
                    w={40} 
                    h={40} 
                    bg="green.5" 
                    style={{ 
                      borderRadius: '50%', 
                      animation: 'bounce 1s infinite',
                      display: 'flex',
                      alignItems: 'center', 
                      justifyContent: 'center'
                    }}
                  >
                    <IconCrown size={20} color="white" />
                  </Box>
                )}
              </Box>
            ) : (
              <Box 
                w={spriteSize} 
                h={spriteSize} 
                bg={colorScheme === 'dark' ? 'dark.6' : 'gray.1'} 
                mx="auto"
                style={{ 
                  borderRadius: '8px',
                  display: 'flex',
                  transition: 'width 0.3s ease, height 0.3s ease',
                  alignItems: 'center', 
                  justifyContent: 'center'
                }}
              >
                <Text size="sm" c="gray.6">
                  No Image
                </Text>
              </Box>
            )}
            
            <Badge 
              variant="light" 
              size="lg"
              pos="absolute"
              top={-8}
              left={-8}
              style={{ border: '2px solid var(--mantine-color-white)' }}
            >
              Lv.{pokemon.level}
            </Badge>
          </Box>
          
          <Title order={2} size="h1" fw={700} tt="capitalize" ta="center">
            {pokemon.name}
          </Title>
        </Card.Section>

        <Card.Section p="lg">
          <Stack gap="md">
            {/* Types */}
            {pokemon.types && pokemon.types.length > 0 && (
              <Group justify="center" gap="sm">
                {pokemon.types.map((type: string) => (
                  <Badge
                    key={type}
                    size="lg"
                    variant="filled"
                    color={getTypeColor(type)}
                    tt="capitalize"
                    style={{ 
                      fontSize: '14px',
                      fontWeight: 700,
                      padding: '8px 16px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.transform = 'scale(1.1)')}
                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {type}
                  </Badge>
                ))}
              </Group>
            )}

            {/* Ability and Item */}
            <Group justify="center" gap="md">
              {pokemon.ability && (
                <Badge
                  variant="light"
                  size="md"
                  color="blue"
                  leftSection={<IconBolt size={14} />}
                  tt="capitalize"
                  style={{ 
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    lineHeight: '1'
                  }}
                >
                  {pokemon.ability}
                </Badge>
              )}
              {pokemon.item ? (
                <Badge
                  variant="outline"
                  size="md"
                  color="teal"
                  leftSection={<IconStar size={14} />}
                  tt="capitalize"
                  style={{ 
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    lineHeight: '1'
                  }}
                >
                  {formatItemName(pokemon.item)}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  size="md"
                  color="gray"
                  leftSection={<IconStar size={14} />}
                  style={{ 
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    lineHeight: '1'
                  }}
                >
                  No Item
                </Badge>
              )}
            </Group>

            {/* Moves */}
            {pokemon.moves && pokemon.moves.length > 0 && (
              <Box>
                <Text size="sm" c="gray.6" ta="center" mb="xs">Moves</Text>
                <Group justify="center" gap="xs">
                  {pokemon.moves.slice(0, 4).map((move: string, index: number) => (
                    <Badge
                      key={index}
                      size="sm"
                      variant="outline"
                      color="gray"
                      tt="capitalize"
                      style={{ 
                        fontSize: '12px',
                        fontWeight: 500,
                        padding: '4px 8px',
                        backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                        borderColor: colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
                      }}
                    >
                      {move}
                    </Badge>
                  ))}
                </Group>
              </Box>
            )}

            {/* Stats */}
            {pokemon.stats && (
              <Box>
                <Text size="sm" c="gray.6" ta="center" mb="xs">Stats (Level {pokemon.level})</Text>
                <Grid gutter="xs">
                  <Grid.Col span={6}>
                    <Box ta="center" p="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.red[0], borderRadius: '4px', border: colorScheme === 'dark' ? `1px solid ${theme.colors.red[8]}` : 'none' }}>
                      <Text size="xs" fw={600} c={colorScheme === 'dark' ? 'red.4' : 'red.7'}>HP</Text>
                      <Text size="sm" fw={700}>{pokemon.stats.hp}</Text>
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box ta="center" p="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.orange[0], borderRadius: '4px', border: colorScheme === 'dark' ? `1px solid ${theme.colors.orange[8]}` : 'none' }}>
                      <Text size="xs" fw={600} c={colorScheme === 'dark' ? 'orange.4' : 'orange.7'}>ATK</Text>
                      <Text size="sm" fw={700}>{pokemon.stats.attack}</Text>
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box ta="center" p="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.yellow[0], borderRadius: '4px', border: colorScheme === 'dark' ? `1px solid ${theme.colors.yellow[8]}` : 'none' }}>
                      <Text size="xs" fw={600} c={colorScheme === 'dark' ? 'yellow.4' : 'yellow.7'}>DEF</Text>
                      <Text size="sm" fw={700}>{pokemon.stats.defense}</Text>
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box ta="center" p="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.blue[0], borderRadius: '4px', border: colorScheme === 'dark' ? `1px solid ${theme.colors.blue[8]}` : 'none' }}>
                      <Text size="xs" fw={600} c={colorScheme === 'dark' ? 'blue.4' : 'blue.7'}>SPA</Text>
                      <Text size="sm" fw={700}>{pokemon.stats.specialAttack}</Text>
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box ta="center" p="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.teal[0], borderRadius: '4px', border: colorScheme === 'dark' ? `1px solid ${theme.colors.teal[8]}` : 'none' }}>
                      <Text size="xs" fw={600} c={colorScheme === 'dark' ? 'teal.4' : 'teal.7'}>SPD</Text>
                      <Text size="sm" fw={700}>{pokemon.stats.specialDefense}</Text>
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box ta="center" p="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.pink[0], borderRadius: '4px', border: colorScheme === 'dark' ? `1px solid ${theme.colors.pink[8]}` : 'none' }}>
                      <Text size="xs" fw={600} c={colorScheme === 'dark' ? 'pink.4' : 'pink.7'}>SPE</Text>
                      <Text size="sm" fw={700}>{pokemon.stats.speed}</Text>
                    </Box>
                  </Grid.Col>
                </Grid>
              </Box>
            )}

            {/* Nature and IVs */}
            {pokemon.nature && (
              <Box>
                <Group justify="center" gap="xs">
                  <Badge
                    variant="dot"
                    size="md"
                    color="violet"
                    tt="capitalize"
                  >
                    {pokemon.nature} Nature
                  </Badge>
                  <Badge
                    variant="dot"
                    size="md"
                    color="green"
                  >
                    Perfect IVs
                  </Badge>
                </Group>
              </Box>
            )}

            {/* Battle Results */}
            {showResults && (
              <ScaleIn delay={0.5}>
                <Box bg={colorScheme === 'dark' ? 'dark.6' : 'gray.0'} p="lg" style={{ borderRadius: '8px' }} ta="center">
                  <Text size="sm" c="gray.6" mb="xs">Battle Results</Text>
                  <Text size="xl" fw={700} c="blue.6" mb="xs">
                    {displayWinPercentage}%
                  </Text>
                  <Text size="sm" c="gray.6">
                    {pokemon.wins}/100 wins
                  </Text>
                </Box>
              </ScaleIn>
            )}
          </Stack>
        </Card.Section>
      </Card>
    </SlideIn>
  );
};

const BattleArena: React.FC = () => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  
  const {
    currentBattle,
    isLoading,
    error,
    score,
    streak,
    totalGuesses,
    correctGuesses,
    generateNewBattle,
    submitGuess,
    clearError,
  } = useGameStore();
  
  const { battleSettings } = useSettingsStore();

  const [guessPercentage, setGuessPercentage] = useState<number>(50);
  const [showResults, setShowResults] = useState(false);
  const [guessResult, setGuessResult] = useState<any>(null);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [lastStreakShown, setLastStreakShown] = useState(0);

  // Removed automatic battle generation on mount
  // Now users must click "New Battle" button to start

  useEffect(() => {
    setGuessPercentage(50);
    setShowResults(false);
    setGuessResult(null);
  }, [currentBattle]);

  useEffect(() => {
    if (streak > lastStreakShown && streak >= 2) {
      setShowStreakCelebration(true);
      setLastStreakShown(streak);
    } else if (streak === 0) {
      setLastStreakShown(0);
    }
  }, [streak, lastStreakShown]);

  const handleSliderChange = (value: number[]) => {
    if (isLoading || showResults) return;
    setGuessPercentage(value[0]);
  };

  const handleSubmitGuess = async () => {
    if (!currentBattle) return;
    
    try {
      const result = await submitGuess(guessPercentage);
      setGuessResult(result);
      setShowResults(true);
    } catch (error) {
      console.error('Error submitting guess:', error);
    }
  };

  const handleNewBattle = () => {
    generateNewBattle(battleSettings);
  };

  const getAccuracy = () => {
    if (totalGuesses === 0) return 0;
    return ((correctGuesses / totalGuesses) * 100).toFixed(1);
  };

  if (error) {
    return (
      <Center mih="60vh">
        <Stack align="center" gap="xl">
          <Stack align="center" gap="md">
            <Box 
              w={64} 
              h={64} 
              bg="red.0" 
              style={{ 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center', 
                justifyContent: 'center'
              }}
            >
              <IconBolt size={32} color="var(--mantine-color-red-6)" />
            </Box>
            <Title order={2} c="red.6">Battle Error</Title>
            <Text c="dimmed" maw={400} ta="center">{error}</Text>
          </Stack>
          <Button onClick={clearError} variant="outline" size="lg" leftSection={<IconRotateClockwise2 size={16} />}>
            Try Again
          </Button>
        </Stack>
      </Center>
    );
  }

  return (
    <>
      <Box maw={1400} mx="auto">
        {/* Title Section */}
        {/* Battle Arena */}
        <FadeIn delay={0.4}>
          <Card withBorder shadow="xl" style={{ overflow: 'hidden' }}>
            <Box 
              pos="absolute" 
              top={0} 
              left={0} 
              right={0} 
              bottom={0} 
              style={{
                background: colorScheme === 'dark' 
                  ? 'linear-gradient(135deg, rgba(31, 41, 55, 0.3) 0%, transparent 50%, rgba(31, 41, 55, 0.3) 100%)'
                  : 'linear-gradient(135deg, var(--mantine-color-blue-0) 0%, transparent 50%, var(--mantine-color-blue-0) 100%)',
                pointerEvents: 'none'
              }}
            />
            <Card.Section p={{ base: 'lg', md: 'xl' }} pos="relative">
              {isLoading ? (
                <div className="py-16">
                  <BattleLoading 
                    pokemon1Name={currentBattle?.pokemon1.name || 'Pokemon'} 
                    pokemon2Name={currentBattle?.pokemon2.name || 'Pokemon'} 
                    className="py-8"
                  />
                </div>
              ) : currentBattle ? (
                <div className="space-y-8">
                  {/* Pokemon Battle */}
                  <div className="relative">
                    {/* VS Badge for Mobile */}
                    <Center mb="md" hiddenFrom="md">
                      <Stack align="center" gap="xs">
                        <BounceIn delay={0.5}>
                          <Box
                            w={64}
                            h={64}
                            bg="linear-gradient(135deg, var(--mantine-color-blue-5), var(--mantine-color-grape-5))"
                            c="white"
                            style={{ 
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center', 
                              justifyContent: 'center',
                              boxShadow: 'var(--mantine-shadow-lg)'
                            }}
                          >
                            <Text size="lg" fw={700}>VS</Text>
                          </Box>
                        </BounceIn>
                        <Text size="sm" c="dimmed">
                          {currentBattle.totalBattles} battle simulation
                        </Text>
                      </Stack>
                    </Center>
                    
                    <Grid gutter={{ base: 'md', md: 'xl' }} align="flex-start" justify="center" maw={1200} mx="auto">
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        {/* Pokemon 1 */}
                        <PokemonBattleCard
                          pokemon={currentBattle.pokemon1}
                          showResults={showResults}
                          position="left"
                          winPercentage={showResults ? guessResult?.actualWinRate : undefined}
                          guessPercentage={!showResults ? guessPercentage : undefined}
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
                        visibleFrom="md"
                      >
                        <BounceIn delay={0.5}>
                          <Box
                            w={80}
                            h={80}
                            bg="linear-gradient(135deg, var(--mantine-color-blue-5), var(--mantine-color-grape-5))"
                            c="white"
                            style={{ 
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center', 
                              justifyContent: 'center',
                              boxShadow: 'var(--mantine-shadow-xl)',
                              border: '4px solid white'
                            }}
                          >
                            <Text size="xl" fw={700}>VS</Text>
                          </Box>
                        </BounceIn>
                      </Box>

                      <Grid.Col span={{ base: 12, sm: 6 }}>

                        {/* Pokemon 2 */}
                        <PokemonBattleCard
                          pokemon={currentBattle.pokemon2}
                          showResults={showResults}
                          position="right"
                          winPercentage={showResults ? (100 - (guessResult?.actualWinRate || 0)) : undefined}
                          guessPercentage={!showResults ? guessPercentage : undefined}
                        />
                      </Grid.Col>
                    </Grid>
                  
                  {/* Battle Info for Desktop */}
                  <Center mt="md" visibleFrom="md">
                    <Text size="sm" c="dimmed">
                      {currentBattle.totalBattles} battle simulation
                    </Text>
                  </Center>
                  </div>

                  {/* Win Rate Prediction Slider */}
                  {!showResults && (
                    <Box maw={800} mx="auto" mt="xl">
                      <Stack align="center" gap="md" mb="md">
                        <Title order={3} size="h3" ta="center">
                          How many battles will {currentBattle.pokemon1.name} win?
                        </Title>
                        <Text size="sm" c="dimmed" ta="center">
                          Drag the slider to predict the win percentage (you need to be within 10% to score points)
                        </Text>
                      </Stack>
                      
                      <Card withBorder p="xl" shadow="lg" style={{ borderColor: colorScheme === 'dark' ? theme.colors.blue[7] : theme.colors.blue[3], borderWidth: '2px' }}>
                        <Group justify="space-between" align="center" mb="xl">
                          <Stack align="flex-start" gap="xs">
                            <Text fw={600} size="lg">{currentBattle.pokemon1.name}</Text>
                            <Text size="xl" fw={700} c="blue.6">{guessPercentage}%</Text>
                          </Stack>
                          <Stack align="center" gap="xs">
                            <Text size="sm" c="dimmed">Win Rate Prediction</Text>
                            <Text size="xl" fw={700}>VS</Text>
                          </Stack>
                          <Stack align="flex-end" gap="xs">
                            <Text fw={600} size="lg">{currentBattle.pokemon2.name}</Text>
                            <Text size="xl" fw={700} c="grape.6">{100 - guessPercentage}%</Text>
                          </Stack>
                        </Group>
                        
                        <Stack gap="md">
                          <Text ta="center" size="sm" c="dimmed">
                            Drag the slider to adjust your prediction
                          </Text>
                          
                          <Slider
                            value={guessPercentage}
                            onChange={(value) => handleSliderChange([value])}
                            min={0}
                            max={100}
                            step={1}
                            disabled={isLoading}
                            color="blue"
                            size="lg"
                            style={{ padding: '8px 0' }}
                          />
                          
                          <Group justify="space-between">
                            <Text size="sm" c="dimmed" fw={500}>0%</Text>
                            <Text size="sm" c="dimmed" fw={500}>50%</Text>
                            <Text size="sm" c="dimmed" fw={500}>100%</Text>
                          </Group>
                        </Stack>
                      </Card>
                    </Box>
                  )}

                  {/* Action Buttons */}
                  <Center>
                    <Stack gap="lg">
                      {!showResults ? (
                        <Group justify="center" gap="md">
                          <Button
                            onClick={handleSubmitGuess}
                            disabled={isLoading}
                            size="lg"
                            leftSection={isLoading ? <Loader size={20} /> : <IconSwords size={20} />}
                            loading={isLoading}
                            loaderProps={{ size: 20 }}
                          >
                            {isLoading ? 'Simulating...' : 'Submit Prediction'}
                          </Button>
                          <Button
                            onClick={handleNewBattle}
                            variant="outline"
                            disabled={isLoading}
                            size="lg"
                            leftSection={<IconRotateClockwise2 size={16} />}
                          >
                            New Battle
                          </Button>
                        </Group>
                      ) : (
                        <Stack gap="lg">
                          <ResultReveal 
                            isVisible={!!guessResult} 
                            isCorrect={guessResult?.isCorrect}
                          >
                            {guessResult && (
                              <Card 
                                withBorder 
                                maw={400} 
                                mx="auto"
                                style={{
                                  backgroundColor: guessResult.isCorrect 
                                    ? colorScheme === 'dark' ? theme.colors.green[9] : theme.colors.green[0]
                                    : colorScheme === 'dark' ? theme.colors.red[9] : theme.colors.red[0],
                                  borderColor: guessResult.isCorrect 
                                    ? colorScheme === 'dark' ? theme.colors.green[7] : theme.colors.green[3]
                                    : colorScheme === 'dark' ? theme.colors.red[7] : theme.colors.red[3]
                                }}
                              >
                                <Card.Section p="xl">
                                  <Stack align="center" gap="md">
                                    <Text 
                                      size="xl" 
                                      fw={700} 
                                      c={guessResult.isCorrect ? 'green.7' : 'red.7'}
                                    >
                                      {guessResult.isCorrect ? '🎉 Within 10%!' : '❌ Not close enough!'}
                                    </Text>
                                    <Text size="lg">
                                      Your guess: <Text component="span" fw={700}>{guessResult.guessPercentage}%</Text>
                                    </Text>
                                    <Text size="lg">
                                      Actual win rate: <Text component="span" fw={700} c="blue.6">{guessResult.actualWinRate.toFixed(1)}%</Text>
                                    </Text>
                                    <Text c="dimmed">
                                      {guessResult.message}
                                    </Text>
                                    {guessResult.isCorrect && (
                                      <Text size="lg" fw={700} c="green.6">
                                        +{guessResult.points} points earned!
                                      </Text>
                                    )}
                                  </Stack>
                                </Card.Section>
                              </Card>
                            )}
                          </ResultReveal>

                          <Group justify="center" gap="md">
                            <Group gap="xs">
                              <IconClock size={16} />
                              <Text size="sm" c="dimmed">
                                Simulation completed in {currentBattle.executionTime}ms
                              </Text>
                            </Group>
                            <Button
                              onClick={handleNewBattle}
                              size="lg"
                              leftSection={<IconRotateClockwise2 size={16} />}
                              variant="filled"
                            >
                              Next Battle
                            </Button>
                          </Group>
                        </Stack>
                      )}
                    </Stack>
                  </Center>
                </div>
              ) : (
                <Center py="xl">
                  <Stack align="center" gap="md">
                    <Box 
                      w={64} 
                      h={64} 
                      bg={colorScheme === 'dark' ? 'dark.6' : 'gray.1'} 
                      style={{ 
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center', 
                        justifyContent: 'center'
                      }}
                    >
                      <IconSwords size={32} color="var(--mantine-color-gray-6)" />
                    </Box>
                    <Title order={3} size="h3">No Battle Available</Title>
                    <Text c="dimmed" ta="center" mb="md">
                      Ready to start your Pokemon battle prediction journey?
                    </Text>
                    <Button onClick={handleNewBattle} size="lg" leftSection={<IconStar size={20} />}>
                      Start First Battle
                    </Button>
                  </Stack>
                </Center>
              )}
            </Card.Section>
          </Card>
        </FadeIn>
      </Box>

      {/* Streak Celebration */}
      <StreakCelebration
        streak={streak}
        isVisible={showStreakCelebration}
        onAnimationComplete={() => setShowStreakCelebration(false)}
      />

      {/* Stats Bar */}
      <FadeIn delay={0.2}>
        <Grid gutter="md" mt="xl">
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Card withBorder>
              <Stack align="center" gap="xs" p="md">
                <IconTrophy size={24} color="var(--mantine-color-yellow-6)" />
                <Text size="xl" fw={700}>
                  {score}
                </Text>
                <Text size="sm" c="dimmed">Score</Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 6, md: 3 }}>
            <Card 
              withBorder 
              style={{ 
                transition: 'all 0.3s ease'
              }}
            >
              <Stack align="center" gap="xs" p="md">
                {streak > 0 ? (
                  <IconFlame size={24} color="var(--mantine-color-red-6)" />
                ) : (
                  <IconBolt size={24} color="var(--mantine-color-gray-6)" />
                )}
                <Text size="xl" fw={700} c={streak > 0 ? 'red.6' : undefined}>
                  {streak}
                </Text>
                <Text size="sm" c={streak > 0 ? 'red.6' : 'dimmed'}>
                  {streak > 0 ? `🔥 Streak` : 'Streak'}
                </Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 6, md: 3 }}>
            <Card withBorder>
              <Stack align="center" gap="xs" p="md">
                <IconTarget size={24} color="var(--mantine-color-blue-6)" />
                <Text size="xl" fw={700}>
                  {getAccuracy()}%
                </Text>
                <Text size="sm" c="dimmed">Accuracy</Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 6, md: 3 }}>
            <Card withBorder>
              <Stack align="center" gap="xs" p="md">
                <IconSwords size={24} color="var(--mantine-color-grape-6)" />
                <Text size="xl" fw={700}>
                  {totalGuesses}
                </Text>
                <Text size="sm" c="dimmed">Battles</Text>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </FadeIn>
    </>
  );
};

export default BattleArena;