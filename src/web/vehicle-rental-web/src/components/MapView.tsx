import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { VehicleSummaryDto, UserLocation, VehicleStatus } from '../types/vehicle';
import { VehicleMarker } from './VehicleMarker';

interface MapViewProps {
  userLocation: UserLocation | null;
  vehicles: VehicleSummaryDto[];
  radius: number;
  onStatusUpdate?: (vehicleId: string, expectedCurrentStatus: VehicleStatus, newStatus: VehicleStatus) => Promise<void>;
  onRefresh?: () => void;
}

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom user location icon
const userIcon = L.divIcon({
  className: 'user-location-icon',
  html: `
    <div style="
      background-color: #007bff;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      position: relative;
    ">
      <div style="
        position: absolute;
        top: -8px;
        left: -8px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: rgba(0, 123, 255, 0.2);
        animation: pulse 2s infinite;
      "></div>
    </div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});


export const MapView: React.FC<MapViewProps> = ({ userLocation, vehicles, radius, onStatusUpdate, onRefresh }) => {
  const mapRef = useRef<L.Map>(null);

  // Center map on user location when it changes
  useEffect(() => {
    if (mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.latitude, userLocation.longitude], 13);
    }
  }, [userLocation]);

  // Default center (if no user location)
  const defaultCenter: [number, number] = [40.7128, -74.0060]; // New York City

  const center: [number, number] = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : defaultCenter;

  return (
    <div style={{ height: '500px', width: '100%' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location marker and radius circle */}
        {userLocation && (
          <>
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={userIcon}
            />
            <Circle
              center={[userLocation.latitude, userLocation.longitude]}
              radius={radius * 1000} // Convert km to meters
              pathOptions={{
                fillColor: '#007bff',
                fillOpacity: 0.1,
                color: '#007bff',
                weight: 2,
                opacity: 0.6,
              }}
            />
          </>
        )}

        {/* Vehicle markers */}
        {vehicles.map((vehicle) => (
          <VehicleMarker
            key={vehicle.vehicleId}
            vehicle={vehicle}
            onStatusUpdate={onStatusUpdate}
            onRefresh={onRefresh}
          />
        ))}
      </MapContainer>

      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 0.6;
            }
            50% {
              transform: scale(1.2);
              opacity: 0.3;
            }
            100% {
              transform: scale(1.4);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
};