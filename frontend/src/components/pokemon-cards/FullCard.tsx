import React, { useState, useEffect } from 'react';
import { Card, Badge, Grid, Text, Box, Stack, Title, Group, Tooltip, useMantineTheme, useMantineColorScheme } from '@mantine/core';
import { IconBolt, IconStar, IconCrown } from '@tabler/icons-react';
import { SlideIn } from '../ui/transitions';
import { getTypeColor, getCategoryIcon } from '../../utils/typeColors';
import { getTypeEffectiveness } from '../../utils/typeEffectiveness';
import { api } from '../../services/api';
import MoveSelector from '../ui/MoveSelector';

/**
 * FullCard - Complete Pokemon display with all details
 *
 * Used in: Battle Mode, Endless Mode
 * Shows: Large sprite, name, level, types, ability, item, moves (2x2 grid), all 6 stats, nature, IVs
 */

export interface FullCardProps {
  pokemon: any;
  showResults?: boolean;
  position?: 'left' | 'right';
  winPercentage?: number;
  guessPercentage?: number;
  guessRange?: [number, number];
  totalBattles?: number;
  debugMode?: boolean;
  onMoveChange?: (pokemonId: number, moveIndex: number, newMove: any) => void;
  /** Whether to animate the card entrance */
  animate?: boolean;
}

export const FullCard: React.FC<FullCardProps> = ({
  pokemon,
  showResults = false,
  position = 'left',
  winPercentage,
  guessPercentage,
  guessRange,
  totalBattles,
  debugMode = false,
  onMoveChange,
  animate = true
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

  // Calculate dynamic sprite size based on guess percentage
  const calculateSpriteSize = () => {
    if (showResults) return 320;

    const effectiveGuess = guessRange
      ? Math.round((guessRange[0] + guessRange[1]) / 2)
      : guessPercentage;

    if (effectiveGuess === undefined || effectiveGuess === null) return 320;

    const minSize = 240;
    const maxSize = 400;
    const scaleFactor = effectiveGuess / 100;
    const size = minSize + (maxSize - minSize) * scaleFactor;

    return Math.round(size);
  };

  const spriteSize = calculateSpriteSize();

  const cardContent = (
    <Card
      withBorder
      shadow="sm"
      className={`
        relative transition-all duration-300 group h-full
        ${showResults && pokemon.wins > 500 ? 'ring-2 ring-green-500' : ''}
      `}
      style={{
        backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-white)'
      }}
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
              Shiny
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
            height: '240px',
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
                  Array.from({ length: 4 }).map((_, index) => {
                    const moveDetail = pokemon.moveDetails[index];

                    if (!moveDetail) {
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
                    const bgOpacity = colorScheme === 'dark' ? '20' : '15';
                    const borderOpacity = colorScheme === 'dark' ? '80' : '60';

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
                              e.currentTarget.style.backgroundColor = `${typeColor}30`;
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
                  Array.from({ length: 4 }).map((_, index) => {
                    const move = pokemon.moves[index];

                    if (!move) {
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
  );

  // Move Selector Modal
  const moveSelector = debugMode && selectedMoveIndex !== null && pokemon.moveDetails && (
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
  );

  if (animate) {
    return (
      <>
        <SlideIn
          direction={position === 'left' ? 'left' : 'right'}
          delay={0.3}
          className="w-full"
        >
          {cardContent}
        </SlideIn>
        {moveSelector}
      </>
    );
  }

  return (
    <>
      {cardContent}
      {moveSelector}
    </>
  );
};

export default FullCard;
