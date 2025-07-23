import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Title, 
  ActionIcon,
  Collapse,
  Group,
  useMantineTheme,
  useMantineColorScheme,
  Card,
  Text,
  Switch,
  NumberInput,
  Select,
  Divider,
  Button
} from '@mantine/core';
import { 
  IconChevronLeft, 
  IconChevronRight, 
  IconSettings,
  IconDice,
  IconEqual,
  IconPokeball,
  IconPackage,
  IconBug,
  IconSwords
} from '@tabler/icons-react';
import { useGameStore } from '../../store/gameStore';

interface LeftSidePanelProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  
  // Battle Settings props
  settings: {
    levelMode: 'random' | 'set';
    setLevel: number;
    generation: number;
    withItems: boolean;
    debugMode?: boolean;
  };
  onSettingsChange: (settings: any) => void;
}

const LeftSidePanel: React.FC<LeftSidePanelProps> = ({
  isExpanded,
  onToggleExpanded,
  settings,
  onSettingsChange
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

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
          <Stack gap="xs">
            <ActionIcon
              onClick={onToggleExpanded}
              variant="filled"
              size="lg"
              color="blue"
              style={{
                position: 'absolute',
                right: '-20px',
                top: '20px',
                zIndex: 1001
              }}
            >
              {isExpanded ? <IconChevronLeft size={20} /> : <IconChevronRight size={20} />}
            </ActionIcon>
            <Collapse in={isExpanded} transitionDuration={200}>
              <Group gap="sm">
                <IconSettings size={20} color="var(--mantine-color-blue-6)" />
                <Title order={4} c="blue.6">
                  Battle Settings
                </Title>
              </Group>
            </Collapse>
          </Stack>
        </Box>

        {/* Content */}
        <Box style={{ flex: 1, overflow: 'hidden' }}>
          <BattleSettingsContent
            isExpanded={isExpanded}
            settings={settings}
            onSettingsChange={onSettingsChange}
          />
        </Box>

        {/* Collapsed State Icon */}
        {!isExpanded && (
          <Box ta="center" mt="md">
            <ActionIcon
              onClick={onToggleExpanded}
              variant="subtle"
              size="lg"
              color="blue"
            >
              <IconSettings size={20} />
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
  const { generateTestBattle } = useGameStore();
  const [battleCount, setBattleCount] = useState(100);
  const [isGenerating, setIsGenerating] = useState(false);
  
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

  const handleDebugModeChange = (checked: boolean) => {
    onSettingsChange({
      ...settings,
      debugMode: checked
    });
  };

  // Import the content from BattleSettings.tsx (lines 120-258)
  return (
    <Collapse in={isExpanded} transitionDuration={300}>
      <Box p="md" style={{ overflowY: 'auto', height: '100%' }}>
        {/* Content copied from BattleSettings */}
        <Stack gap="lg">
          {/* Generate Test Battle Button */}
          <Button
            fullWidth
            size="md"
            variant="gradient"
            gradient={{ from: 'blue', to: 'grape', deg: 135 }}
            leftSection={<IconSwords size={20} />}
            onClick={() => generateTestBattle(settings)}
          >
            Generate Test Battle
          </Button>
          
          {/* Battle Count for Test Generation */}
          <Card withBorder p="md">
            <Stack gap="md">
              <Group gap="sm">
                <IconSwords size={18} color="var(--mantine-color-blue-6)" />
                <Text fw={600} size="sm">
                  Test Battle Generation
                </Text>
              </Group>
              
              <NumberInput
                label="Number of battles to simulate"
                description="For testing random Pokemon matchups"
                value={battleCount}
                onChange={(value) => setBattleCount(typeof value === 'string' ? parseInt(value) || 100 : value)}
                min={10}
                max={1000}
                step={10}
                leftSection={<IconSwords size={16} />}
              />
              
              <Button
                fullWidth
                size="sm"
                variant="light"
                leftSection={<IconDice size={16} />}
                onClick={async () => {
                  setIsGenerating(true);
                  try {
                    // Call new endpoint for random battle generation
                    const response = await fetch('http://localhost:4000/api/battle/simulate-random', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        count: battleCount,
                        options: settings
                      })
                    });
                    
                    if (!response.ok) {
                      throw new Error(`Failed to generate battles: ${response.statusText}`);
                    }
                    
                    const result = await response.json();
                    console.log('Generated battles result:', result);
                    
                    // Show notification or handle result
                    const { notifications } = await import('@mantine/notifications');
                    notifications.show({
                      title: 'Battles Generated',
                      message: `Successfully simulated ${battleCount} random battles. Winner: ${result.pokemon1Name} (${result.pokemon1Wins} wins) vs ${result.pokemon2Name} (${result.pokemon2Wins} wins)`,
                      color: 'green',
                      autoClose: 5000
                    });
                  } catch (error) {
                    console.error('Error generating test battles:', error);
                    const { notifications } = await import('@mantine/notifications');
                    notifications.show({
                      title: 'Error',
                      message: 'Failed to generate test battles',
                      color: 'red'
                    });
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                loading={isGenerating}
              >
                Generate Test Battles
              </Button>
            </Stack>
          </Card>
          
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

          {/* Debug Mode Settings */}
          <Card withBorder p="md">
            <Stack gap="md">
              <Group gap="sm">
                <IconBug size={18} color="var(--mantine-color-yellow-6)" />
                <Text fw={600} size="sm">
                  Debug Mode
                </Text>
              </Group>
              
              <Switch
                label={
                  <Group gap="xs">
                    <IconBug size={16} color={settings.debugMode ? 'var(--mantine-color-yellow-6)' : 'var(--mantine-color-gray-6)'} />
                    <Text size="sm">
                      Enable Debug Mode
                    </Text>
                  </Group>
                }
                checked={settings.debugMode || false}
                onChange={(event) => handleDebugModeChange(event.currentTarget.checked)}
                color="yellow"
              />
              
              <Text size="xs" c="dimmed" mt={-8}>
                {settings.debugMode 
                  ? 'Click on moves to manually select and change them' 
                  : 'Enable to manually edit Pokemon moves for testing'
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

export default LeftSidePanel;