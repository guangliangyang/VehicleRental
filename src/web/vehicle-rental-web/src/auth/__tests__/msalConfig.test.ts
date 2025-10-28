import { LogLevel } from '@azure/msal-browser';
import {
  MsalConfigError,
  createMsalConfig,
  createLoginRequest,
  createTokenRequest
} from '../msalConfig';

// Mock the environment module
jest.mock('../../config/environment', () => ({
  getEnvironmentConfig: jest.fn()
}));

const mockGetEnvironmentConfig = require('../../config/environment').getEnvironmentConfig;

describe('MSAL Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    mockGetEnvironmentConfig.mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('msalConfig creation', () => {
    it('should create valid MSAL configuration', () => {
      // Positive test case
      mockGetEnvironmentConfig.mockReturnValue({
        azure: {
          tenantId: 'test-tenant-id',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000',
          scopes: ['User.Read', 'openid', 'profile']
        }
      });

      const msalConfig = createMsalConfig();

      expect(msalConfig).toBeDefined();
      expect(msalConfig.auth.clientId).toBe('test-client-id');
      expect(msalConfig.auth.authority).toBe('https://login.microsoftonline.com/test-tenant-id');
      expect(msalConfig.auth.redirectUri).toBe('http://localhost:3000');
      expect(msalConfig.auth.postLogoutRedirectUri).toBe('http://localhost:3000');
      expect(msalConfig.auth.navigateToLoginRequestUrl).toBe(false);
    });

    it('should configure cache settings correctly', () => {
      // Positive test case: cache configuration
      mockGetEnvironmentConfig.mockReturnValue({
        azure: {
          tenantId: 'test-tenant-id',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000',
          scopes: ['User.Read']
        }
      });

      const msalConfig = createMsalConfig();

      expect(msalConfig.cache.cacheLocation).toBe('sessionStorage');
      expect(msalConfig.cache.storeAuthStateInCookie).toBe(false);
    });

    it('should configure system settings correctly', () => {
      // Positive test case: system configuration
      mockGetEnvironmentConfig.mockReturnValue({
        azure: {
          tenantId: 'test-tenant-id',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000',
          scopes: ['User.Read']
        }
      });

      const msalConfig = createMsalConfig();

      expect(msalConfig.system.allowNativeBroker).toBe(false);
      expect(msalConfig.system.loggerOptions.piiLoggingEnabled).toBe(false);
    });

    it('should set development log level in development environment', () => {
      // Positive test case: development logging
      process.env.NODE_ENV = 'development';
      mockGetEnvironmentConfig.mockReturnValue({
        azure: {
          tenantId: 'test-tenant-id',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000',
          scopes: ['User.Read']
        }
      });

      const msalConfig = createMsalConfig();

      expect(msalConfig.system.loggerOptions.logLevel).toBe(LogLevel.Info);
    });

    it('should set error log level in production environment', () => {
      // Positive test case: production logging
      process.env.NODE_ENV = 'production';
      mockGetEnvironmentConfig.mockReturnValue({
        azure: {
          tenantId: 'test-tenant-id',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000',
          scopes: ['User.Read']
        }
      });

      const msalConfig = createMsalConfig();

      expect(msalConfig.system.loggerOptions.logLevel).toBe(LogLevel.Error);
    });

    it('should throw MsalConfigError when environment config fails', () => {
      // Negative test case: environment config error
      mockGetEnvironmentConfig.mockImplementation(() => {
        throw new Error('Environment config failed');
      });

      expect(() => {
        createMsalConfig();
      }).toThrow(MsalConfigError);
    });

    it('should include error details in MsalConfigError', () => {
      // Negative test case: error details
      mockGetEnvironmentConfig.mockImplementation(() => {
        throw new Error('Specific config error');
      });

      expect(() => {
        createMsalConfig();
      }).toThrow('Failed to create MSAL configuration: Error: Specific config error');
    });

    it('should handle HTTPS redirect URI', () => {
      // Edge case: HTTPS URL
      mockGetEnvironmentConfig.mockReturnValue({
        azure: {
          tenantId: 'test-tenant-id',
          clientId: 'test-client-id',
          redirectUri: 'https://example.com/auth/callback',
          scopes: ['User.Read']
        }
      });

      const msalConfig = createMsalConfig();

      expect(msalConfig.auth.redirectUri).toBe('https://example.com/auth/callback');
      expect(msalConfig.auth.postLogoutRedirectUri).toBe('https://example.com/auth/callback');
    });
  });

  describe('loginRequest creation', () => {
    it('should create valid login request', () => {
      // Positive test case
      mockGetEnvironmentConfig.mockReturnValue({
        azure: {
          tenantId: 'test-tenant-id',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000',
          scopes: ['User.Read', 'openid', 'profile', 'email']
        }
      });

      const loginRequest = createLoginRequest();

      expect(loginRequest).toBeDefined();
      expect(loginRequest.scopes).toEqual(['User.Read', 'openid', 'profile', 'email']);
      expect(loginRequest.prompt).toBe('select_account');
    });

    it('should handle single scope', () => {
      // Edge case: single scope
      mockGetEnvironmentConfig.mockReturnValue({
        azure: {
          tenantId: 'test-tenant-id',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000',
          scopes: ['User.Read']
        }
      });

      const loginRequest = createLoginRequest();

      expect(loginRequest.scopes).toEqual(['User.Read']);
    });

    it('should throw MsalConfigError when environment config fails', () => {
      // Negative test case
      mockGetEnvironmentConfig.mockImplementation(() => {
        throw new Error('Environment config failed');
      });

      expect(() => {
        createLoginRequest();
      }).toThrow(MsalConfigError);
    });
  });

  describe('tokenRequest creation', () => {
    it('should create valid token request', () => {
      // Positive test case
      mockGetEnvironmentConfig.mockReturnValue({
        azure: {
          tenantId: 'test-tenant-id',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000',
          scopes: ['User.Read', 'openid']
        }
      });

      const tokenRequest = createTokenRequest();

      expect(tokenRequest).toBeDefined();
      expect(tokenRequest.scopes).toEqual(['User.Read', 'openid']);
      expect(tokenRequest.forceRefresh).toBe(false);
    });

    it('should set forceRefresh to false by default', () => {
      // Positive test case: default forceRefresh
      mockGetEnvironmentConfig.mockReturnValue({
        azure: {
          tenantId: 'test-tenant-id',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000',
          scopes: ['User.Read']
        }
      });

      const tokenRequest = createTokenRequest();

      expect(tokenRequest.forceRefresh).toBe(false);
    });

    it('should throw MsalConfigError when environment config fails', () => {
      // Negative test case
      mockGetEnvironmentConfig.mockImplementation(() => {
        throw new Error('Environment config failed');
      });

      expect(() => {
        createTokenRequest();
      }).toThrow(MsalConfigError);
    });
  });

  describe('MsalConfigError', () => {
    it('should create error with correct name and message', () => {
      // Positive test case
      const error = new MsalConfigError('Test error message');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('MsalConfigError');
      expect(error.message).toBe('Test error message');
    });

    it('should inherit from Error', () => {
      // Positive test case: inheritance
      const error = new MsalConfigError('Test error');

      expect(error instanceof Error).toBe(true);
      expect(error instanceof MsalConfigError).toBe(true);
    });
  });

  describe('logger callback', () => {
    let mockConsole: any;

    beforeEach(() => {
      mockConsole = {
        error: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
        debug: jest.fn()
      };
      global.console = mockConsole;
    });

    it('should not log PII messages', () => {
      // Security test case: PII filtering
      mockGetEnvironmentConfig.mockReturnValue({
        azure: {
          tenantId: 'test-tenant-id',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000',
          scopes: ['User.Read']
        }
      });

      const msalConfig = createMsalConfig();
      const loggerCallback = msalConfig.system.loggerOptions.loggerCallback;

      loggerCallback(LogLevel.Error, 'Test message with PII', true);

      expect(mockConsole.error).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.log).not.toHaveBeenCalled();
      expect(mockConsole.debug).not.toHaveBeenCalled();
    });

    it('should log error messages', () => {
      // Positive test case: error logging
      mockGetEnvironmentConfig.mockReturnValue({
        azure: {
          tenantId: 'test-tenant-id',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000',
          scopes: ['User.Read']
        }
      });

      const msalConfig = createMsalConfig();
      const loggerCallback = msalConfig.system.loggerOptions.loggerCallback;

      loggerCallback(LogLevel.Error, 'Test error message', false);

      expect(mockConsole.error).toHaveBeenCalledWith('[MSAL] Test error message');
    });

    it('should log warning messages', () => {
      // Positive test case: warning logging
      mockGetEnvironmentConfig.mockReturnValue({
        azure: {
          tenantId: 'test-tenant-id',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000',
          scopes: ['User.Read']
        }
      });

      const msalConfig = createMsalConfig();
      const loggerCallback = msalConfig.system.loggerOptions.loggerCallback;

      loggerCallback(LogLevel.Warning, 'Test warning message', false);

      expect(mockConsole.warn).toHaveBeenCalledWith('[MSAL] Test warning message');
    });

    it('should log info messages in development', () => {
      // Positive test case: development info logging
      process.env.NODE_ENV = 'development';
      mockGetEnvironmentConfig.mockReturnValue({
        azure: {
          tenantId: 'test-tenant-id',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000',
          scopes: ['User.Read']
        }
      });

      const msalConfig = createMsalConfig();
      const loggerCallback = msalConfig.system.loggerOptions.loggerCallback;

      loggerCallback(LogLevel.Info, 'Test info message', false);

      expect(mockConsole.log).toHaveBeenCalledWith('[MSAL] Test info message');
    });

    it('should not log info messages in production', () => {
      // Edge case: production info suppression
      process.env.NODE_ENV = 'production';
      mockGetEnvironmentConfig.mockReturnValue({
        azure: {
          tenantId: 'test-tenant-id',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000',
          scopes: ['User.Read']
        }
      });

      const msalConfig = createMsalConfig();
      const loggerCallback = msalConfig.system.loggerOptions.loggerCallback;

      loggerCallback(LogLevel.Info, 'Test info message', false);

      expect(mockConsole.log).not.toHaveBeenCalled();
    });

    it('should log verbose messages in development', () => {
      // Positive test case: development verbose logging
      process.env.NODE_ENV = 'development';
      mockGetEnvironmentConfig.mockReturnValue({
        azure: {
          tenantId: 'test-tenant-id',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000',
          scopes: ['User.Read']
        }
      });

      const msalConfig = createMsalConfig();
      const loggerCallback = msalConfig.system.loggerOptions.loggerCallback;

      loggerCallback(LogLevel.Verbose, 'Test verbose message', false);

      expect(mockConsole.debug).toHaveBeenCalledWith('[MSAL] Test verbose message');
    });

    it('should not log verbose messages in production', () => {
      // Edge case: production verbose suppression
      process.env.NODE_ENV = 'production';
      mockGetEnvironmentConfig.mockReturnValue({
        azure: {
          tenantId: 'test-tenant-id',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000',
          scopes: ['User.Read']
        }
      });

      const msalConfig = createMsalConfig();
      const loggerCallback = msalConfig.system.loggerOptions.loggerCallback;

      loggerCallback(LogLevel.Verbose, 'Test verbose message', false);

      expect(mockConsole.debug).not.toHaveBeenCalled();
    });
  });
});