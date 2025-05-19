/**
 * API Route: /api/auth/login
 * Authenticates a user and returns a JWT token
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createValidator, authRequestSchema } from '@/middleware/validation';
import { generateToken } from '@/middleware/auth';
import { userDb } from '@/lib/db';

// Validate login requests
const validateLoginRequest = createValidator(authRequestSchema);

/**
 * Handle POST requests to /api/auth/login
 */
export async function POST(req: NextRequest) {
  return validateLoginRequest(req, async (req, data) => {
    try {
      // Verify credentials
      const user = await userDb.verifyPassword(data.email, data.password);
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }
      
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
          token // Also return the token for clients that need it directly
        }
      });
    } catch (error: any) {
      console.error('[/api/auth/login] Error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Login failed',
          details: error.message || 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}
