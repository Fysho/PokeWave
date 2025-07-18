import React from 'react';
import { AppShell, Container, Group, Button, Badge, ActionIcon, useMantineColorScheme, Box, useMantineTheme, Text } from '@mantine/core';
import { 
  IconHistory, 
  IconChartBar, 
  IconDeviceGamepad2,
  IconCalendar,
  IconCrown,
  IconUsers,
  IconSun,
  IconMoon
} from '@tabler/icons-react';
import BattleSettings from '../settings/BattleSettings';
import SimulationPanel from '../battle/SimulationPanel';
import { useSettingsStore } from '../../store/settingsStore';

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  battleCount?: number;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  battleCount = 0 
}) => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const { 
    battleSettings, 
    isSettingsPanelExpanded, 
    isSimulationPanelExpanded,
    setBattleSettings, 
    toggleSettingsPanel
  } = useSettingsStore();

  const navigationItems = [
    { id: 'battle', label: 'Battle', icon: IconDeviceGamepad2, description: 'Predict Pokemon battles' },
    { id: 'history', label: 'History', icon: IconHistory, description: 'View your battle history', badge: battleCount },
    { id: 'stats', label: 'Stats', icon: IconChartBar, description: 'Detailed analytics' },
    { id: 'leaderboard', label: 'Leaderboard', icon: IconCrown, description: 'Global rankings' },
    { id: 'daily', label: 'Daily', icon: IconCalendar, description: 'Daily challenges' },
  ];

  return (
    <Box>
      {/* Settings Panel */}
      {activeTab === 'battle' && (
        <BattleSettings
          isExpanded={isSettingsPanelExpanded}
          onToggleExpanded={toggleSettingsPanel}
          settings={battleSettings}
          onSettingsChange={setBattleSettings}
        />
      )}

      {/* Battle Simulation Panel */}
      {activeTab === 'battle' && (
        <SimulationPanel />
      )}

      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 0, breakpoint: 'sm' }}
        padding="md"
        style={{
          backgroundColor: colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0]
        }}
      >
        <AppShell.Header
          style={{
            backgroundColor: colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
            borderBottom: `1px solid ${colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[3]}`
          }}
        >
          <Group h="100%" px="md" justify="space-between">
            <Group>
              <Group gap="sm">
                <Box pos="relative">
                  <Box 
                    w={32} 
                    h={32} 
                    style={{ 
                      backgroundImage: 'linear-gradient(135deg, var(--mantine-color-blue-6), var(--mantine-color-grape-6))',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <IconDeviceGamepad2 size={20} color="white" />
                  </Box>
                  <Box 
                    pos="absolute"
                    top={-4}
                    right={-4}
                    w={12}
                    h={12}
                    bg="green.5"
                    style={{ 
                      borderRadius: '50%',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }}
                  />
                </Box>
                <Text 
                  size="xl"
                  fw={700}
                  style={{
                    backgroundImage: 'linear-gradient(135deg, var(--mantine-color-blue-6), var(--mantine-color-grape-6))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  PokeWave
                </Text>
              </Group>
              
              {/* Navigation */}
              <Group gap="xs" visibleFrom="lg">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      variant={activeTab === item.id ? "filled" : "subtle"}
                      size="sm"
                      leftSection={<Icon size={16} />}
                      rightSection={
                        item.badge && item.badge > 0 ? (
                          <Badge size="xs" variant="light">
                            {item.badge}
                          </Badge>
                        ) : null
                      }
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Group>
            </Group>
            
            <Group>
              <ActionIcon 
                onClick={() => toggleColorScheme()}
                variant="default"
                size="lg"
              >
                {colorScheme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
              </ActionIcon>
              <Button variant="outline" size="sm" leftSection={<IconUsers size={16} />}>
                Sign In
              </Button>
            </Group>
          </Group>

          {/* Mobile Navigation */}
          <Group gap="xs" p="md" hiddenFrom="lg" style={{ borderTop: `1px solid ${colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[3]}` }}>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  variant={activeTab === item.id ? "filled" : "subtle"}
                  size="xs"
                  leftSection={<Icon size={14} />}
                  rightSection={
                    item.badge && item.badge > 0 ? (
                      <Badge size="xs" variant="light">
                        {item.badge}
                      </Badge>
                    ) : null
                  }
                >
                  {item.label}
                </Button>
              );
            })}
          </Group>
        </AppShell.Header>

        <AppShell.Main
          style={{
            backgroundColor: colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0]
          }}
        >
          <Container 
            size="xl"
            style={{
              marginLeft: activeTab === 'battle' ? (isSettingsPanelExpanded ? '320px' : '60px') : '0',
              marginRight: activeTab === 'battle' ? (isSimulationPanelExpanded ? '400px' : '60px') : '0',
              transition: 'margin-left 0.3s ease, margin-right 0.3s ease',
              maxWidth: activeTab === 'battle' ? 
                `calc(100% - ${isSettingsPanelExpanded ? '320px' : '60px'} - ${isSimulationPanelExpanded ? '400px' : '60px'})` : 
                '100%'
            }}
          >
            {children}
          </Container>
        </AppShell.Main>
      </AppShell>
    </Box>
  );
};

export default MainLayout;