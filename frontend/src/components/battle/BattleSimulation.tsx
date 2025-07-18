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
  Divider
} from '@mantine/core';
import { 
  IconChevronLeft, 
  IconChevronRight,
  IconSwords,
  IconHeart,
  IconShield,
  IconBolt,
  IconTarget,
  IconSkull
} from '@tabler/icons-react';

interface BattleSimulationProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  pokemon1: any;
  pokemon2: any;
  onSimulateBattle: () => void;
  simulation: any;
  isSimulating: boolean;
}

interface BattleTurn {
  turn: number;
  attacker: string;
  defender: string;
  move: string;
  damage: number;
  remainingHP: number;
  critical: boolean;
  effectiveness: 'super' | 'normal' | 'not very' | 'no';
}

interface BattleSimulation {
  winner: string;
  turns: BattleTurn[];
  totalTurns: number;
  duration: number;
}

const BattleSimulation: React.FC<BattleSimulationProps> = ({
  isExpanded,
  onToggleExpanded,
  pokemon1,
  pokemon2,
  onSimulateBattle,
  simulation,
  isSimulating
}) => {
  const getEffectivenessIcon = (effectiveness: string) => {
    switch (effectiveness) {
      case 'super':
        return <IconBolt size={12} color="var(--mantine-color-orange-6)" />;
      case 'not very':
        return <IconShield size={12} color="var(--mantine-color-gray-6)" />;
      case 'no':
        return <IconTarget size={12} color="var(--mantine-color-gray-4)" />;
      default:
        return null;
    }
  };

  const getEffectivenessText = (effectiveness: string) => {
    switch (effectiveness) {
      case 'super':
        return 'Super effective!';
      case 'not very':
        return 'Not very effective...';
      case 'no':
        return 'No effect!';
      default:
        return '';
    }
  };

  return (
    <Box
      pos="fixed"
      top={0}
      right={0}
      h="100vh"
      bg="white"
      style={{
        width: isExpanded ? '400px' : '60px',
        transition: 'width 0.3s ease',
        borderLeft: '1px solid var(--mantine-color-gray-3)',
        zIndex: 1000,
        boxShadow: 'var(--mantine-shadow-lg)'
      }}
    >
      <Stack h="100%" gap={0}>
        {/* Header */}
        <Box
          p="md"
          style={{
            borderBottom: '1px solid var(--mantine-color-gray-3)',
            backgroundColor: 'var(--mantine-color-grape-0)'
          }}
        >
          <Group justify="space-between" align="center">
            <Group gap="sm">
              <ActionIcon
                onClick={onToggleExpanded}
                variant="subtle"
                size="sm"
                color="grape"
              >
                {isExpanded ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
              </ActionIcon>
              <Collapse in={isExpanded} transitionDuration={200}>
                <Group gap="sm">
                  <IconSwords size={20} color="var(--mantine-color-grape-6)" />
                  <Title order={4} c="grape.6">
                    Battle Simulation
                  </Title>
                </Group>
              </Collapse>
            </Group>
          </Group>
        </Box>

        {/* Content */}
        <Collapse in={isExpanded} transitionDuration={300}>
          <Box p="md" style={{ overflowY: 'auto', flex: 1 }}>
            <Stack gap="md">
              {/* Battle Setup */}
              {pokemon1 && pokemon2 && (
                <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                  <Stack gap="sm">
                    <Text fw={600} size="sm" ta="center">
                      Battle Setup
                    </Text>
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

              {/* Simulate Button */}
              <ActionIcon
                onClick={onSimulateBattle}
                disabled={isSimulating || !pokemon1 || !pokemon2}
                variant="filled"
                size="lg"
                color="grape"
                style={{ alignSelf: 'center' }}
                loading={isSimulating}
              >
                {isSimulating ? <Loader size={16} /> : <IconSwords size={20} />}
              </ActionIcon>

              {/* Battle Results */}
              {simulation && (
                <Card withBorder p="md">
                  <Stack gap="md">
                    <Group justify="space-between" align="center">
                      <Text fw={600} size="sm">
                        Battle Result
                      </Text>
                      <Badge 
                        variant="filled" 
                        color={simulation.winner === pokemon1?.name ? 'blue' : 'red'}
                        size="sm"
                      >
                        {simulation.winner} Wins!
                      </Badge>
                    </Group>
                    
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">
                        Duration: {simulation.duration}ms
                      </Text>
                      <Text size="xs" c="dimmed">
                        {simulation.totalTurns} turns
                      </Text>
                    </Group>

                    <Divider />

                    {/* Turn-by-turn breakdown */}
                    <ScrollArea h={300}>
                      <Stack gap="xs">
                        {simulation.turns?.map((turn: BattleTurn, index: number) => (
                          <Card key={index} withBorder p="sm" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                            <Stack gap="xs">
                              <Group justify="space-between" align="center">
                                <Text size="xs" fw={600} c="gray.7">
                                  Turn {turn.turn}
                                </Text>
                                {turn.critical && (
                                  <Badge size="xs" variant="filled" color="orange">
                                    Critical!
                                  </Badge>
                                )}
                              </Group>
                              
                              <Text size="xs">
                                <Text component="span" fw={500} tt="capitalize">
                                  {turn.attacker}
                                </Text>
                                {' '}used{' '}
                                <Text component="span" fw={500} tt="capitalize">
                                  {turn.move}
                                </Text>
                              </Text>
                              
                              <Group gap="xs" align="center">
                                <Text size="xs" c="red.6">
                                  {turn.damage} damage
                                </Text>
                                {turn.effectiveness !== 'normal' && (
                                  <Group gap={2}>
                                    {getEffectivenessIcon(turn.effectiveness)}
                                    <Text size="xs" c="gray.6">
                                      {getEffectivenessText(turn.effectiveness)}
                                    </Text>
                                  </Group>
                                )}
                              </Group>
                              
                              <Group gap="xs" align="center">
                                <IconHeart size={12} color="var(--mantine-color-red-6)" />
                                <Text size="xs" c="gray.7">
                                  {turn.defender}: {turn.remainingHP} HP left
                                </Text>
                                {turn.remainingHP <= 0 && (
                                  <Group gap={2}>
                                    <IconSkull size={12} color="var(--mantine-color-gray-6)" />
                                    <Text size="xs" c="gray.6">
                                      Fainted!
                                    </Text>
                                  </Group>
                                )}
                              </Group>
                            </Stack>
                          </Card>
                        ))}
                      </Stack>
                    </ScrollArea>
                  </Stack>
                </Card>
              )}

              {/* No simulation message */}
              {!simulation && !isSimulating && (
                <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                  <Stack align="center" gap="md">
                    <IconSwords size={32} color="var(--mantine-color-gray-6)" />
                    <Text size="sm" c="dimmed" ta="center">
                      Click the sword icon to simulate a single battle and see the turn-by-turn breakdown!
                    </Text>
                  </Stack>
                </Card>
              )}
            </Stack>
          </Box>
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

export default BattleSimulation;