import React, { useState } from 'react';
import { Button, Card, Stack, Text, Group, Badge, Loader, Title } from '@mantine/core';
import { IconRefresh, IconDatabase, IconCheck, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { api } from '../../services/api';

const AdminTools: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cacheStats, setCacheStats] = useState<{ size: number; targetSize: number } | null>(null);

  const refreshBattleCache = async () => {
    setIsRefreshing(true);
    try {
      const response = await api.post('/battle/cache-refresh');
      setCacheStats({
        size: response.data.cacheSize,
        targetSize: response.data.targetSize
      });
      
      notifications.show({
        title: 'Cache Refreshed',
        message: `Successfully generated ${response.data.cacheSize} battles`,
        color: 'green',
        icon: <IconCheck />
      });
    } catch (error) {
      notifications.show({
        title: 'Refresh Failed',
        message: 'Could not refresh battle cache',
        color: 'red',
        icon: <IconX />
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchCacheStats = async () => {
    try {
      const response = await api.get('/battle/cache-stats');
      setCacheStats({
        size: response.data.cacheSize,
        targetSize: response.data.targetSize
      });
    } catch (error) {
      console.error('Failed to fetch cache stats:', error);
    }
  };

  React.useEffect(() => {
    fetchCacheStats();
  }, []);

  return (
    <Card withBorder p="lg">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={3}>Admin Tools</Title>
          <Badge size="lg" variant="light">
            Development Only
          </Badge>
        </Group>

        <Card withBorder p="md">
          <Stack gap="sm">
            <Group justify="space-between">
              <Group gap="xs">
                <IconDatabase size={20} />
                <Text fw={500}>Battle Cache</Text>
              </Group>
              {cacheStats && (
                <Badge variant="filled" color="blue">
                  {cacheStats.size} / {cacheStats.targetSize} battles
                </Badge>
              )}
            </Group>
            
            <Text size="sm" c="dimmed">
              Clear and regenerate all cached battles with Pokemon from Gen 1-4
            </Text>
            
            <Button
              fullWidth
              leftSection={isRefreshing ? <Loader size={16} /> : <IconRefresh size={16} />}
              onClick={refreshBattleCache}
              loading={isRefreshing}
              variant="light"
              color="blue"
            >
              Refresh Battle Cache
            </Button>
          </Stack>
        </Card>
      </Stack>
    </Card>
  );
};

export default AdminTools;