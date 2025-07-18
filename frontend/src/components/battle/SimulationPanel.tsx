import React from 'react';
import {
  Box,
  Stack,
  Group,
  ActionIcon,
  Title,
  Text,
  useMantineTheme,
  useMantineColorScheme,
  Collapse
} from '@mantine/core';
import {
  IconChevronLeft,
  IconChevronRight,
  IconActivity
} from '@tabler/icons-react';
import { useSettingsStore } from '../../store/settingsStore';
import { useGameStore } from '../../store/gameStore';
import BattleSimulationDisplay from './BattleSimulationDisplay';

const SimulationPanel: React.FC = () => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const { 
    isSimulationPanelExpanded, 
    toggleSimulationPanel,
    battleSimulation,
    isSimulating
  } = useSettingsStore();
  
  const { currentBattle } = useGameStore();

  // Don't render if no battle
  if (!currentBattle) {
    return null;
  }

  // Check if we have a sample battle
  const hasSampleBattle = currentBattle && 'sampleBattle' in currentBattle && currentBattle.sampleBattle;

  return (
    <Box
      pos="fixed"
      top={60}
      right={0}
      h="calc(100vh - 60px)"
      style={{
        width: isSimulationPanelExpanded ? '420px' : '60px',
        transition: 'width 0.3s ease',
        borderLeft: `1px solid ${colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[3]}`,
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
                onClick={toggleSimulationPanel}
                variant="subtle"
                size="sm"
                color="blue"
              >
                {isSimulationPanelExpanded ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
              </ActionIcon>
              <Collapse in={isSimulationPanelExpanded} transitionDuration={200}>
                <Group gap="sm">
                  <IconActivity size={20} color="var(--mantine-color-green-6)" />
                  <Title order={4} c="green.6">
                    Battle Simulation
                  </Title>
                </Group>
              </Collapse>
            </Group>
          </Group>
        </Box>

        {/* Content */}
        <Collapse in={isSimulationPanelExpanded} transitionDuration={300}>
          <Box p="md" style={{ overflowY: 'auto', flex: 1 }}>
            {hasSampleBattle && currentBattle.sampleBattle ? (
              <BattleSimulationDisplay
                pokemon1={currentBattle.pokemon1}
                pokemon2={currentBattle.pokemon2}
                simulationResults={[currentBattle.sampleBattle]}
                isSimulating={isSimulating}
              />
            ) : (
              <Stack align="center" gap="md" mt="xl">
                <IconActivity size={48} color="var(--mantine-color-gray-5)" />
                <Text c="dimmed" ta="center">
                  Battle simulation details will appear here
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  Run a new battle to see turn-by-turn events
                </Text>
              </Stack>
            )}
          </Box>
        </Collapse>

        {/* Collapsed State Icon */}
        {!isSimulationPanelExpanded && (
          <Box ta="center" mt="md">
            <ActionIcon
              onClick={toggleSimulationPanel}
              variant="subtle"
              size="lg"
              color="green"
            >
              <IconActivity size={20} />
            </ActionIcon>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default SimulationPanel;