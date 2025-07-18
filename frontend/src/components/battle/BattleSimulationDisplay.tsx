import React, { useState, useEffect } from 'react';
import {
  Card,
  Stack,
  Text,
  Group,
  Badge,
  Box,
  Button,
  ScrollArea,
  Title,
  Progress,
  useMantineTheme,
  useMantineColorScheme,
  Collapse,
  ActionIcon
} from '@mantine/core';
import {
  IconSwords,
  IconFlame,
  IconDroplet,
  IconBolt,
  IconSnowflake,
  IconSkull,
  IconSleeping,
  IconHeartbeat,
  IconShield,
  IconChevronDown,
  IconChevronUp,
  IconRefresh
} from '@tabler/icons-react';

export interface BattleEvent {
  turn: number;
  type: 'move' | 'damage' | 'status' | 'weather' | 'ability' | 'item' | 'faint' | 'switch';
  pokemon: 'p1' | 'p2';
  description: string;
  details?: {
    move?: string;
    damage?: number;
    status?: string;
    effectiveness?: 'super' | 'normal' | 'not very' | 'immune';
    criticalHit?: boolean;
  };
}

export interface BattleSimulationResult {
  winner: 1 | 2;
  events: BattleEvent[];
  finalHP: {
    p1: number;
    p2: number;
  };
  totalTurns: number;
}

interface BattleSimulationDisplayProps {
  pokemon1: any;
  pokemon2: any;
  simulationResults: BattleSimulationResult[];
  isSimulating: boolean;
  onRerun?: () => void;
}

