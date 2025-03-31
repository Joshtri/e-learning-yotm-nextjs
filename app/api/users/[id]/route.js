import { NextResponse } from 'next/server';
import { getAuthUser, createApiResponse } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcryptjs from 'bcryptjs'; // Changed from bcrypt to bcryptjs

// GET user by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Check authentication
    const { user, error, status } = await getAuthUser(request);
    
    if (error) {
      return createApiResponse(null, error, status);
    }
    
    // Check authorization (admin can see any user, others can only see themselves)
    if (user.role !== 'ADMIN' && user.id !== id) {
      return createApiResponse(null, 'FORBIDDEN', 403);
    }
    
    // Get user data
    const userData = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        userActivated: true,
        createdAt: true,
        updatedAt: true,
        // Include relations based on role
        student: user.role === 'STUDENT' || user.role === 'ADMIN' ? true : undefined,
        tutor: user.role === 'TUTOR' || user.role === 'ADMIN' ? true : undefined
      }
    });
    
    if (!userData) {
      return createApiResponse(null, 'User not found', 404);
    }
    
    return createApiResponse(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    return createApiResponse(null, 'Failed to fetch user', 500);
  }
}

// PATCH - Update user
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    
    // Check authentication
    const { user, error, status } = await getAuthUser(request);
    
    if (error) {
      return createApiResponse(null, error, status);
    }
    
    // Check authorization (admin can update any user, others can only update themselves)
    if (user.role !== 'ADMIN' && user.id !== id) {
      return createApiResponse(null, 'FORBIDDEN', 403);
    }
    
    // Parse request body
    const body = await request.json();
    const { name, email, password, role, userActivated } = body;
    
    // Build update data
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    
    // Hash password if provided, using bcryptjs
    if (password) {
      const salt = await bcryptjs.genSalt(10);
      updateData.password = await bcryptjs.hash(password, salt);
    }
    
    // Only admin can change role and status
    if (user.role === 'ADMIN') {
      if (role) updateData.role = role;
      if (userActivated) updateData.userActivated = userActivated;
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        userActivated: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return createApiResponse(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    
    // Handle unique constraint error
    if (error.code === 'P2002') {
      return createApiResponse(null, 'Email already in use', 409);
    }
    
    return createApiResponse(null, 'Failed to update user', 500);
  }
}

// DELETE - Delete user
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Only admin can delete users
    const { user, error, status } = await getAuthUser(request, ['ADMIN']);
    
    if (error) {
      return createApiResponse(null, error, status);
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!existingUser) {
      return createApiResponse(null, 'User not found', 404);
    }
    
    // Delete related records first (considering the relations)
    if (existingUser.role === 'STUDENT') {
      await prisma.student.delete({
        where: { userId: id }
      });
    } else if (existingUser.role === 'TUTOR') {
      await prisma.tutor.delete({
        where: { userId: id }
      });
    }
    
    // Delete user
    await prisma.user.delete({
      where: { id }
    });
    
    return createApiResponse({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return createApiResponse(null, 'Failed to delete user', 500);
  }
}