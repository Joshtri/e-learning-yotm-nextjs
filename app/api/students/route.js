import { NextResponse } from 'next/server';
import { getAuthUser, createApiResponse } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET all students (with pagination and filtering)
export async function GET(request) {
  try {
    // Check authentication - only admin and tutors can view all students
    const { user, error, status } = await getAuthUser(request, ['ADMIN', 'TUTOR']);
    
    if (error) {
      return createApiResponse(null, error, status);
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const classId = searchParams.get('classId');
    const gender = searchParams.get('jenisKelamin');
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build filter
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
          { nisn: { contains: search, mode: 'insensitive' } },
          { alamat: { contains: search, mode: 'insensitive' } },
          { tempatLahir: { contains: search, mode: 'insensitive' } }
        ]
      };
    }
    
    // Add class filter
    if (classId) {
      filter.classId = classId;
    }
    
    // Add gender filter
    if (gender) {
      filter.jenisKelamin = gender;
    }
    
    // Execute query with count
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where: filter,
        select: {
          id: true,
          nisn: true,
          jenisKelamin: true,
          tempatLahir: true,
          tanggalLahir: true,
          alamat: true,
          fotoUrl: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
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
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.student.count({ where: filter })
    ]);
    
    // Format the response
    const formattedStudents = students.map(student => ({
      id: student.id,
      user: student.user,
      nisn: student.nisn,
      jenisKelamin: student.jenisKelamin,
      tempatLahir: student.tempatLahir,
      tanggalLahir: student.tanggalLahir,
      alamat: student.alamat,
      fotoUrl: student.fotoUrl,
      class: student.class,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt
    }));
    
    // Return paginated result
    return createApiResponse({
      students: formattedStudents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return createApiResponse(null, 'Failed to fetch students', 500);
  }
}