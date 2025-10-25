import { useState, useEffect, useCallback, useRef } from 'react';
import { VehicleSummaryDto, UserLocation } from '../types/vehicle';
import { VehicleService } from '../services/vehicleService';

interface UseVehiclesResult {
  vehicles: VehicleSummaryDto[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
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
    isAutoRefreshEnabled,
    toggleAutoRefresh
  };
};
