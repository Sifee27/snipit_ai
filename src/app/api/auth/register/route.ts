/**
 * API Route: /api/auth/register
 * Registers a new user and returns a JWT token
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createValidator, registerRequestSchema } from '@/middleware/validation';
import { generateToken } from '@/middleware/auth';
import { userDb } from '@/lib/db';

// Validate registration requests
const validateRegisterRequest = createValidator(registerRequestSchema);

/**
 * Handle POST requests to /api/auth/register
 */
export async function POST(req: NextRequest) {
  return validateRegisterRequest(req, async (req, data) => {
    try {
      // Check if user already exists
      const existingUser = await userDb.findByEmail(data.email);
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Email already registered' },
          { status: 409 }
        );
      }
      
      // Create the new user
      const user = await userDb.create({
        email: data.email,
        name: data.name,
        password: data.password,
      });
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Store token in cookie
      cookies().set({
        name: 'auth-token',
        value: token,
        httpOnly: true,
        path: '/',
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
      
      return NextResponse.json({
        success: true,
        data: {
          user,
          token
        }
      });
    } catch (error: any) {
      console.error('[/api/auth/register] Error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Registration failed',
          details: error.message || 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}
