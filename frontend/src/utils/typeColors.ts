/**
 * Type color mapping for Pokemon and move types
 * Uses Mantine color names for consistency
 */
export const typeColors: { [key: string]: string } = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
};

/**
 * Get the color for a given type
 * @param type - The Pokemon or move type
 * @returns The Mantine color name
 */
export const getTypeColor = (type: string): string => {
  return typeColors[type.toLowerCase()] || 'gray';
};

/**
 * Get move category colors
 * @param category - The move category (physical, special, status)
 * @returns The Mantine color name
 */
export const getCategoryColor = (category: string): string => {
  const categoryColors: { [key: string]: string } = {
    physical: 'orange',
    special: 'violet', 
    status: 'gray'
  };
  return categoryColors[category.toLowerCase()] || 'gray';
};

/**
 * Get move category icon
 * @param category - The move category
 * @returns Icon name or symbol
 */
export const getCategoryIcon = (category: string): string => {
  const categoryIcons: { [key: string]: string } = {
    physical: '⚔️',
    special: '✨',
    status: '🛡️'
  };
  return categoryIcons[category.toLowerCase()] || '❓';
};