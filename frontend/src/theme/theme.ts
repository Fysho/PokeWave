import { createTheme } from '@mantine/core';

// Custom color palette for PokeWave
const pokeBlue = [
  '#e7f5ff',
  '#d0ebff',
  '#a5d8ff',
  '#74c0fc',
  '#4dabf7',
  '#339af0',
  '#228be6',
  '#1c7ed6',
  '#1971c2',
  '#1864ab'
] as const;

const pokeGrape = [
  '#f3f0ff',
  '#e5dbff',
  '#d0bfff',
  '#b197fc',
  '#9775fa',
  '#845ef7',
  '#7950f2',
  '#7048e8',
  '#6741d9',
  '#5f3dc4'
] as const;

// Pokemon-style yellow for accents
const pokeYellow = [
  '#fff9db',
  '#fff3bf',
  '#ffec99',
  '#ffe066',
  '#ffd43b',
  '#fcc419',
  '#fab005',
  '#f59f00',
  '#f08c00',
  '#e67700'
] as const;

export const theme = createTheme({
  primaryColor: 'pokeBlue',
  colors: {
    pokeBlue,
    pokeGrape,
    pokeYellow,
  },
  defaultRadius: 'md',
  components: {
    Card: {
      defaultProps: {
        shadow: 'sm',
        padding: 'lg',
        radius: 'md',
      },
    },
    Button: {
      defaultProps: {
        size: 'md',
      },
    },
    Badge: {
      defaultProps: {
        size: 'md',
      },
    },
  },
});