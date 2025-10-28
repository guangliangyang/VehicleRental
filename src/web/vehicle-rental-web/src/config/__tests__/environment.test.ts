import { loadEnvironmentConfig, EnvironmentConfigError, getEnvironmentConfig } from '../environment';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('loadEnvironmentConfig', () => {
    it('should load valid environment configuration', () => {
      // Positive test case
      process.env.REACT_APP_AZURE_TENANT_ID = '12345678-1234-1234-1234-123456789012';
      process.env.REACT_APP_AZURE_CLIENT_ID = '87654321-4321-4321-4321-210987654321';
      process.env.REACT_APP_AZURE_REDIRECT_URI = 'http://localhost:3000';
      process.env.REACT_APP_AZURE_SCOPES = 'User.Read,openid,profile,email';
      process.env.REACT_APP_API_BASE_URL = 'https://localhost:5001';

      const config = loadEnvironmentConfig();

      expect(config).toEqual({
        azure: {
          tenantId: '12345678-1234-1234-1234-123456789012',
          clientId: '87654321-4321-4321-4321-210987654321',
          redirectUri: 'http://localhost:3000',
          scopes: ['User.Read', 'openid', 'profile', 'email']
        },
        api: {
          baseUrl: 'https://localhost:5001'
        }
      });
    });

    it('should handle scopes with extra whitespace', () => {
      // Edge case: whitespace handling
      process.env.REACT_APP_AZURE_TENANT_ID = 'tenant-id';
      process.env.REACT_APP_AZURE_CLIENT_ID = 'client-id';
      process.env.REACT_APP_AZURE_REDIRECT_URI = 'http://localhost:3000';
      process.env.REACT_APP_AZURE_SCOPES = ' User.Read , openid,  profile  , email ';
      process.env.REACT_APP_API_BASE_URL = 'https://localhost:5001';

      const config = loadEnvironmentConfig();

      expect(config.azure.scopes).toEqual(['User.Read', 'openid', 'profile', 'email']);
    });

    it('should trim whitespace from environment variables', () => {
      // Edge case: whitespace trimming
      process.env.REACT_APP_AZURE_TENANT_ID = '  tenant-id  ';
      process.env.REACT_APP_AZURE_CLIENT_ID = '  client-id  ';
      process.env.REACT_APP_AZURE_REDIRECT_URI = '  http://localhost:3000  ';
      process.env.REACT_APP_AZURE_SCOPES = '  User.Read  ';
      process.env.REACT_APP_API_BASE_URL = '  https://localhost:5001  ';

      const config = loadEnvironmentConfig();

      expect(config.azure.tenantId).toBe('tenant-id');
      expect(config.azure.clientId).toBe('client-id');
      expect(config.azure.redirectUri).toBe('http://localhost:3000');
      expect(config.api.baseUrl).toBe('https://localhost:5001');
    });

    it('should throw error when REACT_APP_AZURE_TENANT_ID is missing', () => {
      // Negative test case
      delete process.env.REACT_APP_AZURE_TENANT_ID;
      process.env.REACT_APP_AZURE_CLIENT_ID = 'client-id';
      process.env.REACT_APP_AZURE_REDIRECT_URI = 'http://localhost:3000';
      process.env.REACT_APP_AZURE_SCOPES = 'User.Read';
      process.env.REACT_APP_API_BASE_URL = 'https://localhost:5001';

      expect(() => loadEnvironmentConfig()).toThrow(EnvironmentConfigError);
      expect(() => loadEnvironmentConfig()).toThrow('REACT_APP_AZURE_TENANT_ID is required');
    });

    it('should throw error when REACT_APP_AZURE_CLIENT_ID is missing', () => {
      // Negative test case
      process.env.REACT_APP_AZURE_TENANT_ID = 'tenant-id';
      delete process.env.REACT_APP_AZURE_CLIENT_ID;
      process.env.REACT_APP_AZURE_REDIRECT_URI = 'http://localhost:3000';
      process.env.REACT_APP_AZURE_SCOPES = 'User.Read';
      process.env.REACT_APP_API_BASE_URL = 'https://localhost:5001';

      expect(() => loadEnvironmentConfig()).toThrow(EnvironmentConfigError);
      expect(() => loadEnvironmentConfig()).toThrow('REACT_APP_AZURE_CLIENT_ID is required');
    });

    it('should throw error when REACT_APP_AZURE_REDIRECT_URI is missing', () => {
      // Negative test case
      process.env.REACT_APP_AZURE_TENANT_ID = 'tenant-id';
      process.env.REACT_APP_AZURE_CLIENT_ID = 'client-id';
      delete process.env.REACT_APP_AZURE_REDIRECT_URI;
      process.env.REACT_APP_AZURE_SCOPES = 'User.Read';
      process.env.REACT_APP_API_BASE_URL = 'https://localhost:5001';

      expect(() => loadEnvironmentConfig()).toThrow(EnvironmentConfigError);
      expect(() => loadEnvironmentConfig()).toThrow('REACT_APP_AZURE_REDIRECT_URI is required');
    });

    it('should throw error when REACT_APP_AZURE_SCOPES is missing', () => {
      // Negative test case
      process.env.REACT_APP_AZURE_TENANT_ID = 'tenant-id';
      process.env.REACT_APP_AZURE_CLIENT_ID = 'client-id';
      process.env.REACT_APP_AZURE_REDIRECT_URI = 'http://localhost:3000';
      delete process.env.REACT_APP_AZURE_SCOPES;
      process.env.REACT_APP_API_BASE_URL = 'https://localhost:5001';

      expect(() => loadEnvironmentConfig()).toThrow(EnvironmentConfigError);
      expect(() => loadEnvironmentConfig()).toThrow('REACT_APP_AZURE_SCOPES is required');
    });

    it('should throw error when REACT_APP_API_BASE_URL is missing', () => {
      // Negative test case
      process.env.REACT_APP_AZURE_TENANT_ID = 'tenant-id';
      process.env.REACT_APP_AZURE_CLIENT_ID = 'client-id';
      process.env.REACT_APP_AZURE_REDIRECT_URI = 'http://localhost:3000';
      process.env.REACT_APP_AZURE_SCOPES = 'User.Read';
      delete process.env.REACT_APP_API_BASE_URL;

      expect(() => loadEnvironmentConfig()).toThrow(EnvironmentConfigError);
      expect(() => loadEnvironmentConfig()).toThrow('REACT_APP_API_BASE_URL is required');
    });

    it('should throw error when environment variable has default placeholder value', () => {
      // Negative test case: placeholder values
      process.env.REACT_APP_AZURE_TENANT_ID = 'your-tenant-id-here';
      process.env.REACT_APP_AZURE_CLIENT_ID = 'client-id';
      process.env.REACT_APP_AZURE_REDIRECT_URI = 'http://localhost:3000';
      process.env.REACT_APP_AZURE_SCOPES = 'User.Read';
      process.env.REACT_APP_API_BASE_URL = 'https://localhost:5001';

      expect(() => loadEnvironmentConfig()).toThrow(EnvironmentConfigError);
      expect(() => loadEnvironmentConfig()).toThrow('REACT_APP_AZURE_TENANT_ID is required and not configured');
    });

    it('should throw error when environment variable is empty string', () => {
      // Negative test case: empty string
      process.env.REACT_APP_AZURE_TENANT_ID = '';
      process.env.REACT_APP_AZURE_CLIENT_ID = 'client-id';
      process.env.REACT_APP_AZURE_REDIRECT_URI = 'http://localhost:3000';
      process.env.REACT_APP_AZURE_SCOPES = 'User.Read';
      process.env.REACT_APP_API_BASE_URL = 'https://localhost:5001';

      expect(() => loadEnvironmentConfig()).toThrow(EnvironmentConfigError);
      expect(() => loadEnvironmentConfig()).toThrow('REACT_APP_AZURE_TENANT_ID is required');
    });

    it('should throw error when environment variable is only whitespace', () => {
      // Negative test case: whitespace only
      process.env.REACT_APP_AZURE_TENANT_ID = '   ';
      process.env.REACT_APP_AZURE_CLIENT_ID = 'client-id';
      process.env.REACT_APP_AZURE_REDIRECT_URI = 'http://localhost:3000';
      process.env.REACT_APP_AZURE_SCOPES = 'User.Read';
      process.env.REACT_APP_API_BASE_URL = 'https://localhost:5001';

      expect(() => loadEnvironmentConfig()).toThrow(EnvironmentConfigError);
      expect(() => loadEnvironmentConfig()).toThrow('REACT_APP_AZURE_TENANT_ID is required');
    });

    it('should throw error when redirect URI is invalid', () => {
      // Negative test case: invalid URL
      process.env.REACT_APP_AZURE_TENANT_ID = 'tenant-id';
      process.env.REACT_APP_AZURE_CLIENT_ID = 'client-id';
      process.env.REACT_APP_AZURE_REDIRECT_URI = 'not-a-valid-url';
      process.env.REACT_APP_AZURE_SCOPES = 'User.Read';
      process.env.REACT_APP_API_BASE_URL = 'https://localhost:5001';

      expect(() => loadEnvironmentConfig()).toThrow(EnvironmentConfigError);
      expect(() => loadEnvironmentConfig()).toThrow('REACT_APP_AZURE_REDIRECT_URI must be a valid URL');
    });

    it('should throw error when API base URL is invalid', () => {
      // Negative test case: invalid URL
      process.env.REACT_APP_AZURE_TENANT_ID = 'tenant-id';
      process.env.REACT_APP_AZURE_CLIENT_ID = 'client-id';
      process.env.REACT_APP_AZURE_REDIRECT_URI = 'http://localhost:3000';
      process.env.REACT_APP_AZURE_SCOPES = 'User.Read';
      process.env.REACT_APP_API_BASE_URL = 'invalid-url';

      expect(() => loadEnvironmentConfig()).toThrow(EnvironmentConfigError);
      expect(() => loadEnvironmentConfig()).toThrow('REACT_APP_API_BASE_URL must be a valid URL');
    });

    it('should throw error when scopes is empty after parsing', () => {
      // Negative test case: empty scopes
      process.env.REACT_APP_AZURE_TENANT_ID = 'tenant-id';
      process.env.REACT_APP_AZURE_CLIENT_ID = 'client-id';
      process.env.REACT_APP_AZURE_REDIRECT_URI = 'http://localhost:3000';
      process.env.REACT_APP_AZURE_SCOPES = ' , , , ';
      process.env.REACT_APP_API_BASE_URL = 'https://localhost:5001';

      expect(() => loadEnvironmentConfig()).toThrow(EnvironmentConfigError);
      expect(() => loadEnvironmentConfig()).toThrow('REACT_APP_AZURE_SCOPES must contain at least one scope');
    });

    it('should filter out empty scopes', () => {
      // Edge case: mixed empty and valid scopes
      process.env.REACT_APP_AZURE_TENANT_ID = 'tenant-id';
      process.env.REACT_APP_AZURE_CLIENT_ID = 'client-id';
      process.env.REACT_APP_AZURE_REDIRECT_URI = 'http://localhost:3000';
      process.env.REACT_APP_AZURE_SCOPES = 'User.Read, , openid, , profile';
      process.env.REACT_APP_API_BASE_URL = 'https://localhost:5001';

      const config = loadEnvironmentConfig();

      expect(config.azure.scopes).toEqual(['User.Read', 'openid', 'profile']);
    });

    it('should handle HTTPS URLs correctly', () => {
      // Positive test case: HTTPS URLs
      process.env.REACT_APP_AZURE_TENANT_ID = 'tenant-id';
      process.env.REACT_APP_AZURE_CLIENT_ID = 'client-id';
      process.env.REACT_APP_AZURE_REDIRECT_URI = 'https://example.com/callback';
      process.env.REACT_APP_AZURE_SCOPES = 'User.Read';
      process.env.REACT_APP_API_BASE_URL = 'https://api.example.com';

      const config = loadEnvironmentConfig();

      expect(config.azure.redirectUri).toBe('https://example.com/callback');
      expect(config.api.baseUrl).toBe('https://api.example.com');
    });

    it('should create proper EnvironmentConfigError', () => {
      // Test error class
      const error = new EnvironmentConfigError('Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(EnvironmentConfigError);
      expect(error.name).toBe('EnvironmentConfigError');
      expect(error.message).toBe('Test error');
    });
  });

  describe('getEnvironmentConfig', () => {
    it('should return the same result as loadEnvironmentConfig', () => {
      // Test wrapper function
      process.env.REACT_APP_AZURE_TENANT_ID = 'tenant-id';
      process.env.REACT_APP_AZURE_CLIENT_ID = 'client-id';
      process.env.REACT_APP_AZURE_REDIRECT_URI = 'http://localhost:3000';
      process.env.REACT_APP_AZURE_SCOPES = 'User.Read';
      process.env.REACT_APP_API_BASE_URL = 'https://localhost:5001';

      const config1 = loadEnvironmentConfig();
      const config2 = getEnvironmentConfig();

      expect(config1).toEqual(config2);
    });

    it('should throw the same errors as loadEnvironmentConfig', () => {
      // Test wrapper function error handling
      delete process.env.REACT_APP_AZURE_TENANT_ID;

      expect(() => getEnvironmentConfig()).toThrow(EnvironmentConfigError);
      expect(() => getEnvironmentConfig()).toThrow('REACT_APP_AZURE_TENANT_ID is required');
    });
  });
});