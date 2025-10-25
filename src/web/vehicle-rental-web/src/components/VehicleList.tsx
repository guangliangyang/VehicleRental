import React from 'react';
import { VehicleSummaryDto, VehicleStatus } from '../types/vehicle';
import { VehicleActions } from './VehicleActions';

interface VehicleListProps {
  vehicles: VehicleSummaryDto[];
  loading: boolean;
  onRefresh?: () => void;
}

export const VehicleList: React.FC<VehicleListProps> = ({ vehicles, loading, onRefresh }) => {

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

              <VehicleActions
                vehicle={vehicle}
                onRefresh={onRefresh}
              />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
