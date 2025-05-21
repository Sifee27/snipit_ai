/**
 * Waitlist Database Service
 * 
 * Enterprise-grade Supabase implementation for waitlist email storage
 * with comprehensive error handling, retries, and data validation.
 */

import { supabase } from './client';

// TypeScript interface for waitlist entries
export interface WaitlistEntry {
  id?: number;
  email: string;
  created_at?: string;
  source?: string;
  metadata?: Record<string, any>;
}

/**
 * Waitlist service for database operations
 * Follows enterprise patterns: retries, validation, and comprehensive error handling
 */
export class WaitlistService {
  private static instance: WaitlistService;
  private readonly tableName = 'waitlist';
  private readonly maxRetries = 3;
  
  private constructor() {
    // Private constructor to enforce singleton pattern
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): WaitlistService {
    if (!WaitlistService.instance) {
      WaitlistService.instance = new WaitlistService();
    }
    return WaitlistService.instance;
  }
  
  /**
   * Add email to waitlist with retry logic
   */
  public async addEmail(
    email: string, 
    options: { source?: string; metadata?: Record<string, any> } = {}
  ): Promise<{ success: boolean; message: string; data?: any }> {
    console.log(`[WaitlistService] Adding email to database: ${email}`);
    
    // Basic email validation
    if (!this.isValidEmail(email)) {
      return { 
        success: false, 
        message: 'Invalid email format' 
      };
    }
    
    // Create entry object
    const entry: WaitlistEntry = {
      email: email.toLowerCase().trim(),
      source: options.source || 'waitlist-form',
      metadata: options.metadata || { 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }
    };
    
    // Attempt to insert with retries
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Check if email already exists
        const { data: existingEntries, error: checkError } = await supabase
          .from(this.tableName)
          .select('id, email')
          .eq('email', entry.email)
          .limit(1);
          
        if (checkError) {
          console.error(`[WaitlistService] Error checking for existing email (attempt ${attempt}):`, checkError);
          lastError = checkError;
          
          // Wait before retry (exponential backoff)
          if (attempt < this.maxRetries) {
            await this.delay(Math.pow(2, attempt) * 100);
            continue;
          }
          break;
        }
        
        // Handle duplicate email
        if (existingEntries && existingEntries.length > 0) {
          console.log(`[WaitlistService] Email already exists: ${entry.email}`);
          return { 
            success: false, 
            message: 'Email already registered',
            data: { id: existingEntries[0].id }
          };
        }
        
        // Insert new entry
        const { data, error } = await supabase
          .from(this.tableName)
          .insert([entry])
          .select();
          
        if (error) {
          console.error(`[WaitlistService] Insert failed (attempt ${attempt}):`, error);
          lastError = error;
          
          // Wait before retry
          if (attempt < this.maxRetries) {
            await this.delay(Math.pow(2, attempt) * 100);
            continue;
          }
          break;
        }
        
        console.log(`[WaitlistService] Successfully added email: ${email}`);
        return { 
          success: true, 
          message: 'Thank you! You have been added to our waitlist.',
          data
        };
      } catch (error) {
        console.error(`[WaitlistService] Unexpected error (attempt ${attempt}):`, error);
        lastError = error;
        
        if (attempt < this.maxRetries) {
          await this.delay(Math.pow(2, attempt) * 100);
        }
      }
    }
    
    // All attempts failed
    console.error(`[WaitlistService] All ${this.maxRetries} attempts failed to add email: ${email}`);
    return { 
      success: false, 
      message: `Failed to save email after ${this.maxRetries} attempts. Please try again later.`
    };
  }
  
  /**
   * Get all waitlist emails
   */
  public async getEmails(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('email')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('[WaitlistService] Error fetching emails:', error);
        return [];
      }
      
      return data?.map(item => item.email) || [];
    } catch (error) {
      console.error('[WaitlistService] Unexpected error fetching emails:', error);
      return [];
    }
  }
  
  /**
   * Get total count of waitlist entries
   */
  public async getCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(this.tableName)
        .select('id', { count: 'exact', head: true });
        
      if (error) {
        console.error('[WaitlistService] Error getting count:', error);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error('[WaitlistService] Unexpected error getting count:', error);
      return 0;
    }
  }
  
  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Promise-based delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const waitlistService = WaitlistService.getInstance();

export default waitlistService;
