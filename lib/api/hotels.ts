const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// Helper function to parse double-stringified values from backend
const parseStringValue = (value: any): any => {
  if (value === 'null' || value === 'undefined') return null;
  if (typeof value === 'string') {
    // Keep trying to parse until we get a non-string or a string without quotes
    let parsed = value;
    while (typeof parsed === 'string' && parsed.startsWith('"') && parsed.endsWith('"')) {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        break;
      }
    }
    return parsed;
  }
  return value;
};

// Clean hotel data from backend
const cleanHotelData = (hotel: any): Hotel => {
  return {
    ...hotel,
    name: parseStringValue(hotel.name),
    description: parseStringValue(hotel.description),
    contactEmail: parseStringValue(hotel.contactEmail),
    contactPhone: parseStringValue(hotel.contactPhone),
    city: hotel.city ? {
      ...hotel.city,
      name: parseStringValue(hotel.city.name),
      parentName: parseStringValue(hotel.city.parentName),
    } : undefined,
    policies: hotel.policies?.map((p: any) => ({
      ...p,
      title: parseStringValue(p.title),
      content: parseStringValue(p.content),
    })),
    faqs: hotel.faqs?.map((f: any) => ({
      ...f,
      question: parseStringValue(f.question),
      answer: parseStringValue(f.answer),
    })),
    amenityCategories: hotel.amenityCategories?.map((cat: any) => ({
      ...cat,
      title: parseStringValue(cat.title),
      items: cat.items?.map((item: any) => ({
        ...item,
        title: parseStringValue(item.title),
      })),
    })),
    roomTypes: hotel.roomTypes?.map((rt: any) => ({
      ...rt,
      name: parseStringValue(rt.name),
      description: parseStringValue(rt.description),
      bedType: parseStringValue(rt.bedType),
    })),
  };
};

// Clean room type data from backend
const cleanRoomTypeData = (roomType: any): RoomType => {
  return {
    ...roomType,
    name: parseStringValue(roomType.name),
    description: parseStringValue(roomType.description),
    bedType: parseStringValue(roomType.bedType),
    capacity: roomType.capacity ? {
      ...roomType.capacity,
      bedType: parseStringValue(roomType.capacity.bedType),
    } : undefined,
  };
};

export interface HotelAddress {
  street: string;
  city: string;
  country: string;
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
  sortOrder?: number;
}

export interface CapacityDto {
  adults: number;
  children: number;
  bedType?: string;
  roomSize?: number;
  breakfastIncluded?: boolean;
  breakfastQuantity?: number;
}

export interface PolicyResponse {
  title: string;
  content: string;
}

export interface QuestionResponse {
  question: string;
  answer: string;
}

export interface AmenityItemResponse {
  id: string;
  title: string;
}

export interface AmenityResponse {
  id: string;
  title: string;
  items: AmenityItemResponse[];
}

export interface AmenityCategoryOption {
  type: string;
}

export interface PolicyResponse {
  title: string;
  content: string;
}

export interface AmenityItemResponse {
  id: string;
  title: string;
}

export interface AmenityResponse {
  id: string;
  title: string;
  items: AmenityItemResponse[];
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
  roomAmount?: number;
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
  policies?: PolicyResponse[];
  faqs?: QuestionResponse[];
  amenityCategories?: AmenityResponse[];
  amenities?: AmenityResponse[]; // legacy name for amenityCategories
  contactEmail?: string;
  contactPhone?: string;
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

export const hotelApi = {
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

      const data = await response.json();
      return data.map((hotel: any) => cleanHotelData(hotel));
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

      const data = await response.json();
      return cleanHotelData(data);
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

      const data = await response.json();
      return data.map((hotel: any) => cleanHotelData(hotel));
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

  // Get pending hotels for approval (admin, requires JWT)
  getPendingHotels: async (): Promise<Hotel[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotel/hotels/pending`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pending hotels: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching pending hotels:', error);
      throw error;
    }
  },

  // Get pending hotel detail
  getPendingHotelDetail: async (hotelId: string): Promise<PendingHotelDetail> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotel/hotels/pending/${hotelId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pending hotel detail: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching pending hotel detail:', error);
      throw error;
    }
  },

  // Approve a hotel
  approveHotel: async (hotelId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotel/hotels/${hotelId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to approve hotel: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error approving hotel:', error);
      throw error;
    }
  },

  // Reject a hotel
  rejectHotel: async (hotelId: string, note: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotel/hotels/${hotelId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ approve: false, note }),
      });

      if (!response.ok) {
        throw new Error(`Failed to reject hotel: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error rejecting hotel:', error);
      throw error;
    }
  },

