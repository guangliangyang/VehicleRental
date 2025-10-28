import axios, { AxiosError } from 'axios';
import { httpClient, anonymousHttpClient } from './httpClient';
import {
  VehicleSummaryDto,
  NearbyVehiclesQuery,
  ApiError,
  VehicleStatus,
  ConcurrencyConflictError,
  VehicleConcurrencyError
} from '../types/vehicle';

// Enhanced error handling interface
interface ServiceError extends Error {
  code?: string;
  statusCode?: number;
  isRetryable?: boolean;
}

// Simple in-memory cache for user vehicles
class UserVehicleCache {
  private cache: VehicleSummaryDto[] | null = null;
  private timestamp: number = 0;
  private readonly TTL = 30000; // 30 seconds

  set(vehicles: VehicleSummaryDto[]): void {
    this.cache = vehicles;
    this.timestamp = Date.now();
  }

  get(): VehicleSummaryDto[] | null {
    if (!this.cache || Date.now() - this.timestamp > this.TTL) {
      this.clear();
      return null;
    }
    return this.cache;
  }

  clear(): void {
    this.cache = null;
    this.timestamp = 0;
  }

  // Invalidate cache when vehicle status changes
  invalidate(): void {
    this.clear();
  }
}

// Request retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableStatusCodes: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
};

// Exponential backoff delay calculation
const calculateDelay = (attempt: number, baseDelay: number, maxDelay: number): number => {
  const delay = baseDelay * Math.pow(2, attempt);
  return Math.min(delay + Math.random() * 1000, maxDelay);
};

// Enhanced error creation with additional context
const createServiceError = (error: unknown, context: string): ServiceError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const serviceError = new Error(`${context}: ${axiosError.message}`) as ServiceError;

    serviceError.code = axiosError.code;
    serviceError.statusCode = axiosError.response?.status;
    serviceError.isRetryable = axiosError.response ?
      DEFAULT_RETRY_CONFIG.retryableStatusCodes.includes(axiosError.response.status) :
      true; // Network errors are generally retryable

    return serviceError;
  }

  if (error instanceof Error) {
    const serviceError = new Error(`${context}: ${error.message}`) as ServiceError;
    serviceError.isRetryable = false;
    return serviceError;
  }

  const serviceError = new Error(`${context}: Unknown error occurred`) as ServiceError;
  serviceError.isRetryable = false;
  return serviceError;
};

