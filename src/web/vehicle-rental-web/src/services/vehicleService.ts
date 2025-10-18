import axios from 'axios';
import { VehicleSummaryDto, NearbyVehiclesQuery, ApiError, VehicleStatus, ConcurrencyConflictError, VehicleConcurrencyError } from '../types/vehicle';

const API_BASE_URL = process.env.REACT_APP_API_URL;
const API_KEY = process.env.REACT_APP_API_KEY;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    ...(API_KEY && { 'Ocp-Apim-Subscription-Key': API_KEY })
  }
});

export class VehicleService {

  static async getNearbyVehicles(query: NearbyVehiclesQuery): Promise<VehicleSummaryDto[]> {
    try {
      const params = {
        latitude: query.latitude,
        longitude: query.longitude,
        radius: query.radius || 5
      };

      const response = await api.get<VehicleSummaryDto[]>('/vehicles/nearby', { params });
      return response.data;
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

      await api.put(`/vehicles/${vehicleId}/status`, {
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
}
