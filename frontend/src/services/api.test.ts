import { api } from './api';

describe('API Service Authentication', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset axios headers
    delete api.defaults.headers.common['Authorization'];
  });

  test('should initialize auth token from localStorage on module load', () => {
    // Set up mock auth storage
    const mockToken = 'test-jwt-token';
    const authStorage = {
      state: {
        token: mockToken,
        user: { id: '123', username: 'testuser' },
        isAuthenticated: true
      }
    };
    
    // Store in localStorage
    localStorage.setItem('auth-storage', JSON.stringify(authStorage));
    
    // Re-import the module to trigger initialization
    jest.resetModules();
    require('./api');
    
    // Get the api instance again after re-import
    const { api: reimportedApi } = require('./api');
    
    // Check that the Authorization header is set
    expect(reimportedApi.defaults.headers.common['Authorization']).toBe(`Bearer ${mockToken}`);
  });

  test('should handle missing auth storage gracefully', () => {
    // Ensure localStorage is empty
    localStorage.removeItem('auth-storage');
    
    // Re-import the module
    jest.resetModules();
    require('./api');
    
    // Get the api instance again after re-import
    const { api: reimportedApi } = require('./api');
    
    // Check that no Authorization header is set
    expect(reimportedApi.defaults.headers.common['Authorization']).toBeUndefined();
  });

  test('should handle invalid JSON in auth storage', () => {
    // Set invalid JSON in localStorage
    localStorage.setItem('auth-storage', 'invalid-json');
    
    // Re-import the module
    jest.resetModules();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    require('./api');
    
    // Get the api instance again after re-import
    const { api: reimportedApi } = require('./api');
    
    // Check that no Authorization header is set and error was logged
    expect(reimportedApi.defaults.headers.common['Authorization']).toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error initializing auth token:', expect.any(Error));
    
    consoleErrorSpy.mockRestore();
  });
});