import { useEffect } from 'react';
import { httpClient } from '../services/httpClient';
import { useAuth } from '../auth/AuthContext';

/**
 * Hook to configure the HTTP client with authentication token provider
 */
export const useAuthenticatedApi = () => {
  const { getAccessToken, isAuthenticated } = useAuth();

  useEffect(() => {
    // Configure the HTTP client with the token provider
    httpClient.setTokenProvider(getAccessToken);
  }, [getAccessToken]);

  return {
    httpClient,
    isAuthenticated
  };
};