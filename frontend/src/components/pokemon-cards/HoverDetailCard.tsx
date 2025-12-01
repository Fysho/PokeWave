import React from 'react';
import { Card, Badge, Text, Box, Stack, Grid, Group, Title, Tooltip, useMantineTheme, useMantineColorScheme } from '@mantine/core';
import { getTypeColor, getCategoryIcon } from '../../utils/typeColors';
import { getTypeEffectiveness } from '../../utils/typeEffectiveness';

/**
 * HoverDetailCard - Detailed Pokemon info shown on hover
 *
 * Used in: MiniCard hover tooltip, quick info popups
 * Shows: All Pokemon information in a compact but comprehensive layout
 * - Sprite, name, level, shiny status
 * - Types with effectiveness
 * - Ability and item
 * - All stats
 * - Moves grid
 * - Nature
 */

export interface HoverDetailCardProps {
  pokemon: any;
}

export const HoverDetailCard: React.FC<HoverDetailCardProps> = ({
  pokemon
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

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

  return (
    <Card withBorder p="sm" shadow="lg" style={{ width: '100%' }}>
      <Stack gap="sm">
        {/* Header with sprite and basic info */}
        <Group gap="md" align="flex-start">
          {/* Sprite with item overlay */}
          <Box
            pos="relative"
            style={{
              width: 80,
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {pokemon.sprites?.front ? (
              <img
                src={pokemon.shiny && pokemon.sprites.shiny ? pokemon.sprites.shiny : pokemon.sprites.front}
                alt={pokemon.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  imageRendering: 'pixelated'
                }}
              />
            ) : (
              <Box
                w="100%"
                h="100%"
                bg={colorScheme === 'dark' ? 'dark.6' : 'gray.1'}
                style={{
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text size="xs" c="gray.6">?</Text>
              </Box>
            )}
            {/* Item icon in top-right corner */}
            {pokemon.item && pokemon.itemDetail?.sprite && (
              <Tooltip
                label={
                  <Box maw={200}>
                    <Text size="xs" fw={600} tt="capitalize" mb={4}>
                      {formatItemName(pokemon.itemDetail?.name || pokemon.item)}
                    </Text>
                    {pokemon.itemDetail?.shortEffect && (
                      <Text size="xs">{pokemon.itemDetail.shortEffect}</Text>
                    )}
                  </Box>
                }
                position="top"
                withArrow
                multiline
              >
                <Box
                  pos="absolute"
                  top={-4}
                  right={-4}
                  style={{
                    cursor: 'help'
                  }}
                >
                  <img
                    src={pokemon.itemDetail.sprite}
                    alt={pokemon.itemDetail.name || pokemon.item}
                    style={{ width: 20, height: 20, imageRendering: 'pixelated' }}
                  />
                </Box>
              </Tooltip>
            )}
          </Box>

          {/* Name, level, types */}
          <Stack gap={4} style={{ flex: 1 }}>
            <Group gap="xs">
              <Title order={5} tt="capitalize">
                {pokemon.name}
              </Title>
              {pokemon.shiny && (
                <Badge size="xs" variant="dot" color="yellow">Shiny</Badge>
              )}
            </Group>
            <Text size="sm" c="dimmed">Lv.{pokemon.level}</Text>

            {/* Types */}
            {pokemon.types && pokemon.types.length > 0 && (
              <Group gap={4}>
                {pokemon.types.map((type: string) => (
                  <Badge
                    key={type}
                    size="sm"
                    variant="filled"
                    color={getTypeColor(type)}
                    tt="capitalize"
                  >
                    {type}
                  </Badge>
                ))}
              </Group>
            )}

            {/* Ability and Item */}
            <Group gap={4} mt={4}>
              {pokemon.ability && (
                <Badge
                  variant="light"
                  size="xs"
                  color="blue"
                  tt="capitalize"
                >
                  {pokemon.ability}
                </Badge>
              )}
              {pokemon.item ? (
                <Badge
                  variant="outline"
                  size="xs"
                  color="teal"
                  tt="capitalize"
                >
                  {formatItemName(pokemon.item)}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  size="xs"
                  color="gray"
                >
                  No Item
                </Badge>
              )}
            </Group>
          </Stack>
        </Group>

        {/* Stats */}
        {pokemon.stats && (
          <Box>
            <Text size="xs" fw={600} mb={4} c="dimmed">Stats</Text>
            <Group gap={4} justify="center">
              <Box ta="center" px="xs" py={2} style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.red[0], borderRadius: '4px', minWidth: '45px' }}>
                <Text size="xs" fw={600} c={colorScheme === 'dark' ? 'red.4' : 'red.7'}>HP</Text>
                <Text size="xs" fw={700}>{pokemon.stats.hp}</Text>
              </Box>
              <Box ta="center" px="xs" py={2} style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.orange[0], borderRadius: '4px', minWidth: '45px' }}>
                <Text size="xs" fw={600} c={colorScheme === 'dark' ? 'orange.4' : 'orange.7'}>ATK</Text>
                <Text size="xs" fw={700}>{pokemon.stats.attack}</Text>
              </Box>
              <Box ta="center" px="xs" py={2} style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.yellow[0], borderRadius: '4px', minWidth: '45px' }}>
                <Text size="xs" fw={600} c={colorScheme === 'dark' ? 'yellow.4' : 'yellow.7'}>DEF</Text>
                <Text size="xs" fw={700}>{pokemon.stats.defense}</Text>
              </Box>
              <Box ta="center" px="xs" py={2} style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.blue[0], borderRadius: '4px', minWidth: '45px' }}>
                <Text size="xs" fw={600} c={colorScheme === 'dark' ? 'blue.4' : 'blue.7'}>SPA</Text>
                <Text size="xs" fw={700}>{pokemon.stats.specialAttack}</Text>
              </Box>
              <Box ta="center" px="xs" py={2} style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.teal[0], borderRadius: '4px', minWidth: '45px' }}>
                <Text size="xs" fw={600} c={colorScheme === 'dark' ? 'teal.4' : 'teal.7'}>SPD</Text>
                <Text size="xs" fw={700}>{pokemon.stats.specialDefense}</Text>
              </Box>
              <Box ta="center" px="xs" py={2} style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.pink[0], borderRadius: '4px', minWidth: '45px' }}>
                <Text size="xs" fw={600} c={colorScheme === 'dark' ? 'pink.4' : 'pink.7'}>SPE</Text>
                <Text size="xs" fw={700}>{pokemon.stats.speed}</Text>
              </Box>
            </Group>
          </Box>
        )}

        {/* Moves */}
        {(pokemon.moveDetails || pokemon.moves) && (
          <Box>
            <Text size="xs" fw={600} mb={4} c="dimmed">Moves</Text>
            <Grid gutter={4}>
              {pokemon.moveDetails ? (
                Array.from({ length: 4 }).map((_, index) => {
                  const moveDetail = pokemon.moveDetails[index];

                  if (!moveDetail) {
                    return (
                      <Grid.Col key={index} span={6}>
                        <Box
                          ta="center"
                          p={4}
                          style={{
                            backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                            borderRadius: '4px',
                            opacity: 0.3
                          }}
                        >
                          <Text size="xs" c="dimmed">-</Text>
                        </Box>
                      </Grid.Col>
                    );
                  }

                  const typeColor = getTypeColor(moveDetail.type);
                  const bgOpacity = colorScheme === 'dark' ? '20' : '15';
                  const borderOpacity = colorScheme === 'dark' ? '80' : '60';

                  return (
                    <Grid.Col key={index} span={6}>
                      <Box
                        ta="center"
                        p={4}
                        style={{
                          backgroundColor: `${typeColor}${bgOpacity}`,
                          borderRadius: '4px',
                          border: `1px solid ${typeColor}${borderOpacity}`
                        }}
                      >
                        <Text size="xs" fw={600} tt="capitalize" style={{ color: typeColor }}>
                          {moveDetail.name}
                        </Text>
                      </Box>
                    </Grid.Col>
                  );
                })
              ) : pokemon.moves ? (
                Array.from({ length: 4 }).map((_, index) => {
                  const move = pokemon.moves[index];

                  if (!move) {
                    return (
                      <Grid.Col key={index} span={6}>
                        <Box
                          ta="center"
                          p={4}
                          style={{
                            backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                            borderRadius: '4px',
                            opacity: 0.3
                          }}
                        >
                          <Text size="xs" c="dimmed">-</Text>
                        </Box>
                      </Grid.Col>
                    );
                  }

                  return (
                    <Grid.Col key={index} span={6}>
                      <Box
                        ta="center"
                        p={4}
                        style={{
                          backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                          borderRadius: '4px'
                        }}
                      >
                        <Text size="xs" fw={600} tt="capitalize">{move}</Text>
                      </Box>
                    </Grid.Col>
                  );
                })
              ) : null}
            </Grid>
          </Box>
        )}

        {/* Nature */}
        {pokemon.nature && (
          <Group gap={4} justify="center">
            <Badge
              variant="dot"
              size="xs"
              color="violet"
              tt="capitalize"
            >
              {pokemon.nature} Nature
            </Badge>
            <Badge
              variant="dot"
              size="xs"
              color="green"
            >
              Perfect IVs
            </Badge>
          </Group>
        )}
      </Stack>
    </Card>
  );
};

export default HoverDetailCard;
