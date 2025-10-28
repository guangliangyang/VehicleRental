import React, { useState, useEffect, useCallback } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { VehicleSummaryDto, VehicleStatus, VehicleConcurrencyError } from '../types/vehicle';
import { useAuth } from '../auth';
import {
  getUserPermissions,
  getAvailableStatusTransitions,
  getDisplayRole,
  isAuthenticated
} from '../auth/roleUtils';
import { VehicleService } from '../services/vehicleService';

interface VehicleMarkerProps {
  vehicle: VehicleSummaryDto;
  onStatusUpdate?: (vehicleId: string, expectedCurrentStatus: VehicleStatus, newStatus: VehicleStatus) => Promise<void>;
  onRefresh?: () => void;
}

// Create custom icons for different vehicle statuses
const getStatusColor = (status: string): string => {
  switch (status) {
    case VehicleStatus.Available:
      return '#28a745';
    case VehicleStatus.Rented:
      return '#dc3545';
    case VehicleStatus.Maintenance:
      return '#fd7e14';
    case VehicleStatus.OutOfService:
      return '#6c757d';
    default:
      return '#007bff';
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

export const VehicleMarker: React.FC<VehicleMarkerProps> = ({ vehicle, onStatusUpdate, onRefresh }) => {
  const { user } = useAuth();
  const permissions = getUserPermissions(user);
  const [selectedStatus, setSelectedStatus] = useState<VehicleStatus>(vehicle.status as VehicleStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error' | 'conflict'; text: string } | null>(null);
  const [currentVehicleStatus, setCurrentVehicleStatus] = useState<VehicleStatus>(vehicle.status as VehicleStatus);
  const [isRenting, setIsRenting] = useState(false);
  const [isReturning, setIsReturning] = useState(false);

  // Update local status when vehicle prop changes (from parent/server)
  useEffect(() => {
    setCurrentVehicleStatus(vehicle.status as VehicleStatus);
    setSelectedStatus(vehicle.status as VehicleStatus);
  }, [vehicle.status]);

  const color = getStatusColor(vehicle.status);
  const availableStatusTransitions = getAvailableStatusTransitions(user, currentVehicleStatus);
  const userDisplayRole = getDisplayRole(user);

  const handleRentVehicle = useCallback(async () => {
    if (!isAuthenticated(user) || currentVehicleStatus !== VehicleStatus.Available) return;

    setIsRenting(true);
    setUpdateMessage(null);

    try {
      await VehicleService.rentVehicle(vehicle.vehicleId);
      setCurrentVehicleStatus(VehicleStatus.Rented);
      setUpdateMessage({ type: 'success', text: 'Vehicle rented successfully!' });
      onRefresh?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to rent vehicle';
      setUpdateMessage({ type: 'error', text: errorMessage });
      console.error('Failed to rent vehicle:', error);
    } finally {
      setIsRenting(false);
      setTimeout(() => setUpdateMessage(null), 3000);
    }
  }, [user, currentVehicleStatus, vehicle.vehicleId, onRefresh]);

  const handleReturnVehicle = useCallback(async () => {
    if (!isAuthenticated(user) || currentVehicleStatus !== VehicleStatus.Rented) return;

    setIsReturning(true);
    setUpdateMessage(null);

    try {
      await VehicleService.returnVehicle(vehicle.vehicleId);
      setCurrentVehicleStatus(VehicleStatus.Available);
      setUpdateMessage({ type: 'success', text: 'Vehicle returned successfully!' });
      onRefresh?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to return vehicle';
      setUpdateMessage({ type: 'error', text: errorMessage });
      console.error('Failed to return vehicle:', error);
    } finally {
      setIsReturning(false);
      setTimeout(() => setUpdateMessage(null), 3000);
    }
  }, [user, currentVehicleStatus, vehicle.vehicleId, onRefresh]);

  const handleStatusUpdate = useCallback(async () => {
    if (selectedStatus === currentVehicleStatus) return;

    setIsUpdating(true);
    setUpdateMessage(null);

    try {
      await VehicleService.updateVehicleStatus(vehicle.vehicleId, currentVehicleStatus, selectedStatus);
      setCurrentVehicleStatus(selectedStatus);
      setUpdateMessage({ type: 'success', text: 'Status updated successfully!' });
      onRefresh?.();
    } catch (error) {
      console.error('Failed to update vehicle status:', error);

      if (error instanceof VehicleConcurrencyError) {
        // Handle concurrency conflict with detailed message
        setCurrentVehicleStatus(error.actualCurrentStatus);
        setSelectedStatus(error.actualCurrentStatus);
        setUpdateMessage({
          type: 'conflict',
          text: `Status changed by another user. Expected: ${error.expectedCurrentStatus}, Current: ${error.actualCurrentStatus}. Please try again.`
        });
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
        setUpdateMessage({ type: 'error', text: errorMessage });
        setSelectedStatus(currentVehicleStatus); // Reset to current status
      }
    } finally {
      setIsUpdating(false);
      // Clear message after 5 seconds for conflicts, 3 seconds for others
      setTimeout(() => setUpdateMessage(null), updateMessage?.type === 'conflict' ? 5000 : 3000);
    }
  }, [selectedStatus, currentVehicleStatus, vehicle.vehicleId, onRefresh, updateMessage?.type]);

  const customIcon = new L.DivIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
      ">
        🚗
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return (
    <Marker
      position={[vehicle.latitude, vehicle.longitude]}
      // @ts-ignore
      icon={customIcon}
    >
      <Popup>
        <div className="p-3" style={{ minWidth: '280px' }}>
          {/* Header */}
          <div className="text-center mb-3">
            <h5 className="mb-1">Vehicle {vehicle.vehicleId}</h5>
            <small className="text-muted">
              📍 {vehicle.latitude.toFixed(6)}, {vehicle.longitude.toFixed(6)}
            </small>
          </div>

          {/* User Role Display */}
          {isAuthenticated(user) && (
            <div className="text-center mb-2">
              <span className="badge bg-secondary">{userDisplayRole}</span>
            </div>
          )}

          {/* Current Status */}
          <div className="mb-3">
            <div className={`d-flex align-items-center justify-content-center gap-2 p-2 rounded border-2`}
                 style={{
                   backgroundColor: '#f8f9fa',
                   borderColor: getStatusColor(currentVehicleStatus)
                 }}>
              <span style={{ fontSize: '18px' }}>
                {getStatusIcon(currentVehicleStatus)}
              </span>
              <span className="fw-bold" style={{ color: getStatusColor(currentVehicleStatus) }}>
                {currentVehicleStatus}
              </span>
            </div>
          </div>

          {/* Actions Section */}
          {isAuthenticated(user) ? (
            <div className="d-flex flex-column gap-2 mb-3">
              {/* Rent Vehicle Button */}
              {permissions.canRentVehicles && currentVehicleStatus === VehicleStatus.Available && (
                <button
                  onClick={handleRentVehicle}
                  disabled={isRenting}
                  className="btn btn-success btn-sm"
                >
                  {isRenting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"></span>
                      Renting...
                    </>
                  ) : (
                    <>🚗 Rent Vehicle</>
                  )}
                </button>
              )}

              {/* Return Vehicle Button */}
              {permissions.canReturnVehicles && currentVehicleStatus === VehicleStatus.Rented && (
                <button
                  onClick={handleReturnVehicle}
                  disabled={isReturning}
                  className="btn btn-info btn-sm"
                >
                  {isReturning ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"></span>
                      Returning...
                    </>
                  ) : (
                    <>🔄 Return Vehicle</>
                  )}
                </button>
              )}

              {/* Status Update Section for Technicians */}
              {permissions.canUpdateVehicleStatus && availableStatusTransitions.length > 0 && (
                <div>
                  <label className="form-label small fw-bold">Change Status:</label>
                  <div className="d-flex gap-1">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as VehicleStatus)}
                      disabled={isUpdating}
                      className="form-select form-select-sm flex-grow-1"
                    >
                      <option value={currentVehicleStatus}>{currentVehicleStatus}</option>
                      {availableStatusTransitions.map(status => (
                        <option key={status} value={status}>
                          {getStatusIcon(status)} {status}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleStatusUpdate}
                      disabled={isUpdating || selectedStatus === currentVehicleStatus}
                      className={`btn btn-sm ${
                        isUpdating
                          ? 'btn-secondary'
                          : selectedStatus === currentVehicleStatus
                            ? 'btn-outline-secondary'
                            : 'btn-warning'
                      }`}
                    >
                      {isUpdating ? '⏳' : '🔧'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted small">
              Sign in to rent vehicles
            </div>
          )}

          {/* Status Message */}
          {updateMessage && (
            <div className={`alert alert-sm p-2 text-center small ${
              updateMessage.type === 'success' ? 'alert-success' :
              updateMessage.type === 'conflict' ? 'alert-warning' : 'alert-danger'
            }`}>
              {updateMessage.type === 'conflict' && '⚠️ '}{updateMessage.text}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};