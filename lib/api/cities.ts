const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/api/hotel/cities`;

export interface City {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  parentId?: string | null;
  parentName?: string | null;
  hotelCount?: number | null;
  createdAt: string;
  type?: string;  // "PROVINCE" or "CITY"
}

export const cityApi = {
  // Get all cities
  getAllCities: async (): Promise<City[]> => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch cities: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching cities:', error);
      throw error;
    }
  },

  // Get all locations (provinces + cities)
  getAllLocations: async (): Promise<City[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/all-locations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch locations: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  },

  // Search locations (provinces + cities)
  searchLocations: async (query: string): Promise<City[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/search/locations?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to search locations: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error searching locations:', error);
      throw error;
    }
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
