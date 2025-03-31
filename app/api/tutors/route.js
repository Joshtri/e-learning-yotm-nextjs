import { NextResponse } from 'next/server';
import { getAuthUser, createApiResponse } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET all tutors (with pagination and filtering)
export async function GET(request) {
  try {
    // Check authentication - all authenticated users can view tutor list
    const { user, error, status } = await getAuthUser(request);
    
    if (error) {
      return createApiResponse(null, error, status);
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const subjectId = searchParams.get('subjectId');
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build base filter
    let filter = {};
    
    // Add search filter
    if (search) {
      filter = {
        OR: [
          { 
            user: { 
              name: { contains: search, mode: 'insensitive' } 
            } 
          },
          { 
            user: { 
              email: { contains: search, mode: 'insensitive' } 
            } 
          },
          { telepon: { contains: search, mode: 'insensitive' } },
          { bio: { contains: search, mode: 'insensitive' } },
          { pendidikan: { contains: search, mode: 'insensitive' } },
          { pengalaman: { contains: search, mode: 'insensitive' } }
        ]
      };
    }
    
    // If filtering by subject
    if (subjectId) {
      filter = {
        ...filter,
        classSubjectTutors: {
          some: {
            classSubject: {
              subjectId
            }
          }
        }
      };
    }
    
    // Execute query with count
    const [tutors, total] = await Promise.all([
      prisma.tutor.findMany({
        where: filter,
        select: {
          id: true,
          bio: true,
          pendidikan: true,
          pengalaman: true,
          telepon: true,
          fotoUrl: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              classSubjectTutors: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.tutor.count({ where: filter })
    ]);
    
    // Format the response
    const formattedTutors = tutors.map(tutor => ({
      id: tutor.id,
      user: tutor.user,
      bio: tutor.bio,
      pendidikan: tutor.pendidikan,
      pengalaman: tutor.pengalaman,
      telepon: tutor.telepon,
      fotoUrl: tutor.fotoUrl,
      assignedSubjectsCount: tutor._count.classSubjectTutors,
      createdAt: tutor.createdAt,
      updatedAt: tutor.updatedAt
    }));
    
    // Return paginated result
    return createApiResponse({
      tutors: formattedTutors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tutors:', error);
    return createApiResponse(null, 'Failed to fetch tutors', 500);
  }
}