import { useState, useEffect, useCallback, useRef } from 'react';
import { VehicleSummaryDto, UserLocation, VehicleStatus, VehicleConcurrencyError } from '../types/vehicle';
import { VehicleService } from '../services/vehicleService';

interface UseVehiclesResult {
  vehicles: VehicleSummaryDto[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  updateVehicleStatus: (vehicleId: string, expectedCurrentStatus: VehicleStatus, newStatus: VehicleStatus) => Promise<void>;
  isAutoRefreshEnabled: boolean;
  toggleAutoRefresh: () => void;
}

export const useVehicles = (userLocation: UserLocation | null, radius: number = 5, autoRefreshInterval: number = 30000): UseVehiclesResult => {
  const [vehicles, setVehicles] = useState<VehicleSummaryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState<boolean>(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchVehicles = useCallback(async () => {
    if (!userLocation) return;

    setLoading(true);
    setError(null);

    try {
      const nearbyVehicles = await VehicleService.getNearbyVehicles({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radius,
      });
      setVehicles(nearbyVehicles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  }, [userLocation, radius]);

  const refresh = useCallback(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const updateVehicleStatus = useCallback(async (vehicleId: string, expectedCurrentStatus: VehicleStatus, newStatus: VehicleStatus) => {
    try {
      setError(null);
      await VehicleService.updateVehicleStatus(vehicleId, expectedCurrentStatus, newStatus);

      // Update the local state immediately for better UX
      setVehicles(prevVehicles =>
        prevVehicles.map(vehicle =>
          vehicle.vehicleId === vehicleId
            ? { ...vehicle, status: newStatus }
            : vehicle
        )
      );

      // Refresh data from server after a short delay to get the latest state
      setTimeout(() => {
        fetchVehicles();
      }, 1000);
    } catch (error) {
      if (error instanceof VehicleConcurrencyError) {
        const { actualCurrentStatus } = error;

        // Handle concurrency conflict: Update local state with actual current status
        setVehicles(prevVehicles =>
          prevVehicles.map(vehicle =>
            vehicle.vehicleId === vehicleId
              ? { ...vehicle, status: actualCurrentStatus }
              : vehicle
          )
        );

        // Re-throw the concurrency error so component can handle it with user-friendly message
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to update vehicle status';
      setError(errorMessage);

      // Re-fetch to ensure we have the correct state
      fetchVehicles();
      throw error; // Re-throw so the component can handle it
    }
  }, [fetchVehicles]);

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled(prev => !prev);
  }, []);

  // Set up periodic refresh
  useEffect(() => {
    if (isAutoRefreshEnabled && userLocation) {
      intervalRef.current = setInterval(() => {
        fetchVehicles();
      }, autoRefreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAutoRefreshEnabled, fetchVehicles, autoRefreshInterval, userLocation]);

  // Fetch vehicles when location or radius changes
  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    vehicles,
    loading,
    error,
    refresh,
    updateVehicleStatus,
    isAutoRefreshEnabled,
    toggleAutoRefresh
  };
};
