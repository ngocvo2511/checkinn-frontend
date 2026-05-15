const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserDetailResponse {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export type UserPageResponse = PagedResponse<UserResponse>;

export const userApi = {
  // Get users list page
  getUsers: async (token: string, page = 0, size = 10): Promise<UserPageResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/admin/users?page=${page}&size=${size}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get user detail by ID
  getUserDetail: async (token: string, userId: string): Promise<UserDetailResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/admin/users/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user detail:', error);
      throw error;
    }
  },

  // Lock user account
  lockAccount: async (token: string, userId: string): Promise<{ message: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/admin/users/${userId}/lock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error locking account:', error);
      throw error;
    }
  },

  // Unlock user account
  unlockAccount: async (token: string, userId: string): Promise<{ message: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/admin/users/${userId}/unlock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error unlocking account:', error);
      throw error;
    }
  },
};
