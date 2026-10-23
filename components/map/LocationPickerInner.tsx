'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons in React/Next.js
const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (coords: { latitude: number; longitude: number }) => void;
  zoom?: number;
  height?: string;
  className?: string;
  helperText?: string;
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function MapEventsHandler({ onSelect }: { onSelect: (coords: { latitude: number; longitude: number }) => void }) {
  useMapEvents({
    click(e) {
      onSelect({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });
  return null;
}

export default function LocationPickerInner({
  latitude,
  longitude,
  onChange,
  zoom = 15,
  height = '350px',
  className = '',
  helperText,
}: LocationPickerProps) {
  const hasCoordinates =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    (latitude !== 0 || longitude !== 0);

  // Default to Da Nang center if coordinates not set
  const center: [number, number] = useMemo(() => {
    if (hasCoordinates) {
      return [latitude!, longitude!];
    }
    return [16.0544, 108.2022];
  }, [hasCoordinates, latitude, longitude]);

  const markerRef = useRef<L.Marker | null>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const pos = marker.getLatLng();
          onChange({ latitude: pos.lat, longitude: pos.lng });
        }
      },
    }),
    [onChange]
  );

  return (
    <div className={`relative rounded-xl overflow-hidden border border-[#E8E9F1] shadow-inner ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} zoom={zoom} />
        <MapEventsHandler onSelect={onChange} />
        {hasCoordinates && (
          <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={[latitude!, longitude!]}
            ref={markerRef}
            icon={customIcon}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-semibold text-gray-800">Vị trí đã chọn</p>
                <p className="text-gray-500 font-mono">
                  {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
                </p>
                <p className="text-[11px] text-blue-600 mt-1">Kéo thả để điều chỉnh vị trí</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      {helperText && (
        <div className="absolute bottom-2 left-2 right-2 z-[400] bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-amber-200 text-xs text-amber-900 shadow-sm flex items-center gap-1.5 pointer-events-none">
          <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{helperText}</span>
        </div>
      )}
    </div>
  );
}
