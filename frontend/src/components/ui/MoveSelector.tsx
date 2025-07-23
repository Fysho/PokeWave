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
            {/* Remove Move option - always show at top when no search term or when searching "remove" */}
            {(searchTerm === '' || 'remove move'.includes(searchTerm.toLowerCase())) && (
              <Box
                p="sm"
                style={{
                  backgroundColor: colorScheme === 'dark' 
                    ? theme.colors.dark[5] 
                    : theme.colors.gray[2],
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: `2px solid ${colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]}`,
                }}
                onClick={() => handleSelectMove({ 
                  id: 'none', 
                  name: '(No Move)', 
                  type: 'normal', 
                  category: 'status' as const, 
                  power: null, 
                  accuracy: null, 
                  pp: 0 
                })}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colorScheme === 'dark' 
                    ? theme.colors.dark[4] 
                    : theme.colors.gray[3];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colorScheme === 'dark' 
                    ? theme.colors.dark[5] 
                    : theme.colors.gray[2];
                }}
              >
                <Group justify="space-between" align="center">
                  <Text size="sm" c="dimmed" fs="italic">
                    Remove Move
                  </Text>
                  <Badge size="xs" color="red" variant="light">
                    Clear Slot
                  </Badge>
                </Group>
              </Box>
            )}
            
            {filteredMoves.map((move) => {
              const isCurrentMove = move.name === currentMove;

              return (
                <Box
                  key={move.id}
                  p="sm"
                  style={{
                    backgroundColor: isCurrentMove 
                      ? (colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2])
                      : 'transparent',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => handleSelectMove(move)}
                  onMouseEnter={(e) => {
                    if (!isCurrentMove) {
                      e.currentTarget.style.backgroundColor = colorScheme === 'dark' 
                        ? theme.colors.dark[6] 
                        : theme.colors.gray[1];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrentMove) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Group justify="space-between" align="center">
                    <Text size="sm" fw={isCurrentMove ? 600 : 400}>
                      {move.name}
                    </Text>
                    {isCurrentMove && (
                      <Badge size="xs" color="blue" variant="light">
                        Current
                      </Badge>
                    )}
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