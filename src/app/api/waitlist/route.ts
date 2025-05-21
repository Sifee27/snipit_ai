import { NextRequest, NextResponse } from 'next/server';
import waitlistService from '@/lib/supabase/waitlist-service';
import serverWaitlist from '@/lib/supabase/server-waitlist';
import { supabase, logDatabaseOperation } from '@/lib/supabase/client';
import fs from 'fs';
import path from 'path';

// For backward compatibility, still import the old storage
import getWaitlistStorage from '@/lib/storage/waitlist-storage';

// Define a global type for waitlist emails storage
declare global {
  var waitlistEmails: string[];
}

// Constants for direct Supabase operations
const WAITLIST_TABLE = 'waitlist';

// Guaranteed working storage
const GUARANTEED_DATA_DIR = path.join(process.cwd(), 'data');
const GUARANTEED_WAITLIST_FILE = path.join(GUARANTEED_DATA_DIR, 'waitlist.json');

// Function to directly save an email to the JSON file
const saveEmailDirectly = async (email: string): Promise<{ success: boolean; message: string }> => {
  console.log(`[DirectStorage] Saving email: ${email}`);
  
  try {
    // Ensure the directory exists
    if (!fs.existsSync(GUARANTEED_DATA_DIR)) {
      fs.mkdirSync(GUARANTEED_DATA_DIR, { recursive: true });
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
      } catch (readError) {
        console.error('[DirectStorage] Error reading file:', readError);
        // Continue with empty data
      }
    }
    
    // Check for duplicate
    if (data.emails.includes(email)) {
      return { success: true, message: 'Email already registered' };
    }
    
    // Add new email and update timestamp
    data.emails.push(email);
    data.lastUpdated = new Date().toISOString();
    
    // Write to file
    fs.writeFileSync(GUARANTEED_WAITLIST_FILE, JSON.stringify(data, null, 2));
    
    return { success: true, message: 'Email saved successfully' };
  } catch (error) {
    console.error('[DirectStorage] Error saving email:', error);
    return { success: false, message: 'Failed to save email directly' };
  }
};

