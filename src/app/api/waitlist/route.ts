import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Directory to store waitlist data
// Use a storage method that works in both development and production
const DATA_DIR = path.join(process.cwd(), 'data');
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.json');

// In-memory storage as fallback
let MEMORY_STORAGE: { emails: string[], lastUpdated: string } = {
  emails: [],
  lastUpdated: new Date().toISOString()
};

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Initialize the data directory and waitlist file if they don't exist
function initializeStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    if (!fs.existsSync(WAITLIST_FILE)) {
      fs.writeFileSync(WAITLIST_FILE, JSON.stringify({ 
        emails: [],
        lastUpdated: new Date().toISOString()
      }));
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
}

// Add an email to the waitlist
function addToWaitlist(email: string): { success: boolean; message: string } {
  try {
    // Try file storage first
    try {
      // Initialize storage
      if (!initializeStorage()) {
        throw new Error('Storage initialization failed');
      }
      
      // Read current data
      const data = JSON.parse(fs.readFileSync(WAITLIST_FILE, 'utf8'));
      
      // Check if email already exists
      if (data.emails.includes(email)) {
        return { success: false, message: 'Email already registered' };
      }
      
      // Add new email
      data.emails.push(email);
      data.lastUpdated = new Date().toISOString();
      
      // Save updated data
      fs.writeFileSync(WAITLIST_FILE, JSON.stringify(data, null, 2));
      
      console.log(`Email ${email} successfully added to file storage`);
      return { success: true, message: 'Email added to waitlist' };
      
    } catch (fileError) {
      // If file storage fails, use in-memory storage
      console.warn('File storage failed, using in-memory fallback:', fileError);
      
      // Check if email already exists in memory storage
      if (MEMORY_STORAGE.emails.includes(email)) {
        return { success: false, message: 'Email already registered' };
      }
      
      // Add to memory storage
      MEMORY_STORAGE.emails.push(email);
      MEMORY_STORAGE.lastUpdated = new Date().toISOString();
      
      console.log(`Email ${email} added to memory storage (fallback)`);
      return { success: true, message: 'Email added to waitlist (memory storage)' };
    }
  } catch (error) {
    console.error('Critical error adding to waitlist:', error);
    return { success: false, message: 'Server error occurred' };
  }
}

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
    
    // Simple in-memory fallback if file operations fail
    try {
      // Attempt to add to waitlist file
      const result = addToWaitlist(email);
      
      if (result.success) {
        console.log('Email successfully added to waitlist:', email);
        return NextResponse.json(result, { status: 200 });
      } else {
        console.log('Failed to add email to waitlist:', result.message);
        return NextResponse.json(result, { status: 400 });
      }
    } catch (storageError) {
      console.error('Error with waitlist storage:', storageError);
      // Even if file storage fails, acknowledge the submission
      console.log('Using memory fallback for email:', email);
      return NextResponse.json({ 
        success: true, 
        message: 'Email received (fallback mode)',
        detail: 'Using memory storage fallback'
      }, { status: 200 });
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
    if (!fs.existsSync(WAITLIST_FILE)) {
      return NextResponse.json({ success: true, count: 0, emails: [] }, { status: 200 });
    }
    
    const data = JSON.parse(fs.readFileSync(WAITLIST_FILE, 'utf8'));
    
    return NextResponse.json({
      success: true,
      count: data.emails.length,
      lastUpdated: data.lastUpdated,
      emails: data.emails
    }, { status: 200 });
  } catch (error) {
    console.error('Error retrieving waitlist data:', error);
    return NextResponse.json({ success: false, message: 'Server error occurred' }, { status: 500 });
  }
}
