import { NextResponse } from 'next/server';
import { getAuthUser, createApiResponse } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET tutor by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Check authentication
    const { user, error, status } = await getAuthUser(request);
    
    if (error) {
      return createApiResponse(null, error, status);
    }
    
    // Find the tutor
    const tutor = await prisma.tutor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            userActivated: true
          }
        },
        classSubjectTutors: {
          select: {
            id: true,
            classSubject: {
              select: {
                id: true,
                class: {
                  select: {
                    id: true,
                    name: true,
                    program: {
                      select: {
                        id: true,
                        namaPaket: true
                      }
                    }
                  }
                },
                subject: {
                  select: {
                    id: true,
                    name: true,
                    description: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!tutor) {
      return createApiResponse(null, 'Tutor not found', 404);
    }
    
    // Check authorization - all authenticated users can see tutor details
    // but detailed information is only for admin and the tutor themselves
    const isSelfOrAdmin = user.role === 'ADMIN' || user.id === tutor.user.id;
    
    // Format tutor assignments
    const assignments = tutor.classSubjectTutors.map(cst => ({
      id: cst.id,
      class: cst.classSubject.class,
      subject: cst.classSubject.subject
    }));
    
    // Format the response based on authorization
    const formattedTutor = {
      id: tutor.id,
      user: tutor.user,
      bio: tutor.bio,
      fotoUrl: tutor.fotoUrl,
      assignments: assignments,
      // Only include private details for self or admin
      pendidikan: isSelfOrAdmin ? tutor.pendidikan : undefined,
      pengalaman: isSelfOrAdmin ? tutor.pengalaman : undefined,
      telepon: isSelfOrAdmin ? tutor.telepon : undefined,
      createdAt: tutor.createdAt,
      updatedAt: tutor.updatedAt
    };
    
    // Return tutor data
    return createApiResponse(formattedTutor);
  } catch (error) {
    console.error('Error fetching tutor:', error);
    return createApiResponse(null, 'Failed to fetch tutor details', 500);
  }
}