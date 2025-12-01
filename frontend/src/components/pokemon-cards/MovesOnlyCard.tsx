import React from 'react';
import { Card, Badge, Text, Box, Stack, Grid, Group, Title, Tooltip, useMantineTheme, useMantineColorScheme } from '@mantine/core';
import { getTypeColor, getCategoryIcon } from '../../utils/typeColors';

/**
 * MovesOnlyCard - Pokemon card focused on move information
 *
 * Used in: Move analysis, battle strategy views
 * Shows: Small sprite, name, level, and detailed moves grid (2x2)
 */

export interface MovesOnlyCardProps {
  pokemon: any;
  /** Size of the sprite */
  spriteSize?: number;
  /** Whether to show shiny indicator */
  showShiny?: boolean;
}

export const MovesOnlyCard: React.FC<MovesOnlyCardProps> = ({
  pokemon,
  spriteSize = 96,
  showShiny = true
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  return (
    <Card withBorder p="md" className="transition-all duration-200">
      <Stack gap="md">
        {/* Header with sprite and name */}
        <Group gap="md" align="center">
          {/* Sprite */}
          <Box
            style={{
              width: spriteSize,
              height: spriteSize,
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
          </Box>

          {/* Name and info */}
          <Stack gap={4}>
            <Group gap="xs">
              <Title order={4} tt="capitalize">
                {pokemon.name}
              </Title>
              {showShiny && pokemon.shiny && (
                <Badge size="xs" variant="dot" color="yellow">Shiny</Badge>
              )}
            </Group>
            <Text size="sm" c="dimmed">Lv.{pokemon.level}</Text>
            {pokemon.types && pokemon.types.length > 0 && (
              <Group gap={4}>
                {pokemon.types.map((type: string) => (
                  <Badge
                    key={type}
                    size="xs"
                    variant="filled"
                    color={getTypeColor(type)}
                    tt="capitalize"
                  >
                    {type}
                  </Badge>
                ))}
              </Group>
            )}
          </Stack>
        </Group>

        {/* Moves Section */}
        <Box>
          <Text size="sm" fw={600} mb="xs" c="dimmed">Moves</Text>
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
                          opacity: 0.3,
                          minHeight: '60px'
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
                        p="xs"
                        style={{
                          backgroundColor: `${typeColor}${bgOpacity}`,
                          borderRadius: '4px',
                          border: `1px solid ${typeColor}${borderOpacity}`,
                          minHeight: '60px',
                          cursor: 'help',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                          e.currentTarget.style.transform = 'scale(1.02)';
                          e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)';
                          e.currentTarget.style.backgroundColor = `${typeColor}30`;
                        }}
                        onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.backgroundColor = `${typeColor}${bgOpacity}`;
                        }}
                      >
                        <Stack gap={2}>
                          <Text size="sm" fw={600} tt="capitalize" style={{ color: typeColor }}>
                            {moveDetail.name}
                          </Text>
                          <Group gap={4}>
                            <Badge size="xs" color={getTypeColor(moveDetail.type)} variant="light">
                              {moveDetail.type}
                            </Badge>
                            {moveDetail.power && (
                              <Text size="xs" c="dimmed">
                                {moveDetail.power} PWR
                              </Text>
                            )}
                          </Group>
                        </Stack>
                      </Box>
                    </Tooltip>
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
                        p="sm"
                        style={{
                          backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                          borderRadius: '4px',
                          border: colorScheme === 'dark' ? `1px solid ${theme.colors.gray[8]}` : `1px solid ${theme.colors.gray[3]}`,
                          opacity: 0.3,
                          minHeight: '60px'
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
                      p="sm"
                      style={{
                        backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                        borderRadius: '4px',
                        border: colorScheme === 'dark' ? `1px solid ${theme.colors.gray[8]}` : `1px solid ${theme.colors.gray[3]}`,
                        minHeight: '60px'
                      }}
                    >
                      <Text size="sm" fw={600} tt="capitalize">{move}</Text>
                    </Box>
                  </Grid.Col>
                );
              })
            ) : (
              <Grid.Col span={12}>
                <Text size="sm" c="dimmed" ta="center">No moves available</Text>
              </Grid.Col>
            )}
          </Grid>
        </Box>
      </Stack>
    </Card>
  );
};

export default MovesOnlyCard;
