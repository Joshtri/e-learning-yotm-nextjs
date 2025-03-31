import { NextResponse } from 'next/server';
import { getAuthUser, createApiResponse } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET all programs (with pagination and filtering)
export async function GET(request) {
  try {
    // Check authentication (anyone who is authenticated can view programs)
    const { user, error, status } = await getAuthUser(request);
    
    if (error) {
      return createApiResponse(null, error, status);
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    if (search) {
      filter.namaPaket = {
        contains: search,
        mode: 'insensitive'
      };
    }
    
    // Execute query with count
    const [programs, total] = await Promise.all([
      prisma.program.findMany({
        where: filter,
        include: {
          _count: {
            select: {
              classes: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { namaPaket: 'asc' }
      }),
      prisma.program.count({ where: filter })
    ]);
    
    // Format the response
    const formattedPrograms = programs.map(program => ({
      id: program.id,
      namaPaket: program.namaPaket,
      classCount: program._count.classes
    }));
    
    // Return paginated result
    return createApiResponse({
      programs: formattedPrograms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching programs:', error);
    return createApiResponse(null, 'Failed to fetch programs', 500);
  }
}

// POST - Create a new program
export async function POST(request) {
  try {
    // Only admin can create programs
    const { user, error, status } = await getAuthUser(request, ['ADMIN']);
    
    if (error) {
      return createApiResponse(null, error, status);
    }
    
    // Parse request body
    const body = await request.json();
    const { namaPaket } = body;
    
    // Validate required fields
    if (!namaPaket) {
      return createApiResponse(null, 'Program name is required', 400);
    }
    
    // Check if program with the same name already exists
    const existingProgram = await prisma.program.findUnique({
      where: { namaPaket }
    });
    
    if (existingProgram) {
      return createApiResponse(null, 'Program with this name already exists', 409);
    }
    
    // Create program
    const newProgram = await prisma.program.create({
      data: {
        namaPaket
      }
    });
    
    return createApiResponse(newProgram, null, 201);
  } catch (error) {
    console.error('Error creating program:', error);
    
    // Handle unique constraint error
    if (error.code === 'P2002') {
      return createApiResponse(null, 'Program with this name already exists', 409);
    }
    
    return createApiResponse(null, 'Failed to create program', 500);
  }
}