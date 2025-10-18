import React from 'react';
import { VehicleStatus } from '../types/vehicle';

interface FilterPanelProps {
  radius: number;
  onRadiusChange: (radius: number) => void;
  statusFilter: string[];
  onStatusFilterChange: (statuses: string[]) => void;
  onRefresh: () => void;
  onGetLocation: () => void;
  loading: boolean;
  isAutoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  radius,
  onRadiusChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  onGetLocation,
  loading,
  isAutoRefreshEnabled,
  onToggleAutoRefresh,
}) => {
  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      onStatusFilterChange([...statusFilter, status]);
    } else {
      onStatusFilterChange(statusFilter.filter(s => s !== status));
    }
  };

  const statusOptions = Object.values(VehicleStatus);

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <h3 style={{ margin: '0 0 16px 0' }}>Vehicle Search Controls</h3>

      {/* Radius Control */}
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="radius" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
          Search Radius: {radius} km
        </label>
        <input
          type="range"
          id="radius"
          min="1"
          max="20"
          value={radius}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
          <span>1 km</span>
          <span>20 km</span>
        </div>
      </div>

      {/* Status Filter */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Vehicle Status Filter:
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {statusOptions.map((status) => (
            <label key={status} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={statusFilter.includes(status)}
                onChange={(e) => handleStatusChange(status, e.target.checked)}
                style={{ marginRight: '4px' }}
              />
              <span style={{ fontSize: '14px' }}>{status}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={onGetLocation}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          📍 Get My Location
        </button>

        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          🔄 Refresh
        </button>

        <button
          onClick={onToggleAutoRefresh}
          style={{
            padding: '8px 16px',
            backgroundColor: isAutoRefreshEnabled ? '#dc3545' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {isAutoRefreshEnabled ? '⏸️ Stop Auto-Refresh' : '▶️ Start Auto-Refresh'}
        </button>
      </div>
    </div>
  );
};