import { NextResponse } from 'next/server';
import { createApiResponse } from '@/lib/auth';
import prisma from '@/lib/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, password } = body;
    
    // Validate required fields
    if (!email || !password) {
      return createApiResponse(null, 'Missing email or password', 400);
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        userActivated: true
      }
    });
    
    // Check if user exists
    if (!user) {
      return createApiResponse(null, 'Invalid email or password', 401);
    }
    
    // Check if user is active
    if (user.userActivated !== 'ACTIVE') {
      return createApiResponse(null, 'Account is inactive', 403);
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return createApiResponse(null, 'Invalid email or password', 401);
    }
    
    // Create token with user data (excluding password)
    const { password: _, ...userData } = user;
    
    const token = jwt.sign(
      userData,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    });
    
    // Set cookie
    const cookieStore = cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 24 hours
      path: '/'
    });
    
    // Return user data and token
    return createApiResponse({
      user: userData,
      token
    });
  } catch (error) {
    console.error('Error during login:', error);
    return createApiResponse(null, 'Login failed', 500);
  }
}