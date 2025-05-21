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
      // Check if we can query the table
      const { error } = await supabase
        .from(this.tableName)
        .select('count', { count: 'exact', head: true });
      
      if (error && error.code === '42P01') { // Table doesn't exist error
        logDatabaseOperation('Table does not exist', { table: this.tableName });
        
        // Try to create the table (may fail with anon key permissions)
        try {
          const createSql = `
            CREATE TABLE IF NOT EXISTS ${this.tableName} (
              id SERIAL PRIMARY KEY,
              email TEXT NOT NULL UNIQUE,
              source TEXT,
              metadata JSONB,
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
          `;
          
          // This will likely fail with anon key but worth trying
          const { error: createError } = await supabase.rpc('execute_sql', { sql: createSql });
          
          if (createError) {
            logDatabaseOperation('Failed to create table - normal if using anon key', { error: createError });
          } else {
            logDatabaseOperation('Table created successfully', { table: this.tableName });
          }
        } catch (err) {
          logDatabaseOperation('Error creating table', { error: err });
        }
      } else {
        logDatabaseOperation('Table exists and is accessible', { table: this.tableName });
      }
    } catch (error) {
      console.error('Error checking table existence:', error);
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
    
    // Insert new email
    const { data, error } = await supabase
      .from(this.tableName)
      .insert([{
        email: entry.email,
        source: entry.source,
        metadata: entry.metadata
      }])
      .select();
      
    if (error) {
      logDatabaseOperation('Error adding email', { error, email: entry.email });
      throw new Error(`Insert error: ${error.message}`);
    }
    
    logDatabaseOperation('Email added successfully', { email: entry.email });
    return {
      success: true,
      message: 'Email added to waitlist',
      data: data?.[0],
      source: 'supabase'
    };
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
      // Try Supabase first
      const { data, error } = await supabase
        .from(this.tableName)
        .select('email');
      
      if (!error && data && data.length > 0) {
        return data.map(item => item.email);
      }
      
      // Fallback to file
      return this.getEmailsFromFile();
    } catch (error) {
      console.error('Error getting emails from database:', error);
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
        const data = JSON.parse(fileContent);
        if (data && Array.isArray(data.emails)) {
          return data.emails;
        }
      }
      return [];
    } catch (error) {
      console.error('Error reading waitlist file:', error);
      return [];
    }
  }
  
  /**
   * Check if the database connection is working
   */
  public async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .select('count', { count: 'exact', head: true });
      
      return !error;
    } catch {
      return false;
    }
  }
}

// Create a singleton instance
const waitlistService = WaitlistService.getInstance();
export default waitlistService;
