import React, { useState, useEffect } from 'react';
import { AppShell, Container, Group, Button, Badge, ActionIcon, useMantineColorScheme, Box, useMantineTheme, Text, Menu, Avatar } from '@mantine/core';
import {
  PixelHistory,
  PixelSwords,
  PixelCalendar,
  PixelCrown,
  PixelUsers,
  PixelSun,
  PixelMoon,
  PixelInfo,
  PixelInfinity,
  PixelPokeball,
  PixelLogout,
  PixelUser
} from '../ui/PixelIcons';
import LeftSidePanel from '../panels/LeftSidePanel';
import RightSidePanel from '../panels/RightSidePanel';
import { useSettingsStore } from '../../store/settingsStore';
import { useGameStore } from '../../store/gameStore';
import { useAuthStore } from '../../store/authStore';
import SignInModal from '../auth/SignInModal';
import AuthService from '../../services/auth';
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
  const [isBattleTesterExpanded, setIsBattleTesterExpanded] = useState(false);
  const { currentBattle } = useGameStore();
  const { user, isAuthenticated, signOut, checkAuth, token } = useAuthStore();
  const [signInModalOpened, setSignInModalOpened] = useState(false);
  
  // Set auth token on mount if it exists
  useEffect(() => {
    if (token) {
      AuthService.setAuthToken(token);
    }
    checkAuth();
  }, [token, checkAuth]);

  const navigationItems = [
    { id: 'battle', label: 'Battle', icon: PixelSwords, description: 'Predict Pokemon battles' },
    { id: 'history', label: 'History', icon: PixelHistory, description: 'View your battle history', badge: battleCount },
    { id: 'leaderboard', label: 'Leaderboard', icon: PixelCrown, description: 'Global rankings' },
    { id: 'daily', label: 'Daily', icon: PixelCalendar, description: 'Daily challenges' },
    { id: 'endless', label: 'Endless', icon: PixelInfinity, description: 'Survival mode' },
    { id: 'pokedex', label: 'Pokédex', icon: PixelPokeball, description: 'Browse all Pokémon' },
    { id: 'pokeinfo', label: 'PokeInfo', icon: PixelInfo, description: 'Pokemon debug information' },
  ];

  return (
    <Box>
      {/* Left Panel with Settings */}
      {(activeTab === 'battle' || activeTab === 'endless') && (
        <LeftSidePanel
          isExpanded={isSettingsPanelExpanded}
          onToggleExpanded={toggleSettingsPanel}
          settings={battleSettings}
          onSettingsChange={setBattleSettings}
        />
      )}
      
      {/* Right Panel with Battle Tester */}
      {(activeTab === 'battle' || activeTab === 'endless') && (
        <RightSidePanel
          isExpanded={isBattleTesterExpanded}
          onToggleExpanded={() => setIsBattleTesterExpanded(!isBattleTesterExpanded)}
          pokemon1={currentBattle?.pokemon1}
          pokemon2={currentBattle?.pokemon2}
          onSimulateBattle={async () => {
            if (!currentBattle?.pokemon1 || !currentBattle?.pokemon2) return;

            setIsBattleTesterSimulating(true);
            try {
              // Send the current Pokemon data to the backend for battle testing
              // Include generation from battle settings for correct battle mechanics
              const response = await fetch('/api/battle/simulate-single', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  pokemon1: currentBattle.pokemon1,
                  pokemon2: currentBattle.pokemon2,
                  generation: battleSettings.generation || 9
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
            </Group>
            
            <Group>
              <ActionIcon
                onClick={() => toggleColorScheme()}
                variant="default"
                size="lg"
              >
                {colorScheme === 'dark' ? <PixelSun size={18} /> : <PixelMoon size={18} />}
              </ActionIcon>
              
              {isAuthenticated ? (
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      leftSection={
                        <Avatar 
                          src={user?.avatarSprite || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'} 
                          size={40} 
                          radius="xl"
                        />
                      }
                      styles={{
                        root: { paddingLeft: '8px' },
                        label: { marginLeft: '8px' }
                      }}
                    >
                      {user?.username}
                    </Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label>Account</Menu.Label>
                    <Menu.Item
                      leftSection={
                        <Avatar 
                          src={user?.avatarSprite || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'} 
                          size={18} 
                          radius="xl"
                        />
                      }
                      onClick={() => onTabChange('profile')}
                    >
                      View Profile
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      color="red"
                      leftSection={<PixelLogout size={14} />}
                      onClick={signOut}
                    >
                      Sign Out
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  leftSection={<PixelUsers size={14} />}
                  onClick={() => setSignInModalOpened(true)}
                >
                  Sign In
                </Button>
              )}
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
                  leftSection={<Icon size={12} />}
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
              marginRight: (activeTab === 'battle' || activeTab === 'endless') ? (isBattleTesterExpanded ? '400px' : '60px') : '0',
              transition: 'margin-left 0.3s ease, margin-right 0.3s ease',
              maxWidth: (activeTab === 'battle' || activeTab === 'endless') ? 
                `calc(100% - ${isSettingsPanelExpanded ? '400px' : '60px'} - ${isBattleTesterExpanded ? '400px' : '60px'})` : 
                '100%'
            }}
          >
            {children}
          </Container>
        </AppShell.Main>
      </AppShell>
      
      {/* Sign In Modal */}
      <SignInModal 
        opened={signInModalOpened} 
        onClose={() => setSignInModalOpened(false)} 
      />
    </Box>
  );
};

export default MainLayout;