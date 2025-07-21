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
  IconInfoCircle
} from '@tabler/icons-react';
import BattleSettings from '../settings/BattleSettings';
import BattleTester from '../battle/BattleTester';
import { useSettingsStore } from '../../store/settingsStore';
import { useGameStore } from '../../store/gameStore';

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
    isBattleTesterExpanded,
    battleTesterSimulation,
    isBattleTesterSimulating,
    setBattleSettings, 
    toggleSettingsPanel,
    toggleBattleTester,
    setBattleTesterSimulation,
    setIsBattleTesterSimulating
  } = useSettingsStore();
  const { currentBattle, currentPokemon1, currentPokemon2 } = useGameStore();

  const navigationItems = [
    { id: 'battle', label: 'Battle', icon: IconDeviceGamepad2, description: 'Predict Pokemon battles' },
    { id: 'history', label: 'History', icon: IconHistory, description: 'View your battle history', badge: battleCount },
    { id: 'stats', label: 'Stats', icon: IconChartBar, description: 'Detailed analytics' },
    { id: 'leaderboard', label: 'Leaderboard', icon: IconCrown, description: 'Global rankings' },
    { id: 'daily', label: 'Daily', icon: IconCalendar, description: 'Daily challenges' },
    { id: 'pokeinfo', label: 'PokeInfo', icon: IconInfoCircle, description: 'Pokemon debug information' },
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

      {/* Battle Tester Panel */}
      {activeTab === 'battle' && (
        <BattleTester
          isExpanded={isBattleTesterExpanded}
          onToggleExpanded={toggleBattleTester}
          pokemon1={currentBattle?.pokemon1}
          pokemon2={currentBattle?.pokemon2}
          rightOffset={0}
          onSimulateBattle={async () => {
            if (!currentPokemon1 || !currentPokemon2) return;
            
            setIsBattleTesterSimulating(true);
            try {
              // Import and use the single battle simulation
              const { simulateSingleBattle } = await import('../../utils/mainBattleSimulation');
              
              // Convert Pokemon instances to CompletePokemon format
              const pokemon1Data = {
                id: currentPokemon1.id,
                name: currentPokemon1.name,
                species: currentPokemon1.name,
                level: currentPokemon1.level,
                types: currentPokemon1.types,
                stats: {
                  hp: currentPokemon1.calculatedStats.hp,
                  attack: currentPokemon1.calculatedStats.attack,
                  defense: currentPokemon1.calculatedStats.defense,
                  specialAttack: currentPokemon1.calculatedStats.specialAttack,
                  specialDefense: currentPokemon1.calculatedStats.specialDefense,
                  speed: currentPokemon1.calculatedStats.speed
                },
                moves: currentPokemon1.moves,
                moveNames: currentPokemon1.moves,
                ability: currentPokemon1.ability,
                abilityName: currentPokemon1.ability,
                item: currentPokemon1.item,
                sprites: currentPokemon1.sprites,
                wins: currentPokemon1.wins
              };
              
              const pokemon2Data = {
                id: currentPokemon2.id,
                name: currentPokemon2.name,
                species: currentPokemon2.name,
                level: currentPokemon2.level,
                types: currentPokemon2.types,
                stats: {
                  hp: currentPokemon2.calculatedStats.hp,
                  attack: currentPokemon2.calculatedStats.attack,
                  defense: currentPokemon2.calculatedStats.defense,
                  specialAttack: currentPokemon2.calculatedStats.specialAttack,
                  specialDefense: currentPokemon2.calculatedStats.specialDefense,
                  speed: currentPokemon2.calculatedStats.speed
                },
                moves: currentPokemon2.moves,
                moveNames: currentPokemon2.moves,
                ability: currentPokemon2.ability,
                abilityName: currentPokemon2.ability,
                item: currentPokemon2.item,
                sprites: currentPokemon2.sprites,
                wins: currentPokemon2.wins
              };
              
              const startTime = Date.now();
              const result = await simulateSingleBattle(
                pokemon1Data,
                pokemon2Data,
                battleSettings.generation
              );
              
              // Format the result for the battle tester display
              const formattedResult = {
                winner: result.winner === 1 ? currentPokemon1.name : currentPokemon2.name,
                totalTurns: result.totalTurns,
                executionTime: Date.now() - startTime,
                pokemon1: currentBattle.pokemon1,
                pokemon2: currentBattle.pokemon2,
                turns: result.events.map((event, index) => {
                  if (event.type === 'move') {
                    const attacker = event.pokemon === 'p1' ? currentPokemon1.name : currentPokemon2.name;
                    const defender = event.pokemon === 'p1' ? currentPokemon2.name : currentPokemon1.name;
                    
                    // Find the next damage event for this move
                    const damageEvent = result.events.slice(index + 1).find(e => 
                      e.type === 'damage' && e.turn === event.turn
                    );
                    
                    return {
                      turn: event.turn,
                      attacker,
                      defender,
                      move: event.details?.move || 'Unknown Move',
                      damage: damageEvent?.details?.damage || 0,
                      remainingHP: 0, // Will be calculated based on final HP
                      critical: false,
                      effectiveness: 'normal'
                    };
                  }
                  return null;
                }).filter(Boolean)
              };
              
              setBattleTesterSimulation(formattedResult);
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
              marginRight: activeTab === 'battle' ? (isBattleTesterExpanded ? '400px' : '60px') : '0',
              transition: 'margin-left 0.3s ease, margin-right 0.3s ease',
              maxWidth: activeTab === 'battle' ? 
                `calc(100% - ${isSettingsPanelExpanded ? '320px' : '60px'} - ${isBattleTesterExpanded ? '400px' : '60px'})` : 
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