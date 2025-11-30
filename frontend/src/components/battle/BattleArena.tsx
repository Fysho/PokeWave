import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Slider, Group, Text, Grid, Box, Stack, Title, Center, Loader, useMantineTheme, useMantineColorScheme, Tooltip } from '@mantine/core';
import { CenterDraggableRangeSlider } from '../ui/CenterDraggableRangeSlider';
import { TypeColorSlider } from '../ui/TypeColorSlider';
import MoveSelector from '../ui/MoveSelector';
import { useGameStore } from '../../store/gameStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useEndlessStore } from '../../store/endlessStore';
import { FadeIn, SlideIn, BounceIn } from '../ui/transitions';
// import StreakCelebration from '../ui/streak-celebration'; // Disabled to prevent flying text
import { getTypeColor, getCategoryIcon } from '../../utils/typeColors';
import { getTypeEffectiveness, formatTypeList } from '../../utils/typeEffectiveness';
import { api } from '../../services/api';
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
  debugMode?: boolean;
  onMoveChange?: (pokemonId: number, moveIndex: number, newMove: any) => void;
}

export const PokemonBattleCard: React.FC<PokemonBattleCardProps> = ({
  pokemon,
  showResults,
  position,
  winPercentage,
  guessPercentage,
  guessRange,
  totalBattles,
  compact = false,
  debugMode = false,
  onMoveChange
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [selectedMoveIndex, setSelectedMoveIndex] = useState<number | null>(null);
  const [availableMoves, setAvailableMoves] = useState<any[]>([]);
  
  // Fetch available moves when in debug mode
  useEffect(() => {
    if (debugMode && pokemon?.id) {
      const fetchAvailableMoves = async () => {
        try {
          const response = await api.get(`/pokemon/${pokemon.id}/available-moves?generation=${pokemon.generation || 9}&level=${pokemon.level || 50}&debugMode=true`);
          setAvailableMoves(response.data.moves || []);
        } catch (error) {
          console.error('Failed to fetch available moves:', error);
          // Fallback to showing current moves
          setAvailableMoves(pokemon.moveDetails || []);
        }
      };
      
      fetchAvailableMoves();
    }
  }, [debugMode, pokemon?.id, pokemon?.generation, pokemon?.level]);
  
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
                            <Box mb={4}>
                              <Text size="xs">Weak to (2x):</Text>
                              <Group gap={4}>
                                {effectiveness.weakTo.map((weakType, idx) => (
                                  <Text 
                                    key={idx} 
                                    size="xs" 
                                    c={getTypeColor(weakType)}
                                    tt="capitalize"
                                    span
                                  >
                                    {weakType}{idx < effectiveness.weakTo.length - 1 ? ',' : ''}
                                  </Text>
                                ))}
                              </Group>
                            </Box>
                          )}
                          {effectiveness.resistantTo.length > 0 && (
                            <Box mb={4}>
                              <Text size="xs">Resistant to (0.5x):</Text>
                              <Group gap={4}>
                                {effectiveness.resistantTo.map((resistType, idx) => (
                                  <Text 
                                    key={idx} 
                                    size="xs" 
                                    c={getTypeColor(resistType)}
                                    tt="capitalize"
                                    span
                                  >
                                    {resistType}{idx < effectiveness.resistantTo.length - 1 ? ',' : ''}
                                  </Text>
                                ))}
                              </Group>
                            </Box>
                          )}
                          {effectiveness.immuneTo.length > 0 && (
                            <Box>
                              <Text size="xs">Immune to (0x):</Text>
                              <Group gap={4}>
                                {effectiveness.immuneTo.map((immuneType, idx) => (
                                  <Text 
                                    key={idx} 
                                    size="xs" 
                                    c={getTypeColor(immuneType)}
                                    tt="capitalize"
                                    span
                                  >
                                    {immuneType}{idx < effectiveness.immuneTo.length - 1 ? ',' : ''}
                                  </Text>
                                ))}
                              </Group>
                            </Box>
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
                      leftSection={
                        pokemon.itemDetail.sprite ? (
                          <img
                            src={pokemon.itemDetail.sprite}
                            alt={pokemon.itemDetail.name}
                            style={{ width: 16, height: 16, imageRendering: 'pixelated' }}
                          />
                        ) : (
                          <IconStar size={14} />
                        )
                      }
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
                                opacity: debugMode ? 0.6 : 0.3,
                                minHeight: '42px',
                                cursor: debugMode ? 'pointer' : 'default',
                                transition: 'all 0.2s ease',
                                ...(debugMode && {
                                  outline: '2px dashed transparent',
                                  outlineOffset: '2px'
                                })
                              }}
                              onClick={() => {
                                if (debugMode) {
                                  setSelectedMoveIndex(index);
                                }
                              }}
                              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                                if (debugMode) {
                                  e.currentTarget.style.opacity = '0.8';
                                  e.currentTarget.style.outline = '2px dashed var(--mantine-color-yellow-6)';
                                }
                              }}
                              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                                if (debugMode) {
                                  e.currentTarget.style.opacity = '0.6';
                                  e.currentTarget.style.outline = '2px dashed transparent';
                                }
                              }}
                            >
                              {debugMode && (
                                <Text size="xs" c="dimmed" fs="italic">
                                  + Add Move
                                </Text>
                              )}
                            </Box>
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
                                cursor: debugMode ? 'pointer' : 'default',
                                transition: 'all 0.2s ease',
                                minHeight: '42px',
                                position: 'relative',
                                ...(debugMode && {
                                  outline: '2px dashed transparent',
                                  outlineOffset: '2px'
                                })
                              }}
                              onClick={() => {
                                if (debugMode) {
                                  setSelectedMoveIndex(index);
                                }
                              }}
                              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                                e.currentTarget.style.transform = 'scale(1.02)';
                                e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)';
                                e.currentTarget.style.backgroundColor = `${typeColor}30`; // 30% opacity on hover
                                if (debugMode) {
                                  e.currentTarget.style.outline = '2px dashed var(--mantine-color-yellow-6)';
                                }
                              }}
                              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.backgroundColor = `${typeColor}${bgOpacity}`;
                                if (debugMode) {
                                  e.currentTarget.style.outline = '2px dashed transparent';
                                }
                              }}
                            >
                              <Text size="sm" fw={600} tt="capitalize" style={{ color: typeColor }}>
                                {moveDetail.name}
                              </Text>
                              {debugMode && (
                                <Badge
                                  size="xs"
                                  color="yellow"
                                  variant="filled"
                                  style={{
                                    position: 'absolute',
                                    top: -8,
                                    right: -8,
                                    fontSize: '10px'
                                  }}
                                >
                                  EDIT
                                </Badge>
                              )}
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
                                opacity: debugMode ? 0.6 : 0.3,
                                minHeight: '42px',
                                cursor: debugMode ? 'pointer' : 'default',
                                transition: 'all 0.2s ease',
                                ...(debugMode && {
                                  outline: '2px dashed transparent',
                                  outlineOffset: '2px'
                                })
                              }}
                              onClick={() => {
                                if (debugMode) {
                                  setSelectedMoveIndex(index);
                                }
                              }}
                              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                                if (debugMode) {
                                  e.currentTarget.style.opacity = '0.8';
                                  e.currentTarget.style.outline = '2px dashed var(--mantine-color-yellow-6)';
                                }
                              }}
                              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                                if (debugMode) {
                                  e.currentTarget.style.opacity = '0.6';
                                  e.currentTarget.style.outline = '2px dashed transparent';
                                }
                              }}
                            >
                              {debugMode && (
                                <Text size="xs" c="dimmed" fs="italic">
                                  + Add Move
                                </Text>
                              )}
                            </Box>
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
                              cursor: debugMode ? 'pointer' : 'default',
                              transition: 'all 0.2s ease',
                              minHeight: '42px',
                              position: 'relative',
                              ...(debugMode && {
                                outline: '2px dashed transparent',
                                outlineOffset: '2px'
                              })
                            }}
                            onClick={() => {
                              if (debugMode) {
                                setSelectedMoveIndex(index);
                              }
                            }}
                            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                              e.currentTarget.style.transform = 'scale(1.02)';
                              e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)';
                              if (debugMode) {
                                e.currentTarget.style.outline = '2px dashed var(--mantine-color-yellow-6)';
                              }
                            }}
                            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = 'none';
                              if (debugMode) {
                                e.currentTarget.style.outline = '2px dashed transparent';
                              }
                            }}
                          >
                            <Text size="sm" fw={600} tt="capitalize">{move}</Text>
                            {debugMode && (
                              <Badge
                                size="xs"
                                color="yellow"
                                variant="filled"
                                style={{
                                  position: 'absolute',
                                  top: -8,
                                  right: -8,
                                  fontSize: '10px'
                                }}
                              >
                                EDIT
                              </Badge>
                            )}
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

          </Stack>
        </Card.Section>
      </Card>
      
      {/* Move Selector Modal */}
      {debugMode && selectedMoveIndex !== null && pokemon.moveDetails && (
        <MoveSelector
          opened={selectedMoveIndex !== null}
          onClose={() => setSelectedMoveIndex(null)}
          currentMove={pokemon.moveDetails[selectedMoveIndex]?.name || ''}
          pokemonName={pokemon.name}
          pokemonId={pokemon.id}
          onSelectMove={(move) => {
            if (onMoveChange && selectedMoveIndex !== null) {
              onMoveChange(pokemon.id, selectedMoveIndex, move);
            }
            setSelectedMoveIndex(null);
          }}
          availableMoves={availableMoves}
        />
      )}
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
    updatePokemonMove,
  } = useGameStore();
  
  const { battleSettings } = useSettingsStore();
  const { isEndlessActive, endlessScore } = useEndlessStore();

  const [guessPercentage, setGuessPercentage] = useState<number>(50);
  
  // Handler for move changes in debug mode
  const handleMoveChange = async (pokemonId: number, moveIndex: number, newMove: any) => {
    try {
      // Update the move in the store
      if (updatePokemonMove) {
        await updatePokemonMove(pokemonId, moveIndex, newMove);
      }
      
      // Also update the backend instance
      await api.post(`/pokemon/${pokemonId}/update-move`, {
        moveIndex,
        newMove
      });
    } catch (error) {
      console.error('Failed to update move:', error);
    }
  };
  
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
  // const [showStreakCelebration, setShowStreakCelebration] = useState(false); // Disabled
  // const [lastStreakShown, setLastStreakShown] = useState(0); // Disabled

  // Removed automatic battle generation on mount
  // Now users must click "New Battle" button to start

  useEffect(() => {
    setGuessPercentage(50);
    setShowResults(false);
    setGuessResult(null);
  }, [currentBattle]);

  // Streak celebration disabled to prevent flying text
  // useEffect(() => {
  //   if (streak > lastStreakShown && streak >= 2) {
  //     setShowStreakCelebration(true);
  //     setLastStreakShown(streak);
  //   } else if (streak === 0) {
  //     setLastStreakShown(0);
  //   }
  // }, [streak, lastStreakShown]);

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
      // Now the slider value directly represents Pokemon 1's win percentage
      const result = isEndlessActive 
        ? await submitGuess(Math.round((guessRange[0] + guessRange[1]) / 2), guessRange)
        : await submitGuess(guessPercentage);
      
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
                <Center py="xl">
                  <Loader size="lg" />
                </Center>
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
                        <FadeIn key={`pokemon1-${currentBattle.battleInstanceId || currentBattle.battleId}-${currentBattle.pokemon1.id}`}>
                          <PokemonBattleCard
                            pokemon={currentBattle.pokemon1}
                            showResults={showResults}
                            position="left"
                            winPercentage={showResults ? guessResult?.actualWinRate : undefined}
                            guessPercentage={!showResults && !isEndlessActive ? guessPercentage : undefined}
                            guessRange={!showResults && isEndlessActive ? guessRange : undefined}
                            totalBattles={currentBattle.totalBattles}
                            debugMode={battleSettings?.debugMode || false}
                            onMoveChange={handleMoveChange}
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
                        <FadeIn key={`pokemon2-${currentBattle.battleInstanceId || currentBattle.battleId}-${currentBattle.pokemon2.id}`}>
                          <PokemonBattleCard
                            pokemon={currentBattle.pokemon2}
                            showResults={showResults}
                            position="right"
                            winPercentage={showResults ? (100 - (guessResult?.actualWinRate || 0)) : undefined}
                            guessPercentage={!showResults && !isEndlessActive ? (100 - guessPercentage) : undefined}
                            guessRange={!showResults && isEndlessActive ? [100 - guessRange[1], 100 - guessRange[0]] : undefined}
                            totalBattles={currentBattle.totalBattles}
                            debugMode={battleSettings?.debugMode || false}
                            onMoveChange={handleMoveChange}
                          />
                        </FadeIn>
                      </Grid.Col>
                    </Grid>
                  
                  </div>

                  {/* Win Rate Prediction Slider */}
                  <Box maw={800} mx="auto" mt="xl">
                    
                    <Card withBorder p="xl" shadow="lg" style={{ borderColor: colorScheme === 'dark' ? theme.colors.blue[7] : theme.colors.blue[3], borderWidth: '2px' }}>
                      <Box pos="relative" mb="xl">
                        <Group justify="space-between" align="center">
                          <Stack align="flex-start" gap="xs">
                            <Text fw={600} size="lg">{currentBattle.pokemon1.name}</Text>
                            {showResults && guessResult ? (
                              <Text size="xl" fw={700} c="blue.6">{guessResult.actualWinRate.toFixed(1)}%</Text>
                            ) : isEndlessActive ? (
                              <Text size="xl" fw={700} c="blue.6">{guessRange[0]}% - {guessRange[1]}%</Text>
                            ) : (
                              <Text size="xl" fw={700} c="blue.6">{guessPercentage}%</Text>
                            )}
                          </Stack>
                          <Stack align="flex-end" gap="xs">
                            <Text fw={600} size="lg">{currentBattle.pokemon2.name}</Text>
                            {showResults && guessResult ? (
                              <Text size="xl" fw={700} c="grape.6">{(100 - guessResult.actualWinRate).toFixed(1)}%</Text>
                            ) : isEndlessActive ? (
                              <Text size="xl" fw={700} c="grape.6">
                                {100 - guessRange[1]}% - {100 - guessRange[0]}%
                              </Text>
                            ) : (
                              <Text size="xl" fw={700} c="grape.6">{100 - guessPercentage}%</Text>
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
                          <Box pos="relative">
                            <CenterDraggableRangeSlider
                              value={guessRange}
                              onChange={handleRangeSliderChange}
                              min={0}
                              max={100}
                              step={1}
                              disabled={isLoading || showResults}
                              color="blue"
                              size="xl"
                              label={(value) => `${value}%`}
                              hideHandles={true}
                              disableIndividualDrag={true}
                              leftType={currentBattle.pokemon1.types[0]}
                              rightType={currentBattle.pokemon2.types[0]}
                            />
                            {/* Correct Answer Indicator for Endless Mode */}
                            {showResults && guessResult && (
                              <Box
                                style={{
                                  position: 'absolute',
                                  top: '-15px',
                                  left: `${guessResult.actualWinRate}%`,
                                  transform: 'translateX(-50%)',
                                  width: 0,
                                  height: 0,
                                  borderLeft: '8px solid transparent',
                                  borderRight: '8px solid transparent',
                                  borderTop: `12px solid ${guessResult.isCorrect ? '#27ae60' : '#e74c3c'}`,
                                  pointerEvents: 'none',
                                }}
                              />
                            )}
                          </Box>
                        ) : (
                          <Box style={{ padding: '15px 0 12px 0' }}>
                            <TypeColorSlider
                              value={guessPercentage}
                              onChange={(value) => handleSliderChange([value])}
                              leftType={currentBattle.pokemon1.types[0]}
                              rightType={currentBattle.pokemon2.types[0]}
                              min={0}
                              max={100}
                              step={1}
                              disabled={isLoading || showResults}
                              correctValue={showResults && guessResult ? guessResult.actualWinRate : undefined}
                              showCorrectIndicator={showResults}
                              isCorrect={showResults && guessResult ? guessResult.isCorrect : false}
                            />
                          </Box>
                        )}
                      </Stack>
                    </Card>
                  </Box>

                  {/* Battle Statistics - Show after guess */}
                  {showResults && guessResult?.battleStats && (
                    <Box maw={800} mx="auto" mt="md">
                      <Card withBorder p="md" shadow="sm">
                        <Group justify="space-between" align="center">
                          <Stack gap="xs">
                            <Text size="sm" fw={600} c="dimmed">Community Battle Stats</Text>
                            <Group gap="xl">
                              <Stack gap={4}>
                                <Text size="xs" c="dimmed">Total Attempts</Text>
                                <Text size="lg" fw={700}>{guessResult.battleStats.totalAttempts}</Text>
                              </Stack>
                              <Stack gap={4}>
                                <Text size="xs" c="dimmed">Success Rate</Text>
                                <Text size="lg" fw={700} c={guessResult.battleStats.successRate >= 50 ? 'green' : 'red'}>
                                  {guessResult.battleStats.successRate}%
                                </Text>
                              </Stack>
                              <Stack gap={4}>
                                <Text size="xs" c="dimmed">Average Guess</Text>
                                <Text size="lg" fw={700} c="blue">
                                  {guessResult.battleStats.averageGuess || 0}%
                                </Text>
                              </Stack>
                              <Stack gap={4}>
                                <Text size="xs" c="dimmed">Correct Answer</Text>
                                <Text size="lg" fw={700} c="teal">
                                  {guessResult.actualWinRate % 1 === 0 
                                    ? guessResult.actualWinRate.toFixed(0) 
                                    : guessResult.actualWinRate.toFixed(1)}%
                                </Text>
                              </Stack>
                            </Group>
                          </Stack>
                          {guessResult.isCorrect && (
                            <Badge size="lg" variant="filled" color="green">
                              You got it right! 🎉
                            </Badge>
                          )}
                        </Group>
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
                            style={{ minWidth: '200px' }}
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
      </Box>

      {/* Streak Celebration - Disabled to prevent flying text */}
      {/* <StreakCelebration
        streak={streak}
        isVisible={showStreakCelebration}
        onAnimationComplete={() => setShowStreakCelebration(false)}
      /> */}

    </>
  );
};

export default BattleArena;