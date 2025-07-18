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
  Card
} from '@mantine/core';
import { 
  IconChevronLeft, 
  IconChevronRight, 
  IconSettings,
  IconDice,
  IconEqual
} from '@tabler/icons-react';

interface BattleSettingsProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  settings: {
    levelMode: 'random' | 'set';
    setLevel: number;
  };
  onSettingsChange: (settings: any) => void;
}

const BattleSettings: React.FC<BattleSettingsProps> = ({
  isExpanded,
  onToggleExpanded,
  settings,
  onSettingsChange
}) => {
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

  return (
    <Box
      pos="fixed"
      top={0}
      left={0}
      h="100vh"
      bg="white"
      style={{
        width: isExpanded ? '320px' : '60px',
        transition: 'width 0.3s ease',
        borderRight: '1px solid var(--mantine-color-gray-3)',
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
            backgroundColor: 'var(--mantine-color-blue-0)'
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
              <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
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

              <Divider />

              {/* Placeholder for future settings */}
              <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
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