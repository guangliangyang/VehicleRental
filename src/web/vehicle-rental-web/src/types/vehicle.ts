export interface VehicleSummaryDto {
  vehicleId: string;
  latitude: number;
  longitude: number;
  status: string;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface ConcurrencyConflictError {
  code: string;
  message: string;
  expectedCurrentStatus: VehicleStatus;
  attemptedNewStatus: VehicleStatus;
  actualCurrentStatus: VehicleStatus;
}

export class VehicleConcurrencyError extends Error {
  constructor(
    public expectedCurrentStatus: VehicleStatus,
    public attemptedNewStatus: VehicleStatus,
    public actualCurrentStatus: VehicleStatus,
    message: string
  ) {
    super(message);
    this.name = 'VehicleConcurrencyError';
  }
}

export interface NearbyVehiclesQuery {
  latitude: number;
  longitude: number;
  radius?: number;
}

export enum VehicleStatus {
  Available = 'Available',
  Rented = 'Rented',
  Maintenance = 'Maintenance',
  OutOfService = 'OutOfService'
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}