// Retry mechanism with exponential backoff
const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  context: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> => {
  let lastError: ServiceError | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = createServiceError(error, context);

      // Don't retry on last attempt or non-retryable errors
      if (attempt === config.maxRetries || !lastError.isRetryable) {
        throw lastError;
      }

      // Wait before retrying
      const delay = calculateDelay(attempt, config.baseDelay, config.maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but provide a fallback error
  throw lastError || new Error(`${context}: Maximum retry attempts exceeded`);
};

// Status mapping utilities
const statusToNumericMap: Record<VehicleStatus, number> = {
  [VehicleStatus.Available]: 1,
  [VehicleStatus.Rented]: 2,
  [VehicleStatus.Maintenance]: 3,
  [VehicleStatus.OutOfService]: 4
};

const numericToStatusMap: Record<number, VehicleStatus> = {
  1: VehicleStatus.Available,
  2: VehicleStatus.Rented,
  3: VehicleStatus.Maintenance,
  4: VehicleStatus.OutOfService
};

const normalizeStatus = (status: VehicleStatus | number): VehicleStatus => {
  if (typeof status === 'number') {
    return numericToStatusMap[status] ?? VehicleStatus.Available;
  }
  return status;
};

// Cache instance
const userVehicleCache = new UserVehicleCache();

export class VehicleService {
  /**
   * Get nearby vehicles with enhanced error handling and logging
   */
  static async getNearbyVehicles(query: NearbyVehiclesQuery): Promise<VehicleSummaryDto[]> {
    return retryRequest(async () => {
      const params = {
        latitude: query.latitude,
        longitude: query.longitude,
        radius: query.radius || 5
      };

      try {
        // Use anonymous client for nearby vehicles (no authentication required)
        const response = await anonymousHttpClient.get<VehicleSummaryDto[]>('/vehicles/nearby', { params });
        return response;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data) {
          const apiError = error.response.data as ApiError;
          throw new Error(`API Error ${error.response.status}: ${apiError.message || apiError.code}`);
        }
        throw error;
      }
    }, 'Failed to fetch nearby vehicles');
  }

  /**
   * Update vehicle status with enhanced concurrency handling
   */
  static async updateVehicleStatus(
    vehicleId: string,
    expectedCurrentStatus: VehicleStatus,
    newStatus: VehicleStatus
  ): Promise<void> {
    return retryRequest(async () => {
      try {
        await httpClient.put(`/vehicles/${vehicleId}/status`, {
          expectedCurrentStatus: statusToNumericMap[expectedCurrentStatus],
          newStatus: statusToNumericMap[newStatus]
        });

        // Invalidate user vehicle cache since status changed
        userVehicleCache.invalidate();
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data) {
          // Handle concurrency conflict (409 status)
          if (error.response.status === 409) {
            const conflictError = error.response.data as ConcurrencyConflictError;
            throw new VehicleConcurrencyError(
              normalizeStatus(conflictError.expectedCurrentStatus),
              normalizeStatus(conflictError.attemptedNewStatus),
              normalizeStatus(conflictError.actualCurrentStatus),
              conflictError.message
            );
          }

          // Handle other API errors
          const apiError = error.response.data as ApiError;
          throw new Error(`API Error ${error.response.status}: ${apiError.message || apiError.code}`);
        }
        throw error;
      }
    }, 'Failed to update vehicle status', {
      ...DEFAULT_RETRY_CONFIG,
      maxRetries: 1 // Don't retry concurrency conflicts or business logic errors
    });
  }

  /**
   * Get vehicles rented by the current authenticated user with caching
   */
  static async getUserVehicles(): Promise<VehicleSummaryDto[]> {
    // Check cache first
    const cachedVehicles = userVehicleCache.get();
    if (cachedVehicles) {
      return cachedVehicles;
    }

    return retryRequest(async () => {
      try {
        const vehicles = await httpClient.get<VehicleSummaryDto[]>('/vehicles/user');

        // Cache the result
        userVehicleCache.set(vehicles);

        return vehicles;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data) {
          const apiError = error.response.data as ApiError;

          // Handle authentication errors specially
          if (error.response.status === 401) {
            throw new Error('Authentication required. Please sign in again.');
          }

          throw new Error(`API Error ${error.response.status}: ${apiError.message || apiError.code}`);
        }
        throw error;
      }
    }, 'Failed to fetch user vehicles');
  }

  /**
   * Rent a vehicle for the current authenticated user
   */
  static async rentVehicle(vehicleId: string): Promise<void> {
    return retryRequest(async () => {
      try {
        await httpClient.post(`/vehicles/${vehicleId}/rent`);

        // Invalidate user vehicle cache since user now has a new rental
        userVehicleCache.invalidate();
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data) {
          const apiError = error.response.data as ApiError;

          // Handle specific business logic errors
          if (error.response.status === 400) {
            throw new Error(`Cannot rent vehicle: ${apiError.message || 'Vehicle may not be available'}`);
          }

          if (error.response.status === 401) {
            throw new Error('Authentication required. Please sign in to rent vehicles.');
          }

          if (error.response.status === 403) {
            throw new Error('You do not have permission to rent vehicles.');
          }

          throw new Error(`API Error ${error.response.status}: ${apiError.message || apiError.code}`);
        }
        throw error;
      }
    }, 'Failed to rent vehicle', {
      ...DEFAULT_RETRY_CONFIG,
      maxRetries: 1 // Don't retry business logic errors
    });
  }

  /**
   * Return a vehicle from the current authenticated user
   */
  static async returnVehicle(vehicleId: string): Promise<void> {
    return retryRequest(async () => {
      try {
        await httpClient.post(`/vehicles/${vehicleId}/return`);

        // Invalidate user vehicle cache since rental status changed
        userVehicleCache.invalidate();
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data) {
          const apiError = error.response.data as ApiError;

          // Handle specific business logic errors
          if (error.response.status === 400) {
            throw new Error(`Cannot return vehicle: ${apiError.message || 'Vehicle may not be rented by you'}`);
          }

          if (error.response.status === 401) {
            throw new Error('Authentication required. Please sign in to return vehicles.');
          }

          if (error.response.status === 403) {
            throw new Error('You do not have permission to return this vehicle.');
          }

          throw new Error(`API Error ${error.response.status}: ${apiError.message || apiError.code}`);
        }
        throw error;
      }
    }, 'Failed to return vehicle', {
      ...DEFAULT_RETRY_CONFIG,
      maxRetries: 1 // Don't retry business logic errors
    });
  }

  /**
   * Clear all caches (useful for logout or when user changes)
   */
  static clearCache(): void {
    userVehicleCache.clear();
  }

  /**
   * Health check method to verify service connectivity
   */
  static async healthCheck(): Promise<boolean> {
    try {
      // Try a simple request to verify connectivity
      await anonymousHttpClient.get('/vehicles/nearby', {
        params: { latitude: 0, longitude: 0, radius: 1 },
        timeout: 5000
      });
      return true;
    } catch (error) {
      console.warn('VehicleService health check failed:', error);
      return false;
    }
  }
}