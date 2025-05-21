/**
 * Supabase client for server-side waitlist operations
 * Uses service role key for admin-level database access
 * DO NOT use this in client-side or browser code
 */
import { createClient } from '@supabase/supabase-js';

// Constants (using same configuration from client.ts)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Error handling for missing environment variables
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('CRITICAL: Supabase URL or Service Role Key is missing.');
  console.error('Server-side functionality will not work correctly without these environment variables.');
}

const TABLE_NAME = 'waitlist';
const DEBUG = true;

// Create a Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

// Logger
function log(message: string, details?: any) {
  if (DEBUG) {
    console.log(`[Waitlist] ${message}`, details ? JSON.stringify(details, null, 2) : '');
  }
}

// Email validation
function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Get all waitlist entries
 */
export async function getAllWaitlistEntries() {
  try {
    log('Getting all waitlist entries');
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      log('Error getting waitlist entries', error);
      return { success: false, error: error.message };
    }
    
    log('Successfully retrieved waitlist entries', { count: data.length });
    return { success: true, data };
  } catch (err) {
    log('Exception getting waitlist entries', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Add a new entry to the waitlist
 */
export async function addToWaitlist(email: string, referralCode?: string) {
  if (!isValidEmail(email)) {
    return { success: false, error: 'Invalid email address' };
  }
  
  try {
    log('Adding to waitlist', { email, referralCode });
    
    // Check if email already exists
    const { data: existingEntries } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('email', email);
    
    if (existingEntries && existingEntries.length > 0) {
      log('Email already in waitlist', { email });
      return { success: false, error: 'Email is already on the waitlist' };
    }
    
    // Add new entry
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([{ 
        email, 
        referral_code: referralCode,
        created_at: new Date().toISOString() 
      }]);
    
    if (error) {
      log('Error adding to waitlist', error);
      return { success: false, error: error.message };
    }
    
    log('Successfully added to waitlist', { email });
    return { success: true, data };
  } catch (err) {
    log('Exception adding to waitlist', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Remove an entry from the waitlist
 */
export async function removeFromWaitlist(email: string) {
  if (!isValidEmail(email)) {
    return { success: false, error: 'Invalid email address' };
  }
  
  try {
    log('Removing from waitlist', { email });
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('email', email);
    
    if (error) {
      log('Error removing from waitlist', error);
      return { success: false, error: error.message };
    }
    
    log('Successfully removed from waitlist', { email });
    return { success: true, data };
  } catch (err) {
    log('Exception removing from waitlist', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Default export of all waitlist functions for easier imports
const serverWaitlist = {
  getAllWaitlistEntries,
  addToWaitlist,
  removeFromWaitlist,
  isValidEmail,
  supabase
};

export default serverWaitlist;
