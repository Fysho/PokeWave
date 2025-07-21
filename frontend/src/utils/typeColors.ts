/**
 * Type color mapping for Pokemon and move types
 * Uses Mantine color names for consistency
 */
export const typeColors: { [key: string]: string } = {
  normal: 'gray',
  fire: 'red',
  water: 'blue',
  electric: 'yellow',
  grass: 'green',
  ice: 'cyan',
  fighting: 'red',
  poison: 'grape',
  ground: 'orange',
  flying: 'indigo',
  psychic: 'pink',
  bug: 'lime',
  rock: 'orange',
  ghost: 'violet',
  dragon: 'indigo',
  dark: 'dark',
  steel: 'gray',
  fairy: 'pink',
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