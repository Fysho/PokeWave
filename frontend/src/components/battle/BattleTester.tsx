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
  Divider,
  useMantineTheme,
  useMantineColorScheme
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

interface BattleTurn {
  turn: number;
  attacker: string;
  defender: string;
  move: string;
  damage: number;
  remainingHP: number;
  critical: boolean;
  effectiveness: 'super' | 'normal' | 'not very' | 'no';
  missed?: boolean;
  statusEffect?: string;
  statusInflicted?: boolean;
  healing?: number;
  fainted?: boolean;
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
  
  // Debug logging
  React.useEffect(() => {
    console.log('BattleSimulation props:', {
      isExpanded,
      pokemon1,
      pokemon2,
      simulation,
      isSimulating
    });
  }, [isExpanded, pokemon1, pokemon2, simulation, isSimulating]);
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

  const getStatusEffectText = (status: string) => {
    switch (status) {
      case 'brn':
        return 'burned';
      case 'par':
        return 'paralyzed';
      case 'psn':
        return 'poisoned';
      case 'tox':
        return 'badly poisoned';
      case 'slp':
        return 'fell asleep';
      case 'frz':
        return 'frozen';
      case 'confusion':
        return 'confused';
      default:
        return status;
    }
  };

  const getStatusEffectColor = (status: string) => {
    switch (status) {
      case 'brn':
        return 'red';
      case 'par':
        return 'yellow';
      case 'psn':
      case 'tox':
        return 'violet';
      case 'slp':
        return 'indigo';
      case 'frz':
        return 'cyan';
      case 'confusion':
        return 'gray';
      default:
        return 'gray';
    }
  };

  return (
    <Box
      pos="fixed"
      top={60}
      right={rightOffset}
      h="calc(100vh - 60px)"
      style={{
        width: isExpanded ? '400px' : '60px',
        transition: 'width 0.3s ease, right 0.3s ease',
        borderLeft: `1px solid ${colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[3]}`,
        zIndex: 1100,
        boxShadow: 'var(--mantine-shadow-lg)',
        backgroundColor: colorScheme === 'dark' ? theme.colors.dark[7] : theme.white
      }}
    >
      <Stack h="100%" gap={0}>
        {/* Header */}
        <Box
          p="md"
          style={{
            borderBottom: `1px solid ${colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[3]}`
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
        <Collapse in={isExpanded} transitionDuration={300} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Box p="md" style={{ overflowY: 'auto', flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
              {/* Battle Setup */}
              {pokemon1 && pokemon2 && (
                <Card withBorder p="md">
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
                <Card withBorder p="md" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
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
                        Duration: {simulation.executionTime}ms
                      </Text>
                      <Text size="xs" c="dimmed">
                        {simulation.totalTurns} turns
                      </Text>
                    </Group>

                    <Divider />

                    {/* Turn-by-turn breakdown */}
                    <ScrollArea style={{ flex: 1, minHeight: '400px', maxHeight: 'calc(100vh - 400px)' }}>
                      <Stack gap="xs">
                        {simulation.turns?.map((turn: BattleTurn, index: number) => {
                          // Check if this is the start of a new turn number
                          const isNewTurn = index === 0 || turn.turn !== simulation.turns[index - 1].turn;
                          
                          return (
                            <Box key={index}>
                              {isNewTurn && index > 0 && (
                                <>
                                  <Box style={{ height: '8px' }} />
                                  <Divider size="xs" label={`Turn ${turn.turn}`} labelPosition="center" />
                                  <Box style={{ height: '8px' }} />
                                </>
                              )}
                              <Card withBorder p="sm">
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
                                {turn.missed && (
                                  <Text component="span" c="gray.6" fs="italic">
                                    {' '}but it missed!
                                  </Text>
                                )}
                              </Text>
                              
                              {!turn.missed && (
                                <Group gap="xs" align="center">
                                  {turn.damage > 0 && (
                                    <Text size="xs" c="red.6">
                                      {turn.damage} damage
                                    </Text>
                                  )}
                                  {turn.effectiveness !== 'normal' && (
                                    <Group gap={2}>
                                      {getEffectivenessIcon(turn.effectiveness)}
                                      <Text size="xs" c="gray.6">
                                        {getEffectivenessText(turn.effectiveness)}
                                      </Text>
                                    </Group>
                                  )}
                                </Group>
                              )}
                              
                              {turn.statusInflicted && turn.statusEffect && (
                                <Group gap="xs" align="center">
                                  <Badge 
                                    size="xs" 
                                    variant="filled" 
                                    color={getStatusEffectColor(turn.statusEffect)}
                                  >
                                    Status Effect
                                  </Badge>
                                  <Text size="xs" c="gray.7">
                                    {turn.defender} was {getStatusEffectText(turn.statusEffect)}!
                                  </Text>
                                </Group>
                              )}
                              
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
                            </Box>
                          );
                        })}
                      </Stack>
                    </ScrollArea>
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