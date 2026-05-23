const API_ROOT = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const API_BASE_URL = `${API_ROOT}/api/auth`;

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  fullName: string;
  role: string;
  emailVerified?: boolean;
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
        throw new Error(json.message || json.error || 'Đăng ký thất bại');
      } catch (err) {
        if (err instanceof Error && err.message !== text) {
          throw err;
        }
        throw new Error(text || 'Đăng ký thất bại');
      }
    }

    return response.json();
  },

  registerOwner: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/register-owner`, {
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
        throw new Error(json.message || json.error || 'Đăng ký thất bại');
      } catch (err) {
        if (err instanceof Error && err.message !== text) {
          throw err;
        }
        throw new Error(text || 'Đăng ký thất bại');
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
        throw new Error(text || 'Đăng nhập thất bại');
      }
    }

    return response.json();
  },

  changePassword: async (currentPassword: string, newPassword: string, token: string): Promise<void> => {
      const response = await fetch(`${API_ROOT}/api/user/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Không thể đổi mật khẩu' }));
      throw new Error(errorData.message || 'Không thể đổi mật khẩu');
    }
  },

  verifyOtp: async (email: string, otpCode: string): Promise<{ verified: boolean; message: string; email: string }> => {
    const response = await fetch(`${API_BASE_URL}/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otpCode }),
    });

    if (!response.ok) {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        throw new Error(json.message || json.error || 'Xác thực OTP thất bại');
      } catch (err) {
        if (err instanceof Error && err.message !== text) {
          throw err;
        }
        throw new Error(text || 'Xác thực OTP thất bại');
      }
    }

    return response.json();
  },

  resendOtp: async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/otp/resend?email=${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        throw new Error(json.message || json.error || 'Không thể gửi lại OTP');
      } catch (err) {
        if (err instanceof Error && err.message !== text) {
          throw err;
        }
        throw new Error(text || 'Không thể gửi lại OTP');
      }
    }

    return response.json();
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/forgot-password?email=${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        throw new Error(json.message || json.error || 'Không thể gửi yêu cầu đặt lại mật khẩu');
      } catch (err) {
        if (err instanceof Error && err.message !== text) {
          throw err;
        }
        throw new Error(text || 'Không thể gửi yêu cầu đặt lại mật khẩu');
      }
    }

    return response.json();
  },

  resetPassword: async (email: string, otpCode: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otpCode, newPassword }),
    });

    if (!response.ok) {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        throw new Error(json.message || json.error || 'Không thể đặt lại mật khẩu');
      } catch (err) {
        if (err instanceof Error && err.message !== text) {
          throw err;
        }
        throw new Error(text || 'Không thể đặt lại mật khẩu');
      }
    }

    return response.json();
  },
};
