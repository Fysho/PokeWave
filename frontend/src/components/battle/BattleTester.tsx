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
  Button,
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
  statChange?: {
    stat: string;
    stages: number;
    type: 'boost' | 'unboost' | 'failed';
  };
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
      case 'burn':
        return 'red';
      case 'par':
        return 'yellow';
      case 'psn':
      case 'tox':
      case 'poison':
        return 'violet';
      case 'slp':
        return 'indigo';
      case 'frz':
        return 'cyan';
      case 'confusion':
        return 'pink';
      case 'sandstorm':
        return 'orange';
      case 'hail':
        return 'blue';
      case 'recoil':
        return 'red';
      case 'Life Orb':
        return 'violet';
      default:
        return 'gray';
    }
  };

  const getStatName = (stat: string) => {
    switch (stat) {
      case 'atk':
        return 'Attack';
      case 'def':
        return 'Defense';
      case 'spa':
        return 'Special Attack';
      case 'spd':
        return 'Special Defense';
      case 'spe':
        return 'Speed';
      case 'accuracy':
        return 'Accuracy';
      case 'evasion':
        return 'Evasion';
      default:
        return stat;
    }
  };

  const getStatChangeText = (statChange: { stat: string; stages: number; type: string }) => {
    if (statChange.type === 'failed') {
      if (statChange.stages > 0) {
        return "stats can't go any higher!";
      } else if (statChange.stages < 0) {
        return "stats can't go any lower!";
      }
      return "stat change failed!";
    }
    
    const statName = getStatName(statChange.stat);
    const stages = Math.abs(statChange.stages);
    const direction = statChange.stages > 0 ? 'rose' : 'fell';
    
    if (stages === 1) {
      return `${statName} ${direction}!`;
    } else if (stages === 2) {
      return `${statName} ${direction} sharply!`;
    } else if (stages >= 3) {
      return `${statName} ${direction} drastically!`;
    }
    return `${statName} ${direction} by ${stages} stages!`;
  };

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

                    <Divider />

                    {/* Turn-by-turn breakdown */}
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
                              
                              <Box>
                                {/* Check if this is a stat change */}
                                {turn.move === 'Stat Change' && turn.statChange ? (
                                  <>
                                    <Text component="span" size="xs" fw={500} tt="capitalize">
                                      {turn.attacker}
                                    </Text>
                                    <Text component="span" size="xs">{"'s "}</Text>
                                    <Text component="span" size="xs" fw={500} c={turn.statChange.stages > 0 ? 'green.6' : turn.statChange.stages < 0 ? 'red.6' : 'gray.6'}>
                                      {getStatChangeText(turn.statChange)}
                                    </Text>
                                  </>
                                ) : ['confusion', 'poison', 'burn', 'sandstorm', 'hail', 'recoil', 'Life Orb'].includes(turn.attacker) ? (
                                  <>
                                    <Text component="span" size="xs" fw={500} tt="capitalize">
                                      {turn.defender}
                                    </Text>
                                    <Text component="span" size="xs">{' '}took{' '}</Text>
                                    <Text component="span" size="xs" fw={500} c={getStatusEffectColor(turn.attacker)}>
                                      {turn.damage} damage
                                    </Text>
                                    <Text component="span" size="xs">{' '}from{' '}</Text>
                                    <Text component="span" size="xs" fw={500}>
                                      {turn.attacker === 'confusion' ? 'confusion' : 
                                       turn.attacker === 'recoil' ? 'recoil' :
                                       turn.attacker === 'Life Orb' ? 'Life Orb' :
                                       turn.attacker}
                                    </Text>
                                    <Text component="span" size="xs">{turn.attacker === 'confusion' && '!'}</Text>
                                  </>
                                ) : turn.move.startsWith("Can't move") ? (
                                  <>
                                    <Text component="span" size="xs" fw={500} tt="capitalize">
                                      {turn.attacker}
                                    </Text>
                                    <Text component="span" size="xs" c="gray.6" fs="italic">
                                      {' '}{turn.move.replace("Can't move", "couldn't move")}
                                    </Text>
                                  </>
                                ) : (
                                  <>
                                    <Text component="span" size="xs" fw={500} tt="capitalize">
                                      {turn.attacker}
                                    </Text>
                                    <Text component="span" size="xs">{' '}used{' '}</Text>
                                    <Text component="span" size="xs" fw={500} tt="capitalize">
                                      {turn.move}
                                    </Text>
                                    {turn.missed && (
                                      <Text component="span" size="xs" c="gray.6" fs="italic">
                                        {' '}but it missed!
                                      </Text>
                                    )}
                                  </>
                                )}
                              </Box>
                              
                              {!turn.missed && turn.move !== 'Stat Change' && !['confusion', 'poison', 'burn', 'sandstorm', 'hail', 'recoil', 'Life Orb'].includes(turn.attacker) && (
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
                              
                              {/* Don't show HP line for stat changes */}
                              {turn.move !== 'Stat Change' && (
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
                              )}
                            </Stack>
                          </Card>
                            </Box>
                          );
                        })}
                        </Stack>
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