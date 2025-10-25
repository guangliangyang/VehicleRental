import React, { useState, useEffect } from 'react';
import { VehicleSummaryDto } from '../types/vehicle';
import { VehicleService } from '../services/vehicleService';
import { useAuth } from '../auth';
import { isAuthenticated } from '../auth/roleUtils';

interface UserVehiclesViewProps {
  onRefresh?: () => void;
}

export const UserVehiclesView: React.FC<UserVehiclesViewProps> = ({ onRefresh }) => {
  const { user } = useAuth();
  const [userVehicles, setUserVehicles] = useState<VehicleSummaryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserVehicles = async () => {
    if (!isAuthenticated(user)) {
      setUserVehicles([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const vehicles = await VehicleService.getUserVehicles();
      setUserVehicles(vehicles);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch your vehicles';
      setError(errorMessage);
      console.error('Failed to fetch user vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserVehicles();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => {
    fetchUserVehicles();
    if (onRefresh) onRefresh();
  };

  if (!isAuthenticated(user)) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h3>Sign In Required</h3>
        <p>Please sign in to view your rented vehicles.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div>Loading your vehicles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#f8d7da',
        color: '#721c24',
        padding: '16px',
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        <h4>Error Loading Your Vehicles</h4>
        <p>{error}</p>
        <button
          onClick={handleRefresh}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>
          🚗 Your Rented Vehicles ({userVehicles.length})
        </h3>
        <button
          onClick={handleRefresh}
          style={{
            padding: '6px 12px',
            fontSize: '14px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {userVehicles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚙</div>
          <h4>No Vehicles Rented</h4>
          <p>You haven't rented any vehicles yet. Find available vehicles on the map or list view to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {userVehicles.map((vehicle) => (
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
                <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>
                  🚗 Vehicle {vehicle.vehicleId}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                  📍 Location: {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
                </div>
                <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    color: vehicle.status === 'Rented' ? '#dc3545' : '#28a745',
                    fontWeight: 'bold'
                  }}>
                    Status: {vehicle.status}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                {vehicle.status === 'Rented' && (
                  <button
                    onClick={async () => {
                      try {
                        await VehicleService.returnVehicle(vehicle.vehicleId);
                        handleRefresh();
                      } catch (err) {
                        const errorMessage = err instanceof Error ? err.message : 'Failed to return vehicle';
                        alert(errorMessage);
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Return Vehicle
                  </button>
                )}

                <div style={{ fontSize: '11px', color: '#666' }}>
                  Vehicle ID: {vehicle.vehicleId}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};