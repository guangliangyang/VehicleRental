import React, { memo, useCallback } from 'react';
import { VehicleSummaryDto, VehicleStatus } from '../types/vehicle';
import { VehicleActions } from './VehicleActions';

interface VehicleListProps {
  vehicles: VehicleSummaryDto[];
  loading: boolean;
  onRefresh?: () => void;
}

// Memoized status utility functions outside component to prevent recreation
const getStatusClassName = (status: string): string => {
  switch (status) {
    case VehicleStatus.Available:
      return 'bg-success';
    case VehicleStatus.Rented:
      return 'bg-warning';
    case VehicleStatus.Maintenance:
      return 'bg-info';
    case VehicleStatus.OutOfService:
      return 'bg-danger';
    default:
      return 'bg-secondary';
  }
};

const getStatusIcon = (status: string): string => {
  switch (status) {
    case VehicleStatus.Available:
      return '✅';
    case VehicleStatus.Rented:
      return '🚗';
    case VehicleStatus.Maintenance:
      return '🔧';
    case VehicleStatus.OutOfService:
      return '🚫';
    default:
      return '❓';
  }
};

// Memoized vehicle item component for performance
const VehicleItem = memo<{
  vehicle: VehicleSummaryDto;
  onRefresh?: () => void;
}>(({ vehicle, onRefresh }) => {
  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <h6 className="card-title mb-1">
              Vehicle {vehicle.vehicleId}
            </h6>
            <p className="card-text text-muted small mb-2">
              📍 {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
            </p>
            <span className={`badge ${getStatusClassName(vehicle.status)} me-1`}>
              <span aria-hidden="true">{getStatusIcon(vehicle.status)}</span> {vehicle.status}
            </span>
          </div>

          <div className="ms-3">
            <VehicleActions
              vehicle={vehicle}
              onRefresh={onRefresh}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

VehicleItem.displayName = 'VehicleItem';

export const VehicleList: React.FC<VehicleListProps> = memo(({ vehicles, loading, onRefresh }) => {
  const handleVehicleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" role="status" aria-live="polite">
        <div className="spinner-border text-primary me-3" aria-hidden="true"></div>
        <div>Loading vehicles...</div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-5" role="status">
        <div className="display-1 mb-3" aria-hidden="true">🚗</div>
        <h4 className="text-muted">No vehicles found in your area</h4>
        <p className="text-muted">
          Try increasing the search radius or checking your location
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="vehicle-list-title">
      <h3 id="vehicle-list-title" className="h4 mb-4">
        Nearby Vehicles ({vehicles.length})
      </h3>

      <div role="list" aria-label={`${vehicles.length} vehicles found`}>
        {vehicles.map((vehicle) => (
          <div key={vehicle.vehicleId} role="listitem">
            <VehicleItem
              vehicle={vehicle}
              onRefresh={handleVehicleRefresh}
            />
          </div>
        ))}
      </div>
    </section>
  );
});

VehicleList.displayName = 'VehicleList';