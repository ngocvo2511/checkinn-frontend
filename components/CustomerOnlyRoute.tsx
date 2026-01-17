'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface CustomerOnlyRouteProps {
  children: React.ReactNode;
}

export function CustomerOnlyRoute({ children }: CustomerOnlyRouteProps) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const checkRole = () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        // No token, allow access (guest user)
        setIsAllowed(true);
        return;
      }

      try {
        // Decode JWT to get role
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        const role = decodedPayload.role;

        // If admin or owner, redirect to their dashboard
        if (role === 'ADMIN') {
          router.replace('/admin/dashboard');
          setIsAllowed(false);
          return;
        }
        if (role === 'OWNER') {
          router.replace('/host/dashboard');
          setIsAllowed(false);
          return;
        }
        
        // If CUSTOMER or other role, allow access
        setIsAllowed(true);
      } catch (error) {
        // If token decode fails, allow access
        console.error('Failed to decode token:', error);
        setIsAllowed(true);
      }
    };

    checkRole();
  }, [router]);

  // While checking, show nothing
  if (isAllowed === null) {
    return null;
  }

  // If not allowed, show nothing (redirecting)
  if (!isAllowed) {
    return null;
  }

  // If allowed, render children
  return <>{children}</>;
}
