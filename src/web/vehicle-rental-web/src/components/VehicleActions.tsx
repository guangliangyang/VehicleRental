import React, { useState } from 'react';
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

interface VehicleActionsProps {
  vehicle: VehicleSummaryDto;
  onRefresh?: () => void;
}

export const VehicleActions: React.FC<VehicleActionsProps> = ({
  vehicle,
  onRefresh
}) => {
  const { user } = useAuth();
  const permissions = getUserPermissions(user);
  const [isRenting, setIsRenting] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<VehicleStatus>(vehicle.status as VehicleStatus);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const currentStatus = vehicle.status as VehicleStatus;
  const availableStatusTransitions = getAvailableStatusTransitions(user, currentStatus);
  const userDisplayRole = getDisplayRole(user);

  const handleRentVehicle = async () => {
    if (!isAuthenticated(user) || currentStatus !== VehicleStatus.Available) return;

    setIsRenting(true);
    try {
      await VehicleService.rentVehicle(vehicle.vehicleId);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to rent vehicle:', error);
      alert(error instanceof Error ? error.message : 'Failed to rent vehicle');
    } finally {
      setIsRenting(false);
    }
  };

  const handleReturnVehicle = async () => {
    if (!isAuthenticated(user) || currentStatus !== VehicleStatus.Rented) return;

    setIsReturning(true);
    try {
      await VehicleService.returnVehicle(vehicle.vehicleId);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to return vehicle:', error);
      alert(error instanceof Error ? error.message : 'Failed to return vehicle');
    } finally {
      setIsReturning(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (selectedStatus === currentStatus) return;

    setIsUpdatingStatus(true);
    try {
      await VehicleService.updateVehicleStatus(vehicle.vehicleId, currentStatus, selectedStatus);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to update vehicle status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update vehicle status');
      setSelectedStatus(currentStatus); // Reset to current status on error
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Don't show any actions for anonymous users except viewing
  if (!isAuthenticated(user)) {
    return (
      <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
        Sign in to rent vehicles
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* User Role Display */}
      <div style={{ fontSize: '11px', color: '#666' }}>
        Role: {userDisplayRole}
      </div>

      {/* Rent/Return Actions for Authenticated Users */}
      {permissions.canRentVehicles && currentStatus === VehicleStatus.Available && (
        <button
          onClick={handleRentVehicle}
          disabled={isRenting}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRenting ? 'wait' : 'pointer',
          }}
        >
          {isRenting ? 'Renting...' : '🚗 Rent Vehicle'}
        </button>
      )}

      {permissions.canReturnVehicles && currentStatus === VehicleStatus.Rented && (
        <button
          onClick={handleReturnVehicle}
          disabled={isReturning}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isReturning ? 'wait' : 'pointer',
          }}
        >
          {isReturning ? 'Returning...' : '🔄 Return Vehicle'}
        </button>
      )}

      {/* Status Update Actions for Technicians */}
      {permissions.canUpdateVehicleStatus && availableStatusTransitions.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as VehicleStatus)}
            disabled={isUpdatingStatus}
            style={{
              padding: '4px 6px',
              fontSize: '11px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              backgroundColor: 'white',
              flex: 1,
            }}
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
            disabled={isUpdatingStatus || selectedStatus === currentStatus}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              backgroundColor: selectedStatus === currentStatus ? '#6c757d' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedStatus === currentStatus ? 'not-allowed' : (isUpdatingStatus ? 'wait' : 'pointer'),
              opacity: selectedStatus === currentStatus ? 0.6 : 1,
            }}
          >
            {isUpdatingStatus ? '⏳' : '🔧'}
          </button>
        </div>
      )}

      {/* Status Information */}
      {isTechnician(user) && (
        <div style={{ fontSize: '10px', color: '#666' }}>
          Can manage: Maintenance, Out-of-Service
        </div>
      )}
    </div>
  );
};