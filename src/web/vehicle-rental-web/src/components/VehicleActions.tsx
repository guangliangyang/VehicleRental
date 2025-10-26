import React, { useState, useCallback, memo } from 'react';
import { VehicleSummaryDto, VehicleStatus } from '../types/vehicle';
import { useAuth } from '../auth';
import {
  getUserPermissions,
  getAvailableStatusTransitions,
  getDisplayRole,
  isTechnician,
  isAuthenticated
} from '../auth/roleUtils';
import { VehicleService } from '../services/vehicleService';
import styles from '../styles/VehicleActions.module.css';

interface VehicleActionsProps {
  vehicle: VehicleSummaryDto;
  onRefresh?: () => void;
}

export const VehicleActions: React.FC<VehicleActionsProps> = memo(({
  vehicle,
  onRefresh
}) => {
  const { user } = useAuth();
  const permissions = getUserPermissions(user);
  const [isRenting, setIsRenting] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<VehicleStatus>(vehicle.status as VehicleStatus);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStatus = vehicle.status as VehicleStatus;
  const availableStatusTransitions = getAvailableStatusTransitions(user, currentStatus);
  const userDisplayRole = getDisplayRole(user);

  // Clear error when status changes
  React.useEffect(() => {
    setError(null);
  }, [selectedStatus]);

  const handleRentVehicle = useCallback(async () => {
    if (!isAuthenticated(user) || currentStatus !== VehicleStatus.Available) return;

    setIsRenting(true);
    setError(null);

    try {
      await VehicleService.rentVehicle(vehicle.vehicleId);
      onRefresh?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to rent vehicle';
      setError(errorMessage);
      console.error('Failed to rent vehicle:', error);
    } finally {
      setIsRenting(false);
    }
  }, [user, currentStatus, vehicle.vehicleId, onRefresh]);

  const handleReturnVehicle = useCallback(async () => {
    if (!isAuthenticated(user) || currentStatus !== VehicleStatus.Rented) return;

    setIsReturning(true);
    setError(null);

    try {
      await VehicleService.returnVehicle(vehicle.vehicleId);
      onRefresh?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to return vehicle';
      setError(errorMessage);
      console.error('Failed to return vehicle:', error);
    } finally {
      setIsReturning(false);
    }
  }, [user, currentStatus, vehicle.vehicleId, onRefresh]);

  const handleStatusChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(event.target.value as VehicleStatus);
    setError(null);
  }, []);

  const handleStatusUpdate = useCallback(async () => {
    if (selectedStatus === currentStatus) return;

    setIsUpdatingStatus(true);
    setError(null);

    try {
      await VehicleService.updateVehicleStatus(vehicle.vehicleId, currentStatus, selectedStatus);
      onRefresh?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update vehicle status';
      setError(errorMessage);
      setSelectedStatus(currentStatus); // Reset to current status on error
      console.error('Failed to update vehicle status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [selectedStatus, currentStatus, vehicle.vehicleId, onRefresh]);

  // Don't show any actions for anonymous users except viewing
  if (!isAuthenticated(user)) {
    return (
      <div className={styles.anonymousMessage} role="status">
        Sign in to rent vehicles
      </div>
    );
  }

  const isStatusChangeAvailable = selectedStatus !== currentStatus;
  const updateButtonClass = isUpdatingStatus
    ? styles.updateButtonLoading
    : isStatusChangeAvailable
      ? styles.updateButtonActive
      : styles.updateButtonInactive;

  return (
    <div className={styles.container}>
      {/* User Role Display */}
      <div className={styles.roleDisplay} aria-label={`User role: ${userDisplayRole}`}>
        Role: {userDisplayRole}
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorMessage} role="alert" aria-live="polite">
          {error}
        </div>
      )}

      {/* Rent/Return Actions for Authenticated Users */}
      {permissions.canRentVehicles && currentStatus === VehicleStatus.Available && (
        <button
          onClick={handleRentVehicle}
          disabled={isRenting}
          className={`${styles.actionButton} ${styles.rentButton}`}
          aria-label={`Rent vehicle ${vehicle.vehicleId}`}
        >
          {isRenting ? (
            <>
              <span className={styles.spinner} aria-hidden="true"></span>
              Renting...
            </>
          ) : (
            <>🚗 Rent Vehicle</>
          )}
        </button>
      )}

      {permissions.canReturnVehicles && currentStatus === VehicleStatus.Rented && (
        <button
          onClick={handleReturnVehicle}
          disabled={isReturning}
          className={`${styles.actionButton} ${styles.returnButton}`}
          aria-label={`Return vehicle ${vehicle.vehicleId}`}
        >
          {isReturning ? (
            <>
              <span className={styles.spinner} aria-hidden="true"></span>
              Returning...
            </>
          ) : (
            <>🔄 Return Vehicle</>
          )}
        </button>
      )}

      {/* Status Update Actions for Technicians */}
      {permissions.canUpdateVehicleStatus && availableStatusTransitions.length > 0 && (
        <div className={styles.statusControls}>
          <label htmlFor={`status-select-${vehicle.vehicleId}`} className="sr-only">
            Update vehicle status
          </label>
          <select
            id={`status-select-${vehicle.vehicleId}`}
            value={selectedStatus}
            onChange={handleStatusChange}
            disabled={isUpdatingStatus}
            className={styles.statusSelect}
            aria-label={`Current status: ${currentStatus}. Select new status`}
          >
            <option value={currentStatus}>{currentStatus}</option>
            {availableStatusTransitions.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <button
            onClick={handleStatusUpdate}
            disabled={isUpdatingStatus || !isStatusChangeAvailable}
            className={`${styles.updateButton} ${updateButtonClass}`}
            aria-label={isStatusChangeAvailable ? `Update status to ${selectedStatus}` : 'No status change selected'}
            title={isStatusChangeAvailable ? `Update status to ${selectedStatus}` : 'Select a different status to update'}
          >
            {isUpdatingStatus ? '⏳' : '🔧'}
          </button>
        </div>
      )}

      {/* Status Information */}
      {isTechnician(user) && (
        <div className={styles.technicianInfo} aria-label="Technician capabilities">
          Can manage: Maintenance, Out-of-Service
        </div>
      )}
    </div>
  );
});

VehicleActions.displayName = 'VehicleActions';