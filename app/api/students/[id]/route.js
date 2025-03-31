import { NextResponse } from 'next/server';
import { getAuthUser, createApiResponse } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET classes for a student
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Check authentication
    const { user, error, status } = await getAuthUser(request);
    
    if (error) {
      return createApiResponse(null, error, status);
    }
    
    // Find the student
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true
          }
        },
        class: {
          include: {
            program: true,
            classSubjects: {
              include: {
                subject: true,
                classSubjectTutors: {
                  include: {
                    tutor: {
                      include: {
                        user: {
                          select: {
                            name: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!student) {
      return createApiResponse(null, 'Student not found', 404);
    }
    
    // Check authorization - only admin, assigned tutors, or the student themselves can view
    if (
      user.role !== 'ADMIN' && 
      user.id !== student.user.id &&
      user.role !== 'TUTOR'
    ) {
      return createApiResponse(null, 'FORBIDDEN', 403);
    }
    
    // Format the response
    const classData = student.class ? {
      id: student.class.id,
      name: student.class.name,
      program: {
        id: student.class.program.id,
        name: student.class.program.namaPaket
      },
      subjects: student.class.classSubjects.map(cs => ({
        id: cs.id,
        name: cs.subject.name,
        description: cs.subject.description,
        tutors: cs.classSubjectTutors.map(cst => ({
          id: cst.tutor.id,
          name: cst.tutor.user.name
        }))
      }))
    } : null;
    
    // Return class data
    return createApiResponse({
      student: {
        id: student.id,
        userId: student.user.id
      },
      class: classData
    });
  } catch (error) {
    console.error('Error fetching student classes:', error);
    return createApiResponse(null, 'Failed to fetch student class details', 500);
  }
}