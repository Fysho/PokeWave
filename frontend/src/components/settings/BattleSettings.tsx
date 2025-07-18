import React from 'react';
import { 
  Box, 
  Stack, 
  Title, 
  Switch, 
  NumberInput, 
  Text, 
  Divider,
  ActionIcon,
  Collapse,
  Group,
  Card,
  Select,
  useMantineTheme,
  useMantineColorScheme
} from '@mantine/core';
import { 
  IconChevronLeft, 
  IconChevronRight, 
  IconSettings,
  IconDice,
  IconEqual,
  IconPokeball,
  IconPackage
} from '@tabler/icons-react';

interface BattleSettingsProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  settings: {
    levelMode: 'random' | 'set';
    setLevel: number;
    generation: number;
    withItems: boolean;
  };
  onSettingsChange: (settings: any) => void;
}

const BattleSettings: React.FC<BattleSettingsProps> = ({
  isExpanded,
  onToggleExpanded,
  settings,
  onSettingsChange
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
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

  return (
    <Box
      pos="fixed"
      top={60}
      left={0}
      h="calc(100vh - 60px)"
      style={{
        width: isExpanded ? '320px' : '60px',
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
              <IconSettings size={20} color="var(--mantine-color-blue-6)" />
              <Collapse in={isExpanded} transitionDuration={200}>
                <Title order={4} c="blue.6">
                  Battle Settings
                </Title>
              </Collapse>
            </Group>
            <ActionIcon
              onClick={onToggleExpanded}
              variant="subtle"
              size="sm"
              color="blue"
            >
              {isExpanded ? <IconChevronLeft size={16} /> : <IconChevronRight size={16} />}
            </ActionIcon>
          </Group>
        </Box>

        {/* Settings Content */}
        <Collapse in={isExpanded} transitionDuration={300}>
          <Box p="md" style={{ overflowY: 'auto', flex: 1 }}>
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

export default BattleSettings;