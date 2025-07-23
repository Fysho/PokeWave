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
  IconMoon,
  IconInfoCircle,
  IconInfinity,
  IconPokeball
} from '@tabler/icons-react';
import LeftSidePanel from '../panels/LeftSidePanel';
import { useSettingsStore } from '../../store/settingsStore';
import { useGameStore } from '../../store/gameStore';
// import ApiService from '../../services/api';

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
    battleTesterSimulation,
    isBattleTesterSimulating,
    setBattleSettings, 
    toggleSettingsPanel,
    setBattleTesterSimulation,
    setIsBattleTesterSimulating
  } = useSettingsStore();
  const { currentBattle } = useGameStore();

  const navigationItems = [
    { id: 'battle', label: 'Battle', icon: IconDeviceGamepad2, description: 'Predict Pokemon battles' },
    { id: 'history', label: 'History', icon: IconHistory, description: 'View your battle history', badge: battleCount },
    { id: 'stats', label: 'Stats', icon: IconChartBar, description: 'Detailed analytics' },
    { id: 'leaderboard', label: 'Leaderboard', icon: IconCrown, description: 'Global rankings' },
    { id: 'daily', label: 'Daily', icon: IconCalendar, description: 'Daily challenges' },
    { id: 'endless', label: 'Endless', icon: IconInfinity, description: 'Survival mode' },
    { id: 'pokedex', label: 'Pokédex', icon: IconPokeball, description: 'Browse all Pokémon' },
    { id: 'pokeinfo', label: 'PokeInfo', icon: IconInfoCircle, description: 'Pokemon debug information' },
  ];

  return (
    <Box>
      {/* Combined Left Panel with Settings and Battle Tester */}
      {(activeTab === 'battle' || activeTab === 'endless') && (
        <LeftSidePanel
          isExpanded={isSettingsPanelExpanded}
          onToggleExpanded={toggleSettingsPanel}
          settings={battleSettings}
          onSettingsChange={setBattleSettings}
          pokemon1={currentBattle?.pokemon1}
          pokemon2={currentBattle?.pokemon2}
          onSimulateBattle={async () => {
            if (!currentBattle?.pokemon1 || !currentBattle?.pokemon2) return;
            
            setIsBattleTesterSimulating(true);
            try {
              // Send the current Pokemon data to the backend for battle testing
              const response = await fetch('http://localhost:4000/api/battle/simulate-single', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  pokemon1: currentBattle.pokemon1,
                  pokemon2: currentBattle.pokemon2
                })
              });
              
              if (!response.ok) {
                throw new Error(`Battle test failed: ${response.statusText}`);
              }
              
              const result = await response.json();
              
              // The result already contains the formatted data we need
              setBattleTesterSimulation(result);
            } catch (error) {
              console.error('Battle test error:', error);
            } finally {
              setIsBattleTesterSimulating(false);
            }
          }}
          simulation={battleTesterSimulation}
          isSimulating={isBattleTesterSimulating}
        />
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
                <Box 
                  component="img"
                  src="/PokeWaveLogo256.png" 
                  alt="PokeWave Logo"
                  h={40}
                  style={{ 
                    objectFit: 'contain',
                    cursor: 'pointer'
                  }}
                  onClick={() => onTabChange('battle')}
                />
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
              <Button 
                onClick={() => onTabChange('profile')}
                variant={activeTab === 'profile' ? "filled" : "subtle"}
                size="sm" 
                leftSection={<IconUsers size={16} />}
              >
                Profile
              </Button>
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
              marginLeft: (activeTab === 'battle' || activeTab === 'endless') ? (isSettingsPanelExpanded ? '400px' : '60px') : '0',
              marginRight: '0',
              transition: 'margin-left 0.3s ease',
              maxWidth: (activeTab === 'battle' || activeTab === 'endless') ? 
                `calc(100% - ${isSettingsPanelExpanded ? '400px' : '60px'})` : 
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