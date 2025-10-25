import axios from 'axios';
import { httpClient, anonymousHttpClient } from './httpClient';
import { VehicleSummaryDto, NearbyVehiclesQuery, ApiError, VehicleStatus, ConcurrencyConflictError, VehicleConcurrencyError } from '../types/vehicle';

export class VehicleService {

  static async getNearbyVehicles(query: NearbyVehiclesQuery): Promise<VehicleSummaryDto[]> {
    try {
      const params = {
        latitude: query.latitude,
        longitude: query.longitude,
        radius: query.radius || 5
      };

      // Use anonymous client for nearby vehicles (no authentication required)
      return await anonymousHttpClient.get<VehicleSummaryDto[]>('/vehicles/nearby', { params });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        const apiError = error.response.data as ApiError;
        throw new Error(`${apiError.code}: ${apiError.message}`);
      }
      throw new Error('Failed to fetch nearby vehicles');
    }
  }

  static async updateVehicleStatus(
    vehicleId: string,
    expectedCurrentStatus: VehicleStatus,
    newStatus: VehicleStatus
  ): Promise<void> {
    try {
      // Convert status string to numeric value for backend API
      const statusMap: Record<VehicleStatus, number> = {
        [VehicleStatus.Available]: 1,
        [VehicleStatus.Rented]: 2,
        [VehicleStatus.Maintenance]: 3,
        [VehicleStatus.OutOfService]: 4
      };

      await httpClient.put(`/vehicles/${vehicleId}/status`, {
        expectedCurrentStatus: statusMap[expectedCurrentStatus],
        newStatus: statusMap[newStatus]
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        // Handle concurrency conflict (409 status)
        if (error.response.status === 409) {
          const conflictError = error.response.data as ConcurrencyConflictError;
          const statusMap: Record<number, VehicleStatus> = {
            1: VehicleStatus.Available,
            2: VehicleStatus.Rented,
            3: VehicleStatus.Maintenance,
            4: VehicleStatus.OutOfService
          };

          const normalizeStatus = (status: VehicleStatus | number): VehicleStatus => {
            if (typeof status === 'number') {
              return statusMap[status] ?? VehicleStatus.Available;
            }
            return status;
          };

          throw new VehicleConcurrencyError(
            normalizeStatus(conflictError.expectedCurrentStatus),
            normalizeStatus(conflictError.attemptedNewStatus),
            normalizeStatus(conflictError.actualCurrentStatus),
            conflictError.message
          );
        }

        // Handle other API errors
        const apiError = error.response.data as ApiError;
        throw new Error(`${apiError.code}: ${apiError.message}`);
      }
      throw new Error('Failed to update vehicle status');
    }
  }

  /**
   * Get vehicles rented by the current authenticated user
   */
  static async getUserVehicles(): Promise<VehicleSummaryDto[]> {
    try {
      return await httpClient.get<VehicleSummaryDto[]>('/vehicles/user');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        const apiError = error.response.data as ApiError;
        throw new Error(`${apiError.code}: ${apiError.message}`);
      }
      throw new Error('Failed to fetch user vehicles');
    }
  }

  /**
   * Rent a vehicle for the current authenticated user
   */
  static async rentVehicle(vehicleId: string): Promise<void> {
    try {
      await httpClient.post(`/vehicles/${vehicleId}/rent`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        const apiError = error.response.data as ApiError;
        throw new Error(`${apiError.code}: ${apiError.message}`);
      }
      throw new Error('Failed to rent vehicle');
    }
  }

  /**
   * Return a vehicle from the current authenticated user
   */
  static async returnVehicle(vehicleId: string): Promise<void> {
    try {
      await httpClient.post(`/vehicles/${vehicleId}/return`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        const apiError = error.response.data as ApiError;
        throw new Error(`${apiError.code}: ${apiError.message}`);
      }
      throw new Error('Failed to return vehicle');
    }
  }
}
