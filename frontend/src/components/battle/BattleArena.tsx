import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Slider, Group, Text, Grid, Box, Stack, Title, Center, Loader, useMantineTheme, useMantineColorScheme, Tooltip } from '@mantine/core';
import { CenterDraggableRangeSlider } from '../ui/CenterDraggableRangeSlider';
import { useGameStore } from '../../store/gameStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useEndlessStore } from '../../store/endlessStore';
import { BattleLoading } from '../ui/loading';
import { FadeIn, SlideIn, ResultReveal, BounceIn, ScaleIn } from '../ui/transitions';
import StreakCelebration from '../ui/streak-celebration';
import { getTypeColor, getCategoryIcon } from '../../utils/typeColors';
import { getTypeEffectiveness, formatTypeList } from '../../utils/typeEffectiveness';
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
  guessRange?: [number, number];
  totalBattles?: number;
  compact?: boolean;
}

export const PokemonBattleCard: React.FC<PokemonBattleCardProps> = ({
  pokemon,
  showResults,
  position,
  winPercentage,
  guessPercentage,
  guessRange,
  totalBattles,
  compact = false
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  
  const badgeStyle = {
    minWidth: '120px',
    height: '36px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 16px',
    fontSize: '14px',
    fontWeight: 600,
    borderRadius: '18px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
  };
  
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


  const displayWinPercentage = winPercentage !== undefined ? winPercentage.toFixed(1) : showResults ? ((pokemon.wins / 100) * 100).toFixed(1) : null;

  // Calculate dynamic sprite size based on guess percentage
  const calculateSpriteSize = () => {
    if (compact) {
      // Smaller sizes for compact mode
      if (showResults) return 120;
      const effectiveGuess = guessRange 
        ? Math.round((guessRange[0] + guessRange[1]) / 2)
        : guessPercentage;
      if (effectiveGuess === undefined || effectiveGuess === null) return 120;
      const minSize = 80;
      const maxSize = 160;
      const percentage = effectiveGuess;
      const scaleFactor = percentage / 100;
      const size = minSize + (maxSize - minSize) * scaleFactor;
      return Math.round(size);
    }
    
    if (showResults) return 320; // Default size when showing results (2x bigger)
    
    // Use range midpoint if range is provided, otherwise use guessPercentage
    const effectiveGuess = guessRange 
      ? Math.round((guessRange[0] + guessRange[1]) / 2)
      : guessPercentage;
      
    if (effectiveGuess === undefined || effectiveGuess === null) return 320;
    
    const minSize = 240; // 2x bigger (was 120)
    const maxSize = 400; // 2x bigger (was 200)
    
    // The effectiveGuess now represents the win percentage for the specific Pokemon
    // So we use it directly for sizing
    const percentage = effectiveGuess;
    
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
        <Card.Section p="lg" pos="relative">
          <Group 
            pos="absolute" 
            top="lg" 
            left="lg"
            gap="sm"
          >
            <Text 
              size="lg" 
              c="dimmed" 
            >
              Lv.{pokemon.level}
            </Text>
            {pokemon.shiny && (
              <Badge
                variant="dot"
                size="md"
                color="yellow"
              >
                ✨ Shiny
              </Badge>
            )}
          </Group>
          <Box mb="xl">
            <Title order={2} size="h1" fw={700} tt="capitalize" ta="center">
              {pokemon.name}
            </Title>
          </Box>
          
          <Box 
            pos="relative" 
            ta="center" 
            style={{
              height: '240px', // Further reduced height
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {pokemon.sprites?.front ? (
              <Box pos="relative">
                <img 
                  src={pokemon.shiny && pokemon.sprites.shiny ? pokemon.sprites.shiny : pokemon.sprites.front} 
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
          </Box>
        </Card.Section>

        <Card.Section p="md">
          <Stack gap="sm">
            {/* Types */}
            {pokemon.types && pokemon.types.length > 0 && (
              <Group justify="center" gap="sm">
                {pokemon.types.map((type: string) => {
                  const effectiveness = getTypeEffectiveness(type);
                  return (
                    <Tooltip
                      key={type}
                      label={
                        <Box>
                          <Text size="xs" fw={600} tt="capitalize" mb={4}>{type} Type</Text>
                          {effectiveness.weakTo.length > 0 && (
                            <>
                              <Text size="xs" c="red.4">Weak to (2x):</Text>
                              <Text size="xs" mb={4}>{formatTypeList(effectiveness.weakTo)}</Text>
                            </>
                          )}
                          {effectiveness.resistantTo.length > 0 && (
                            <>
                              <Text size="xs" c="green.4">Resistant to (0.5x):</Text>
                              <Text size="xs" mb={4}>{formatTypeList(effectiveness.resistantTo)}</Text>
                            </>
                          )}
                          {effectiveness.immuneTo.length > 0 && (
                            <>
                              <Text size="xs" c="blue.4">Immune to (0x):</Text>
                              <Text size="xs">{formatTypeList(effectiveness.immuneTo)}</Text>
                            </>
                          )}
                        </Box>
                      }
                      position="top"
                      withArrow
                      multiline
                      styles={{ tooltip: { maxWidth: 250 } }}
                    >
                      <Badge
                        size="lg"
                        variant="filled"
                        color={getTypeColor(type)}
                        tt="capitalize"
                        style={{ 
                          ...badgeStyle,
                          fontWeight: 700,
                          cursor: 'help',
                        }}
                        onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.transform = 'scale(1.1)')}
                        onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        {type}
                      </Badge>
                    </Tooltip>
                  );
                })}
              </Group>
            )}

            {/* Ability and Item */}
            <Group justify="center" gap="md">
              {pokemon.ability && (
                pokemon.abilityDetail ? (
                  <Tooltip
                    label={
                      <Box maw={300}>
                        <Text size="xs" fw={600} tt="capitalize" mb={4}>{pokemon.abilityDetail.name}</Text>
                        <Text size="xs">{pokemon.abilityDetail.shortEffect || pokemon.abilityDetail.effect}</Text>
                      </Box>
                    }
                    position="top"
                    withArrow
                    multiline
                  >
                    <Badge
                      variant="light"
                      size="md"
                      color="blue"
                      leftSection={<IconBolt size={14} />}
                      tt="capitalize"
                      style={{ 
                        ...badgeStyle,
                        cursor: 'help'
                      }}
                    >
                      {pokemon.ability}
                    </Badge>
                  </Tooltip>
                ) : (
                  <Badge
                    variant="light"
                    size="md"
                    color="blue"
                    leftSection={<IconBolt size={14} />}
                    tt="capitalize"
                    style={badgeStyle}
                  >
                    {pokemon.ability}
                  </Badge>
                )
              )}
              {pokemon.item ? (
                pokemon.itemDetail ? (
                  <Tooltip
                    label={
                      <Box maw={300}>
                        <Text size="xs" fw={600} tt="capitalize" mb={4}>{formatItemName(pokemon.itemDetail.name)}</Text>
                        <Text size="xs">{pokemon.itemDetail.shortEffect || pokemon.itemDetail.effect}</Text>
                      </Box>
                    }
                    position="top"
                    withArrow
                    multiline
                  >
                    <Badge
                      variant="outline"
                      size="md"
                      color="teal"
                      leftSection={<IconStar size={14} />}
                      tt="capitalize"
                      style={{ 
                        ...badgeStyle,
                        fontWeight: 500,
                        cursor: 'help'
                      }}
                    >
                      {formatItemName(pokemon.item)}
                    </Badge>
                  </Tooltip>
                ) : (
                  <Badge
                    variant="outline"
                    size="md"
                    color="teal"
                    leftSection={<IconStar size={14} />}
                    tt="capitalize"
                    style={{ 
                      ...badgeStyle,
                      fontWeight: 500
                    }}
                  >
                    {formatItemName(pokemon.item)}
                  </Badge>
                )
              ) : (
                <Badge
                  variant="outline"
                  size="md"
                  color="gray"
                  leftSection={<IconStar size={14} />}
                  style={{ 
                    ...badgeStyle,
                    fontWeight: 500
                  }}
                >
                  No Item
                </Badge>
              )}
            </Group>

            {/* Moves */}
            {pokemon.moves && pokemon.moves.length > 0 && (
              <Box>
                <Grid gutter="xs">
                  {pokemon.moveDetails ? (
                    // If we have move details, show colored buttons with tooltips
                    // Always render 4 cells, fill with empty if needed
                    Array.from({ length: 4 }).map((_, index) => {
                      const moveDetail = pokemon.moveDetails[index];
                      
                      if (!moveDetail) {
                        // Empty cell
                        return (
                          <Grid.Col key={index} span={6}>
                            <Box 
                              ta="center" 
                              p="sm" 
                              style={{ 
                                backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                                borderRadius: '4px',
                                border: colorScheme === 'dark' ? `1px solid ${theme.colors.gray[8]}` : `1px solid ${theme.colors.gray[3]}`,
                                opacity: 0.3,
                                minHeight: '42px'
                              }}
                            />
                          </Grid.Col>
                        );
                      }
                      
                      const typeColor = getTypeColor(moveDetail.type);
                      const bgOpacity = colorScheme === 'dark' ? '20' : '15'; // hex opacity
                      const borderOpacity = colorScheme === 'dark' ? '80' : '60'; // hex opacity
                      
                      return (
                        <Grid.Col key={index} span={6}>
                          <Tooltip
                            label={
                              <Box>
                                <Text size="xs" fw={600} tt="capitalize">{moveDetail.name}</Text>
                                <Text size="xs">Type: {moveDetail.type}</Text>
                                <Text size="xs">Category: {getCategoryIcon(moveDetail.category)} {moveDetail.category}</Text>
                                {moveDetail.power && <Text size="xs">Power: {moveDetail.power}</Text>}
                                {moveDetail.accuracy && <Text size="xs">Accuracy: {moveDetail.accuracy}%</Text>}
                                <Text size="xs">PP: {moveDetail.pp}</Text>
                                {moveDetail.description && (
                                  <>
                                    <Box h={4} />
                                    <Text size="xs" c="dimmed">{moveDetail.description}</Text>
                                  </>
                                )}
                              </Box>
                            }
                            position="top"
                            withArrow
                            multiline
                            styles={{ tooltip: { maxWidth: 300 } }}
                          >
                            <Box 
                              ta="center" 
                              p="sm" 
                              style={{ 
                                backgroundColor: `${typeColor}${bgOpacity}`,
                                borderRadius: '4px', 
                                border: `1px solid ${typeColor}${borderOpacity}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                minHeight: '42px'
                              }}
                              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                                e.currentTarget.style.transform = 'scale(1.02)';
                                e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)';
                                e.currentTarget.style.backgroundColor = `${typeColor}30`; // 30% opacity on hover
                              }}
                              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.backgroundColor = `${typeColor}${bgOpacity}`;
                              }}
                            >
                              <Text size="sm" fw={600} tt="capitalize" style={{ color: typeColor }}>
                                {moveDetail.name}
                              </Text>
                            </Box>
                          </Tooltip>
                        </Grid.Col>
                      );
                    })
                  ) : (
                    // Fallback to regular moves if no details - also ensure 4 cells
                    Array.from({ length: 4 }).map((_, index) => {
                      const move = pokemon.moves[index];
                      
                      if (!move) {
                        // Empty cell
                        return (
                          <Grid.Col key={index} span={6}>
                            <Box 
                              ta="center" 
                              p="sm" 
                              style={{ 
                                backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                                borderRadius: '4px',
                                border: colorScheme === 'dark' ? `1px solid ${theme.colors.gray[8]}` : `1px solid ${theme.colors.gray[3]}`,
                                opacity: 0.3,
                                minHeight: '42px'
                              }}
                            />
                          </Grid.Col>
                        );
                      }
                      
                      return (
                        <Grid.Col key={index} span={6}>
                          <Box 
                            ta="center" 
                            p="sm" 
                            style={{ 
                              backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0], 
                              borderRadius: '4px', 
                              border: colorScheme === 'dark' ? `1px solid ${theme.colors.gray[8]}` : `1px solid ${theme.colors.gray[3]}`,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              minHeight: '42px'
                            }}
                            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                              e.currentTarget.style.transform = 'scale(1.02)';
                              e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)';
                            }}
                            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <Text size="sm" fw={600} tt="capitalize">{move}</Text>
                          </Box>
                        </Grid.Col>
                      );
                    })
                  )}
                </Grid>
              </Box>
            )}

            {/* Stats */}
            {pokemon.stats && (
              <Box>
                <Group gap="xs" justify="center">
                  <Box ta="center" px="md" py="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.red[0], borderRadius: '4px', border: colorScheme === 'dark' ? `1px solid ${theme.colors.red[8]}` : 'none', minWidth: '60px' }}>
                    <Text size="xs" fw={600} c={colorScheme === 'dark' ? 'red.4' : 'red.7'}>HP</Text>
                    <Text size="sm" fw={700}>{pokemon.stats.hp}</Text>
                  </Box>
                  <Box ta="center" px="md" py="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.orange[0], borderRadius: '4px', border: colorScheme === 'dark' ? `1px solid ${theme.colors.orange[8]}` : 'none', minWidth: '60px' }}>
                    <Text size="xs" fw={600} c={colorScheme === 'dark' ? 'orange.4' : 'orange.7'}>ATK</Text>
                    <Text size="sm" fw={700}>{pokemon.stats.attack}</Text>
                  </Box>
                  <Box ta="center" px="md" py="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.yellow[0], borderRadius: '4px', border: colorScheme === 'dark' ? `1px solid ${theme.colors.yellow[8]}` : 'none', minWidth: '60px' }}>
                    <Text size="xs" fw={600} c={colorScheme === 'dark' ? 'yellow.4' : 'yellow.7'}>DEF</Text>
                    <Text size="sm" fw={700}>{pokemon.stats.defense}</Text>
                  </Box>
                  <Box ta="center" px="md" py="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.blue[0], borderRadius: '4px', border: colorScheme === 'dark' ? `1px solid ${theme.colors.blue[8]}` : 'none', minWidth: '60px' }}>
                    <Text size="xs" fw={600} c={colorScheme === 'dark' ? 'blue.4' : 'blue.7'}>SPA</Text>
                    <Text size="sm" fw={700}>{pokemon.stats.specialAttack}</Text>
                  </Box>
                  <Box ta="center" px="md" py="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.teal[0], borderRadius: '4px', border: colorScheme === 'dark' ? `1px solid ${theme.colors.teal[8]}` : 'none', minWidth: '60px' }}>
                    <Text size="xs" fw={600} c={colorScheme === 'dark' ? 'teal.4' : 'teal.7'}>SPD</Text>
                    <Text size="sm" fw={700}>{pokemon.stats.specialDefense}</Text>
                  </Box>
                  <Box ta="center" px="md" py="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.pink[0], borderRadius: '4px', border: colorScheme === 'dark' ? `1px solid ${theme.colors.pink[8]}` : 'none', minWidth: '60px' }}>
                    <Text size="xs" fw={600} c={colorScheme === 'dark' ? 'pink.4' : 'pink.7'}>SPE</Text>
                    <Text size="sm" fw={700}>{pokemon.stats.speed}</Text>
                  </Box>
                </Group>
              </Box>
            )}

            {/* Nature and IVs */}
            <Box>
              <Group justify="center" gap="xs">
                {pokemon.nature && (
                  <Badge
                    variant="dot"
                    size="md"
                    color="violet"
                    tt="capitalize"
                  >
                    {pokemon.nature} Nature
                  </Badge>
                )}
                <Badge
                  variant="dot"
                  size="md"
                  color="green"
                >
                  Perfect IVs
                </Badge>
              </Group>
            </Box>

            {/* Battle Results */}
            {showResults && (
              <ScaleIn delay={0.5}>
                <Box bg={colorScheme === 'dark' ? 'dark.6' : 'gray.0'} p="lg" style={{ borderRadius: '8px' }} ta="center">
                  <Text size="sm" c="gray.6" mb="xs">Battle Results</Text>
                  <Text size="xl" fw={700} c="blue.6" mb="xs">
                    {displayWinPercentage}%
                  </Text>
                  <Text size="sm" c="gray.6">
                    {pokemon.wins} out of {totalBattles || 999} wins
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

interface BattleArenaProps {
  hideStats?: boolean;
}

const BattleArena: React.FC<BattleArenaProps> = ({ hideStats = false }) => {
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
  const { isEndlessActive, endlessScore } = useEndlessStore();

  const [guessPercentage, setGuessPercentage] = useState<number>(50);
  
  // Calculate range width based on endless score (starts at 50%, shrinks by 1% per score, minimum 20%)
  const calculateRangeWidth = () => {
    if (!isEndlessActive) return 20; // Default for non-endless mode
    const baseWidth = 50;
    const shrinkPerScore = 1;
    const minWidth = 20;
    const score = endlessScore || 0; // Ensure we have a valid number
    return Math.max(minWidth, baseWidth - (score * shrinkPerScore));
  };
  
  const [guessRange, setGuessRange] = useState<[number, number]>(() => {
    const width = calculateRangeWidth();
    const center = 50;
    const min = Math.round(center - width / 2);
    const max = Math.round(center + width / 2);
    return [min, max];
  });
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

  // Update range width when endless score changes
  useEffect(() => {
    if (isEndlessActive) {
      const width = calculateRangeWidth();
      setGuessRange(prevRange => {
        const center = prevRange[0] + (prevRange[1] - prevRange[0]) / 2;
        const rawMin = center - width / 2;
        const rawMax = center + width / 2;
        let newMin = Math.max(0, Math.min(100 - width, rawMin));
        let newMax = Math.min(100, Math.max(width, rawMax));
        
        // Ensure we maintain exact boundaries at 0 and 100
        if (newMin <= 0.5) newMin = 0;
        if (newMax >= 99.5) newMax = 100;
        
        return [Math.round(newMin), Math.round(newMax)];
      });
    }
  }, [endlessScore, isEndlessActive]);

  const handleSliderChange = (value: number[]) => {
    if (isLoading || showResults) return;
    setGuessPercentage(value[0]);
  };

  const handleRangeSliderChange = (value: [number, number]) => {
    if (isLoading || showResults) return;
    setGuessRange(value);
  };

  const handleSubmitGuess = async () => {
    if (!currentBattle) return;
    
    try {
      // Invert the values since slider right = right Pokemon wins more
      // But backend expects left Pokemon win percentage
      const result = isEndlessActive 
        ? await submitGuess(Math.round((100 - guessRange[1] + 100 - guessRange[0]) / 2), [100 - guessRange[1], 100 - guessRange[0]])
        : await submitGuess(100 - guessPercentage);
      
      setGuessResult(result);
      setShowResults(true);
    } catch (error) {
      console.error('Error submitting guess:', error);
    }
  };

  const handleNewBattle = () => {
    setShowResults(false);
    setGuessResult(null);
    setGuessPercentage(50);
    // Reset range to default width for endless mode
    if (isEndlessActive) {
      const width = calculateRangeWidth();
      const center = 50;
      setGuessRange([Math.round(center - width / 2), Math.round(center + width / 2)]);
    }
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
              {isLoading && !currentBattle ? (
                <div className="py-16">
                  <BattleLoading 
                    pokemon1Name={'Pokemon'} 
                    pokemon2Name={'Pokemon'} 
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
                      </Stack>
                    </Center>
                    
                    <Grid gutter={{ base: 'md', md: 'xl' }} align="flex-start" justify="center" maw={1200} mx="auto">
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        {/* Pokemon 1 */}
                        <FadeIn key={`pokemon1-${currentBattle.pokemon1.id}`}>
                          <PokemonBattleCard
                            pokemon={currentBattle.pokemon1}
                            showResults={showResults}
                            position="left"
                            winPercentage={showResults ? guessResult?.actualWinRate : undefined}
                            guessPercentage={!showResults && !isEndlessActive ? (100 - guessPercentage) : undefined}
                            guessRange={!showResults && isEndlessActive ? [100 - guessRange[1], 100 - guessRange[0]] : undefined}
                            totalBattles={currentBattle.totalBattles}
                          />
                        </FadeIn>
                      </Grid.Col>

                      {/* VS Badge - Positioned absolutely on larger screens */}
                      <Box 
                        pos="absolute" 
                        top="40%" 
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
                        <FadeIn key={`pokemon2-${currentBattle.pokemon2.id}`}>
                          <PokemonBattleCard
                            pokemon={currentBattle.pokemon2}
                            showResults={showResults}
                            position="right"
                            winPercentage={showResults ? (100 - (guessResult?.actualWinRate || 0)) : undefined}
                            guessPercentage={!showResults && !isEndlessActive ? guessPercentage : undefined}
                            guessRange={!showResults && isEndlessActive ? guessRange : undefined}
                            totalBattles={currentBattle.totalBattles}
                          />
                        </FadeIn>
                      </Grid.Col>
                    </Grid>
                  
                  </div>

                  {/* Win Rate Prediction Slider */}
                  {!showResults && (
                    <Box maw={800} mx="auto" mt="xl">
                      
                      <Card withBorder p="xl" shadow="lg" style={{ borderColor: colorScheme === 'dark' ? theme.colors.blue[7] : theme.colors.blue[3], borderWidth: '2px' }}>
                        <Box pos="relative" mb="xl">
                          <Group justify="space-between" align="center">
                            <Stack align="flex-start" gap="xs">
                              <Text fw={600} size="lg">{currentBattle.pokemon1.name}</Text>
                              {isEndlessActive ? (
                                <Text size="xl" fw={700} c="blue.6">{100 - guessRange[1]}% - {100 - guessRange[0]}%</Text>
                              ) : (
                                <Text size="xl" fw={700} c="blue.6">{100 - guessPercentage}%</Text>
                              )}
                            </Stack>
                            <Stack align="flex-end" gap="xs">
                              <Text fw={600} size="lg">{currentBattle.pokemon2.name}</Text>
                              {isEndlessActive ? (
                                <Text size="xl" fw={700} c="grape.6">
                                  {guessRange[0]}% - {guessRange[1]}%
                                </Text>
                              ) : (
                                <Text size="xl" fw={700} c="grape.6">{guessPercentage}%</Text>
                              )}
                            </Stack>
                          </Group>
                          <Text 
                            size="xl" 
                            fw={700} 
                            pos="absolute" 
                            top="50%" 
                            left="50%" 
                            style={{ transform: 'translate(-50%, -50%)' }}
                          >
                            VS
                          </Text>
                        </Box>
                        
                        <Stack gap="md">
                          {isEndlessActive ? (
                            <CenterDraggableRangeSlider
                              value={guessRange}
                              onChange={handleRangeSliderChange}
                              min={0}
                              max={100}
                              step={1}
                              disabled={isLoading}
                              color="blue"
                              size="xl"
                              label={(value) => `${value}%`}
                              hideHandles={true}
                              disableIndividualDrag={true}
                            />
                          ) : (
                            <Slider
                              value={guessPercentage}
                              onChange={(value) => handleSliderChange([value])}
                              min={0}
                              max={100}
                              step={1}
                              disabled={isLoading}
                              color="blue"
                              size="xl"
                              styles={{
                                root: { padding: '12px 0' },
                                track: { height: '12px' },
                                bar: { height: '12px' },
                                thumb: { width: '24px', height: '24px' }
                              }}
                            />
                          )}
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
                              <Box maw={800} mx="auto">
                                <Card 
                                  withBorder 
                                  p="xl"
                                  shadow="lg"
                                  style={{
                                    backgroundColor: guessResult.isCorrect 
                                      ? colorScheme === 'dark' ? theme.colors.green[9] : theme.colors.green[0]
                                      : colorScheme === 'dark' ? theme.colors.red[9] : theme.colors.red[0],
                                    borderColor: guessResult.isCorrect 
                                      ? colorScheme === 'dark' ? theme.colors.green[7] : theme.colors.green[3]
                                      : colorScheme === 'dark' ? theme.colors.red[7] : theme.colors.red[3],
                                    borderWidth: '2px',
                                    minHeight: '180px'
                                  }}
                                >
                                  <Stack align="center" gap="md" justify="center" style={{ minHeight: '120px' }}>
                                    <Text 
                                      size="xl" 
                                      fw={700} 
                                      c={guessResult.isCorrect ? 'green.7' : 'red.7'}
                                    >
                                      {guessResult.isCorrect ? '🎉 Correct!' : '❌ Incorrect!'}
                                    </Text>
                                    <Text size="lg">
                                      Your guess: <Text component="span" fw={700}>
                                        {isEndlessActive 
                                          ? `${100 - guessRange[1]}% - ${100 - guessRange[0]}% for ${currentBattle.pokemon1.name}`
                                          : `${100 - guessResult.guessPercentage}% for ${currentBattle.pokemon1.name}`
                                        }
                                      </Text>
                                    </Text>
                                    <Text size="lg">
                                      Actual win rate: <Text component="span" fw={700} c="blue.6">{guessResult.actualWinRate.toFixed(1)}%</Text>
                                    </Text>
                                  </Stack>
                                </Card>
                              </Box>
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
      {!hideStats && (
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
      )}
    </>
  );
};

export default BattleArena;