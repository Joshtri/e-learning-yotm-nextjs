import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function getAuthUser(request, allowedRoles = []) {
  // Get cookie store
  const cookieStore = cookies();
  
  // Get authorization from header or cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const tokenFromCookie = cookieHeader
    .split('; ')
    .find(c => c.startsWith('auth_token='))
    ?.split('=')[1] || cookieStore.get('auth_token')?.value;

  const tokenFromHeader = request.headers
    ?.get('authorization')
    ?.split(' ')[1];

  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    return { 
      error: 'TOKEN_MISSING',
      status: 401
    };
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);

    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      return {
        error: 'FORBIDDEN',
        status: 403
      };
    }

    return { user };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return {
        error: 'TOKEN_EXPIRED',
        status: 401
      };
    }

    return {
      error: 'TOKEN_INVALID',
      status: 401
    };
  }
}

// Helper for consistent API responses
// export function createApiResponse(data = null, error = null, status = 200) {
//   return NextResponse.json(
//     { 
//       success: !error, 
//       data, 
//       error 
//     }, 
//     { status }
//   );
// }