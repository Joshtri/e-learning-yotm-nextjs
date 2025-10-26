import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Define route patterns and their required roles
  const routeProtection = [
    { pattern: /^\/admin/, allowedRoles: ['ADMIN'] },
    { pattern: /^\/tutor/, allowedRoles: ['TUTOR'] },
    { pattern: /^\/siswa/, allowedRoles: ['STUDENT'] },
    { pattern: /^\/homeroom/, allowedRoles: ['TUTOR'] }, // Homeroom is a mode of TUTOR
  ];

  // Check if current path needs protection
  const protectedRoute = routeProtection.find(route => route.pattern.test(pathname));

  if (!protectedRoute) {
    // Path tidak perlu protection, allow access
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // No token, redirect to login
    const loginUrl = new URL('/', request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify token using jose (Edge Runtime compatible)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Check if user role is allowed for this route
    if (!protectedRoute.allowedRoles.includes(payload.role)) {
      // Role tidak sesuai, redirect ke dashboard sesuai role mereka
      const redirectMap = {
        ADMIN: '/admin/dashboard',
        TUTOR: '/tutor/dashboard',
        STUDENT: '/siswa/dashboard',
      };

      const correctDashboard = redirectMap[payload.role] || '/';
      const redirectUrl = new URL(correctDashboard, request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Token valid dan role sesuai, allow access
    return NextResponse.next();

  } catch (error) {
    // Token expired atau invalid, redirect to login
    const loginUrl = new URL('/', request.url);
    const response = NextResponse.redirect(loginUrl);

    // Clear the invalid token
    response.cookies.delete('auth_token');

    return response;
  }
}

// Configure which paths should trigger the middleware
export const config = {
  matcher: [
    '/admin/:path*',
    '/tutor/:path*',
    '/siswa/:path*',
    '/homeroom/:path*',
  ],
};
