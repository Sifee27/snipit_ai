/**
 * API Route: /api/auth/me
 * Returns information about the currently authenticated user
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { userDb } from '@/lib/db';

/**
 * Handle GET requests to /api/auth/me
 */
export async function GET(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    try {
      // Get the latest user data from the database
      const userData = await userDb.findById(user.id);
      
      if (!userData) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: {
          user: userData
        }
      });
    } catch (error: any) {
      console.error('[/api/auth/me] Error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Error retrieving user information',
          details: error.message || 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}
