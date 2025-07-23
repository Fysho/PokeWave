import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  Title, 
  Group, 
  Button, 
  Text, 
  Stack, 
  Avatar, 
  Card, 
  Center,
  Loader,
  Alert,
  Badge
} from '@mantine/core';
import { 
  IconLogout, 
  IconShieldCheck, 
  IconUser,
  IconAlertCircle,
  IconCheck
} from '@tabler/icons-react';
import { useAuthStore } from '../../store/authStore';
import { notifications } from '@mantine/notifications';

const Profile: React.FC = () => {
  const { user, isAuthenticated, signOut, checkAuth } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(false);

  const handleLogout = () => {
    signOut();
    notifications.show({
      title: 'Logged Out',
      message: 'You have been successfully logged out',
      color: 'blue',
      icon: <IconCheck size={16} />
    });
  };

  const handleVerifySession = async () => {
    setIsVerifying(true);
    try {
      const isValid = await checkAuth();
      
      if (isValid) {
        notifications.show({
          title: 'Session Valid',
          message: 'Your login session is active and valid',
          color: 'green',
          icon: <IconShieldCheck size={16} />
        });
      } else {
        notifications.show({
          title: 'Session Invalid',
          message: 'Your login session has expired. Please log in again.',
          color: 'red',
          icon: <IconAlertCircle size={16} />
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Verification Failed',
        message: 'Could not verify session. Please try again.',
        color: 'red',
        icon: <IconAlertCircle size={16} />
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <Container size="sm" py="xl">
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Not Logged In" 
          color="yellow"
        >
          Please log in to view your profile.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Paper p="xl" radius="md" withBorder>
        <Stack gap="xl">
          {/* Profile Header */}
          <Center>
            <Stack align="center" gap="md">
              <Avatar 
                src={user.avatarSprite || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'} 
                size={120} 
                radius="xl"
              />
              <Title order={2}>{user.username}</Title>
              {user.email && (
                <Text c="dimmed" size="sm">{user.email}</Text>
              )}
            </Stack>
          </Center>

          {/* User Stats */}
          <Card withBorder p="md">
            <Group justify="space-around">
              <Stack align="center" gap="xs">
                <Text size="xs" c="dimmed">Member Since</Text>
                <Text fw={500}>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </Text>
              </Stack>
              <Stack align="center" gap="xs">
                <Text size="xs" c="dimmed">User ID</Text>
                <Badge variant="light">{user.id}</Badge>
              </Stack>
            </Group>
          </Card>

          {/* Action Buttons */}
          <Stack gap="md">
            <Button
              fullWidth
              leftSection={isVerifying ? <Loader size={16} /> : <IconShieldCheck size={16} />}
              onClick={handleVerifySession}
              loading={isVerifying}
              variant="light"
              color="blue"
            >
              Verify Login Session
            </Button>
            
            <Button
              fullWidth
              leftSection={<IconLogout size={16} />}
              onClick={handleLogout}
              color="red"
              variant="outline"
            >
              Log Out
            </Button>
          </Stack>

          {/* Session Info */}
          <Card withBorder p="sm" bg="gray.0">
            <Group gap="xs">
              <IconUser size={16} />
              <Text size="sm" c="dimmed">
                Currently logged in as <Text component="span" fw={500}>{user.username}</Text>
              </Text>
            </Group>
          </Card>
        </Stack>
      </Paper>
    </Container>
  );
};

export default Profile;