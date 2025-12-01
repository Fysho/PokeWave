import React from 'react';
import { Card, Badge, Text, Box, Stack, Tooltip, useMantineColorScheme } from '@mantine/core';
import { HoverDetailCard } from './HoverDetailCard';

/**
 * MicroCard - Ultra-minimal Pokemon display
 *
 * Used in: Dense lists, thumbnails, selection grids
 * Shows: Small sprite (48-64px), name, level only (no types)
 * Hover shows HoverDetailCard with all information
 */

export interface MicroCardProps {
  pokemon: any;
  /** Size of the sprite */
  spriteSize?: number;
  /** Whether to show the level */
  showLevel?: boolean;
  /** Whether to show shiny indicator */
  showShiny?: boolean;
  /** Whether to enable hover tooltip with full details */
  enableHoverDetail?: boolean;
  /** Click handler */
  onClick?: () => void;
}

export const MicroCard: React.FC<MicroCardProps> = ({
  pokemon,
  spriteSize = 64,
  showLevel = true,
  showShiny = true,
  enableHoverDetail = true,
  onClick
}) => {
  const { colorScheme } = useMantineColorScheme();

  const cardContent = (
    <Card
      p={6}
      withBorder
      shadow="sm"
      className="transition-all duration-200"
      style={{
        cursor: onClick ? 'pointer' : enableHoverDetail ? 'help' : 'default',
        minWidth: '80px',
        backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-white)'
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
      <Stack gap={2} align="center">
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
        <Text size="xs" fw={600} tt="capitalize" ta="center" lineClamp={1}>
          {pokemon.name}
        </Text>

        {/* Level */}
        {showLevel && pokemon.level && (
          <Text size="xs" c="dimmed">
            Lv.{pokemon.level}
          </Text>
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

export default MicroCard;
