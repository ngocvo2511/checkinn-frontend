import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Middleware for Next.js routing
  // Note: Role-based access control is handled client-side via CustomerOnlyRoute component
  // because tokens are stored in localStorage, not cookies
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/host/:path*',
    '/admin/:path*',
    '/search/:path*',
    '/hotel/:path*',
    '/booking/:path*',
    '/personal-data/:path*',
  ],
};
