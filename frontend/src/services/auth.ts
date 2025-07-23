import { api } from './api';

interface AuthResponse {
  user: {
    id: string;
    username: string;
    createdAt: string;
    avatarPokemonId?: number;
    avatarSprite?: string;
  };
  token: string;
}

interface UpdateAvatarResponse {
  user: {
    id: string;
    username: string;
    createdAt: string;
    avatarPokemonId: number;
    avatarSprite: string;
  };
}

interface ProfileResponse {
  user: {
    id: string;
    username: string;
    createdAt: string;
    avatarPokemonId?: number;
    avatarSprite?: string;
    pokedex?: any;
    gameStats?: any;
  };
}

class AuthService {
  static async signIn(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/signin', {
        username,
        password
      });
      
      // Set the auth token for future requests
      if (response.data.token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid username or password');
      }
      throw new Error(error.response?.data?.message || 'Failed to sign in');
    }
  }

  static async signUp(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/signup', {
        username,
        password
      });
      
      // Set the auth token for future requests
      if (response.data.token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error('Username already exists');
      }
      throw new Error(error.response?.data?.message || 'Failed to create account');
    }
  }

  static signOut() {
    // Remove the auth token
    delete api.defaults.headers.common['Authorization'];
  }

  static setAuthToken(token: string) {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }

  static async updateAvatar(avatarPokemonId: number, avatarSprite: string): Promise<UpdateAvatarResponse> {
    try {
      const response = await api.put<UpdateAvatarResponse>('/auth/avatar', {
        avatarPokemonId,
        avatarSprite
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update avatar');
    }
  }

  static async getProfile(): Promise<ProfileResponse> {
    try {
      const response = await api.get<ProfileResponse>('/auth/profile');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get profile');
    }
  }
}

export default AuthService;