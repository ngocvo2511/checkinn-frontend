'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface HotelLocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  hotelName?: string;
  street?: string;
  city?: string;
  country?: string;
  height?: string;
  className?: string;
}

export default function HotelLocationMapInner({
  latitude,
  longitude,
  hotelName,
  street,
  city,
  country,
  height = '320px',
  className = '',
}: HotelLocationMapProps) {
  const hasCoordinates =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    (latitude !== 0 || longitude !== 0);

  const center: [number, number] = useMemo(() => {
    if (hasCoordinates) return [latitude!, longitude!];
    return [16.0544, 108.2022];
  }, [hasCoordinates, latitude, longitude]);

  if (!hasCoordinates) {
    return (
      <div
        className={`rounded-xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center p-6 text-gray-500 gap-2 ${className}`}
        style={{ height }}
      >
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <p className="text-sm font-medium">Chưa có dữ liệu tọa độ bản đồ cho khách sạn này</p>
      </div>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <div className={`relative rounded-xl overflow-hidden border border-[#E8E9F1] shadow-inner ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center} icon={customIcon}>
          <Popup>
            <div className="p-1 space-y-1">
              {hotelName && <p className="font-bold text-gray-900 text-sm">{hotelName}</p>}
              {(street || city) && (
                <p className="text-xs text-gray-600">
                  {[street, city, country].filter(Boolean).join(', ')}
                </p>
              )}
              <div className="pt-1 text-[11px] font-mono text-blue-700">
                {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Quick link to Google Maps for admin verification */}
      <div className="absolute bottom-2.5 right-2.5 z-[400]">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-xs border border-gray-200 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition"
        >
          <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Mở Google Maps
        </a>
      </div>
    </div>
  );
}
