import { NextResponse } from 'next/server';
import { getAuthUser, createApiResponse } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(request) {
  try {
    // Check authentication
    const { user, error, status } = await getAuthUser(request);
    
    if (error) {
      return createApiResponse(null, error, status);
    }
    
    // Get fresh user data from database
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        userActivated: true,
        createdAt: true,
        updatedAt: true,
        // Include role-specific data
        student: user.role === 'STUDENT' ? true : undefined,
        tutor: user.role === 'TUTOR' ? true : undefined
      }
    });
    
    if (!userData) {
      return createApiResponse(null, 'User not found', 404);
    }
    
    return createApiResponse(userData);
  } catch (error) {
    console.error('Error fetching current user:', error);
    return createApiResponse(null, 'Failed to fetch user data', 500);
  }
}