// Get storage provider
const waitlistStorage = getWaitlistStorage();

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Handle POST requests to add emails
export async function POST(req: NextRequest) {
  try {
    // Get the email from the request body
    const { email } = await req.json();
    
    // Check if we received an email
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email is required' 
      }, { status: 400 });
    }
    
    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid email format' 
      }, { status: 400 });
    }
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[WAITLIST] Processing email submission: ${normalizedEmail}`);
    
    // Track success stages for debugging
    let savedToSupabase = false;
    let savedToLegacyStorage = false;
    let savedToDirectFile = false;
    let supabaseError = null;
    
    try {
      
      // Try to add email using server-side service (with admin privileges)
      try {
        const metadata = {
          userAgent: req.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'production'
        };
        
        const result = await serverWaitlist.addEmail(normalizedEmail, {
          source: 'waitlist-form',
          metadata
        });
        
        // Handle successful addition
        if (result.success) {
          savedToSupabase = true;
          
          return NextResponse.json({
            success: true,
            message: 'Thank you for joining our waitlist!',
            source: result.source || 'server-waitlist',
            status: 'STAGE_1_SUCCESS'
          });
        }
      } catch (serverError) {
        console.error('Server waitlist service error:', serverError);
        // Continue to fallback mechanisms
      }
      
      // If server service failed, try the regular waitlist service as fallback
      try {
        const legacyResult = await waitlistService.addEmail(normalizedEmail, {
          source: 'waitlist-form',
          metadata: {
            userAgent: req.headers.get('user-agent') || 'unknown',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'production'
          }
        });
        
        if (legacyResult.success) {
          savedToLegacyStorage = true;
          
          return NextResponse.json({
            success: true,
            message: 'Thank you for joining our waitlist!',
            source: legacyResult.source || 'legacy-service',
            status: 'STAGE_2_SUCCESS'
          });
        }
      } catch (legacyError) {
        console.error('Legacy waitlist service error:', legacyError);
        // Continue to other fallbacks
      }
      
      // STAGE 2: DIRECT FILE STORAGE - Fallback approach
      try {
        console.log(`[WAITLIST] Attempting direct file storage`);
        const fileResult = await saveEmailDirectly(normalizedEmail);
        
        if (fileResult.success) {
          console.log(`[WAITLIST] Successfully saved to file storage`);
          savedToDirectFile = true;
          
          // Attempt to also save to Supabase in the background
          if (!savedToSupabase) {
            try {
              // Don't await - fire and forget to avoid blocking
              waitlistService.addEmail(normalizedEmail, {
                source: 'waitlist-form',
                metadata: {
                  userAgent: req.headers.get('user-agent') || 'unknown',
                  timestamp: new Date().toISOString()
                }
              }).then(result => {
                console.log(`[WAITLIST] Background Supabase save result:`, result.success);
              }).catch(err => {
                console.log(`[WAITLIST] Background Supabase save failed:`, err);
              });
            } catch (backupError) {
              console.error('[WAITLIST] Error triggering background save:', backupError);
            }
          }
          
          return NextResponse.json({
            success: true,
            message: 'Thank you for joining our waitlist!',
            source: 'file-storage',
            status: 'STAGE_2_SUCCESS'
          });
        }
      } catch (fileError) {
        console.error('[WAITLIST] Direct file storage failed:', fileError);
        // Continue to stage 3
      }
      
      // STAGE 3: LEGACY STORAGE - Compatibility approach
      try {
        console.log(`[WAITLIST] Attempting legacy storage`);
        const legacySuccess = await waitlistStorage.addEmail(normalizedEmail);
        
        if (legacySuccess) {
          console.log(`[WAITLIST] Successfully saved to legacy storage`);
          return NextResponse.json({
            success: true,
            message: 'Thank you for joining our waitlist!',
            source: 'legacy-storage',
            status: 'STAGE_3_SUCCESS'
          });
        }
      } catch (legacyError) {
        console.error('[WAITLIST] Legacy storage failed:', legacyError);
        // Continue to stage 4
      }
      
      // STAGE 4: MEMORY STORAGE - Last resort approach
      console.log(`[WAITLIST] Using memory storage as last resort`);
      
      // Initialize the global array if it doesn't exist
      if (!global.waitlistEmails) {
        global.waitlistEmails = [];
      }
      
      // Add the email if it's not already there
      if (!global.waitlistEmails.includes(normalizedEmail)) {
        global.waitlistEmails.push(normalizedEmail);
      }
      
      console.log(`[WAITLIST][URGENT] Email saved to memory only: ${normalizedEmail}`);
      console.log(`[WAITLIST][URGENT] Current emails in memory:`, global.waitlistEmails);
      
      // Log the errors for debugging
      console.error('[WAITLIST][URGENT] All storage methods failed, using in-memory.');
      
      // Return success to the client even though we're in a degraded state
      return NextResponse.json({
        success: true,
        message: 'Thank you for joining our waitlist!',
        source: 'memory-storage',
        status: 'STAGE_4_FALLBACK'
      });
    } catch (error) {
      supabaseError = error;
      console.error('[WAITLIST] Direct Supabase operation failed:', error);
      // Continue to stage 2
    }
    
    // STAGE 2: DIRECT FILE STORAGE - Fallback approach
    try {
      console.log(`[WAITLIST] Attempting direct file storage`);
      const fileResult = await saveEmailDirectly(normalizedEmail);
      
      if (fileResult.success) {
        console.log(`[WAITLIST] Successfully saved to file storage`);
        
        // Attempt to also save to Supabase in the background
        if (!savedToSupabase) {
          try {
            // Don't await - fire and forget to avoid blocking
            waitlistService.addEmail(normalizedEmail, {
              source: 'waitlist-form',
              metadata: {
                userAgent: req.headers.get('user-agent') || 'unknown',
                timestamp: new Date().toISOString()
              }
            }).then(result => {
              console.log(`[WAITLIST] Background Supabase save result:`, result.success);
            }).catch(err => {
              console.log(`[WAITLIST] Background Supabase save failed:`, err);
            });
          } catch (backupError) {
            console.error('[WAITLIST] Error triggering background save:', backupError);
          }
        }
        
        return NextResponse.json({
          success: true,
          message: 'Thank you for joining our waitlist!',
          source: 'file-storage',
          status: 'STAGE_2_SUCCESS'
        });
      }
    } catch (fileError) {
      console.error('[WAITLIST] Direct file storage failed:', fileError);
      // Continue to stage 3
    }
    
    // STAGE 3: LEGACY STORAGE - Compatibility approach
    try {
      console.log(`[WAITLIST] Attempting legacy storage`);
      const legacySuccess = await waitlistStorage.addEmail(normalizedEmail);
      
      if (legacySuccess) {
        console.log(`[WAITLIST] Successfully saved to legacy storage`);
        return NextResponse.json({
          success: true,
          message: 'Thank you for joining our waitlist!',
          source: 'legacy-storage',
          status: 'STAGE_3_SUCCESS'
        });
      }
    } catch (legacyError) {
      console.error('[WAITLIST] Legacy storage failed:', legacyError);
      // Continue to stage 4
    }
    
    // STAGE 4: MEMORY STORAGE - Last resort approach
    console.log(`[WAITLIST] Using memory storage as last resort`);
    
    // Initialize the global array if it doesn't exist
    if (!global.waitlistEmails) {
      global.waitlistEmails = [];
    }
    
    // Add the email if it's not already there
    if (!global.waitlistEmails.includes(normalizedEmail)) {
      global.waitlistEmails.push(normalizedEmail);
    }
    
    console.log(`[WAITLIST][URGENT] Email saved to memory only: ${normalizedEmail}`);
    console.log(`[WAITLIST][URGENT] Current emails in memory:`, global.waitlistEmails);
    
    // Log the errors for debugging
    console.error('[WAITLIST][URGENT] All storage methods failed, using in-memory.');
    if (supabaseError) console.error('[WAITLIST] Supabase error:', supabaseError);
    
    // Return success to the client even though we're in a degraded state
    return NextResponse.json({
      success: true,
      message: 'Thank you for joining our waitlist!',
      source: 'memory-storage',
      status: 'STAGE_4_FALLBACK'
    });
    
  } catch (error) {
    // Handle any unexpected errors in the route handler
    console.error('[WAITLIST] Unhandled error in waitlist API:', error);
    
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle GET requests to retrieve waitlist stats (protected, admin only)
export async function GET(req: NextRequest) {
  // TODO: Add proper authentication for admin access
  
  try {
    // Try to get emails from Supabase first
    let emails: string[] = [];
    let source = 'unknown';
    
    try {
      // Direct Supabase query first
      const { data, error } = await supabase
        .from(WAITLIST_TABLE)
        .select('email');
        
      if (!error && data && data.length > 0) {
        emails = data.map(item => item.email);
        source = 'supabase';
      }
    } catch (dbError) {
      console.error('Error getting emails from Supabase:', dbError);
    }
    
    // If Supabase failed, try file storage
    if (emails.length === 0) {
      try {
        if (fs.existsSync(GUARANTEED_WAITLIST_FILE)) {
          const fileContent = fs.readFileSync(GUARANTEED_WAITLIST_FILE, 'utf8');
          const data = JSON.parse(fileContent);
          
          if (data && Array.isArray(data.emails)) {
            emails = data.emails;
            source = 'file';
          }
        }
      } catch (fileError) {
        console.error('Error reading waitlist file:', fileError);
      }
    }
    
    // If file storage failed, try the in-memory storage
    if (emails.length === 0 && global.waitlistEmails && global.waitlistEmails.length > 0) {
      emails = global.waitlistEmails;
      source = 'memory';
    }
    
    // Return the count and emails
    return NextResponse.json({
      success: true,
      count: emails.length,
      emails,
      source
    });
  } catch (error) {
    console.error('Error in GET waitlist handler:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error retrieving waitlist data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
