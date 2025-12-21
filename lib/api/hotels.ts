const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export interface HotelAddress {
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface City {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  hotelCount?: number;
  createdAt?: string;
  parentName?: string;
}

export interface MediaAsset {
  id: string;
  url: string;
  type: string;
  isThumbnail?: boolean;
  displayOrder?: number;
}

export interface CapacityDto {
  adults: number;
  children: number;
}

export interface RoomType {
  id: string;
  name: string;
  description?: string;
  maxOccupancy?: number;
  bedType?: string;
  roomSize?: number;
  pricePerNight?: number;
  basePrice?: number;
  availableRooms?: number;
  capacity?: CapacityDto;
  amenities?: string[];
  isActive?: boolean;
  totalRooms?: number;
  mediaAssets?: MediaAsset[];
}

export interface Hotel {
  id: string;
  ownerId: string;
  cityId: string;
  name: string;
  description?: string;
  starRating?: number;
  address: HotelAddress;
  isActive: boolean;
  approvedStatus: string;
  city?: City;
  createdAt: string;
  updatedAt: string;
  roomTypes?: RoomType[];
  mediaAssets?: MediaAsset[];
  lowestPrice?: number;
  starRating?: number;
  description?: string;
  amenities?: string[];
}

export interface SearchHotelsParams {
  cityId?: string;
  cityName?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  minPrice?: number;
  maxPrice?: number;
}

const hotelApi = {
  /**
   * Search hotels by city
   */
  async searchHotelsByCity(cityId: string): Promise<Hotel[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotel/hotels/city/${cityId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to search hotels: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching hotels by city:', error);
      throw error;
    }
  },

  /**
   * Get hotel details by ID
   */
  async getHotelById(hotelId: string): Promise<Hotel> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotel/hotels/${hotelId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get hotel: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting hotel details:', error);
      throw error;
    }
  },

  /**
   * Get hotels by owner (requires authentication)
   */
  async getHotelsByOwner(token: string): Promise<Hotel[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotel/hotels/owner`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get owner hotels: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting owner hotels:', error);
      throw error;
    }
  },

  /**
   * Search hotels with advanced filters
   * Supports both city and province search
   */
  async searchHotels(params: SearchHotelsParams): Promise<Hotel[]> {
    try {
      let cityIds: string[] = [];
      
      if (params.cityId) {
        cityIds.push(params.cityId);
      } else if (params.cityName) {
        // First try to search as location (province or city)
        const locationsResponse = await fetch(
          `${API_BASE_URL}/api/hotel/cities/search/locations?query=${encodeURIComponent(params.cityName)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('[DEBUG] locationResponse status:', locationsResponse.status);

        if (locationsResponse.ok) {
          const locations: Array<{ id: string; type: string; parentName?: string }> = await locationsResponse.json();
          console.log('[DEBUG] locations returned:', locations);
          
          if (locations.length > 0) {
            // If it's a PROVINCE, we need to get all its cities
            const provinceResults = locations.filter(l => l.type === 'PROVINCE');
            const cityResults = locations.filter(l => l.type === 'CITY');

            // Get city IDs from direct city matches
            cityResults.forEach(city => {
              if (!cityIds.includes(city.id)) {
                cityIds.push(city.id);
              }
            });

            // Get all cities for province matches
            if (provinceResults.length > 0) {
              const citiesResponse = await fetch(
                `${API_BASE_URL}/api/hotel/cities`,
                {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (citiesResponse.ok) {
                const allCities: City[] = await citiesResponse.json();
                // Add cities that belong to the matched province
                provinceResults.forEach(province => {
                  const citiesInProvince = allCities.filter(c => c.parentName === province.name);
                  citiesInProvince.forEach(city => {
                    if (!cityIds.includes(city.id)) {
                      cityIds.push(city.id);
                    }
                  });
                });
              }
            }
          }
        }
      }

      if (cityIds.length === 0) {
        console.log('[DEBUG] No cityIds found, returning empty array');
        return [];
      }

      console.log('[DEBUG] cityIds to search:', cityIds);

      // Fetch hotels from all cities
      let allHotels: Hotel[] = [];
      for (const cityId of cityIds) {
        const hotels = await hotelApi.searchHotelsByCity(cityId);
        console.log(`[DEBUG] Hotels from city ${cityId}:`, hotels.length);
        allHotels = allHotels.concat(hotels);
      }

      // Remove duplicates
      allHotels = Array.from(new Map(allHotels.map(h => [h.id, h])).values());

      // Apply client-side filters
      let filteredHotels = allHotels.filter(
        (hotel) => hotel.isActive && hotel.approvedStatus === 'APPROVED'
      );

      // Filter by price if provided
      if (params.minPrice !== undefined || params.maxPrice !== undefined) {
        filteredHotels = filteredHotels.filter((hotel) => {
          // If hotel has no roomTypes, we can't filter by price, so include it
          if (!hotel.roomTypes || hotel.roomTypes.length === 0) return true;
          
          const minRoomPrice = Math.min(
            ...hotel.roomTypes.map((rt) => rt.basePrice ?? rt.pricePerNight ?? 0)
          );

          if (params.minPrice !== undefined && minRoomPrice < params.minPrice) {
            return false;
          }
          if (params.maxPrice !== undefined && minRoomPrice > params.maxPrice) {
            return false;
          }

          return true;
        });
      }

      return filteredHotels;
    } catch (error) {
      console.error('Error searching hotels:', error);
      throw error;
    }
  },
};

export default hotelApi;
