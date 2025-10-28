import type { AccountInfo } from '@azure/msal-browser';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username: string;
  roles?: string[];
  role?: string;
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
  // Extract roles from ID token claims
  const idTokenClaims = account.idTokenClaims as any;
  let roles: string[] = [];
  let role: string | undefined;

  if (idTokenClaims) {
    // Check for roles array claim
    if (idTokenClaims.roles && Array.isArray(idTokenClaims.roles)) {
      roles = idTokenClaims.roles;
    }

    // Check for single role claim
    if (idTokenClaims.role && typeof idTokenClaims.role === 'string') {
      role = idTokenClaims.role;
    }

    // Also check for extension_roles (custom claim format)
    if (idTokenClaims.extension_roles && Array.isArray(idTokenClaims.extension_roles)) {
      roles = [...roles, ...idTokenClaims.extension_roles];
    }
  }

  return {
    id: account.homeAccountId,
    name: account.name || account.username || 'Unknown User',
    email: account.username || '',
    username: account.username || '',
    roles: roles.length > 0 ? roles : undefined,
    role: role
  };
};