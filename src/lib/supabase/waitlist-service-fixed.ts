/**
 * Waitlist Database Service
 * 
 * Direct Supabase implementation following their recommended patterns
 * for optimal database integration with proper error handling
 */

import { supabase, logDatabaseOperation } from './client';
import fs from 'fs';
import path from 'path';

// File storage fallback settings
const DATA_DIR = path.join(process.cwd(), 'data');
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.json');

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

/**
 * Waitlist service for database operations
 */
export class WaitlistService {
  private static instance: WaitlistService;
  private readonly tableName = 'waitlist';
  private readonly maxRetries = 3;
  
  private constructor() {
    // Initialize when first instantiated
    this.ensureTableExists();
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
   * Ensures the database table exists
   */
  private async ensureTableExists(): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        logDatabaseOperation('Table check failed', { error });
      } else {
        logDatabaseOperation('Table exists');
      }
    } catch (err) {
      logDatabaseOperation('Error checking table', { error: err });
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
   * Add email to waitlist
   */
  public async addEmail(
    email: string,
    options: {
      source?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<WaitlistResponse> {
    // Validate email
    if (!this.isValidEmail(email)) {
      return {
        success: false,
        message: 'Invalid email format',
        source: 'validation'
      };
    }
    
    // Create standardized entry
    const entry: WaitlistEntry = {
      email: email.toLowerCase().trim(),
      source: options.source || 'waitlist',
      metadata: options.metadata || {}
    };
    
    // Try Supabase first with retries
    let attempts = 0;
    let lastError: any = null;
    
    while (attempts < this.maxRetries) {
      try {
        return await this.saveEmailToSupabase(entry);
      } catch (error) {
        lastError = error;
        console.error(`Supabase save attempt ${attempts + 1} failed:`, error);
        attempts++;
        
        if (attempts < this.maxRetries) {
          // Wait with exponential backoff before retry
          await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempts)));
        }
      }
    }
    
    // If Supabase fails after all retries, try file storage
    try {
      return await this.saveEmailToFile(entry);
    } catch (fileError) {
      console.error('File storage also failed:', fileError);
      
      // Last resort - memory storage
      return this.saveEmailToMemory(entry);
    }
  }
  
  /**
   * Save email to Supabase
   */
  private async saveEmailToSupabase(entry: WaitlistEntry): Promise<WaitlistResponse> {
    // Check if email already exists
    const { data: existingData, error: checkError } = await supabase
      .from(this.tableName)
      .select('id, email')
      .eq('email', entry.email)
      .limit(1);
      
    if (checkError) {
      logDatabaseOperation('Error checking existing email', { error: checkError });
      throw new Error(`Database error: ${checkError.message}`);
    }
    
    // If email already exists, return success with existing data
    if (existingData && existingData.length > 0) {
      logDatabaseOperation('Email already exists', { email: entry.email });
      return {
        success: true,
        message: 'Email already in waitlist',
        data: { id: existingData[0].id },
        source: 'supabase-existing'
      };
    }
    
    // Try insert with basic fields
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert([{
          email: entry.email,
          source: entry.source,
          metadata: entry.metadata
        }])
        .select();
        
      if (error) {
        // If there's an error about missing columns, try with just email
        logDatabaseOperation('Full insert failed, trying minimal insert', { error });
        
        const { data: minimalData, error: minimalError } = await supabase
          .from(this.tableName)
          .insert([{ email: entry.email }])
          .select();
          
        if (minimalError) {
          logDatabaseOperation('Even minimal insert failed', { error: minimalError });
          throw new Error(`Database insert error: ${minimalError.message}`);
        }
        
        return {
          success: true,
          message: 'Email added to waitlist with minimal data',
          data: minimalData,
          source: 'supabase-minimal'
        };
      }
      
      logDatabaseOperation('Email added successfully', { email: entry.email });
      return {
        success: true,
        message: 'Email added to waitlist',
        data: data,
        source: 'supabase'
      };
    } catch (error) {
      logDatabaseOperation('Error during database insert', { error });
      throw error;
    }
  }
  
  /**
   * Save email to file (fallback)
   */
  private async saveEmailToFile(entry: WaitlistEntry): Promise<WaitlistResponse> {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Read existing data or create empty structure
    let data = {
      emails: [] as string[],
      lastUpdated: new Date().toISOString()
    };
    
    // Try to read existing file
    if (fs.existsSync(WAITLIST_FILE)) {
      try {
        const fileContent = fs.readFileSync(WAITLIST_FILE, 'utf8');
        const parsedData = JSON.parse(fileContent);
        if (parsedData && Array.isArray(parsedData.emails)) {
          data.emails = parsedData.emails;
        }
      } catch (readError) {
        console.error('Error reading waitlist file:', readError);
        // Continue with empty data
      }
    }
    
    // Check if email already exists
    if (data.emails.includes(entry.email)) {
      return {
        success: true,
        message: 'Email already in waitlist',
        source: 'file-existing'
      };
    }
    
    // Add email and save file
    data.emails.push(entry.email);
    data.lastUpdated = new Date().toISOString();
    
    fs.writeFileSync(WAITLIST_FILE, JSON.stringify(data, null, 2));
    
    return {
      success: true,
      message: 'Email added to waitlist',
      source: 'file'
    };
  }
  
  /**
   * Save email to memory (last resort)
   */
  private saveEmailToMemory(entry: WaitlistEntry): WaitlistResponse {
    // Define global storage if not exists
    if (typeof global.waitlistEmails === 'undefined') {
      global.waitlistEmails = [];
    }
    
    // Check for duplicate
    if (global.waitlistEmails.includes(entry.email)) {
      return {
        success: true,
        message: 'Email already in waitlist',
        source: 'memory-existing'
      };
    }
    
    // Add email to memory
    global.waitlistEmails.push(entry.email);
    console.log(`[URGENT] Email saved to memory only: ${entry.email}`);
    console.log(`[URGENT] Total emails in memory: ${global.waitlistEmails.length}`);
    
    return {
      success: true,
      message: 'Email added to waitlist (memory only)',
      source: 'memory'
    };
  }
  
  /**
   * Get all waitlist emails
   */
  public async getEmails(): Promise<string[]> {
    try {
      // Try Supabase first with schema compatibility
      try {
        // Try with created_at ordering
        const { data, error } = await supabase
          .from(this.tableName)
          .select('email')
          .order('created_at', { ascending: false });
          
        if (!error && data && data.length > 0) {
          return data.map(item => item.email);
        }
        
        // If there's an error about created_at column, try without ordering
        if (error) {
          // Try without ordering
          const { data: basicData, error: basicError } = await supabase
            .from(this.tableName)
            .select('email');
            
          if (!basicError && basicData && basicData.length > 0) {
            return basicData.map(item => item.email);
          }
        }
      } catch (dbError) {
        console.error('Database retrieval error:', dbError);
      }
      
      // Fallback to file storage
      return this.getEmailsFromFile();
    } catch (error) {
      console.error('Error getting emails, falling back to file:', error);
      return this.getEmailsFromFile();
    }
  }
  
  /**
   * Get emails from file
   */
  private getEmailsFromFile(): string[] {
    try {
      if (fs.existsSync(WAITLIST_FILE)) {
        const fileContent = fs.readFileSync(WAITLIST_FILE, 'utf8');
        const parsedData = JSON.parse(fileContent);
        if (parsedData && Array.isArray(parsedData.emails)) {
          return parsedData.emails;
        }
      }
      return [];
    } catch (error) {
      console.error('Error reading emails from file:', error);
      
      // Last resort - memory
      return typeof global.waitlistEmails !== 'undefined' ? 
        global.waitlistEmails : [];
    }
  }
  
  /**
   * Test connection to Supabase
   */
  public async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .select('count', { count: 'exact', head: true });
      
      return !error;
    } catch (error) {
      console.error('Connection test error:', error);
      return false;
    }
  }
}

// Create a singleton instance
const waitlistService = WaitlistService.getInstance();
export default waitlistService;
