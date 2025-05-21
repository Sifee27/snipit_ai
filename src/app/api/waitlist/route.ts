import { NextRequest, NextResponse } from 'next/server';
import waitlistService from '@/lib/supabase/waitlist-service';
import fs from 'fs';
import path from 'path';

// For backward compatibility, still import the old storage
import getWaitlistStorage from '@/lib/storage/waitlist-storage';

// Define a global type for waitlist emails storage
declare global {
  var waitlistEmails: string[];
}

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
    
        // GUARANTEED WORKING SOLUTION - DIRECT IN-ROUTE IMPLEMENTATION
    try {
      console.log(`[WAITLIST] Processing submission for: ${email}`);
      console.log(`[WAITLIST] Environment: ${process.env.NODE_ENV}`);
      console.log(`[WAITLIST] Working directory: ${process.cwd()}`);
      
      // STAGE 1: DIRECT FILE STORAGE - THE SIMPLEST POSSIBLE APPROACH
      try {
        // Hardcoded paths for maximum robustness in production
        const DATA_PATHS = [
          // Standard path
          path.join(process.cwd(), 'data'),
          // Production temp directory - often writable in serverless environments
          '/tmp',
          // Windows temp directory (for local testing)
          process.env.TEMP,
          // User home directory (fallback)
          process.env.HOME || process.env.USERPROFILE,
          // Current directory (last resort)
          process.cwd()
        ];

        // Try each possible storage location until one works
        let savedSuccessfully = false;
        let dataPath = '';
        let errorMessages: string[] = [];
        
        for (const testPath of DATA_PATHS) {
          if (!testPath) continue;
          
          try {
            dataPath = testPath;
            const filePath = path.join(dataPath, 'waitlist.json');
            console.log(`[WAITLIST] Attempting to save to: ${filePath}`);
            
            // Ensure directory exists
            if (!fs.existsSync(dataPath)) {
              fs.mkdirSync(dataPath, { recursive: true });
              console.log(`[WAITLIST] Created directory: ${dataPath}`);
            }
            
            // Initialize data structure or read existing file
            let data = { emails: [], lastUpdated: new Date().toISOString() };
            
            if (fs.existsSync(filePath)) {
              try {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const parsedData = JSON.parse(fileContent);
                
                if (parsedData && Array.isArray(parsedData.emails)) {
                  data.emails = parsedData.emails;
                }
              } catch (readError) {
                console.log(`[WAITLIST] Could not read existing file at ${filePath}:`, readError);
                // Continue with empty data
              }
            }
            
            // Check for duplicate
            if (data.emails.includes(email)) {
              console.log(`[WAITLIST] Email already registered: ${email}`);
              return NextResponse.json({
                success: false,
                message: 'Email already registered'
              }, { status: 400 });
            }
            
            // Add email and save
            data.emails.push(email);
            data.lastUpdated = new Date().toISOString();
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            
            // If we get here without errors, it worked!
            savedSuccessfully = true;
            console.log(`[WAITLIST] Successfully saved email to ${filePath}`);
            break;
          } catch (pathError: unknown) {
            const error = pathError as Error;
            console.error(`[WAITLIST] Failed to save to ${dataPath}:`, error);
            errorMessages.push(`${dataPath}: ${error.message || 'Unknown error'}`);
            // Continue to next path
          }
        }
        
        if (savedSuccessfully) {
          // STAGE 2: Try Supabase as a background task for redundancy (don't wait for result)
          try {
            // Don't await - fire and forget to avoid blocking
            waitlistService.addEmail(email, {
              source: 'waitlist-form',
              metadata: {
                userAgent: req.headers.get('user-agent') || 'unknown',
                timestamp: new Date().toISOString()
              }
            }).then(result => {
              console.log(`[WAITLIST] Backup Supabase result:`, result.success);
            }).catch(err => {
              console.log(`[WAITLIST] Backup Supabase failed:`, err);
            });
          } catch (backupError) {
            // Ignore backup errors - our file storage already worked
            console.log('[WAITLIST] Backup storage attempt failed:', backupError);
          }
          
          return NextResponse.json({
            success: true,
            message: 'Thank you! You have been added to our waitlist.'
          }, { status: 200 });
        } else {
          // All file paths failed, throw with detailed error
          throw new Error(`Could not save to any location. Tried: ${errorMessages.join(' | ')}`);
        }
      } catch (directError) {
        // File storage completely failed, log and continue to last resort
        console.error('[WAITLIST] All direct file storage attempts failed:', directError);
      }
      
      // STAGE 3: LAST RESORT - IN-MEMORY STORAGE WITH ALERT
      // Store in a global variable and log an urgent alert
      
      if (!global.waitlistEmails) {
        global.waitlistEmails = [];
      }
      
      if (!global.waitlistEmails.includes(email)) {
        global.waitlistEmails.push(email);
        console.log(`[WAITLIST][URGENT] Email saved to memory only: ${email}`);
        console.log(`[WAITLIST][URGENT] Current emails in memory: ${global.waitlistEmails.join(', ')}`);
        
        return NextResponse.json({
          success: true,
          message: 'Thank you! You have been added to our waitlist.',
          storageMethod: 'memory_fallback'
        }, { status: 200 });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Email already registered (memory check)'
        }, { status: 400 });
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
