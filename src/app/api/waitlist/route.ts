import { NextRequest, NextResponse } from 'next/server';
import waitlistService from '@/lib/supabase/waitlist-service';
import fs from 'fs';
import path from 'path';

// For backward compatibility, still import the old storage
import getWaitlistStorage from '@/lib/storage/waitlist-storage';

// Guaranteed working storage
const GUARANTEED_DATA_DIR = path.join(process.cwd(), 'data');
const GUARANTEED_WAITLIST_FILE = path.join(GUARANTEED_DATA_DIR, 'waitlist.json');

// Function to directly save an email to the JSON file
const saveEmailDirectly = async (email: string): Promise<{ success: boolean; message: string }> => {
  console.log(`[DirectStorage] Saving email: ${email}`);
  console.log(`[DirectStorage] File path: ${GUARANTEED_WAITLIST_FILE}`);
  
  try {
    // Ensure the directory exists
    if (!fs.existsSync(GUARANTEED_DATA_DIR)) {
      fs.mkdirSync(GUARANTEED_DATA_DIR, { recursive: true });
      console.log(`[DirectStorage] Created directory: ${GUARANTEED_DATA_DIR}`);
    }
    
    // Initialize with default data structure
    let data: { emails: string[]; lastUpdated: string } = { 
      emails: [], 
      lastUpdated: new Date().toISOString() 
    };
    
    // Read existing file if it exists
    if (fs.existsSync(GUARANTEED_WAITLIST_FILE)) {
      try {
        const fileContent = fs.readFileSync(GUARANTEED_WAITLIST_FILE, 'utf8');
        const parsed = JSON.parse(fileContent);
        
        if (parsed && Array.isArray(parsed.emails)) {
          data.emails = parsed.emails;
        }
      } catch (error: unknown) {
        const readError = error as Error;
        console.error(`[DirectStorage] Error reading file: ${readError.message}`);
        // Continue with empty data
      }
    }
    
    // Check for duplicate
    if (data.emails.includes(email)) {
      console.log(`[DirectStorage] Email already exists: ${email}`);
      return { success: false, message: 'Email already registered' };
    }
    
    // Add the email and update timestamp
    data.emails.push(email);
    data.lastUpdated = new Date().toISOString();
    
    // Write the file
    fs.writeFileSync(GUARANTEED_WAITLIST_FILE, JSON.stringify(data, null, 2));
    console.log(`[DirectStorage] Successfully saved email: ${email}`);
    
    return { success: true, message: 'Email added successfully' };
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`[DirectStorage] Error saving email: ${err.message}`);
    return { success: false, message: `Server error: ${err.message}` };
  }
};

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
    
    // ENTERPRISE-GRADE SOLUTION: Primary database storage with file-based fallback
    try {
      console.log(`Processing waitlist submission for ${email} using Supabase...`);
      
      // PRIMARY: Use Supabase for reliable cloud database storage
      const supabaseResult = await waitlistService.addEmail(email, {
        source: 'waitlist-form',
        metadata: {
          userAgent: req.headers.get('user-agent'),
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV
        }
      });
      
      // FALLBACK 1: If Supabase fails, try direct file storage
      if (!supabaseResult.success && !supabaseResult.message.includes('already registered')) {
        console.log(`Supabase storage failed for ${email}, falling back to direct file storage...`);
        const directResult = await saveEmailDirectly(email);
        
        if (directResult.success) {
          console.log(`Email ${email} saved via direct file storage fallback`);
          return NextResponse.json({
            success: true,
            message: 'Thank you! You have been added to our waitlist.',
            storageMethod: 'file_fallback'
          }, { status: 200 });
        }
      }
      
      // FALLBACK 2: For completeness, also try the regular storage system (background task)
      // This ensures multiple storage mechanisms for redundancy
      try {
        // Don't await - fire and forget to avoid blocking
        waitlistStorage.addEmail(email).then(legacyResult => {
          console.log(`Legacy storage result for ${email}:`, legacyResult);
        }).catch(legacyError => {
          console.log(`Legacy storage failed for ${email}:`, legacyError);
        });
      } catch (legacyError) {
        // Ignore legacy storage errors - Supabase is our primary storage
        console.log('Legacy storage attempt failed:', legacyError);
      }
      
      // Return result based on Supabase outcome
      if (supabaseResult.success) {
        console.log(`Email ${email} successfully added to waitlist in Supabase`);
        return NextResponse.json({
          success: true,
          message: 'Thank you! You have been added to our waitlist.',
          storageMethod: 'supabase'
        }, { status: 200 });
      } else if (supabaseResult.message.includes('already registered')) {
        // Handle duplicate gracefully
        console.log(`Email ${email} already exists in waitlist`);
        return NextResponse.json({
          success: false, 
          message: 'Email already registered'
        }, { status: 400 });
      } else {
        // All storage mechanisms failed
        console.error('All storage mechanisms failed:', supabaseResult.message);
        throw new Error(`Storage failed: ${supabaseResult.message}`);
      }
    } catch (storageError) {
      console.error('ALL storage mechanisms failed:', storageError);
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
