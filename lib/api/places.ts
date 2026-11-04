import { NearbyPlace, PlaceCategoryFilter } from '@/types/place';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export interface GetNearbyPlacesParams {
  latitude?: number | null;
  longitude?: number | null;
  category?: PlaceCategoryFilter;
  radiusKm?: number;
  limit?: number;
}

export const placesApi = {
  /**
   * Fetches nearby places strictly calculated by road/spatial metrics from the given coordinates.
   * If coordinates are missing or no places exist within radiusKm, returns an empty list [].
   * NEVER falls back to city-wide or province-wide listings.
   */
  getNearbyPlaces: async ({
    latitude,
    longitude,
    category = 'ALL',
    radiusKm = 10,
    limit = 12,
  }: GetNearbyPlacesParams): Promise<NearbyPlace[]> => {
    if (
      latitude == null ||
      longitude == null ||
      isNaN(Number(latitude)) ||
      isNaN(Number(longitude)) ||
      (Number(latitude) === 0 && Number(longitude) === 0)
    ) {
      console.warn('[NEARBY_PLACES] No valid coordinates provided. Returning empty list without fallback.');
      return [];
    }

    const params = new URLSearchParams();
    if (category && category !== 'ALL') {
      params.append('category', category);
    }
    params.append('limit', limit.toString());
    params.append('latitude', latitude.toString());
    params.append('longitude', longitude.toString());
    params.append('radiusKm', radiusKm.toString());

    const endpointPath = `/places/nearby?${params.toString()}`;

    // Route via API Gateway: /api/places/... -> rewrites to /places/... on place-service
    const gatewayUrl = `${API_BASE_URL}/api${endpointPath}`;
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

  getPlacesByCityId: async (
    cityId: string,
    category: PlaceCategoryFilter = 'ALL',
    limit: number = 20
  ): Promise<NearbyPlace[]> => {
    if (!cityId) return [];
    const params = new URLSearchParams();
    if (category && category !== 'ALL') {
      params.append('category', category);
    }
    params.append('limit', limit.toString());

    const endpointPath = `/places/by-city/${cityId}?${params.toString()}`;
    const gatewayUrl = `${API_BASE_URL}/api${endpointPath}`;

    try {
      const res = await fetch(gatewayUrl, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      return res.ok ? await res.json() : [];
    } catch (err) {
      console.warn('[PLACES_BY_CITY] Failed to fetch places:', err);
      return [];
    }
  },

  getPlacesByProvince: async (
    provinceName: string,
    category: PlaceCategoryFilter = 'ALL',
    limit: number = 20
  ): Promise<NearbyPlace[]> => {
    if (!provinceName) return [];
    const params = new URLSearchParams();
    params.append('provinceName', provinceName);
    if (category && category !== 'ALL') {
      params.append('category', category);
    }
    params.append('limit', limit.toString());

    const endpointPath = `/places/by-province?${params.toString()}`;
    const gatewayUrl = `${API_BASE_URL}/api${endpointPath}`;

    try {
      const res = await fetch(gatewayUrl, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      return res.ok ? await res.json() : [];
    } catch (err) {
      console.warn('[PLACES_BY_PROVINCE] Failed to fetch places:', err);
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
