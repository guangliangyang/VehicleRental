import React, { useEffect, useRef, useState } from 'react';
import { VehicleSummaryDto, VehicleStatus, VehicleConcurrencyError } from '../types/vehicle';

interface VehicleListProps {
  vehicles: VehicleSummaryDto[];
  loading: boolean;
  onStatusUpdate?: (vehicleId: string, expectedCurrentStatus: VehicleStatus, newStatus: VehicleStatus) => Promise<void>;
}

export const VehicleList: React.FC<VehicleListProps> = ({ vehicles, loading, onStatusUpdate }) => {
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, VehicleStatus>>({});
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
  const [statusMessages, setStatusMessages] = useState<Record<string, { type: 'success' | 'error' | 'conflict'; text: string }>>({});
  const messageTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    setSelectedStatuses(prev => {
      const next: Record<string, VehicleStatus> = {};
      vehicles.forEach(vehicle => {
        const status = vehicle.status as VehicleStatus;
        next[vehicle.vehicleId] = prev[vehicle.vehicleId] ?? status;
      });
      return next;
    });

    setIsUpdating(prev => {
      const next: Record<string, boolean> = {};
      vehicles.forEach(vehicle => {
        next[vehicle.vehicleId] = prev[vehicle.vehicleId] ?? false;
      });
      return next;
    });

    setStatusMessages(prev => {
      const next: typeof prev = {};
      vehicles.forEach(vehicle => {
        if (prev[vehicle.vehicleId]) {
          next[vehicle.vehicleId] = prev[vehicle.vehicleId];
        }
      });
      return next;
    });

    // Clear timers for removed vehicles
    Object.entries(messageTimeoutsRef.current).forEach(([vehicleId, timeoutId]) => {
      if (!vehicles.some(vehicle => vehicle.vehicleId === vehicleId)) {
        clearTimeout(timeoutId);
        delete messageTimeoutsRef.current[vehicleId];
      }
    });
  }, [vehicles]);

  useEffect(() => () => {
    Object.values(messageTimeoutsRef.current).forEach(timeoutId => clearTimeout(timeoutId));
  }, []);

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

  const statusOptions = Object.values(VehicleStatus);

  const scheduleMessageClear = (vehicleId: string, type: 'success' | 'error' | 'conflict') => {
    if (messageTimeoutsRef.current[vehicleId]) {
      clearTimeout(messageTimeoutsRef.current[vehicleId]);
    }

    const delay = type === 'conflict' ? 5000 : 3000;
    messageTimeoutsRef.current[vehicleId] = setTimeout(() => {
      setStatusMessages(prev => {
        const { [vehicleId]: _, ...rest } = prev;
        return rest;
      });
      delete messageTimeoutsRef.current[vehicleId];
    }, delay);
  };

  const handleStatusUpdate = async (vehicleId: string) => {
    if (!onStatusUpdate) {
      return;
    }

    const vehicle = vehicles.find(v => v.vehicleId === vehicleId);
    if (!vehicle) {
      return;
    }

    const currentStatus = vehicle.status as VehicleStatus;
    const selectedStatus = selectedStatuses[vehicleId] ?? currentStatus;

    if (selectedStatus === currentStatus) {
      return;
    }

    setIsUpdating(prev => ({ ...prev, [vehicleId]: true }));
    setStatusMessages(prev => {
      const { [vehicleId]: _, ...rest } = prev;
      return rest;
    });

    try {
      await onStatusUpdate(vehicleId, currentStatus, selectedStatus);
      setStatusMessages(prev => ({
        ...prev,
        [vehicleId]: {
          type: 'success',
          text: 'Status updated successfully!'
        }
      }));
      scheduleMessageClear(vehicleId, 'success');
    } catch (caughtError) {
      console.error('Failed to update vehicle status:', caughtError);
      const error = caughtError as unknown;

      if (error instanceof VehicleConcurrencyError) {
        setSelectedStatuses(prev => ({
          ...prev,
          [vehicleId]: error.actualCurrentStatus
        }));
        setStatusMessages(prev => ({
          ...prev,
          [vehicleId]: {
            type: 'conflict',
            text: `Status changed by another user. Expected: ${error.expectedCurrentStatus}, Current: ${error.actualCurrentStatus}. Please try again.`
          }
        }));
        scheduleMessageClear(vehicleId, 'conflict');
      } else {
        setSelectedStatuses(prev => ({
          ...prev,
          [vehicleId]: currentStatus
        }));
        setStatusMessages(prev => ({
          ...prev,
          [vehicleId]: {
            type: 'error',
            text: error instanceof Error ? error.message : 'Failed to update status. Please try again.'
          }
        }));
        scheduleMessageClear(vehicleId, 'error');
      }
    } finally {
      setIsUpdating(prev => ({ ...prev, [vehicleId]: false }));
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div>Loading vehicles...</div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
        <div>🚗 No vehicles found in your area</div>
        <div style={{ fontSize: '14px', marginTop: '8px' }}>
          Try increasing the search radius or checking your location
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '16px' }}>
      <h3 style={{ margin: '0 0 16px 0' }}>
        Nearby Vehicles ({vehicles.length})
      </h3>

      <div style={{ display: 'grid', gap: '12px' }}>
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.vehicleId}
            style={{
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '6px',
              border: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                Vehicle {vehicle.vehicleId}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                📍 {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>
                  {getStatusIcon(vehicle.status)}
                </span>
                <span
                  style={{
                    color: getStatusColor(vehicle.status),
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}
                >
                  {vehicle.status}
                </span>
              </div>

              {onStatusUpdate && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    value={selectedStatuses[vehicle.vehicleId] ?? vehicle.status}
                    onChange={(e) =>
                      setSelectedStatuses(prev => ({
                        ...prev,
                        [vehicle.vehicleId]: e.target.value as VehicleStatus
                      }))
                    }
                    disabled={isUpdating[vehicle.vehicleId]}
                    style={{
                      padding: '6px 8px',
                      fontSize: '12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      backgroundColor: 'white'
                    }}
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleStatusUpdate(vehicle.vehicleId)}
                    disabled={
                      isUpdating[vehicle.vehicleId] ||
                      (selectedStatuses[vehicle.vehicleId] ?? vehicle.status) === vehicle.status
                    }
                    style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      backgroundColor:
                        (selectedStatuses[vehicle.vehicleId] ?? vehicle.status) === vehicle.status
                          ? '#6c757d'
                          : '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor:
                        (selectedStatuses[vehicle.vehicleId] ?? vehicle.status) === vehicle.status
                          ? 'not-allowed'
                          : (isUpdating[vehicle.vehicleId] ? 'wait' : 'pointer'),
                      opacity:
                        (selectedStatuses[vehicle.vehicleId] ?? vehicle.status) === vehicle.status
                          ? 0.6
                          : 1
                    }}
                  >
                    {isUpdating[vehicle.vehicleId] ? 'Updating...' : 'Update'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {Object.entries(statusMessages).map(([vehicleId, message]) => (
        <div
          key={vehicleId}
          style={{
            marginTop: '12px',
            padding: '10px 12px',
            borderRadius: '4px',
            border: `1px solid ${
              message.type === 'success'
                ? '#c3e6cb'
                : message.type === 'conflict'
                  ? '#ffeaa7'
                  : '#f5c6cb'
            }`,
            backgroundColor:
              message.type === 'success'
                ? '#d4edda'
                : message.type === 'conflict'
                  ? '#fff3cd'
                  : '#f8d7da',
            color:
              message.type === 'success'
                ? '#155724'
                : message.type === 'conflict'
                  ? '#856404'
                  : '#721c24',
            fontSize: '13px'
          }}
        >
          <strong>Vehicle {vehicleId}:</strong>{' '}
          {message.type === 'conflict' ? '⚠️ ' : ''}
          {message.text}
        </div>
      ))}
    </div>
  );
};
