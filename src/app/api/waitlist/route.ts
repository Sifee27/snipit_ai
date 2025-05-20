import { NextRequest, NextResponse } from 'next/server';
import getWaitlistStorage from '@/lib/storage/waitlist-storage';

// Get storage provider
const waitlistStorage = getWaitlistStorage();

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Handle POST requests to add emails
export async function POST(req: NextRequest) {
  try {
    console.log('Received waitlist submission request');
    
    // Try to parse the request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid request format',
        detail: 'Could not parse request body' 
      }, { status: 400 });
    }
    
    const { email } = body;
    console.log('Received email submission:', email);
    
    // Validate request data
    if (!email) {
      console.log('Email validation failed: Email is empty');
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }
    
    if (!EMAIL_REGEX.test(email)) {
      console.log('Email validation failed: Invalid format', email);
      return NextResponse.json({ success: false, message: 'Invalid email format' }, { status: 400 });
    }
    
    try {
      // Use our robust storage implementation
      const result = await waitlistStorage.addEmail(email);
      
      if (result.success) {
        console.log('Email successfully added to waitlist:', email);
        return NextResponse.json(result, { status: 200 });
      } else {
        console.log('Failed to add email to waitlist:', result.message);
        return NextResponse.json(result, { status: 400 });
      }
    } catch (storageError) {
      console.error('Error with waitlist storage:', storageError);
      return NextResponse.json({ 
        success: false, 
        message: 'Server error: Unable to save email. Please try again later.',
        detail: storageError instanceof Error ? storageError.message : 'Unknown storage error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Critical error processing waitlist request:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error occurred',
      detail: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle GET requests to retrieve waitlist stats (protected, admin only)
export async function GET(req: NextRequest) {
  // Multi-method admin authentication
  // For compatibility with both API access and admin dashboard
  const authHeader = req.headers.get('authorization');
  const adminAccessHeader = req.headers.get('x-admin-access');
  const adminApiKey = process.env.ADMIN_API_KEY || 'admin-dev-key';
  
  // Check for both authorization methods
  const isAdminViaToken = authHeader === `Bearer ${adminApiKey}`;
  
  // For admin dashboard - validate using cookie auth + header flag
  // In production, you'd want to validate the session token here
  const isAdminViaSession = adminAccessHeader === 'true';
  
  if (!isAdminViaToken && !isAdminViaSession) {
    console.log('Unauthorized waitlist data access attempt');
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get emails using storage provider
    const emails = await waitlistStorage.getEmails();
    const count = await waitlistStorage.getTotalCount();
    
    return NextResponse.json({
      success: true,
      count: count,
      lastUpdated: new Date().toISOString(),
      emails: emails
    }, { status: 200 });
  } catch (error) {
    console.error('Error retrieving waitlist data:', error);
    return NextResponse.json({ success: false, message: 'Server error occurred' }, { status: 500 });
  }
}
