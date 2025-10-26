import React, { memo, useCallback } from 'react';
import { VehicleSummaryDto, VehicleStatus } from '../types/vehicle';
import { VehicleActions } from './VehicleActions';
import styles from '../styles/VehicleList.module.css';

interface VehicleListProps {
  vehicles: VehicleSummaryDto[];
  loading: boolean;
  onRefresh?: () => void;
}

// Memoized status utility functions outside component to prevent recreation
const getStatusClassName = (status: string): string => {
  switch (status) {
    case VehicleStatus.Available:
      return styles.statusAvailable;
    case VehicleStatus.Rented:
      return styles.statusRented;
    case VehicleStatus.Maintenance:
      return styles.statusMaintenance;
    case VehicleStatus.OutOfService:
      return styles.statusOutOfService;
    default:
      return styles.statusDefault;
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
    <div className={styles.vehicleCard}>
      <div className={styles.vehicleInfo}>
        <div className={styles.vehicleId}>
          Vehicle {vehicle.vehicleId}
        </div>
        <div className={styles.vehicleLocation}>
          📍 {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
        </div>
      </div>

      <div className={styles.vehicleActions}>
        <div className={styles.statusContainer}>
          <span className={styles.statusIcon} aria-hidden="true">
            {getStatusIcon(vehicle.status)}
          </span>
          <span
            className={`${styles.statusText} ${getStatusClassName(vehicle.status)}`}
          >
            {vehicle.status}
          </span>
        </div>

        <VehicleActions
          vehicle={vehicle}
          onRefresh={onRefresh}
        />
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
      <div className={styles.loadingContainer} role="status" aria-live="polite">
        <div className={styles.loadingSpinner} aria-hidden="true"></div>
        <div>Loading vehicles...</div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className={styles.emptyContainer} role="status">
        <span className={styles.emptyIcon} aria-hidden="true">🚗</span>
        <div className={styles.emptyTitle}>No vehicles found in your area</div>
        <div className={styles.emptySubtitle}>
          Try increasing the search radius or checking your location
        </div>
      </div>
    );
  }

  return (
    <section className={styles.container} aria-labelledby="vehicle-list-title">
      <h3 id="vehicle-list-title" className={styles.title}>
        Nearby Vehicles ({vehicles.length})
      </h3>

      <div className={styles.vehicleGrid} role="list" aria-label={`${vehicles.length} vehicles found`}>
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