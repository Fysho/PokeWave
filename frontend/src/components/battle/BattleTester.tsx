import React from 'react';
import {
  Box,
  Stack,
  Title,
  Text,
  ActionIcon,
  Collapse,
  Group,
  Card,
  Badge,
  Loader,
  ScrollArea,
  Button,
  useMantineTheme,
  useMantineColorScheme
} from '@mantine/core';
import {
  IconChevronLeft,
  IconChevronRight,
  IconSwords
} from '@tabler/icons-react';
import BattleTurnDisplay from './BattleTurnDisplay';
import type { BattleTurn } from './BattleTurnDisplay';

interface BattleTesterProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  pokemon1: any;
  pokemon2: any;
  onSimulateBattle: () => void;
  simulation: any;
  isSimulating: boolean;
  rightOffset?: number;
}

const BattleTester: React.FC<BattleTesterProps> = ({
  isExpanded,
  onToggleExpanded,
  pokemon1,
  pokemon2,
  onSimulateBattle,
  simulation,
  isSimulating,
  rightOffset = 0
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  
  return (
    <Box
      style={{
        position: 'fixed',
        top: 60,
        right: rightOffset,
        width: isExpanded ? '400px' : '60px',
        height: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease, right 0.3s ease',
        borderLeft: `1px solid ${colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[3]}`,
        zIndex: 1100,
        boxShadow: 'var(--mantine-shadow-lg)',
        backgroundColor: colorScheme === 'dark' ? theme.colors.dark[7] : theme.white
      }}
    >
      <Stack h="100%" gap={0} style={{ flex: 1, overflow: 'hidden' }}>
        {/* Header */}
        <Box
          p="md"
          style={{
            borderBottom: `1px solid ${colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[3]}`,
            flexShrink: 0
          }}
        >
          <Group justify="space-between" align="center">
            <Group gap="sm">
              <ActionIcon
                onClick={onToggleExpanded}
                variant="filled"
                size="lg"
                color="grape"
                style={{
                  position: 'absolute',
                  left: '-20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1101
                }}
              >
                {isExpanded ? <IconChevronRight size={20} /> : <IconChevronLeft size={20} />}
              </ActionIcon>
              <Collapse in={isExpanded} transitionDuration={200}>
                <Group gap="sm">
                  <IconSwords size={20} color="var(--mantine-color-grape-6)" />
                  <Title order={4} c="grape.6">
                    Battle Tester
                  </Title>
                </Group>
              </Collapse>
            </Group>
          </Group>
        </Box>

        {/* Content */}
        <Collapse in={isExpanded} transitionDuration={300} style={{ flex: 1, overflow: 'hidden' }}>
          <ScrollArea h="calc(100vh - 140px)" offsetScrollbars scrollbarSize={8} type="hover">
            <Box p="md">
              <Stack gap="md">
              {/* Battle Setup */}
              {pokemon1 && pokemon2 && (
                <Card withBorder p="md">
                  <Stack gap="sm">
                    <Group justify="space-between" align="center">
                      <Text fw={600} size="sm">
                        Battle Setup
                      </Text>
                      <Button
                        onClick={onSimulateBattle}
                        disabled={isSimulating || !pokemon1 || !pokemon2}
                        variant="filled"
                        size="xs"
                        color="grape"
                        loading={isSimulating}
                        leftSection={!isSimulating && <IconSwords size={14} />}
                      >
                        Battle
                      </Button>
                    </Group>
                    <Group justify="space-between" align="center">
                      <Stack align="center" gap={4}>
                        <Text size="sm" fw={500} tt="capitalize">
                          {pokemon1.name}
                        </Text>
                        <Badge variant="light" size="sm">
                          Lv.{pokemon1.level}
                        </Badge>
                      </Stack>
                      <IconSwords size={16} color="var(--mantine-color-gray-6)" />
                      <Stack align="center" gap={4}>
                        <Text size="sm" fw={500} tt="capitalize">
                          {pokemon2.name}
                        </Text>
                        <Badge variant="light" size="sm">
                          Lv.{pokemon2.level}
                        </Badge>
                      </Stack>
                    </Group>
                  </Stack>
                </Card>
              )}


              {/* Battle Results */}
              {simulation && (
                <Card withBorder p="md" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
                    <Group justify="space-between" align="center">
                      <Text fw={600} size="sm">
                        Battle Result
                      </Text>
                      <Badge 
                        variant="filled" 
                        color={simulation.winner === 'draw' ? 'gray' : (simulation.winner === pokemon1?.name ? 'blue' : 'red')}
                        size="sm"
                      >
                        {simulation.winner === 'draw' ? 'Draw!' : `${simulation.winner} Wins!`}
                      </Badge>
                    </Group>
                    
                    
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">
                        Duration: {simulation.executionTime}ms
                      </Text>
                      <Text size="xs" c="dimmed">
                        {simulation.turns && simulation.turns.length > 0 
                          ? Math.max(...simulation.turns.map((t: BattleTurn) => t.turn)) 
                          : 0} turns
                      </Text>
                    </Group>

                    {/* Turn-by-turn breakdown using shared component */}
                    <Box
                      style={{
                        border: `1px solid ${colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[3]}`,
                        borderRadius: '4px',
                        padding: '8px',
                        maxHeight: 'calc(100vh - 400px)',
                        minHeight: '400px',
                        overflowY: 'auto'
                      }}
                    >
                      <BattleTurnDisplay
                        turns={simulation.turns || []}
                        pokemon1Name={pokemon1?.name}
                        pokemon2Name={pokemon2?.name}
                        pokemon1HP={simulation.pokemon1HP}
                        pokemon2HP={simulation.pokemon2HP}
                        showBattleStart={!!simulation.pokemon1HP && !!simulation.pokemon2HP}
                      />
                    </Box>
                  </Stack>
                </Card>
              )}

              {/* No simulation message */}
              {!simulation && !isSimulating && (
                <Card withBorder p="md">
                  <Stack align="center" gap="md">
                    <IconSwords size={32} color="var(--mantine-color-gray-6)" />
                    <Text size="sm" c="dimmed" ta="center">
                      Click the sword icon to test a single battle and see the turn-by-turn breakdown!
                    </Text>
                  </Stack>
                </Card>
              )}
              
              {/* Loading state */}
              {isSimulating && (
                <Card withBorder p="md">
                  <Stack align="center" gap="md">
                    <Loader size="lg" />
                    <Text size="sm" c="dimmed" ta="center">
                      Testing battle...
                    </Text>
                  </Stack>
                </Card>
              )}
              </Stack>
            </Box>
          </ScrollArea>
        </Collapse>

        {/* Collapsed State Icon */}
        {!isExpanded && (
          <Box ta="center" mt="md">
            <ActionIcon
              onClick={onToggleExpanded}
              variant="subtle"
              size="lg"
              color="grape"
            >
              <IconSwords size={20} />
            </ActionIcon>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default BattleTester;