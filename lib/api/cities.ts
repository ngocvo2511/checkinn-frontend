import { readJson, readArray } from './read-request.ts';
const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/cities`;

export interface City {
  id: string;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  parentId?: string | null;
  parentName?: string | null;
  hotelCount?: number | null;
  createdAt?: string | null;
  type?: string;  // "PROVINCE" or "CITY"
}

export const cityApi = {
  // Get all cities
  getAllCities: async (): Promise<City[]> => {
    return readArray<City>(await readJson(API_BASE_URL),
      c => typeof c.id === 'string' && typeof c.name === 'string');
  },

  // Get all locations (provinces + cities)
  getAllLocations: async (): Promise<City[]> => {
    return readArray<City>(await readJson(`${API_BASE_URL}/all-locations`),
      c => typeof c.id === 'string' && typeof c.name === 'string');
  },

  // Search locations (provinces + cities)
  searchLocations: async (query: string): Promise<City[]> => {
    return readArray<City>(await readJson(`${API_BASE_URL}/search/locations?query=${encodeURIComponent(query)}`),
      c => typeof c.id === 'string' && typeof c.name === 'string');
  },

  // Get city by ID
  getCityById: async (cityId: string): Promise<City> => {
    try {
      const response = await fetch(`${API_BASE_URL}/${cityId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch city: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching city:', error);
      throw error;
    }
  },

  // Get city by name
  getCityByName: async (name: string): Promise<City> => {
    try {
      const response = await fetch(`${API_BASE_URL}/search/by-name?name=${encodeURIComponent(name)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch city: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching city by name:', error);
      throw error;
    }
  },

  // Get city by code
  getCityByCode: async (code: string): Promise<City> => {
    try {
      const response = await fetch(`${API_BASE_URL}/search/by-code?code=${encodeURIComponent(code)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch city: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching city by code:', error);
      throw error;
    }
  },
};
