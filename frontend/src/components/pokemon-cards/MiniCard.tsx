import React from 'react';
import { Card, Badge, Text, Box, Stack, Group, Tooltip, useMantineColorScheme } from '@mantine/core';
import { getTypeColor } from '../../utils/typeColors';
import { HoverDetailCard } from './HoverDetailCard';

/**
 * MiniCard - Minimal Pokemon display for lists and compact views
 *
 * Used in: Lists, search results, compact grids
 * Shows: Small sprite (64-96px), name, level, types as small badges
 * Hover shows HoverDetailCard with all information
 */

export interface MiniCardProps {
  pokemon: any;
  /** Size of the sprite */
  spriteSize?: number;
  /** Whether to show the level */
  showLevel?: boolean;
  /** Whether to show type badges */
  showTypes?: boolean;
  /** Whether to show shiny indicator */
  showShiny?: boolean;
  /** Whether to enable hover tooltip with full details */
  enableHoverDetail?: boolean;
  /** Click handler */
  onClick?: () => void;
}

export const MiniCard: React.FC<MiniCardProps> = ({
  pokemon,
  spriteSize = 80,
  showLevel = true,
  showTypes = true,
  showShiny = true,
  enableHoverDetail = true,
  onClick
}) => {
  const { colorScheme } = useMantineColorScheme();

  const cardContent = (
    <Card
      p="xs"
      withBorder
      className="transition-all duration-200"
      style={{
        cursor: onClick ? 'pointer' : enableHoverDetail ? 'help' : 'default',
        minWidth: '120px'
      }}
      onClick={onClick}
      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)';
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <Stack gap={4} align="center">
        {/* Shiny indicator */}
        {showShiny && pokemon.shiny && (
          <Badge size="xs" variant="dot" color="yellow" style={{ alignSelf: 'flex-start' }}>
            Shiny
          </Badge>
        )}

        {/* Sprite */}
        <Box
          style={{
            width: spriteSize,
            height: spriteSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
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

        {/* Name */}
        <Text size="sm" fw={600} tt="capitalize" ta="center" lineClamp={1}>
          {pokemon.name}
        </Text>

        {/* Level */}
        {showLevel && pokemon.level && (
          <Text size="xs" c="dimmed">
            Lv.{pokemon.level}
          </Text>
        )}

        {/* Types */}
        {showTypes && pokemon.types && pokemon.types.length > 0 && (
          <Group gap={2} justify="center">
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
    </Card>
  );

  if (enableHoverDetail) {
    return (
      <Tooltip
        label={<HoverDetailCard pokemon={pokemon} />}
        position="right"
        withArrow
        transitionProps={{ transition: 'fade', duration: 200 }}
        events={{ hover: true, focus: false, touch: false }}
        multiline
        w={400}
        styles={{
          tooltip: {
            padding: 0,
            background: 'transparent',
            border: 'none',
            boxShadow: 'none'
          }
        }}
      >
        {cardContent}
      </Tooltip>
    );
  }

  return cardContent;
};

export default MiniCard;
