/**
 * Supabase client for browser/client-side use
 * Handles database access with limited permissions (anon key)
 */
import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Error handling for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

// Create supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

// Helper function to log database operations in development
export function logDatabaseOperation(operation: string, details?: any): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Supabase] ${operation}`, details ? JSON.stringify(details, null, 2) : '');
  }
}

// Check if the connection is established
export async function checkConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('waitlist').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Supabase connection failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception during connection test:', err);
    return false;
  }
}

// Export variables for testing purposes
export { supabaseUrl, supabaseAnonKey };
