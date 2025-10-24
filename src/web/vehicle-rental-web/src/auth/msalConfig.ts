import { Configuration, PopupRequest, LogLevel } from '@azure/msal-browser';
import { getEnvironmentConfig } from '../config/environment';

export class MsalConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MsalConfigError';
  }
}

const createMsalConfig = (): Configuration => {
  try {
    const envConfig = getEnvironmentConfig();

    const config: Configuration = {
      auth: {
        clientId: envConfig.azure.clientId,
        authority: `https://login.microsoftonline.com/${envConfig.azure.tenantId}`,
        redirectUri: envConfig.azure.redirectUri,
        postLogoutRedirectUri: envConfig.azure.redirectUri,
        navigateToLoginRequestUrl: false
      },
      cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false
      },
      system: {
        allowNativeBroker: false,
        loggerOptions: {
          loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
            if (containsPii) return;

            switch (level) {
              case LogLevel.Error:
                console.error(`[MSAL] ${message}`);
                break;
              case LogLevel.Warning:
                console.warn(`[MSAL] ${message}`);
                break;
              case LogLevel.Info:
                if (process.env.NODE_ENV === 'development') {
                  console.log(`[MSAL] ${message}`);
                }
                break;
              case LogLevel.Verbose:
                if (process.env.NODE_ENV === 'development') {
                  console.debug(`[MSAL] ${message}`);
                }
                break;
            }
          },
          piiLoggingEnabled: false,
          logLevel: process.env.NODE_ENV === 'development' ? LogLevel.Info : LogLevel.Error
        }
      }
    };

    return config;
  } catch (error) {
    throw new MsalConfigError(`Failed to create MSAL configuration: ${error}`);
  }
};

const createLoginRequest = (): PopupRequest => {
  try {
    const envConfig = getEnvironmentConfig();

    return {
      scopes: envConfig.azure.scopes,
      prompt: 'select_account'
    };
  } catch (error) {
    throw new MsalConfigError(`Failed to create login request: ${error}`);
  }
};

const createTokenRequest = () => {
  try {
    const envConfig = getEnvironmentConfig();

    return {
      scopes: envConfig.azure.scopes,
      forceRefresh: false
    };
  } catch (error) {
    throw new MsalConfigError(`Failed to create token request: ${error}`);
  }
};

let _msalConfig: Configuration | null = null;
let _loginRequest: PopupRequest | null = null;
let _tokenRequest: any | null = null;

export const getMsalConfig = (): Configuration => {
  if (!_msalConfig) {
    _msalConfig = createMsalConfig();
  }
  return _msalConfig;
};

export const getLoginRequest = (): PopupRequest => {
  if (!_loginRequest) {
    _loginRequest = createLoginRequest();
  }
  return _loginRequest;
};

export const getTokenRequest = () => {
  if (!_tokenRequest) {
    _tokenRequest = createTokenRequest();
  }
  return _tokenRequest;
};

// Export factory functions for testing
export { createMsalConfig, createLoginRequest, createTokenRequest };