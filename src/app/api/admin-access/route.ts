import { NextRequest, NextResponse } from 'next/server';

// Admin access endpoint for verifying admin status
export async function GET(req: NextRequest) {
  try {
    // Check the admin cookie or token
    const adminCookie = req.cookies.get('admin_access');
    
    // Simple temporary admin access check
    // In production, use proper authentication
    if (adminCookie) {
      return NextResponse.json({ isAdmin: true });
    }
    
    return NextResponse.json({ isAdmin: false });
  } catch (error) {
    console.error('Admin access check error:', error);
    return NextResponse.json({ isAdmin: false, error: 'Server error' });
  }
}

// Set admin access cookie
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;
    
    // Validate email against allowed admin emails
    const adminEmails = ['test@example.com', 'liamjvieira@gmail.com'];
    
    if (!adminEmails.includes(email)) {
      return NextResponse.json(
        { success: false, message: 'Not an admin email' }, 
        { status: 403 }
      );
    }
    
    // Create a simple admin access token
    const token = Buffer.from(`${email}:admin:${Date.now()}`).toString('base64');
    
    // Set cookie and return success
    return NextResponse.json(
      { success: true },
      { 
        status: 200,
        headers: {
          'Set-Cookie': `admin_access=${token}; Path=/; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
        }
      }
    );
  } catch (error) {
    console.error('Admin access error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
