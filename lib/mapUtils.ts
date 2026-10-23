/**
 * Map coordinate & geocoding utility helpers for Checkinn
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Extracts latitude and longitude from various formats:
 * - Direct "lat, lng" text (e.g., "16.0682, 108.2451")
 * - Google Maps URL with @lat,lng (e.g. ".../@16.0682,108.2451,17z")
 * - Google Maps URL query parameters (?q=lat,lng or ?query=lat,lng or ?ll=lat,lng)
 * - Google Maps protobuf/embed parameters (!3dlat!4dlng)
 */
export function parseGoogleMapsCoordinates(input: string): Coordinates | null {
  if (!input || typeof input !== 'string') return null;
  const decoded = decodeURIComponent(input.trim());

  // 1. Raw coordinates "16.0682, 108.2451" or "16.0682 108.2451"
  const rawMatch = decoded.match(/^(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)$/);
  if (rawMatch) {
    const lat = parseFloat(rawMatch[1]);
    const lng = parseFloat(rawMatch[2]);
    if (isValidLatLng(lat, lng)) return { latitude: lat, longitude: lng };
  }

  // 2. URL with @lat,lng (e.g. /@16.0682000,108.2451000,17z)
  const atMatch = decoded.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (isValidLatLng(lat, lng)) return { latitude: lat, longitude: lng };
  }

  // 3. URL query param: q=lat,lng or query=lat,lng or ll=lat,lng
  const queryMatch = decoded.match(/[?&](?:q|query|ll)=(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)/i);
  if (queryMatch) {
    const lat = parseFloat(queryMatch[1]);
    const lng = parseFloat(queryMatch[2]);
    if (isValidLatLng(lat, lng)) return { latitude: lat, longitude: lng };
  }

  // 4. Google Maps embed / place data: !3d<lat>!4d<lng>
  const embedMatch = decoded.match(/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/);
  if (embedMatch) {
    const lat = parseFloat(embedMatch[1]);
    const lng = parseFloat(embedMatch[2]);
    if (isValidLatLng(lat, lng)) return { latitude: lat, longitude: lng };
  }

  return null;
}

function isValidLatLng(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Forward geocoding query using OpenStreetMap Nominatim.
 */
export async function geocodeAddress(
  street: string,
  cityName: string,
  country = 'Vietnam'
): Promise<Coordinates | null> {
  const parts = [street.trim(), cityName.trim(), country.trim()].filter(Boolean);
  if (!parts.length) return null;

  const q = parts.join(', ');
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;

  try {
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'vi,en',
        'User-Agent': 'Checkinn-Platform/1.0',
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      if (isValidLatLng(lat, lon)) {
        return { latitude: lat, longitude: lon };
      }
    }
    return null;
  } catch (err) {
    console.error('Nominatim geocoding error:', err);
    return null;
  }
}
