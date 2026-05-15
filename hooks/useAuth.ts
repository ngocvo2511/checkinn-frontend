import { useState, useEffect, useCallback } from 'react';
import { signOut, useSession } from 'next-auth/react';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!session?.user) return;

    const sessionUser = {
      email: session.user.email,
      fullName: session.user.name,
      avatar: session.user.image,
      role: 'customer',
      accessToken: session.accessToken,
      provider: session.provider,
    };

    setUser(sessionUser);
    localStorage.setItem("user", JSON.stringify(sessionUser));
    if (session.accessToken) {
      localStorage.setItem("token", session.accessToken);
    }
  }, [session]);

  const login = useCallback((userData: any) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userData.token || userData.accessToken);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (session) {
      await signOut({ redirect: false });
    }
  }, [session]);

  const updateUser = useCallback((userData: any): void => {
    setUser((prev: any | null) => {
      if (!prev) return null;
      const updated = { ...prev, ...userData };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const hasRole = useCallback((role: string | string[]): boolean => {
    if (!user) return false;
    const userRole = user.role;
    if (Array.isArray(role)) {
      return role.includes(userRole);
    }
    return userRole === role;
  }, [user]);

  return {
    user,
    isLoading,
    login,
    logout,
    updateUser,
    hasRole,
    isAuthenticated: !!user,
  };
}
