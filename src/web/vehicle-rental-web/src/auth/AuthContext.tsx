import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PublicClientApplication, AuthenticationResult } from '@azure/msal-browser';
import { AuthContextType, AuthUser, convertMsalAccountToAuthUser } from './types';
import { getMsalConfig, getLoginRequest, getTokenRequest } from './msalConfig';

export class AuthContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthContextError';
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  msalInstance?: PublicClientApplication;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  msalInstance: providedMsalInstance
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        setLoading(true);
        setError(null);

        const instance = providedMsalInstance || new PublicClientApplication(getMsalConfig());
        await instance.initialize();
        setMsalInstance(instance);

        const accounts = instance.getAllAccounts();
        if (accounts.length > 0) {
          const account = accounts[0];
          setUser(convertMsalAccountToAuthUser(account));
          setIsAuthenticated(true);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Failed to initialize MSAL:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeMsal();
  }, [providedMsalInstance]);

  const login = async (): Promise<void> => {
    if (!msalInstance) {
      const errorMessage = 'MSAL instance not initialized';
      setError(errorMessage);
      throw new AuthContextError(errorMessage);
    }

    try {
      setLoading(true);
      setError(null);

      const loginRequest = getLoginRequest();
      const response: AuthenticationResult = await msalInstance.loginPopup(loginRequest);

      if (response.account) {
        setUser(convertMsalAccountToAuthUser(response.account));
        setIsAuthenticated(true);
      } else {
        const errorMessage = 'Login succeeded but no account information was returned';
        setError(errorMessage);
        throw new AuthContextError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw new AuthContextError(`Login failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    if (!msalInstance) {
      const errorMessage = 'MSAL instance not initialized';
      setError(errorMessage);
      throw new AuthContextError(errorMessage);
    }

    try {
      setLoading(true);
      setError(null);

      await msalInstance.logoutPopup();
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      throw new AuthContextError(`Logout failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    if (!msalInstance) {
      throw new AuthContextError('MSAL instance not initialized');
    }

    if (!isAuthenticated) {
      return null;
    }

    try {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length === 0) {
        throw new AuthContextError('No authenticated accounts found');
      }

      const tokenRequest = {
        ...getTokenRequest(),
        account: accounts[0]
      };

      const response = await msalInstance.acquireTokenSilent(tokenRequest);
      return response.accessToken;
    } catch (err) {
      if (err instanceof Error && err.name === 'InteractionRequiredAuthError') {
        try {
          const tokenRequest = {
            ...getTokenRequest(),
            account: msalInstance.getAllAccounts()[0]
          };
          const response = await msalInstance.acquireTokenPopup(tokenRequest);
          return response.accessToken;
        } catch (popupErr) {
          const errorMessage = popupErr instanceof Error ? popupErr.message : 'Token acquisition failed';
          setError(errorMessage);
          throw new AuthContextError(`Token acquisition failed: ${errorMessage}`);
        }
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Token acquisition failed';
        setError(errorMessage);
        throw new AuthContextError(`Token acquisition failed: ${errorMessage}`);
      }
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    getAccessToken,
    loading,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new AuthContextError('useAuth must be used within an AuthProvider');
  }
  return context;
};