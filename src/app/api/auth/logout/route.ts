/**
 * API Route: /api/auth/logout
 * Logs out a user by clearing the authentication cookie
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Handle POST requests to /api/auth/logout
 */
export async function POST(req: NextRequest) {
  try {
    // Clear the auth cookie
    cookies().delete('auth-token');
    
    return NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' }
    });
  } catch (error: any) {
    console.error('[/api/auth/logout] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Logout failed',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
