import React, { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  ScrollArea,
  Group,
  Badge,
  Box,
  Text,
  Stack,
  Button,
  useMantineTheme,
  useMantineColorScheme
} from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import { getTypeColor, getCategoryIcon } from '../../utils/typeColors';

interface Move {
  id: string;
  name: string;
  type: string;
  category: 'physical' | 'special' | 'status';
  power: number | null;
  accuracy: number | null;
  pp: number;
  description?: string;
}

interface MoveSelectorProps {
  opened: boolean;
  onClose: () => void;
  currentMove: string;
  pokemonName: string;
  pokemonId: number;
  onSelectMove: (move: Move) => void;
  availableMoves: Move[];
}

const MoveSelector: React.FC<MoveSelectorProps> = ({
  opened,
  onClose,
  currentMove,
  pokemonName,
  pokemonId,
  onSelectMove,
  availableMoves
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMoves, setFilteredMoves] = useState<Move[]>(availableMoves);

  useEffect(() => {
    // Filter moves based on search term
    const filtered = availableMoves.filter(move => 
      move.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      move.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMoves(filtered);
  }, [searchTerm, availableMoves]);

  const handleSelectMove = (move: Move) => {
    onSelectMove(move);
    onClose();
    setSearchTerm('');
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Box>
          <Text size="lg" fw={600}>Select Move for {pokemonName}</Text>
          <Text size="sm" c="dimmed">Current: {currentMove}</Text>
        </Box>
      }
      size="lg"
      closeButtonProps={{ 'aria-label': 'Close modal' }}
    >
      <Stack gap="md">
        <TextInput
          placeholder="Search moves by name or type..."
          leftSection={<IconSearch size={16} />}
          rightSection={
            searchTerm && (
              <IconX
                size={16}
                style={{ cursor: 'pointer' }}
                onClick={() => setSearchTerm('')}
              />
            )
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
        />

        <ScrollArea h={400}>
          <Stack gap="xs">
            {filteredMoves.map((move) => {
              const typeColor = getTypeColor(move.type);
              const bgOpacity = colorScheme === 'dark' ? '20' : '15';
              const borderOpacity = colorScheme === 'dark' ? '80' : '60';
              const isCurrentMove = move.name === currentMove;

              return (
                <Box
                  key={move.id}
                  p="md"
                  style={{
                    backgroundColor: isCurrentMove 
                      ? `${typeColor}30`
                      : `${typeColor}${bgOpacity}`,
                    borderRadius: '8px',
                    border: `2px solid ${isCurrentMove ? typeColor : `${typeColor}${borderOpacity}`}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => handleSelectMove(move)}
                  onMouseEnter={(e) => {
                    if (!isCurrentMove) {
                      e.currentTarget.style.backgroundColor = `${typeColor}30`;
                      e.currentTarget.style.borderColor = typeColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrentMove) {
                      e.currentTarget.style.backgroundColor = `${typeColor}${bgOpacity}`;
                      e.currentTarget.style.borderColor = `${typeColor}${borderOpacity}`;
                    }
                  }}
                >
                  <Group justify="space-between" align="flex-start">
                    <Box style={{ flex: 1 }}>
                      <Group gap="sm" mb={4}>
                        <Text fw={600} size="md" tt="capitalize">
                          {move.name}
                        </Text>
                        {isCurrentMove && (
                          <Badge size="sm" color="blue" variant="filled">
                            Current
                          </Badge>
                        )}
                      </Group>
                      
                      <Group gap="xs" mb={8}>
                        <Badge
                          size="sm"
                          variant="filled"
                          color={getTypeColor(move.type)}
                          tt="capitalize"
                        >
                          {move.type}
                        </Badge>
                        <Badge
                          size="sm"
                          variant="light"
                          color="gray"
                          leftSection={getCategoryIcon(move.category)}
                        >
                          {move.category}
                        </Badge>
                      </Group>

                      <Group gap="lg">
                        {move.power !== null && (
                          <Text size="sm">
                            <Text span fw={500}>Power:</Text> {move.power}
                          </Text>
                        )}
                        {move.accuracy !== null && (
                          <Text size="sm">
                            <Text span fw={500}>Accuracy:</Text> {move.accuracy}%
                          </Text>
                        )}
                        <Text size="sm">
                          <Text span fw={500}>PP:</Text> {move.pp}
                        </Text>
                      </Group>

                      {move.description && (
                        <Text size="xs" c="dimmed" mt={8}>
                          {move.description}
                        </Text>
                      )}
                    </Box>
                  </Group>
                </Box>
              );
            })}

            {filteredMoves.length === 0 && (
              <Box ta="center" py="xl">
                <Text c="dimmed">No moves found matching "{searchTerm}"</Text>
              </Box>
            )}
          </Stack>
        </ScrollArea>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default MoveSelector;