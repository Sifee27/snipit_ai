/**
 * Waitlist Database Service
 * 
 * Enterprise-grade implementation for waitlist email storage
 * with dynamic imports, fallbacks, and comprehensive error handling.
 */

import { initSupabase, isSupabaseAvailable } from './client';
import fs from 'fs';
import path from 'path';

// TypeScript interfaces for waitlist entries and responses
export interface WaitlistEntry {
  id?: number;
  email: string;
  created_at?: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface WaitlistResponse {
  success: boolean;
  message: string;
  data?: any;
  source?: string;
  error?: string;
}

// File storage fallback settings
const DATA_DIR = path.join(process.cwd(), 'data');
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.json');

/**
 * Waitlist service for database operations
 * Follows enterprise patterns: retries, validation, and comprehensive error handling
 */
export class WaitlistService {
  private static instance: WaitlistService;
  private readonly tableName = 'waitlist';
  private readonly maxRetries = 3;
  private useSupabase: boolean = false;
  
  private constructor() {
    // Private constructor to enforce singleton pattern
    // Check if Supabase is available on initialization
    this.checkSupabaseAvailability();
  }
  
  private async checkSupabaseAvailability() {
    this.useSupabase = await isSupabaseAvailable();
    console.log(`[WaitlistService] Using Supabase: ${this.useSupabase}`);
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
   * Add email to waitlist with retry logic and fallback mechanisms
   */
  public async addEmail(
    email: string, 
    options: { source?: string; metadata?: Record<string, any> } = {}
  ): Promise<WaitlistResponse> {
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

    // If Supabase is available, try it first
    if (this.useSupabase) {
      try {
        const { supabase, error: initError } = await initSupabase();
        if (initError || !supabase) {
          throw new Error(`Supabase initialization failed: ${initError?.message}`);
        }

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
                data: { id: existingEntries[0].id },
                source: 'supabase'
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
              data,
              source: 'supabase'
            };
          } catch (error) {
            console.error(`[WaitlistService] Unexpected error (attempt ${attempt}):`, error);
            lastError = error;
            
            if (attempt < this.maxRetries) {
              await this.delay(Math.pow(2, attempt) * 100);
            }
          }
        }
        
        // If Supabase fails, log and continue to file storage fallback
        console.error(`[WaitlistService] Supabase storage failed for email: ${email}, falling back to file storage`);
      } catch (error) {
        console.error('[WaitlistService] Error using Supabase:', error);
        // Continue to file fallback
      }
    }

    // File storage fallback
    console.log(`[WaitlistService] Using file storage fallback for: ${email}`);
    return this.addEmailToFileStorage(email, entry.metadata);
  }

  /**
   * Fallback method to save email to JSON file
   */
  private async addEmailToFileStorage(email: string, metadata?: Record<string, any>): Promise<WaitlistResponse> {
    try {
      // Ensure data directory exists
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      // Initialize with default structure
      let data = {
        emails: [] as string[],
        lastUpdated: new Date().toISOString()
      };

      // Read existing data if file exists
      if (fs.existsSync(WAITLIST_FILE)) {
        try {
          const fileContent = fs.readFileSync(WAITLIST_FILE, 'utf8');
          const parsedData = JSON.parse(fileContent);
          if (parsedData && Array.isArray(parsedData.emails)) {
            data.emails = parsedData.emails;
          }
        } catch (readError) {
          console.error('[WaitlistService] Error reading file:', readError);
          // Continue with empty data
        }
      }

      // Check for duplicates
      if (data.emails.includes(email)) {
        return {
          success: false,
          message: 'Email already registered',
          source: 'file'
        };
      }

      // Add email and update timestamp
      data.emails.push(email);
      data.lastUpdated = new Date().toISOString();

      // Write updated data
      fs.writeFileSync(WAITLIST_FILE, JSON.stringify(data, null, 2));
      console.log(`[WaitlistService] Email saved to file storage: ${email}`);

      return {
        success: true,
        message: 'Thank you! You have been added to our waitlist.',
        source: 'file'
      };
    } catch (error) {
      console.error('[WaitlistService] File storage error:', error);
      return {
        success: false,
        message: 'Failed to save email. Please try again later.',
        source: 'file',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get all waitlist emails with fallback mechanisms
   */
  public async getEmails(): Promise<string[]> {
    // Try Supabase first if available
    if (this.useSupabase) {
      try {
        const { supabase, error: initError } = await initSupabase();
        if (initError || !supabase) {
          throw new Error(`Supabase initialization failed: ${initError?.message}`);
        }
        
        const { data, error } = await supabase
          .from(this.tableName)
          .select('email')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('[WaitlistService] Error fetching emails from Supabase:', error);
          throw error; // Continue to fallback
        }
        
        if (data && data.length > 0) {
          return data.map((item: { email: string }) => item.email);
        }
      } catch (error) {
        console.error('[WaitlistService] Supabase getEmails failed, using file fallback:', error);
        // Continue to file fallback
      }
    }
    
    // File storage fallback
    return this.getEmailsFromFile();
  }
  
  /**
   * Fallback method to get emails from file storage
   */
  private getEmailsFromFile(): string[] {
    try {
      if (!fs.existsSync(WAITLIST_FILE)) {
        return [];
      }
      
      const fileContent = fs.readFileSync(WAITLIST_FILE, 'utf8');
      const data = JSON.parse(fileContent);
      
      if (data && Array.isArray(data.emails)) {
        return data.emails;
      }
      
      return [];
    } catch (error) {
      console.error('[WaitlistService] Error reading emails from file:', error);
      return [];
    }
  }
  
  /**
   * Get total count of waitlist entries with fallback
   */
  public async getCount(): Promise<number> {
    // Try Supabase first if available
    if (this.useSupabase) {
      try {
        const { supabase, error: initError } = await initSupabase();
        if (initError || !supabase) {
          throw new Error(`Supabase initialization failed: ${initError?.message}`);
        }
        
        const { count, error } = await supabase
          .from(this.tableName)
          .select('id', { count: 'exact', head: true });
          
        if (error) {
          console.error('[WaitlistService] Error getting count from Supabase:', error);
          throw error; // Continue to fallback
        }
        
        return count || 0;
      } catch (error) {
        console.error('[WaitlistService] Supabase getCount failed, using file fallback:', error);
        // Continue to file fallback
      }
    }
    
    // File storage fallback
    try {
      const emails = this.getEmailsFromFile();
      return emails.length;
    } catch (error) {
      console.error('[WaitlistService] Error getting count from file:', error);
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
