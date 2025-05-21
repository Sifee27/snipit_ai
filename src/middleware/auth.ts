/**
 * Authentication middleware using JWT
 */
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { User } from '@/types/api';

// JWT secret must be in environment variables for security
const JWT_SECRET = process.env.JWT_SECRET || '';

// Error handling for missing JWT secret
if (!JWT_SECRET) {
  console.error('SECURITY WARNING: JWT_SECRET environment variable is not set.');
  console.error('Authentication functionality will not work correctly.');
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: Omit<User, 'password'>): string {
  return jwt.sign(
    { 
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Parse and verify a JWT token
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification failed', error);
    return null;
  }
}

/**
 * Get user from request cookies or headers
 */
export async function getUserFromRequest(req: NextRequest) {
  // Check for token in cookies first (client-side)
  let tokenFromCookie: string | undefined;
  try {
    // Use req.cookies directly instead of the cookies() function
    tokenFromCookie = req.cookies.get('auth_token')?.value;
  } catch (error) {
    console.error('Error accessing cookies:', error);
    tokenFromCookie = undefined;
  }
  
  // Then check authorization header (API calls)
  const authHeader = req.headers.get('authorization');
  const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  // Use whichever token is available
  const token = tokenFromCookie || tokenFromHeader;
  
  if (!token) {
    return null;
  }
  
  // Verify and return user data from token
  return verifyToken(token);
}

/**
 * Middleware to protect routes
 */
export async function authenticate(req: NextRequest): Promise<{ user: any; error?: string }> {
  const user = await getUserFromRequest(req);
  
  if (!user) {
    return { user: null, error: 'Unauthorized' };
  }
  
  return { user };
}

/**
 * Set authentication cookie
 */
export function setAuthCookie(res: NextResponse, token: string): void {
  res.cookies.set({
    name: 'auth_token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  });
}

/**
 * Clear authentication cookie
 */
export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set({
    name: 'auth_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  });
}

/**
 * Higher-order function to wrap API routes with authentication
 * This is used by multiple routes in the application
 */
export function withAuth(handler: Function) {
  return async (req: NextRequest, params?: any) => {
    // Authenticate user
    const { user, error } = await authenticate(req);
    
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 401 });
    }
    
    // Call the original handler with authenticated user
    return handler(req, user, params);
  };
}
