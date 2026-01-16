import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Routes that require authentication
  const protectedRoutes = ['/host', '/admin'];

  // Check if path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // If not a protected route, allow access
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // For protected routes, allow the request to proceed
  // Client-side useProtectedRoute hook will handle authentication and role checking
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/host/:path*',
    '/admin/:path*',
  ],
};
