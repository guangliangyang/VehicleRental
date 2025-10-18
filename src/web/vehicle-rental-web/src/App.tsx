import React, { useState, useMemo } from 'react';
import './App.css';
import { MapView } from './components/MapView';
import { VehicleList } from './components/VehicleList';
import { FilterPanel } from './components/FilterPanel';
import { useGeolocation } from './hooks/useGeolocation';
import { useVehicles } from './hooks/useVehicles';

function App() {
  const [radius, setRadius] = useState<number>(5);
  const [statusFilter, setStatusFilter] = useState<string[]>(['Available', 'Rented', 'Maintenance','OutOfService']);
  const [showList, setShowList] = useState<boolean>(false);

  const { location, error: locationError, loading: locationLoading, getCurrentLocation } = useGeolocation();
  const {
    vehicles: allVehicles,
    loading: vehiclesLoading,
    error: vehiclesError,
    refresh,
    updateVehicleStatus,
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
        <header style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#333', marginBottom: '8px' }}>🚗 Vehicle Rental System</h1>
          <p style={{ color: '#666', margin: 0 }}>Find available vehicles near you</p>
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
            onClick={() => setShowList(false)}
            style={{
              padding: '8px 16px',
              marginRight: '8px',
              backgroundColor: !showList ? '#007bff' : '#e9ecef',
              color: !showList ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            🗺️ Map View
          </button>
          <button
            onClick={() => setShowList(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: showList ? '#007bff' : '#e9ecef',
              color: showList ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            📋 List View
          </button>
        </div>

        {/* Content */}
        {showList ? (
          <VehicleList
            vehicles={filteredVehicles}
            loading={vehiclesLoading}
            onStatusUpdate={updateVehicleStatus}
          />
        ) : (
          <MapView
            userLocation={location}
            vehicles={filteredVehicles}
            radius={radius}
            onStatusUpdate={updateVehicleStatus}
          />
        )}

        {/* Status Info */}
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
      </div>
    </div>
  );
}

export default App;
