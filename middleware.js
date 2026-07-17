import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ============================================================
// © 2025 Joshtri Lenggu — E-Learning YOTM (Tugas Akhir)
// Sistem ini dilindungi hak cipta. Seluruh traffic dipantau.
// Dilarang menyalin, mendistribusikan, atau memodifikasi
// tanpa izin tertulis dari pemilik.
// ============================================================

function logTraffic(request, pathname) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  const ts = new Date().toISOString();
  console.log(`[TRAFFIC] ${ts} | ${ip} | ${pathname} | ${ua.slice(0, 100)}`);
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Catat semua traffic ke console server
  logTraffic(request, pathname);

  // Define route patterns and their required roles
  const routeProtection = [
    { pattern: /^\/admin/, allowedRoles: ['ADMIN'] },
    { pattern: /^\/tutor/, allowedRoles: ['TUTOR'] },
    { pattern: /^\/siswa/, allowedRoles: ['STUDENT'] },
    { pattern: /^\/homeroom/, allowedRoles: ['TUTOR'] }, // Homeroom is a mode of TUTOR
  ];

  // Check if current path needs protection
  const protectedRoute = routeProtection.find(route => route.pattern.test(pathname));

  const copyrightHeaders = {
    'X-Copyright': '© 2025 Joshtri Lenggu — E-Learning YOTM. All rights reserved.',
    'X-Owner': 'Joshtri Lenggu',
    'X-Project': 'E-Learning YOTM — Tugas Akhir',
    'X-Monitored': 'true',
  };

  if (!protectedRoute) {
    const res = NextResponse.next();
    Object.entries(copyrightHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
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
    const res = NextResponse.next();
    Object.entries(copyrightHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;

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
