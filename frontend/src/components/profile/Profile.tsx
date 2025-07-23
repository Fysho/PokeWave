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
  Badge,
  Modal,
  TextInput,
  ScrollArea,
  Grid,
  Box,
  Image,
  ActionIcon
} from '@mantine/core';
import { 
  IconLogout, 
  IconShieldCheck, 
  IconUser,
  IconAlertCircle,
  IconCheck,
  IconPencil,
  IconSearch
} from '@tabler/icons-react';
import { useAuthStore } from '../../store/authStore';
import { usePokedexStore } from '../../store/pokedexStore';
import { notifications } from '@mantine/notifications';
import { pokemonNames, getPokemonName } from '../../data/pokemonNames';

const Profile: React.FC = () => {
  const { user, isAuthenticated, signOut, checkAuth, updateAvatar } = useAuthStore();
  const { unlockedPokemon, unlockedShinyPokemon } = usePokedexStore();
  const [isVerifying, setIsVerifying] = useState(false);
  const [avatarModalOpened, setAvatarModalOpened] = useState(false);
  const [avatarSearchQuery, setAvatarSearchQuery] = useState('');

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
              <Box style={{ position: 'relative' }}>
                <Avatar 
                  src={user.avatarSprite || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'} 
                  size={120} 
                  radius="xl"
                />
                <ActionIcon
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: 'var(--mantine-color-blue-6)',
                    color: 'white'
                  }}
                  size="md"
                  radius="xl"
                  onClick={() => setAvatarModalOpened(true)}
                >
                  <IconPencil size={16} />
                </ActionIcon>
              </Box>
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
          <Card withBorder p="sm">
            <Group gap="xs">
              <IconUser size={16} />
              <Text size="sm" c="dimmed">
                Currently logged in as <Text component="span" fw={500} c="var(--mantine-color-text)">{user.username}</Text>
              </Text>
            </Group>
          </Card>
        </Stack>
      </Paper>
      
      {/* Avatar Selection Modal */}
      <Modal
        opened={avatarModalOpened}
        onClose={() => {
          setAvatarModalOpened(false);
          setAvatarSearchQuery('');
        }}
        title="Choose Your Avatar"
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Select a Pokémon from your unlocked collection to use as your profile avatar.
          </Text>
          
          <TextInput
            placeholder="Search Pokémon by name or number..."
            leftSection={<IconSearch size={16} />}
            value={avatarSearchQuery}
            onChange={(e) => setAvatarSearchQuery(e.currentTarget.value)}
          />
          
          <ScrollArea h={400}>
            <Grid gutter="xs">
              {Array.from(unlockedPokemon)
                .filter((pokemonId) => {
                  if (!avatarSearchQuery) return true;
                  const query = avatarSearchQuery.toLowerCase();
                  
                  // Search by ID
                  if (pokemonId.toString().includes(query)) {
                    return true;
                  }
                  
                  // Search by name
                  const pokemonName = pokemonNames[pokemonId];
                  if (pokemonName && pokemonName.toLowerCase().includes(query)) {
                    return true;
                  }
                  
                  return false;
                })
                .flatMap((pokemonId) => {
                  const regularSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
                  const shinySprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemonId}.png`;
                  const pokemonName = getPokemonName(pokemonId);
                  const hasShiny = unlockedShinyPokemon.has(pokemonId);
                  
                  const avatarOptions = [];
                  
                  // Always add regular version
                  avatarOptions.push(
                    <Grid.Col key={`${pokemonId}-regular`} span={2}>
                      <Box
                        onClick={() => {
                          updateAvatar?.(pokemonId, regularSprite);
                          setAvatarModalOpened(false);
                          setAvatarSearchQuery('');
                          notifications.show({
                            title: 'Avatar Updated',
                            message: `Your avatar has been changed to ${pokemonName}`,
                            color: 'green',
                            icon: <IconCheck size={16} />
                          });
                        }}
                        style={{
                          cursor: 'pointer',
                          padding: 8,
                          borderRadius: 8,
                          border: '2px solid transparent',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          backgroundColor: 'var(--mantine-color-gray-0)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-1)';
                          e.currentTarget.style.borderColor = 'var(--mantine-color-blue-5)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
                          e.currentTarget.style.borderColor = 'transparent';
                        }}
                      >
                        <Image
                          src={regularSprite}
                          alt={pokemonName}
                          width={56}
                          height={56}
                          fit="contain"
                        />
                        <Text size="xs" c="dimmed" tt="capitalize" ta="center" lineClamp={1}>
                          {pokemonName}
                        </Text>
                      </Box>
                    </Grid.Col>
                  );
                  
                  // Only add shiny version if unlocked
                  if (hasShiny) {
                    avatarOptions.push(
                      <Grid.Col key={`${pokemonId}-shiny`} span={2}>
                        <Box
                          onClick={() => {
                            updateAvatar?.(pokemonId, shinySprite);
                            setAvatarModalOpened(false);
                            setAvatarSearchQuery('');
                            notifications.show({
                              title: 'Avatar Updated',
                              message: `Your avatar has been changed to Shiny ${pokemonName}`,
                              color: 'green',
                              icon: <IconCheck size={16} />
                            });
                          }}
                          style={{
                            cursor: 'pointer',
                            padding: 8,
                            borderRadius: 8,
                            border: '2px solid transparent',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            backgroundColor: 'var(--mantine-color-gray-0)',
                            position: 'relative'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-1)';
                            e.currentTarget.style.borderColor = 'var(--mantine-color-yellow-5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
                            e.currentTarget.style.borderColor = 'transparent';
                          }}
                        >
                          <Image
                            src={shinySprite}
                            alt={`Shiny ${pokemonName}`}
                            width={56}
                            height={56}
                            fit="contain"
                          />
                          <Text size="xs" c="dimmed" tt="capitalize" ta="center" lineClamp={1}>
                            {pokemonName} ✨
                          </Text>
                        </Box>
                      </Grid.Col>
                    );
                  }
                  
                  return avatarOptions;
                })}
            </Grid>
          </ScrollArea>
        </Stack>
      </Modal>
    </Container>
  );
};

export default Profile;