import type { AccountInfo } from '@azure/msal-browser';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  loading: boolean;
  error: string | null;
}

export const convertMsalAccountToAuthUser = (account: AccountInfo): AuthUser => {
  return {
    id: account.homeAccountId,
    name: account.name || account.username || 'Unknown User',
    email: account.username || '',
    username: account.username || ''
  };
};