import React from 'react';
import { Box, Text, Group } from '@mantine/core';
import { IconPokeball } from '@tabler/icons-react';

interface PokedexNotificationProps {
  pokemonName: string;
  pokemonSprite: string;
  isShiny?: boolean;
  shinySprite?: string;
}

export const PokedexNotification: React.FC<PokedexNotificationProps> = ({
  pokemonName,
  pokemonSprite,
  isShiny = false,
  shinySprite
}) => {
  return (
    <Group gap="sm" align="center">
      <Box
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--mantine-color-blue-5), var(--mantine-color-grape-5))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--mantine-shadow-sm)'
        }}
      >
        <img 
          src={isShiny && shinySprite ? shinySprite : pokemonSprite} 
          alt={pokemonName}
          style={{
            width: 40,
            height: 40,
            objectFit: 'contain',
            filter: isShiny ? 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))' : 'none'
          }}
        />
      </Box>
      <Box>
        <Group gap={4} align="center">
          <IconPokeball size={16} style={{ color: 'var(--mantine-color-red-6)' }} />
          <Text size="sm" fw={600} tt="capitalize">
            {pokemonName}
          </Text>
        </Group>
        <Text size="xs" c="dimmed">
          {isShiny ? '✨ Shiny added to Pokédex!' : 'Added to Pokédex!'}
        </Text>
      </Box>
    </Group>
  );
};