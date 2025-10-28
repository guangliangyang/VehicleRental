import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

// Request deduplication cache
const requestCache = new Map<string, Promise<VehicleSummaryDto[]>>();
const CACHE_TTL = 10000; // 10 seconds
const cacheTimestamps = new Map<string, number>();

// Create a cache key based on location and radius
const createCacheKey = (location: UserLocation, radius: number): string => {
  return `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}-${radius}`;
};

// Check if cache entry is still valid
const isCacheValid = (key: string): boolean => {
  const timestamp = cacheTimestamps.get(key);
  return timestamp ? Date.now() - timestamp < CACHE_TTL : false;
};

// Clear expired cache entries
const clearExpiredCache = (): void => {
  const now = Date.now();
  cacheTimestamps.forEach((timestamp, key) => {
    if (now - timestamp >= CACHE_TTL) {
      requestCache.delete(key);
      cacheTimestamps.delete(key);
    }
  });
};

export const useVehicles = (
  userLocation: UserLocation | null,
  radius: number = 5,
  autoRefreshInterval: number = 30000
): UseVehiclesResult => {
  const [vehicles, setVehicles] = useState<VehicleSummaryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState<boolean>(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchRef = useRef<{ location: UserLocation | null; radius: number } | null>(null);
  const loadingRef = useRef<boolean>(false);

  // Memoize cache key to prevent unnecessary recalculations
  const cacheKey = useMemo(() => {
    if (!userLocation) return null;
    return createCacheKey(userLocation, radius);
  }, [userLocation, radius]);

  // Enhanced fetch function with deduplication and caching
  const fetchVehicles = useCallback(async (forceRefresh = false) => {
    if (!userLocation || !cacheKey) return;

    // Clean up any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Check if we're already fetching the same data
    const isDuplicateRequest =
      lastFetchRef.current &&
      lastFetchRef.current.location?.latitude === userLocation.latitude &&
      lastFetchRef.current.location?.longitude === userLocation.longitude &&
      lastFetchRef.current.radius === radius &&
      !forceRefresh;

    if (isDuplicateRequest && loadingRef.current) {
      return; // Skip duplicate request
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh && isCacheValid(cacheKey) && requestCache.has(cacheKey)) {
      try {
        const cachedPromise = requestCache.get(cacheKey)!;
        const cachedData = await cachedPromise;

        if (!abortController.signal.aborted) {
          setVehicles(cachedData);
          setError(null);
        }
        return;
      } catch (err) {
        // If cached request failed, continue with new request
        requestCache.delete(cacheKey);
        cacheTimestamps.delete(cacheKey);
      }
    }

    // Clear expired cache entries periodically
    clearExpiredCache();

    // Update last fetch reference
    lastFetchRef.current = { location: userLocation, radius };

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Create the API request promise
      const apiRequest = VehicleService.getNearbyVehicles({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radius,
      });

      // Cache the promise to deduplicate concurrent requests
      requestCache.set(cacheKey, apiRequest);
      cacheTimestamps.set(cacheKey, Date.now());

      const nearbyVehicles = await apiRequest;

      // Only update state if the request wasn't aborted
      if (!abortController.signal.aborted) {
        setVehicles(nearbyVehicles);
        setError(null);
      }
    } catch (err) {
      // Remove failed request from cache
      requestCache.delete(cacheKey);
      cacheTimestamps.delete(cacheKey);

      if (!abortController.signal.aborted) {
        loadingRef.current = false;
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch vehicles';
        setError(errorMessage);
        console.error('Failed to fetch vehicles:', err);
      }
    } finally {
      if (!abortController.signal.aborted) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [userLocation, radius, cacheKey]);

  // Memoized refresh function
  const refresh = useCallback(() => {
    fetchVehicles(true); // Force refresh bypasses cache
  }, [fetchVehicles]);

  // Memoized toggle function
  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled(prev => !prev);
  }, []);

  // Set up periodic refresh with cleanup
  useEffect(() => {
    if (isAutoRefreshEnabled && userLocation) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Set up new interval
      intervalRef.current = setInterval(() => {
        fetchVehicles(false); // Auto-refresh can use cache
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
    fetchVehicles(false);
  }, [fetchVehicles]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Abort any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Clear location-specific cache when component unmounts or location changes dramatically
  useEffect(() => {
    return () => {
      if (cacheKey) {
        // Keep cache for a short time for potential reuse
        setTimeout(() => {
          requestCache.delete(cacheKey);
          cacheTimestamps.delete(cacheKey);
        }, 5000);
      }
    };
  }, [cacheKey]);

  return {
    vehicles,
    loading,
    error,
    refresh,
    isAutoRefreshEnabled,
    toggleAutoRefresh
  };
};