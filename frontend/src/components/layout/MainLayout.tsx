import React from 'react';
import { AppShell, Container, Group, Button, Badge, ActionIcon, useMantineColorScheme } from '@mantine/core';
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

  const navigationItems = [
    { id: 'battle', label: 'Battle', icon: IconDeviceGamepad2, description: 'Predict Pokemon battles' },
    { id: 'history', label: 'History', icon: IconHistory, description: 'View your battle history', badge: battleCount },
    { id: 'stats', label: 'Stats', icon: IconChartBar, description: 'Detailed analytics' },
    { id: 'leaderboard', label: 'Leaderboard', icon: IconCrown, description: 'Global rankings' },
    { id: 'daily', label: 'Daily', icon: IconCalendar, description: 'Daily challenges' },
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 0, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <IconDeviceGamepad2 size={20} color="white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PokeWave
              </span>
            </div>
            
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
        <Group gap="xs" p="md" hiddenFrom="lg" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
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

      <AppShell.Main>
        <Container size="xl">
          {children}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};

export default MainLayout;