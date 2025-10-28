export interface EnvironmentConfig {
  azure: {
    tenantId: string;
    clientId: string;
    redirectUri: string;
    scopes: string[];
  };
  api: {
    baseUrl: string;
  };
}

export class EnvironmentConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentConfigError';
  }
}

const validateEnvironmentVariable = (name: string, value: string | undefined): string => {
  if (!value || value.trim() === '') {
    throw new EnvironmentConfigError(`Environment variable ${name} is required and not configured`);
  }

  const trimmedValue = value.trim();

  // Check for placeholder values
  const placeholderPatterns = [
    'your-tenant-id-here',
    'your-client-id-here',
    'your-redirect-uri-here',
    'your-scopes-here',
    'your-api-base-url-here'
  ];

  if (placeholderPatterns.includes(trimmedValue)) {
    throw new EnvironmentConfigError(`Environment variable ${name} is required and not configured`);
  }

  return trimmedValue;
};

const parseScopes = (scopesString: string): string[] => {
  return scopesString
    .split(',')
    .map(scope => scope.trim())
    .filter(scope => scope.length > 0);
};

const validateUrl = (url: string, name: string): string => {
  try {
    new URL(url);
    return url;
  } catch {
    throw new EnvironmentConfigError(`${name} must be a valid URL`);
  }
};

export const loadEnvironmentConfig = (): EnvironmentConfig => {
  try {
    const tenantId = validateEnvironmentVariable('REACT_APP_AZURE_TENANT_ID', process.env.REACT_APP_AZURE_TENANT_ID);
    const clientId = validateEnvironmentVariable('REACT_APP_AZURE_CLIENT_ID', process.env.REACT_APP_AZURE_CLIENT_ID);
    const redirectUri = validateUrl(
      validateEnvironmentVariable('REACT_APP_AZURE_REDIRECT_URI', process.env.REACT_APP_AZURE_REDIRECT_URI),
      'REACT_APP_AZURE_REDIRECT_URI'
    );
    const scopesString = validateEnvironmentVariable('REACT_APP_AZURE_SCOPES', process.env.REACT_APP_AZURE_SCOPES);
    const baseUrl = validateUrl(
      validateEnvironmentVariable('REACT_APP_API_BASE_URL', process.env.REACT_APP_API_BASE_URL),
      'REACT_APP_API_BASE_URL'
    );

    const scopes = parseScopes(scopesString);
    if (scopes.length === 0) {
      throw new EnvironmentConfigError('REACT_APP_AZURE_SCOPES must contain at least one scope');
    }

    return {
      azure: {
        tenantId,
        clientId,
        redirectUri,
        scopes
      },
      api: {
        baseUrl
      }
    };
  } catch (error) {
    if (error instanceof EnvironmentConfigError) {
      console.error('Environment configuration error:', error.message);
      throw error;
    }
    throw new EnvironmentConfigError(`Failed to load environment configuration: ${error}`);
  }
};

export const getEnvironmentConfig = (): EnvironmentConfig => {
  return loadEnvironmentConfig();
};