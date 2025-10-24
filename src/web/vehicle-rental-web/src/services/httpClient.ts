import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getEnvironmentConfig } from '../config/environment';

/**
 * HTTP client configuration for authenticated API calls
 */
class AuthenticatedHttpClient {
  private client = axios.create({
    baseURL: getEnvironmentConfig().api.baseUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  private getAccessToken: (() => Promise<string | null>) | null = null;

  /**
   * Configure the access token provider
   */
  public setTokenProvider(tokenProvider: () => Promise<string | null>): void {
    this.getAccessToken = tokenProvider;
    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors for authentication
   */
  private setupInterceptors(): void {
    // Request interceptor to add authorization header
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        if (this.getAccessToken) {
          try {
            const token = await this.getAccessToken();
            if (token) {
              config.headers = config.headers || {};
              config.headers.Authorization = `Bearer ${token}`;
            }
          } catch (error) {
            console.error('Failed to get access token:', error);
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh on 401
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && originalRequest && this.getAccessToken) {
          try {
            // Try to get a fresh token
            const token = await this.getAccessToken();
            if (token) {
              // Retry the original request with the new token
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client.request(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // Token refresh failed, let the error propagate
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Get the configured axios instance
   */
  public getInstance() {
    return this.client;
  }

  /**
   * Make a GET request
   */
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * Make a POST request
   */
  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Make a PUT request
   */
  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Make a DELETE request
   */
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

// Create and export a singleton instance
export const httpClient = new AuthenticatedHttpClient();

// Export the class for testing
export { AuthenticatedHttpClient };