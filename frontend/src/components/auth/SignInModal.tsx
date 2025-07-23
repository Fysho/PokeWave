import React, { useState } from 'react';
import {
  Modal,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Group,
  Text,
  Alert,
  Divider,
  Box
} from '@mantine/core';
import { IconUser, IconLock, IconAlertCircle } from '@tabler/icons-react';
import { useAuthStore } from '../../store/authStore';

interface SignInModalProps {
  opened: boolean;
  onClose: () => void;
}

const SignInModal: React.FC<SignInModalProps> = ({ opened, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  const { signIn, signUp } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUp(username, password);
      } else {
        await signIn(username, password);
      }
      onClose();
      // Reset form
      setUsername('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text size="lg" fw={600}>
          {isSignUp ? 'Create Account' : 'Sign In'}
        </Text>
      }
      centered
      size="sm"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              variant="light"
            >
              {error}
            </Alert>
          )}

          <TextInput
            label="Username"
            placeholder="Enter your username"
            leftSection={<IconUser size={16} />}
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
            required
            disabled={isLoading}
          />

          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            leftSection={<IconLock size={16} />}
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
            disabled={isLoading}
          />

          <Button
            type="submit"
            fullWidth
            loading={isLoading}
            disabled={!username || !password}
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>

          <Divider label="or" labelPosition="center" />

          <Box ta="center">
            <Text size="sm" c="dimmed">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <Button
              variant="subtle"
              size="sm"
              onClick={toggleMode}
              disabled={isLoading}
            >
              {isSignUp ? 'Sign In' : 'Create Account'}
            </Button>
          </Box>
        </Stack>
      </form>
    </Modal>
  );
};

export default SignInModal;