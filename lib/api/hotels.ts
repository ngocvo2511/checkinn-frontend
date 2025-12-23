const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/hotels`;

const authHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface Address {
  street: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface Hotel {
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

export const hotelApi = {
  // Get pending hotels for approval
  getPendingHotels: async (): Promise<Hotel[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/pending`, {
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
      const response = await fetch(`${API_BASE_URL}/pending/${hotelId}`, {
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
      const response = await fetch(`${API_BASE_URL}/${hotelId}/approve`, {
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
      const response = await fetch(`${API_BASE_URL}/${hotelId}/reject`, {
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
};