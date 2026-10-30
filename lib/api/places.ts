import { NearbyPlace, PlaceCategoryFilter } from '@/types/place';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export interface GetNearbyPlacesParams {
  latitude?: number | null;
  longitude?: number | null;
  category?: PlaceCategoryFilter;
  radiusKm?: number;
  limit?: number;
  cityId?: string | null;
  provinceName?: string | null;
}

export const placesApi = {
  getNearbyPlaces: async ({
    latitude,
    longitude,
    category = 'ALL',
    radiusKm = 10,
    limit = 12,
    cityId,
    provinceName,
  }: GetNearbyPlacesParams): Promise<NearbyPlace[]> => {
    const params = new URLSearchParams();
    if (category && category !== 'ALL') {
      params.append('category', category);
    }
    params.append('limit', limit.toString());

    let endpointPath = '';

    if (latitude != null && longitude != null && !isNaN(Number(latitude)) && !isNaN(Number(longitude)) && (Number(latitude) !== 0 || Number(longitude) !== 0)) {
      params.append('latitude', latitude.toString());
      params.append('longitude', longitude.toString());
      params.append('radiusKm', radiusKm.toString());
      endpointPath = `/places/nearby?${params.toString()}`;
    } else if (cityId) {
      endpointPath = `/places/by-city/${cityId}?${params.toString()}`;
    } else if (provinceName) {
      params.append('provinceName', provinceName);
      endpointPath = `/places/by-province?${params.toString()}`;
    } else {
      console.warn('[NEARBY_PLACES] No coordinates, cityId, or provinceName provided to fetch places.');
      return [];
    }

    // Route via API Gateway: /api/places/... -> rewrites to /places/... on place-service
    const gatewayUrl = `${API_BASE_URL}/api${endpointPath}`;
    // Fallback direct route or local dev proxy
    const directUrl = `${API_BASE_URL}${endpointPath}`;

    try {
      const res = await fetch(gatewayUrl, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      if (res.ok) {
        return await res.json();
      }

      // Try direct route if gateway returned 404/502
      const fallbackRes = await fetch(directUrl, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      if (fallbackRes.ok) {
        return await fallbackRes.json();
      }

      return [];
    } catch (err) {
      console.warn('[NEARBY_PLACES] Failed to fetch places:', err);
      return [];
    }
  },

  getPlaceById: async (id: string): Promise<NearbyPlace | null> => {
    if (!id) return null;
    const gatewayUrl = `${API_BASE_URL}/api/places/${id}`;
    const directUrl = `${API_BASE_URL}/places/${id}`;

    try {
      const res = await fetch(gatewayUrl, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      if (res.ok) {
        return await res.json();
      }

      const fallbackRes = await fetch(directUrl, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      if (fallbackRes.ok) {
        return await fallbackRes.json();
      }

      return null;
    } catch (err) {
      console.warn(`[PLACE_API] Failed to fetch place ${id}:`, err);
      return null;
    }
  }
};
