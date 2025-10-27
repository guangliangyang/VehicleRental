import React, { useState, useMemo, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { MapView } from './components/MapView';
import { VehicleList } from './components/VehicleList';
import { UserVehiclesView } from './components/UserVehiclesView';
import { FilterPanel } from './components/FilterPanel';
import ErrorBoundary from './components/ErrorBoundary';
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

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handleRadiusChange = useCallback((newRadius: number) => {
    setRadius(newRadius);
  }, []);

  const handleStatusFilterChange = useCallback((newStatusFilter: string[]) => {
    setStatusFilter(newStatusFilter);
  }, []);

  return (
    <div className="App">
      <div className="container-fluid p-4">
        <header className="bg-primary text-white p-3 rounded mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">🚗 Vehicle Rental System</h1>
              <p className="mb-0 text-light">Find available vehicles near you</p>
            </div>
            <div>
              <AuthButton
                className="btn btn-outline-light"
              />
            </div>
          </div>
        </header>

        {/* Location Error */}
        {locationError && (
          <div className="alert alert-warning" role="alert" aria-live="polite">
            ⚠️ Location Error: {locationError}
          </div>
        )}

        {/* Vehicles Error */}
        {vehiclesError && (
          <div className="alert alert-danger" role="alert" aria-live="polite">
            ⚠️ Vehicles Error: {vehiclesError}
          </div>
        )}

        {/* Control Panel */}
        <FilterPanel
          radius={radius}
          onRadiusChange={handleRadiusChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          onRefresh={handleRefresh}
          onGetLocation={getCurrentLocation}
          loading={locationLoading || vehiclesLoading}
          isAutoRefreshEnabled={isAutoRefreshEnabled}
          onToggleAutoRefresh={toggleAutoRefresh}
        />

        {/* View Toggle */}
        <div className="btn-group mb-4 w-100" role="tablist" aria-label="View modes">
          <button
            onClick={() => handleViewModeChange('map')}
            className={`btn ${
              viewMode === 'map' ? 'btn-primary' : 'btn-outline-primary'
            }`}
            role="tab"
            aria-selected={viewMode === 'map'}
            aria-controls="main-content"
          >
            🗺️ Map View
          </button>
          <button
            onClick={() => handleViewModeChange('list')}
            className={`btn ${
              viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'
            }`}
            role="tab"
            aria-selected={viewMode === 'list'}
            aria-controls="main-content"
          >
            📋 List View
          </button>
          {permissions.canViewOwnVehicles && (
            <button
              onClick={() => handleViewModeChange('myVehicles')}
              className={`btn ${
                viewMode === 'myVehicles' ? 'btn-success' : 'btn-outline-success'
              }`}
              role="tab"
              aria-selected={viewMode === 'myVehicles'}
              aria-controls="main-content"
            >
              🚗 My Vehicles
            </button>
          )}
        </div>

        {/* Content */}
        <main id="main-content" role="main">
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
        </main>

        {/* Status Info */}
        {viewMode !== 'myVehicles' && (
          <div className="alert alert-info mt-3" role="status" aria-live="polite">
            {location ? (
              <span>
                📍 Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)} |
                🚗 Found {filteredVehicles.length} vehicles within {radius} km
                {isAutoRefreshEnabled && (
                  <span className="badge bg-success ms-2">
                    🔄 Auto-refresh enabled (30s)
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
          <div className="alert alert-secondary mt-3" role="banner">
            👤 Signed in as <strong>{user?.name}</strong> | Access Level: <span className="badge bg-primary">{permissions.canUpdateVehicleStatus ? 'Technician' : 'User'}</span>
            {permissions.canUpdateVehicleStatus && (
              <span className="badge bg-warning text-dark ms-2">
                🔧 Can manage maintenance & service status
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
