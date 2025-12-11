const API_BASE_URL = 'http://localhost:8080/api/auth';

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  fullName: string;
  role: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface LoginData {
  usernameOrEmail: string;
  password: string;
}

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        throw new Error(json.message || json.error || 'Registration failed');
      } catch (err) {
        if (err instanceof Error && err.message !== text) {
          throw err;
        }
        throw new Error(text || 'Registration failed');
      }
    }

    return response.json();
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        // Lấy message từ JSON error response
        const errorMsg = json.message || json.error || text;
        throw new Error(errorMsg);
      } catch (err) {
        if (err instanceof Error && err.message !== text) {
          throw err;
        }
        throw new Error(text || 'Login failed');
      }
    }

    return response.json();
  },
};
