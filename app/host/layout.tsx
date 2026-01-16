'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

export default function HostLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isLoading, isAuthenticated, hasAccess } = useProtectedRoute('OWNER');

  useEffect(() => {
    if (isLoading) return;

    // If not authenticated and on a sub-page (not /host), redirect to login
    if (!isAuthenticated) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/host') {
        router.push('/host');
      }
      return;
    }

    // If authenticated but no access, redirect to home
    if (!hasAccess) {
      router.push('/');
      return;
    }

    // If on /host (login page) and authenticated with correct role, redirect to dashboard
    if (typeof window !== 'undefined' && window.location.pathname === '/host' && hasAccess) {
      router.push('/host/dashboard');
    }
  }, [isLoading, isAuthenticated, hasAccess, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-[#656F81]">Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  // If not authenticated, show the page (login form) on /host
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // Show nothing if user doesn't have access (will redirect in useEffect)
  if (isAuthenticated && !hasAccess) {
    return null;
  }

  // Show the page if user is authenticated and has access
  return <>{children}</>;
}
