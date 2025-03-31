import { NextResponse } from 'next/server';
import { createApiResponse } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Clear auth cookie
    const cookieStore = cookies();
    cookieStore.delete('auth_token');
    
    return createApiResponse({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    return createApiResponse(null, 'Logout failed', 500);
  }
}