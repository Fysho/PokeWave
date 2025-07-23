import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Title, 
  ActionIcon,
  Collapse,
  Group,
  SegmentedControl,
  useMantineTheme,
  useMantineColorScheme,
  Card,
  Text,
  Switch,
  NumberInput,
  Select,
  Divider,
  Badge,
  Loader,
  ScrollArea
} from '@mantine/core';
import { 
  IconChevronLeft, 
  IconChevronRight, 
  IconSettings,
  IconSwords,
  IconDice,
  IconEqual,
  IconPokeball,
  IconPackage,
  IconHeart,
  IconShield,
  IconBolt,
  IconTarget,
  IconSkull
} from '@tabler/icons-react';

interface LeftSidePanelProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  
  // Battle Settings props
  settings: {
    levelMode: 'random' | 'set';
    setLevel: number;
    generation: number;
    withItems: boolean;
  };
  onSettingsChange: (settings: any) => void;
  
  // Battle Tester props
  pokemon1: any;
  pokemon2: any;
  onSimulateBattle: () => void;
  simulation: any;
  isSimulating: boolean;
}

const LeftSidePanel: React.FC<LeftSidePanelProps> = ({
  isExpanded,
  onToggleExpanded,
  settings,
  onSettingsChange,
  pokemon1,
  pokemon2,
  onSimulateBattle,
  simulation,
  isSimulating
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [activeSection, setActiveSection] = useState<string>('settings');

  return (
    <Box
      pos="fixed"
      top={60}
      left={0}
      h="calc(100vh - 60px)"
      style={{
        width: isExpanded ? '400px' : '60px',
        transition: 'width 0.3s ease',
        borderRight: `1px solid ${colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[3]}`,
        zIndex: 999,
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
                color={activeSection === 'settings' ? 'blue' : 'grape'}
                style={{
                  position: 'absolute',
                  right: '-20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1001
                }}
              >
                {isExpanded ? <IconChevronLeft size={20} /> : <IconChevronRight size={20} />}
              </ActionIcon>
              <Collapse in={isExpanded} transitionDuration={200}>
                <Stack gap="sm">
                  <SegmentedControl
                    value={activeSection}
                    onChange={setActiveSection}
                    data={[
                      {
                        value: 'settings',
                        label: (
                          <Group gap="xs">
                            <IconSettings size={16} />
                            <span>Settings</span>
                          </Group>
                        )
                      },
                      {
                        value: 'tester',
                        label: (
                          <Group gap="xs">
                            <IconSwords size={16} />
                            <span>Battle Tester</span>
                          </Group>
                        )
                      }
                    ]}
                    size="sm"
                    fullWidth
                  />
                </Stack>
              </Collapse>
            </Group>
          </Group>
        </Box>

        {/* Content */}
        <Box style={{ flex: 1, overflow: 'hidden' }}>
          {activeSection === 'settings' ? (
            <BattleSettingsContent
              isExpanded={isExpanded}
              settings={settings}
              onSettingsChange={onSettingsChange}
            />
          ) : (
            <BattleTesterContent
              isExpanded={isExpanded}
              pokemon1={pokemon1}
              pokemon2={pokemon2}
              onSimulateBattle={onSimulateBattle}
              simulation={simulation}
              isSimulating={isSimulating}
            />
          )}
        </Box>

        {/* Collapsed State Icons */}
        {!isExpanded && (
          <Box ta="center" mt="md">
            <ActionIcon
              onClick={onToggleExpanded}
              variant="subtle"
              size="lg"
              color={activeSection === 'settings' ? 'blue' : 'grape'}
            >
              {activeSection === 'settings' ? <IconSettings size={20} /> : <IconSwords size={20} />}
            </ActionIcon>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

// Extract the content part of BattleSettings (without the wrapper)
const BattleSettingsContent: React.FC<{
  isExpanded: boolean;
  settings: any;
  onSettingsChange: (settings: any) => void;
}> = ({ isExpanded, settings, onSettingsChange }) => {
  const handleLevelModeChange = (checked: boolean) => {
    onSettingsChange({
      ...settings,
      levelMode: checked ? 'set' : 'random'
    });
  };

  const handleSetLevelChange = (value: string | number) => {
    onSettingsChange({
      ...settings,
      setLevel: typeof value === 'string' ? parseInt(value) || 50 : value
    });
  };

  const handleGenerationChange = (value: string | null) => {
    onSettingsChange({
      ...settings,
      generation: value ? parseInt(value) : 1
    });
  };

  const handleWithItemsChange = (checked: boolean) => {
    onSettingsChange({
      ...settings,
      withItems: checked
    });
  };

  // Import the content from BattleSettings.tsx (lines 120-258)
  return (
    <Collapse in={isExpanded} transitionDuration={300}>
      <Box p="md" style={{ overflowY: 'auto', height: '100%' }}>
        {/* Content copied from BattleSettings */}
        <Stack gap="lg">
          {/* Level Settings */}
          <Card withBorder p="md">
            <Stack gap="md">
              <Group gap="sm">
                <IconDice size={18} color="var(--mantine-color-grape-6)" />
                <Text fw={600} size="sm">
                  Pokemon Levels
                </Text>
              </Group>
              
              <Switch
                label={
                  <Group gap="xs">
                    {settings.levelMode === 'set' ? (
                      <IconEqual size={16} color="var(--mantine-color-blue-6)" />
                    ) : (
                      <IconDice size={16} color="var(--mantine-color-orange-6)" />
                    )}
                    <Text size="sm">
                      {settings.levelMode === 'set' ? 'Set Level' : 'Random Levels'}
                    </Text>
                  </Group>
                }
                checked={settings.levelMode === 'set'}
                onChange={(event) => handleLevelModeChange(event.currentTarget.checked)}
                color="blue"
              />
              
              <Text size="xs" c="dimmed" mt={-8}>
                {settings.levelMode === 'set' 
                  ? 'Both Pokemon will be the same level' 
                  : 'Pokemon will have random levels between 1-100'
                }
              </Text>

              {settings.levelMode === 'set' && (
                <NumberInput
                  label="Set Level"
                  description="Both Pokemon will be this level"
                  value={settings.setLevel}
                  onChange={handleSetLevelChange}
                  min={1}
                  max={100}
                  step={1}
                  size="sm"
                  leftSection={<IconEqual size={16} />}
                />
              )}
            </Stack>
          </Card>

          {/* Generation Settings */}
          <Card withBorder p="md">
            <Stack gap="md">
              <Group gap="sm">
                <IconPokeball size={18} color="var(--mantine-color-red-6)" />
                <Text fw={600} size="sm">
                  Pokemon Generation
                </Text>
              </Group>
              
              <Select
                label="Generation"
                description="Select which generation of Pokemon and battle mechanics to use"
                value={(settings.generation || 1).toString()}
                onChange={handleGenerationChange}
                data={[
                  { value: '1', label: 'Generation 1 (Red/Blue/Yellow)' },
                  { value: '2', label: 'Generation 2 (Gold/Silver/Crystal)' },
                  { value: '3', label: 'Generation 3 (Ruby/Sapphire/Emerald)' },
                  { value: '4', label: 'Generation 4 (Diamond/Pearl/Platinum)' },
                  { value: '5', label: 'Generation 5 (Black/White)' },
                  { value: '6', label: 'Generation 6 (X/Y)' },
                  { value: '7', label: 'Generation 7 (Sun/Moon)' },
                  { value: '8', label: 'Generation 8 (Sword/Shield)' },
                  { value: '9', label: 'Generation 9 (Scarlet/Violet)' }
                ]}
                size="sm"
                leftSection={<IconPokeball size={16} />}
                styles={{
                  dropdown: {
                    zIndex: 2000
                  }
                }}
              />
              
              <Text size="xs" c="dimmed">
                This affects which Pokemon appear and the battle mechanics used
              </Text>
            </Stack>
          </Card>

          {/* Items Settings */}
          <Card withBorder p="md">
            <Stack gap="md">
              <Group gap="sm">
                <IconPackage size={18} color="var(--mantine-color-teal-6)" />
                <Text fw={600} size="sm">
                  Battle Items
                </Text>
              </Group>
              
              <Switch
                label={
                  <Group gap="xs">
                    <IconPackage size={16} color={settings.withItems ? 'var(--mantine-color-teal-6)' : 'var(--mantine-color-gray-6)'} />
                    <Text size="sm">
                      Use Held Items
                    </Text>
                  </Group>
                }
                checked={settings.withItems}
                onChange={(event) => handleWithItemsChange(event.currentTarget.checked)}
                color="teal"
              />
              
              <Text size="xs" c="dimmed" mt={-8}>
                {settings.withItems 
                  ? 'Pokemon will hold competitive items like Choice Band, Leftovers, etc.' 
                  : 'Pokemon will not hold any items'
                }
              </Text>
            </Stack>
          </Card>

          <Divider />

          {/* Placeholder for future settings */}
          <Card withBorder p="md">
            <Text size="sm" c="dimmed" ta="center">
              More settings coming soon...
            </Text>
          </Card>
        </Stack>
      </Box>
    </Collapse>
  );
};

// Extract the content part of BattleTester (without the wrapper)
const BattleTesterContent: React.FC<{
  isExpanded: boolean;
  pokemon1: any;
  pokemon2: any;
  onSimulateBattle: () => void;
  simulation: any;
  isSimulating: boolean;
}> = ({ isExpanded, pokemon1, pokemon2, onSimulateBattle, simulation, isSimulating }) => {
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

  // Import the content from BattleTester.tsx (lines 260-503)
  return (
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
                            {/* Check if this is a stat change */}
                            {turn.move === 'Stat Change' && turn.statChange ? (
                              <>
                                <Text component="span" fw={500} tt="capitalize">
                                  {turn.attacker}
                                </Text>
                                {"'s "}
                                <Text component="span" fw={500} c={turn.statChange.stages > 0 ? 'green.6' : turn.statChange.stages < 0 ? 'red.6' : 'gray.6'}>
                                  {getStatChangeText(turn.statChange)}
                                </Text>
                              </>
                            ) : ['confusion', 'poison', 'burn', 'sandstorm', 'hail', 'recoil', 'Life Orb'].includes(turn.attacker) ? (
                              <>
                                <Text component="span" fw={500} tt="capitalize">
                                  {turn.defender}
                                </Text>
                                {' '}took{' '}
                                <Text component="span" fw={500} c={getStatusEffectColor(turn.attacker)}>
                                  {turn.damage} damage
                                </Text>
                                {' '}from{' '}
                                <Text component="span" fw={500}>
                                  {turn.attacker === 'confusion' ? 'confusion' : 
                                   turn.attacker === 'recoil' ? 'recoil' :
                                   turn.attacker === 'Life Orb' ? 'Life Orb' :
                                   turn.attacker}
                                </Text>
                                {turn.attacker === 'confusion' && '!'}
                              </>
                            ) : turn.move.startsWith("Can't move") ? (
                              <Text size="xs" c="gray.6" fs="italic">
                                <Text component="span" fw={500} tt="capitalize">
                                  {turn.attacker}
                                </Text>
                                {' '}{turn.move.replace("Can't move", "couldn't move")}
                              </Text>
                            ) : (
                              <>
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
                              </>
                            )}
                          </Text>
                          
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
  );
};

export default LeftSidePanel;