const BattleSimulationDisplay: React.FC<BattleSimulationDisplayProps> = ({
  pokemon1,
  pokemon2,
  simulationResults,
  isSimulating,
  onRerun
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [selectedBattle, setSelectedBattle] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'burn':
      case 'brn':
        return <IconFlame size={16} color={theme.colors.red[6]} />;
      case 'poison':
      case 'psn':
      case 'tox':
        return <IconSkull size={16} color={theme.colors.violet[6]} />;
      case 'paralysis':
      case 'par':
        return <IconBolt size={16} color={theme.colors.yellow[6]} />;
      case 'sleep':
      case 'slp':
        return <IconSleeping size={16} color={theme.colors.blue[6]} />;
      case 'freeze':
      case 'frz':
        return <IconSnowflake size={16} color={theme.colors.cyan[6]} />;
      default:
        return <IconHeartbeat size={16} color={theme.colors.green[6]} />;
    }
  };

  const getEventColor = (event: BattleEvent) => {
    switch (event.type) {
      case 'move':
        return event.details?.effectiveness === 'super' ? 'red' : 
               event.details?.effectiveness === 'not very' ? 'gray' : 'blue';
      case 'status':
        return 'violet';
      case 'damage':
        return 'orange';
      case 'faint':
        return 'red';
      case 'ability':
        return 'green';
      case 'item':
        return 'teal';
      default:
        return 'gray';
    }
  };

  const formatEventDescription = (event: BattleEvent) => {
    const pokemonName = event.pokemon === 'p1' ? pokemon1.name : pokemon2.name;
    let description = event.description.replace(/p1/g, pokemon1.name).replace(/p2/g, pokemon2.name);
    
    if (event.details?.criticalHit) {
      description += ' Critical hit!';
    }
    
    return description;
  };

  if (simulationResults.length === 0) {
    return null;
  }

  const currentBattle = simulationResults[selectedBattle];
  const winRate = (simulationResults.filter(r => r.winner === 1).length / simulationResults.length) * 100;

  return (
    <Card withBorder shadow="sm" p="lg">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={4}>Battle Simulation Details</Title>
          <Group gap="xs">
            {onRerun && (
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconRefresh size={16} />}
                onClick={onRerun}
                loading={isSimulating}
              >
                Rerun
              </Button>
            )}
            <ActionIcon
              variant="subtle"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </ActionIcon>
          </Group>
        </Group>

        <Collapse in={isExpanded}>
          <Stack gap="md">
            {/* Win Rate Summary */}
            <Box>
              <Text size="sm" c="dimmed" mb="xs">Win Rate Summary</Text>
              <Progress 
                value={winRate} 
                color="blue" 
                size="xl" 
                radius="md"
                striped
                animated={isSimulating}
              />
              <Group justify="space-between" mt="xs">
                <Text size="sm">{pokemon1.name}: {winRate.toFixed(1)}%</Text>
                <Text size="sm">{pokemon2.name}: {(100 - winRate).toFixed(1)}%</Text>
              </Group>
            </Box>

            {/* Battle Selector */}
            {simulationResults.length > 1 && (
              <Box>
                <Text size="sm" c="dimmed" mb="xs">
                  Sample Battle #{selectedBattle + 1} of {simulationResults.length}
                </Text>
                <Group gap="xs">
                  {simulationResults.slice(0, 10).map((result, index) => (
                    <Button
                      key={index}
                      size="xs"
                      variant={selectedBattle === index ? 'filled' : 'light'}
                      color={result.winner === 1 ? 'blue' : 'red'}
                      onClick={() => setSelectedBattle(index)}
                    >
                      {index + 1}
                    </Button>
                  ))}
                  {simulationResults.length > 10 && (
                    <Text size="xs" c="dimmed">+{simulationResults.length - 10} more</Text>
                  )}
                </Group>
              </Box>
            )}

            {/* Battle Events */}
            <Box>
              <Text size="sm" c="dimmed" mb="xs">
                Battle Events (Turn {currentBattle.totalTurns})
              </Text>
              <ScrollArea h={300} type="scroll">
                <Stack gap="xs">
                  {currentBattle.events.map((event, index) => (
                    <Box
                      key={index}
                      p="sm"
                      style={{
                        backgroundColor: colorScheme === 'dark' 
                          ? theme.colors.dark[6] 
                          : theme.colors.gray[0],
                        borderRadius: theme.radius.sm,
                        borderLeft: `3px solid ${theme.colors[getEventColor(event)][6]}`
                      }}
                    >
                      <Group justify="space-between" align="flex-start">
                        <Group gap="sm" align="flex-start">
                          {event.type === 'status' && event.details?.status && (
                            getStatusIcon(event.details.status)
                          )}
                          <Box style={{ flex: 1 }}>
                            <Text size="sm" fw={500}>
                              Turn {event.turn}
                            </Text>
                            <Text size="sm" c={colorScheme === 'dark' ? 'dimmed' : 'gray.7'}>
                              {formatEventDescription(event)}
                            </Text>
                          </Box>
                        </Group>
                        {event.details?.damage && (
                          <Badge variant="light" color="red" size="sm">
                            -{event.details.damage} HP
                          </Badge>
                        )}
                      </Group>
                    </Box>
                  ))}
                </Stack>
              </ScrollArea>
            </Box>

            {/* Final HP */}
            <Box>
              <Text size="sm" c="dimmed" mb="xs">Final HP</Text>
              <Group grow>
                <Box>
                  <Text size="sm" fw={500}>{pokemon1.name}</Text>
                  <Progress 
                    value={(currentBattle.finalHP.p1 / pokemon1.stats.hp) * 100} 
                    color={currentBattle.winner === 1 ? 'green' : 'red'}
                    size="md"
                    radius="md"
                  />
                  <Text size="xs" c="dimmed" mt={4}>
                    {currentBattle.finalHP.p1}/{pokemon1.stats.hp} HP
                  </Text>
                </Box>
                <Box>
                  <Text size="sm" fw={500}>{pokemon2.name}</Text>
                  <Progress 
                    value={(currentBattle.finalHP.p2 / pokemon2.stats.hp) * 100} 
                    color={currentBattle.winner === 2 ? 'green' : 'red'}
                    size="md"
                    radius="md"
                  />
                  <Text size="xs" c="dimmed" mt={4}>
                    {currentBattle.finalHP.p2}/{pokemon2.stats.hp} HP
                  </Text>
                </Box>
              </Group>
            </Box>
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  );
};

export default BattleSimulationDisplay;