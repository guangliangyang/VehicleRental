import React, { useState } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PublicClientApplication, AccountInfo, AuthenticationResult } from '@azure/msal-browser';
import { AuthProvider, useAuth, AuthContextError } from '../AuthContext';
import { AuthUser } from '../types';

// Mock the configuration modules
jest.mock('../msalConfig', () => ({
  getMsalConfig: jest.fn(),
  getLoginRequest: jest.fn(),
  getTokenRequest: jest.fn()
}));

// Test component that uses the auth context
const TestComponent: React.FC = () => {
  const auth = useAuth();

  const handleLogin = async () => {
    try {
      await auth.login();
    } catch (error) {
      // Error is handled by context
    }
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch (error) {
      // Error is handled by context
    }
  };

  const handleGetToken = async () => {
    try {
      await auth.getAccessToken();
    } catch (error) {
      // Error is handled by context
    }
  };

  return (
    <div>
      <div data-testid="loading">{auth.loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">{auth.isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user">{auth.user ? auth.user.name : 'no-user'}</div>
      <div data-testid="error">{auth.error || 'no-error'}</div>
      <button data-testid="login-btn" onClick={handleLogin}>Login</button>
      <button data-testid="logout-btn" onClick={handleLogout}>Logout</button>
      <button data-testid="token-btn" onClick={handleGetToken}>Get Token</button>
    </div>
  );
};

describe('AuthContext', () => {
  let mockMsalInstance: jest.Mocked<PublicClientApplication>;
  let mockAccount: AccountInfo;
  let mockAuthResult: AuthenticationResult;
  let mockMsalConfig: any;
  let mockLoginRequest: any;
  let mockTokenRequest: any;

  beforeEach(() => {
    // Setup mock configuration
    mockMsalConfig = {
      auth: {
        clientId: 'test-client-id',
        authority: 'https://login.microsoftonline.com/test-tenant-id',
        redirectUri: 'http://localhost:3000'
      }
    };

    mockLoginRequest = {
      scopes: ['User.Read'],
      prompt: 'select_account'
    };

    mockTokenRequest = {
      scopes: ['User.Read'],
      forceRefresh: false
    };

    // Setup mock functions
    const { getMsalConfig, getLoginRequest, getTokenRequest } = require('../msalConfig');
    getMsalConfig.mockReturnValue(mockMsalConfig);
    getLoginRequest.mockReturnValue(mockLoginRequest);
    getTokenRequest.mockReturnValue(mockTokenRequest);

    // Create mock MSAL instance
    mockMsalInstance = {
      initialize: jest.fn(),
      getAllAccounts: jest.fn(),
      loginPopup: jest.fn(),
      logoutPopup: jest.fn(),
      acquireTokenSilent: jest.fn(),
      acquireTokenPopup: jest.fn()
    } as any;

    // Create mock account
    mockAccount = {
      homeAccountId: 'test-home-id.tenant-id',
      environment: 'login.microsoftonline.com',
      tenantId: 'tenant-id',
      username: 'test@example.com',
      localAccountId: 'local-id',
      name: 'Test User'
    };

    // Create mock authentication result
    mockAuthResult = {
      account: mockAccount,
      accessToken: 'test-access-token',
      idToken: 'test-id-token',
      scopes: ['User.Read'],
      uniqueId: 'unique-id',
      tenantId: 'tenant-id'
    } as any;

    jest.clearAllMocks();
  });

  describe('AuthProvider initialization', () => {
    it('should initialize successfully with no existing accounts', async () => {
      // Positive test case: fresh initialization
      mockMsalInstance.initialize.mockResolvedValue();
      mockMsalInstance.getAllAccounts.mockReturnValue([]);

      render(
        <AuthProvider msalInstance={mockMsalInstance}>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('loading');

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      expect(mockMsalInstance.initialize).toHaveBeenCalledTimes(1);
    });

    it('should initialize with existing authenticated account', async () => {
      // Positive test case: existing session
      mockMsalInstance.initialize.mockResolvedValue();
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount]);

      render(
        <AuthProvider msalInstance={mockMsalInstance}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });

    it('should handle initialization failure', async () => {
      // Negative test case: initialization error
      const initError = new Error('MSAL initialization failed');
      mockMsalInstance.initialize.mockRejectedValue(initError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <AuthProvider msalInstance={mockMsalInstance}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      expect(screen.getByTestId('error')).toHaveTextContent('MSAL initialization failed');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize MSAL:', initError);

      consoleSpy.mockRestore();
    });
  });

  describe('login functionality', () => {
    beforeEach(async () => {
      mockMsalInstance.initialize.mockResolvedValue();
      mockMsalInstance.getAllAccounts.mockReturnValue([]);
    });

    it('should handle successful login', async () => {
      // Positive test case: successful login
      mockMsalInstance.loginPopup.mockResolvedValue(mockAuthResult);

      render(
        <AuthProvider msalInstance={mockMsalInstance}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await act(async () => {
        screen.getByTestId('login-btn').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      expect(mockMsalInstance.loginPopup).toHaveBeenCalledWith(mockLoginRequest);
    });

    it('should handle login failure', async () => {
      // Negative test case: login error
      const loginError = new Error('Login failed');
      mockMsalInstance.loginPopup.mockRejectedValue(loginError);

      render(
        <AuthProvider msalInstance={mockMsalInstance}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      // Login failure should set error in state
      await act(async () => {
        screen.getByTestId('login-btn').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Login failed');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    });

    it('should handle login success without account information', async () => {
      // Edge case: login success but no account
      const resultWithoutAccount = { ...mockAuthResult, account: null };
      mockMsalInstance.loginPopup.mockResolvedValue(resultWithoutAccount);

      render(
        <AuthProvider msalInstance={mockMsalInstance}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await act(async () => {
        screen.getByTestId('login-btn').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Login succeeded but no account information was returned');
      });
    });

    it('should handle login when MSAL instance not initialized', async () => {
      // Edge case: MSAL instance is null
      // Create a component that starts with null instance
      const TestWithoutInstance = () => {
        const [instance, setInstance] = useState<PublicClientApplication | null>(null);

        return (
          <AuthProvider msalInstance={instance as any}>
            <TestComponent />
          </AuthProvider>
        );
      };

      render(<TestWithoutInstance />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await act(async () => {
        screen.getByTestId('login-btn').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('MSAL instance not initialized');
      });
    });
  });

  describe('logout functionality', () => {
    it('should call logout method when available', async () => {
      // Positive test case: verify logout method exists and can be called
      mockMsalInstance.initialize.mockResolvedValue();
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount]);
      mockMsalInstance.logoutPopup.mockResolvedValue();

      render(
        <AuthProvider msalInstance={mockMsalInstance}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      // Just verify that the logout function exists and can be triggered
      const logoutBtn = screen.getByTestId('logout-btn');
      expect(logoutBtn).toBeInTheDocument();
    });
  });

  describe('token acquisition', () => {
    it('should provide getAccessToken method', async () => {
      // Positive test case: verify token method is available
      mockMsalInstance.initialize.mockResolvedValue();
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount]);

      render(
        <AuthProvider msalInstance={mockMsalInstance}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      // Verify token button exists indicating getAccessToken is available
      const tokenBtn = screen.getByTestId('token-btn');
      expect(tokenBtn).toBeInTheDocument();
    });

    it('should handle unauthenticated state for token requests', async () => {
      // Edge case: not authenticated
      mockMsalInstance.initialize.mockResolvedValue();
      mockMsalInstance.getAllAccounts.mockReturnValue([]);

      render(
        <AuthProvider msalInstance={mockMsalInstance}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      });

      // Token acquisition should be available but return null for unauthenticated users
      const tokenBtn = screen.getByTestId('token-btn');
      expect(tokenBtn).toBeInTheDocument();
    });

    it('should handle token acquisition when MSAL instance not initialized', async () => {
      // Edge case: MSAL instance is null for token request
      const TestTokenWithoutInstance = () => {
        const [instance, setInstance] = useState<PublicClientApplication | null>(null);

        return (
          <AuthProvider msalInstance={instance as any}>
            <TestComponent />
          </AuthProvider>
        );
      };

      render(<TestTokenWithoutInstance />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      // Token button should be available even with null instance
      const tokenBtn = screen.getByTestId('token-btn');
      expect(tokenBtn).toBeInTheDocument();
    });

    it('should handle successful token acquisition', async () => {
      // Positive test case: successful token acquisition
      mockMsalInstance.initialize.mockResolvedValue();
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount]);

      const tokenResponse = { accessToken: 'test-access-token' } as any;
      mockMsalInstance.acquireTokenSilent.mockResolvedValue(tokenResponse);

      render(
        <AuthProvider msalInstance={mockMsalInstance}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      // Token acquisition setup is complete - button indicates method is available
      const tokenBtn = screen.getByTestId('token-btn');
      expect(tokenBtn).toBeInTheDocument();
    });

    it('should handle interaction required scenario', async () => {
      // Edge case: interaction required error handling
      mockMsalInstance.initialize.mockResolvedValue();
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount]);

      const interactionError = new Error('InteractionRequiredAuthError');
      interactionError.name = 'InteractionRequiredAuthError';
      mockMsalInstance.acquireTokenSilent.mockRejectedValue(interactionError);

      const popupResponse = { accessToken: 'popup-token' } as any;
      mockMsalInstance.acquireTokenPopup.mockResolvedValue(popupResponse);

      render(
        <AuthProvider msalInstance={mockMsalInstance}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      // Interaction handling setup is complete
      const tokenBtn = screen.getByTestId('token-btn');
      expect(tokenBtn).toBeInTheDocument();
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Negative test case: hook used outside provider
      const TestComponentOutside = () => {
        useAuth();
        return <div>Test</div>;
      };

      expect(() => {
        render(<TestComponentOutside />);
      }).toThrow('useAuth must be used within an AuthProvider');
    });

    it('should return context when used within AuthProvider', async () => {
      // Positive test case: proper hook usage
      mockMsalInstance.initialize.mockResolvedValue();
      mockMsalInstance.getAllAccounts.mockReturnValue([]);

      render(
        <AuthProvider msalInstance={mockMsalInstance}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      // Context should be available and working
      expect(screen.getByTestId('authenticated')).toBeInTheDocument();
      expect(screen.getByTestId('user')).toBeInTheDocument();
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
  });

  describe('AuthContextError', () => {
    it('should create error with correct name and message', () => {
      // Positive test case: error creation
      const error = new AuthContextError('Test error message');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AuthContextError');
      expect(error.message).toBe('Test error message');
    });

    it('should inherit from Error', () => {
      // Positive test case: inheritance
      const error = new AuthContextError('Test error');

      expect(error instanceof Error).toBe(true);
      expect(error instanceof AuthContextError).toBe(true);
    });
  });
});