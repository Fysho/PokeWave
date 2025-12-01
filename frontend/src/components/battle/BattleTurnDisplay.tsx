import React from 'react';
import {
  Box,
  Card,
  Stack,
  Group,
  Text,
  Badge,
  Divider,
  useMantineTheme,
  useMantineColorScheme
} from '@mantine/core';
import {
  IconHeart,
  IconShield,
  IconBolt,
  IconTarget,
  IconSkull
} from '@tabler/icons-react';

export interface BattleTurn {
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

interface BattleTurnDisplayProps {
  turns: BattleTurn[];
  pokemon1Name?: string;
  pokemon2Name?: string;
  pokemon1HP?: number;
  pokemon2HP?: number;
  showBattleStart?: boolean;
}

// Helper functions for formatting battle data
export const getEffectivenessIcon = (effectiveness: string) => {
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

export const getEffectivenessText = (effectiveness: string) => {
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

export const getStatusEffectText = (status: string) => {
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

export const getStatusEffectColor = (status: string) => {
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

export const getStatName = (stat: string) => {
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

export const getStatChangeText = (statChange: { stat: string; stages: number; type: string }) => {
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

/**
 * Shared component for displaying battle turn-by-turn breakdown
 * Used by both BattleTester and BattleLab for consistent display
 */
const BattleTurnDisplay: React.FC<BattleTurnDisplayProps> = ({
  turns,
  pokemon1Name,
  pokemon2Name,
  pokemon1HP,
  pokemon2HP,
  showBattleStart = false
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  return (
    <Stack gap="xs">
      {/* Battle Start - Initial HP (optional) */}
      {showBattleStart && pokemon1Name && pokemon2Name && pokemon1HP && pokemon2HP && (
        <Card withBorder p="sm" bg={colorScheme === 'dark' ? 'dark.7' : 'blue.0'}>
          <Stack gap="xs">
            <Group justify="space-between" align="center">
              <Text size="xs" fw={600} c="blue">
                Battle Start
              </Text>
              <Badge size="xs" variant="light" color="blue">
                Turn 0
              </Badge>
            </Group>
            <Group justify="space-between">
              <Group gap="xs">
                <IconHeart size={12} color="var(--mantine-color-red-6)" />
                <Text size="xs" tt="capitalize" fw={500}>{pokemon1Name}:</Text>
                <Text size="xs" c="green.6" fw={600}>
                  {pokemon1HP} HP
                </Text>
              </Group>
              <Group gap="xs">
                <IconHeart size={12} color="var(--mantine-color-red-6)" />
                <Text size="xs" tt="capitalize" fw={500}>{pokemon2Name}:</Text>
                <Text size="xs" c="green.6" fw={600}>
                  {pokemon2HP} HP
                </Text>
              </Group>
            </Group>
          </Stack>
        </Card>
      )}

      {/* Turn-by-turn breakdown */}
      {turns?.map((turn: BattleTurn, index: number) => {
        // Check if this is the start of a new turn number
        const isNewTurn = index === 0 || turn.turn !== turns[index - 1].turn;

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

                {/* Damage display - show "[defender] took X damage" for regular moves */}
                {!turn.missed && turn.move !== 'Stat Change' && !['confusion', 'poison', 'burn', 'sandstorm', 'hail', 'recoil', 'Life Orb'].includes(turn.attacker) && (
                  <Group gap="xs" align="center">
                    {turn.damage > 0 && (
                      <Text size="xs" c="red.6">
                        <Text component="span" tt="capitalize">{turn.defender}</Text> took {turn.damage} damage
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

                {/* Status effect inflicted */}
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

                {/* HP remaining - Don't show HP line for stat changes */}
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
  );
};

export default BattleTurnDisplay;
