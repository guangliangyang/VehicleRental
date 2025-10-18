import React, { useState, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { VehicleSummaryDto, VehicleStatus, VehicleConcurrencyError } from '../types/vehicle';

interface VehicleMarkerProps {
  vehicle: VehicleSummaryDto;
  onStatusUpdate?: (vehicleId: string, expectedCurrentStatus: VehicleStatus, newStatus: VehicleStatus) => Promise<void>;
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

export const VehicleMarker: React.FC<VehicleMarkerProps> = ({ vehicle, onStatusUpdate }) => {
  const [selectedStatus, setSelectedStatus] = useState<VehicleStatus>(vehicle.status as VehicleStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error' | 'conflict'; text: string } | null>(null);
  const [currentVehicleStatus, setCurrentVehicleStatus] = useState<VehicleStatus>(vehicle.status as VehicleStatus);

  // Update local status when vehicle prop changes (from parent/server)
  useEffect(() => {
    setCurrentVehicleStatus(vehicle.status as VehicleStatus);
    setSelectedStatus(vehicle.status as VehicleStatus);
  }, [vehicle.status]);

  const color = getStatusColor(vehicle.status);
  const statusOptions = Object.values(VehicleStatus);

  const handleStatusUpdate = async () => {
    if (!onStatusUpdate || selectedStatus === currentVehicleStatus) return;

    setIsUpdating(true);
    setUpdateMessage(null);

    try {
      await onStatusUpdate(vehicle.vehicleId, currentVehicleStatus, selectedStatus);
      setCurrentVehicleStatus(selectedStatus);
      setUpdateMessage({ type: 'success', text: 'Status updated successfully!' });
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
        setUpdateMessage({ type: 'error', text: 'Failed to update status. Please try again.' });
        setSelectedStatus(currentVehicleStatus); // Reset to current status
      }
    } finally {
      setIsUpdating(false);
      // Clear message after 5 seconds for conflicts, 3 seconds for others
      setTimeout(() => setUpdateMessage(null), updateMessage?.type === 'conflict' ? 5000 : 3000);
    }
  };

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
        <div style={{ minWidth: '250px', padding: '8px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: '0 0 4px 0', color: '#333' }}>
              Vehicle {vehicle.vehicleId}
            </h4>
            <div style={{ fontSize: '12px', color: '#666' }}>
              📍 {vehicle.latitude.toFixed(6)}, {vehicle.longitude.toFixed(6)}
            </div>
          </div>

          {/* Current Status */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: `2px solid ${getStatusColor(currentVehicleStatus)}`
            }}>
              <span style={{ fontSize: '18px' }}>
                {getStatusIcon(currentVehicleStatus)}
              </span>
              <span style={{
                fontWeight: 'bold',
                color: getStatusColor(currentVehicleStatus)
              }}>
                {currentVehicleStatus}
              </span>
            </div>
          </div>

          {/* Status Update Section */}
          {onStatusUpdate && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                Change Status:
              </label>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as VehicleStatus)}
                disabled={isUpdating}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  marginBottom: '8px'
                }}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {getStatusIcon(status)} {status}
                  </option>
                ))}
              </select>

              <button
                onClick={handleStatusUpdate}
                disabled={isUpdating || selectedStatus === currentVehicleStatus}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: 'white',
                  backgroundColor: selectedStatus === currentVehicleStatus ? '#6c757d' : '#007bff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: selectedStatus === currentVehicleStatus ? 'not-allowed' : (isUpdating ? 'wait' : 'pointer'),
                  opacity: selectedStatus === currentVehicleStatus ? 0.6 : 1
                }}
              >
                {isUpdating ? '🔄 Updating...' : selectedStatus === currentVehicleStatus ? 'No Change' : '✅ Update Status'}
              </button>
            </div>
          )}

          {/* Status Message */}
          {updateMessage && (
            <div style={{
              padding: '6px 8px',
              fontSize: '12px',
              borderRadius: '4px',
              textAlign: 'center',
              backgroundColor:
                updateMessage.type === 'success' ? '#d4edda' :
                updateMessage.type === 'conflict' ? '#fff3cd' : '#f8d7da',
              color:
                updateMessage.type === 'success' ? '#155724' :
                updateMessage.type === 'conflict' ? '#856404' : '#721c24',
              border: `1px solid ${
                updateMessage.type === 'success' ? '#c3e6cb' :
                updateMessage.type === 'conflict' ? '#ffeaa7' : '#f5c6cb'
              }`
            }}>
              {updateMessage.type === 'conflict' && '⚠️ '}{updateMessage.text}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};