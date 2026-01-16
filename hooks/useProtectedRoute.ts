import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

export function useProtectedRoute(requiredRoles: string | string[]) {
  const router = useRouter();
  const { user, isLoading, hasRole } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // If not authenticated, don't redirect (let the page show login form)
    if (!user) {
      return;
    }

    // If user doesn't have required role, redirect to home
    if (!hasRole(requiredRoles)) {
      router.push('/');
      return;
    }
  }, [user, isLoading, hasRole, requiredRoles, router]);

  return { isLoading, isAuthenticated: !!user, hasAccess: !isLoading && user && hasRole(requiredRoles) };
}