  // Activate a hotel
  activateHotel: async (hotelId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotel/hotels/${hotelId}/activate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to activate hotel: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error activating hotel:', error);
      throw error;
    }
  },

  // Deactivate a hotel
  deactivateHotel: async (hotelId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotel/hotels/${hotelId}/deactivate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to deactivate hotel: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deactivating hotel:', error);
      throw error;
    }
  },

  // Update hotel information
  updateHotel: async (hotelId: string, data: {
    name: string;
    description: string;
    starRating: number;
    cityId: string;
    address: HotelAddress;
    contactEmail?: string;
    contactPhone?: string;
  }): Promise<Hotel> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotel/hotels/${hotelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to update hotel: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return cleanHotelData(result);
    } catch (error) {
      console.error('Error updating hotel:', error);
      throw error;
    }
  },

  // Update hotel amenities
  updateAmenities: async (hotelId: string, amenityCategories: any[]): Promise<Hotel> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotel/hotels/${hotelId}/amenities`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ amenityCategories }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update amenities: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return cleanHotelData(result);
    } catch (error) {
      console.error('Error updating amenities:', error);
      throw error;
    }
  },

  // Get available amenity categories (for selection when editing amenities)
  getAmenityCategories: async (): Promise<AmenityCategoryOption[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotel/hotels/amenities/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch amenity categories: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return (result || []).map((cat: AmenityCategoryOption) => ({
        type: parseStringValue(cat.type),
      })).filter((c: AmenityCategoryOption) => !!c.type);
    } catch (error) {
      console.error('Error fetching amenity categories:', error);
      throw error;
    }
  },

  // Update hotel policies
  updatePolicies: async (hotelId: string, policies: { title: string; content: string }[]): Promise<Hotel> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotel/hotels/${hotelId}/policies`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(policies),
      });

      if (!response.ok) {
        throw new Error(`Failed to update policies: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return cleanHotelData(result);
    } catch (error) {
      console.error('Error updating policies:', error);
      throw error;
    }
  },

  // Update hotel FAQs (questions)
  updateQuestions: async (hotelId: string, faqs: { question: string; answer: string }[]): Promise<Hotel> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotel/hotels/${hotelId}/questions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(faqs),
      });

      if (!response.ok) {
        throw new Error(`Failed to update questions: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return cleanHotelData(result);
    } catch (error) {
      console.error('Error updating questions:', error);
      throw error;
    }
  },

  // Get all cities
  getCities: async (): Promise<City[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotel/cities`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get cities: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error getting cities:', error);
      throw error;
    }
  },

  // Upload media (image) for hotel or room
  uploadMedia: async (targetId: string, targetType: 'HOTEL' | 'ROOM_TYPE', file: File, isThumbnail: boolean = false, sortOrder: number = 0): Promise<MediaAsset> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetId', targetId);
      formData.append('targetType', targetType);
      formData.append('isThumbnail', String(isThumbnail));
      formData.append('sortOrder', String(sortOrder));

      const response = await fetch(`${API_BASE_URL}/api/hotel/medias`, {
        method: 'POST',
        headers: {
          ...authHeaders(),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload media: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return cleanRoomTypeData(result);
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  },

  // Delete media by ID
  deleteMedia: async (mediaId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotel/medias/${mediaId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete media: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      throw error;
    }
  },

  // Set media as thumbnail
  setThumbnail: async (mediaId: string): Promise<MediaAsset> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotel/medias/${mediaId}/thumbnail`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to set thumbnail: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error setting thumbnail:', error);
      throw error;
    }
  },

  // Room Type APIs
  getRoomTypeById: async (roomTypeId: string): Promise<RoomType> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotel/api/v1/${roomTypeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get room type: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return cleanRoomTypeData(data);
    } catch (error) {
      console.error('Error getting room type:', error);
      throw error;
    }
  },

    createRoomType: async (data: {
      hotelId: string;
      name: string;
      basePrice: number;
      capacity: CapacityDto;
      roomAmount: number;
      description?: string;
      amenities?: string[];
    }): Promise<RoomType> => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/hotel/api/v1`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`Failed to create room type: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        return cleanRoomTypeData(result);
      } catch (error) {
        console.error('Error creating room type:', error);
        throw error;
      }
    },

    updateRoomType: async (roomTypeId: string, data: {
      name?: string;
      basePrice?: number;
      capacity?: CapacityDto;
      amenities?: string[];
      isActive?: boolean;
      roomAmount?: number;
      description?: string;
    }): Promise<RoomType> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotel/api/v1/${roomTypeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to update room type: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return cleanRoomTypeData(data);
    } catch (error) {
      console.error('Error updating room type:', error);
      throw error;
    }
  },

  activateRoomType: async (roomTypeId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotel/api/v1/${roomTypeId}/activate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to activate room type: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error activating room type:', error);
      throw error;
    }
  },

  deactivateRoomType: async (roomTypeId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotel/api/v1/${roomTypeId}/deactivate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to deactivate room type: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deactivating room type:', error);
      throw error;
    }
  },
};

const authHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default hotelApi;

export interface Address {
  street: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface PendingHotel {
  id: string;
  name: string;
  description: string;
  starRating?: number;
  address: Address;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
  approvedStatus: string;
  owner: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
}

export interface PendingHotelDetail {
  id: string;
  name: string;
  description: string;
  starRating?: number;
  address: Address;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
  approvedStatus: string;
  owner: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
  businessLicenseNumber?: string;
  taxId?: string;
  operationLicenseNumber?: string;
  ownerIdentityNumber?: string;
  policies?: any[]; // Define properly if needed
  amenityCategories?: any[];
  mediaAssets?: any[];
}