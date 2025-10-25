import React, { useState, useMemo } from 'react';
import './App.css';
import { MapView } from './components/MapView';
import { VehicleList } from './components/VehicleList';
import { UserVehiclesView } from './components/UserVehiclesView';
import { FilterPanel } from './components/FilterPanel';
import { useGeolocation } from './hooks/useGeolocation';
import { useVehicles } from './hooks/useVehicles';
import { useAuthenticatedApi } from './hooks/useAuthenticatedApi';
import { AuthProvider, AuthButton, useAuth } from './auth';
import { getUserPermissions, isAuthenticated } from './auth/roleUtils';

type ViewMode = 'map' | 'list' | 'myVehicles';

const AppContent: React.FC = () => {
  const [radius, setRadius] = useState<number>(5);
  const [statusFilter, setStatusFilter] = useState<string[]>(['Available', 'Rented', 'Maintenance','OutOfService']);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const { user } = useAuth();
  const permissions = getUserPermissions(user);

  // Initialize authenticated API
  useAuthenticatedApi();

  const { location, error: locationError, loading: locationLoading, getCurrentLocation } = useGeolocation();
  const {
    vehicles: allVehicles,
    loading: vehiclesLoading,
    error: vehiclesError,
    refresh,
    isAutoRefreshEnabled,
    toggleAutoRefresh
  } = useVehicles(location, radius, 30000); // 30 seconds auto refresh

  // Filter vehicles by status
  const filteredVehicles = useMemo(() => {
    return allVehicles.filter(vehicle => statusFilter.includes(vehicle.status));
  }, [allVehicles, statusFilter]);

  const handleRefresh = () => {
    refresh();
  };

  return (
    <div className="App">
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ textAlign: 'left' }}>
              <h1 style={{ color: '#333', marginBottom: '8px' }}>🚗 Vehicle Rental System</h1>
              <p style={{ color: '#666', margin: 0 }}>Find available vehicles near you</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <AuthButton
                className="auth-button-header"
              />
            </div>
          </div>
        </header>

        {/* Location Error */}
        {locationError && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            ⚠️ Location Error: {locationError}
          </div>
        )}

        {/* Vehicles Error */}
        {vehiclesError && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            ⚠️ Vehicles Error: {vehiclesError}
          </div>
        )}

        {/* Control Panel */}
        <FilterPanel
          radius={radius}
          onRadiusChange={setRadius}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onRefresh={handleRefresh}
          onGetLocation={getCurrentLocation}
          loading={locationLoading || vehiclesLoading}
          isAutoRefreshEnabled={isAutoRefreshEnabled}
          onToggleAutoRefresh={toggleAutoRefresh}
        />

        {/* View Toggle */}
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <button
            onClick={() => setViewMode('map')}
            style={{
              padding: '8px 16px',
              marginRight: '8px',
              backgroundColor: viewMode === 'map' ? '#007bff' : '#e9ecef',
              color: viewMode === 'map' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            🗺️ Map View
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px 16px',
              marginRight: '8px',
              backgroundColor: viewMode === 'list' ? '#007bff' : '#e9ecef',
              color: viewMode === 'list' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            📋 List View
          </button>
          {permissions.canViewOwnVehicles && (
            <button
              onClick={() => setViewMode('myVehicles')}
              style={{
                padding: '8px 16px',
                backgroundColor: viewMode === 'myVehicles' ? '#28a745' : '#e9ecef',
                color: viewMode === 'myVehicles' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              🚗 My Vehicles
            </button>
          )}
        </div>

        {/* Content */}
        {viewMode === 'list' ? (
          <VehicleList
            vehicles={filteredVehicles}
            loading={vehiclesLoading}
            onRefresh={handleRefresh}
          />
        ) : viewMode === 'myVehicles' ? (
          <UserVehiclesView
            onRefresh={handleRefresh}
          />
        ) : (
          <MapView
            userLocation={location}
            vehicles={filteredVehicles}
            radius={radius}
          />
        )}

        {/* Status Info */}
        {viewMode !== 'myVehicles' && (
          <div style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: '#e9ecef',
            borderRadius: '4px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {location ? (
              <span>
                📍 Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)} |
                🚗 Found {filteredVehicles.length} vehicles within {radius} km
                {isAutoRefreshEnabled && (
                  <span style={{ marginLeft: '8px', color: '#28a745' }}>
                    | 🔄 Auto-refresh enabled (30s)
                  </span>
                )}
              </span>
            ) : (
              <span>📍 Getting your location...</span>
            )}
          </div>
        )}

        {/* User Info */}
        {isAuthenticated(user) && (
          <div style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: '#d4edda',
            borderRadius: '4px',
            fontSize: '14px',
            textAlign: 'center',
            color: '#155724'
          }}>
            👤 Signed in as {user?.name} | Access Level: {permissions.canUpdateVehicleStatus ? 'Technician' : 'User'}
            {permissions.canUpdateVehicleStatus && (
              <span style={{ marginLeft: '8px' }}>
                | 🔧 Can manage maintenance & service status
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
