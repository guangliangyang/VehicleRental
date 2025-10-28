import { convertMsalAccountToAuthUser } from '../types';
import type { AccountInfo } from '@azure/msal-browser';

describe('Auth Types', () => {
  describe('convertMsalAccountToAuthUser', () => {
    it('should convert MSAL account with all fields to AuthUser', () => {
      // Positive test case
      const msalAccount: AccountInfo = {
        homeAccountId: 'test-home-id.tenant-id',
        environment: 'login.microsoftonline.com',
        tenantId: 'tenant-id',
        username: 'test@example.com',
        localAccountId: 'local-id',
        name: 'Test User'
      };

      const authUser = convertMsalAccountToAuthUser(msalAccount);

      expect(authUser).toEqual({
        id: 'test-home-id.tenant-id',
        name: 'Test User',
        email: 'test@example.com',
        username: 'test@example.com'
      });
    });

    it('should handle MSAL account with missing name field', () => {
      // Edge case: missing name
      const msalAccount: AccountInfo = {
        homeAccountId: 'test-home-id.tenant-id',
        environment: 'login.microsoftonline.com',
        tenantId: 'tenant-id',
        username: 'test@example.com',
        localAccountId: 'local-id',
        name: undefined
      };

      const authUser = convertMsalAccountToAuthUser(msalAccount);

      expect(authUser).toEqual({
        id: 'test-home-id.tenant-id',
        name: 'test@example.com',
        email: 'test@example.com',
        username: 'test@example.com'
      });
    });

    it('should handle MSAL account with missing username field', () => {
      // Edge case: missing username
      const msalAccount: AccountInfo = {
        homeAccountId: 'test-home-id.tenant-id',
        environment: 'login.microsoftonline.com',
        tenantId: 'tenant-id',
        username: '',
        localAccountId: 'local-id',
        name: 'Test User'
      };

      const authUser = convertMsalAccountToAuthUser(msalAccount);

      expect(authUser).toEqual({
        id: 'test-home-id.tenant-id',
        name: 'Test User',
        email: '',
        username: ''
      });
    });

    it('should handle MSAL account with missing both name and username fields', () => {
      // Edge case: missing both fields
      const msalAccount: AccountInfo = {
        homeAccountId: 'test-home-id.tenant-id',
        environment: 'login.microsoftonline.com',
        tenantId: 'tenant-id',
        username: '',
        localAccountId: 'local-id',
        name: undefined
      };

      const authUser = convertMsalAccountToAuthUser(msalAccount);

      expect(authUser).toEqual({
        id: 'test-home-id.tenant-id',
        name: 'Unknown User',
        email: '',
        username: ''
      });
    });

    it('should handle MSAL account with empty string name', () => {
      // Edge case: empty string name
      const msalAccount: AccountInfo = {
        homeAccountId: 'test-home-id.tenant-id',
        environment: 'login.microsoftonline.com',
        tenantId: 'tenant-id',
        username: 'test@example.com',
        localAccountId: 'local-id',
        name: ''
      };

      const authUser = convertMsalAccountToAuthUser(msalAccount);

      expect(authUser).toEqual({
        id: 'test-home-id.tenant-id',
        name: 'test@example.com',
        email: 'test@example.com',
        username: 'test@example.com'
      });
    });

    it('should handle MSAL account with null name', () => {
      // Edge case: null name
      const msalAccount: AccountInfo = {
        homeAccountId: 'test-home-id.tenant-id',
        environment: 'login.microsoftonline.com',
        tenantId: 'tenant-id',
        username: 'test@example.com',
        localAccountId: 'local-id',
        name: null as any
      };

      const authUser = convertMsalAccountToAuthUser(msalAccount);

      expect(authUser).toEqual({
        id: 'test-home-id.tenant-id',
        name: 'test@example.com',
        email: 'test@example.com',
        username: 'test@example.com'
      });
    });

    it('should preserve special characters in username and name', () => {
      // Edge case: special characters
      const msalAccount: AccountInfo = {
        homeAccountId: 'test-home-id.tenant-id',
        environment: 'login.microsoftonline.com',
        tenantId: 'tenant-id',
        username: 'test+user@sub.example.com',
        localAccountId: 'local-id',
        name: 'Test User-Name (Admin)'
      };

      const authUser = convertMsalAccountToAuthUser(msalAccount);

      expect(authUser).toEqual({
        id: 'test-home-id.tenant-id',
        name: 'Test User-Name (Admin)',
        email: 'test+user@sub.example.com',
        username: 'test+user@sub.example.com'
      });
    });

    it('should handle long homeAccountId', () => {
      // Edge case: long ID
      const longId = 'very-long-home-account-id-that-might-be-used-in-some-azure-configurations.tenant-id-that-is-also-quite-long';
      const msalAccount: AccountInfo = {
        homeAccountId: longId,
        environment: 'login.microsoftonline.com',
        tenantId: 'tenant-id',
        username: 'test@example.com',
        localAccountId: 'local-id',
        name: 'Test User'
      };

      const authUser = convertMsalAccountToAuthUser(msalAccount);

      expect(authUser.id).toBe(longId);
      expect(authUser.name).toBe('Test User');
    });
  });
});