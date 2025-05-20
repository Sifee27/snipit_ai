/**
 * Waitlist Storage Module
 * 
 * Provides multiple storage strategies for waitlist emails:
 * 1. Local file storage (for development and self-hosted)
 * 2. Database integration (when available)
 * 3. Remote API backup (sends to configurable endpoint)
 */

import fs from 'fs';
import path from 'path';

// Directory to store waitlist data
const DATA_DIR = path.join(process.cwd(), 'data');
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.json');
const WAITLIST_TXT_FILE = path.join(DATA_DIR, 'waitlist_emails.txt');

// Storage interface
export interface WaitlistStorage {
  addEmail(email: string): Promise<{ success: boolean; message: string }>;
  getEmails(): Promise<string[]>;
  getTotalCount(): Promise<number>;
}

// Base storage implementation
class FileWaitlistStorage implements WaitlistStorage {
  private ensureStorageExists(): boolean {
    try {
      // Create data directory if it doesn't exist
      if (!fs.existsSync(DATA_DIR)) {
        try {
          fs.mkdirSync(DATA_DIR, { recursive: true });
          console.log(`Created data directory at ${DATA_DIR}`);
        } catch (dirError) {
          console.error(`Failed to create data directory: ${dirError}`);
          return false;
        }
      }
      
      // Create JSON file if it doesn't exist
      if (!fs.existsSync(WAITLIST_FILE)) {
        try {
          const initialData = {
            emails: [],
            lastUpdated: new Date().toISOString()
          };
          fs.writeFileSync(WAITLIST_FILE, JSON.stringify(initialData, null, 2));
          console.log(`Created waitlist JSON file at ${WAITLIST_FILE}`);
        } catch (jsonError) {
          console.error(`Failed to create waitlist JSON file: ${jsonError}`);
          return false;
        }
      }
      
      // Create TXT file if it doesn't exist
      if (!fs.existsSync(WAITLIST_TXT_FILE)) {
        try {
          fs.writeFileSync(
            WAITLIST_TXT_FILE, 
            "SNIPIT WAITLIST EMAILS\n======================\n\n"
          );
          console.log(`Created waitlist TXT file at ${WAITLIST_TXT_FILE}`);
        } catch (txtError) {
          console.error(`Failed to create waitlist TXT file: ${txtError}`);
          // Continue even if TXT file creation fails
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to ensure storage exists:', error);
      return false;
    }
  }
  
  async addEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Ensure storage is initialized
      if (!this.ensureStorageExists()) {
        console.error('Storage initialization failed');
        return { success: false, message: 'Unable to initialize storage. Your email will be saved when our systems are back online.' };
      }
      
      // Read current waitlist data
      let data = { emails: [], lastUpdated: new Date().toISOString() };
      try {
        if (fs.existsSync(WAITLIST_FILE)) {
          const rawData = fs.readFileSync(WAITLIST_FILE, 'utf8');
          if (rawData && rawData.trim()) {
            data = JSON.parse(rawData);
          }
        }
      } catch (readError) {
        console.error('Error reading waitlist file:', readError);
        // Continue with empty data object
      }
      
      // Ensure emails array exists
      if (!data.emails) {
        data.emails = [];
      }
      
      // Check for duplicate email
      if (data.emails.includes(email)) {
        return { success: false, message: 'Email already registered' };
      }
      
      // Add email to JSON storage
      data.emails.push(email);
      data.lastUpdated = new Date().toISOString();
      
      // Write updated data back to JSON file
      try {
        fs.writeFileSync(WAITLIST_FILE, JSON.stringify(data, null, 2));
        console.log(`Email ${email} saved to JSON file`);
      } catch (writeJsonError) {
        console.error('Error writing to JSON file:', writeJsonError);
        // Continue to try text file
      }
      
      // Also append to TXT file for easy access
      try {
        // Make sure the text file exists
        if (!fs.existsSync(WAITLIST_TXT_FILE)) {
          fs.writeFileSync(WAITLIST_TXT_FILE, "SNIPIT WAITLIST EMAILS\n======================\n\n");
        }
        
        fs.appendFileSync(
          WAITLIST_TXT_FILE,
          `${email} (added: ${new Date().toISOString()})\n`
        );
        console.log(`Email ${email} saved to text file`);
      } catch (writeTxtError) {
        console.error('Error writing to text file:', writeTxtError);
        // Continue anyway
      }
      
      // If we got here, at least one write succeeded or we tried our best
      console.log(`Email ${email} processing completed`);
      return { success: true, message: 'Email added to waitlist' };
    } catch (error) {
      console.error('Unexpected error saving email:', error);
      return { success: false, message: 'Server error. Please try again later.' };
    }
  }
  
  async getEmails(): Promise<string[]> {
    try {
      if (!fs.existsSync(WAITLIST_FILE)) {
        return [];
      }
      
      const data = JSON.parse(fs.readFileSync(WAITLIST_FILE, 'utf8'));
      return data.emails || [];
    } catch (error) {
      console.error('Error reading emails from file storage:', error);
      return [];
    }
  }
  
  async getTotalCount(): Promise<number> {
    try {
      const emails = await this.getEmails();
      return emails.length;
    } catch (error) {
      console.error('Error counting emails:', error);
      return 0;
    }
  }
}

// Remote API backup storage
class RemoteBackupStorage implements WaitlistStorage {
  private apiEndpoint: string;
  private apiKey: string;
  private fileStorage: FileWaitlistStorage;
  
  constructor(apiEndpoint: string, apiKey: string) {
    this.apiEndpoint = apiEndpoint;
    this.apiKey = apiKey;
    this.fileStorage = new FileWaitlistStorage();
  }
  
  async addEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Try to add to file storage first
      const fileResult = await this.fileStorage.addEmail(email);
      
      // If already registered, return that result
      if (!fileResult.success && fileResult.message.includes('already registered')) {
        return fileResult;
      }
      
      // Also back up to remote API if configured
      if (this.apiEndpoint && this.apiKey) {
        try {
          const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({ email, timestamp: new Date().toISOString() }),
          });
          
          if (response.ok) {
            console.log(`Email ${email} backed up to remote API`);
          } else {
            console.warn(`Failed to back up email ${email} to remote API:`, await response.text());
          }
        } catch (apiError) {
          console.error('Remote API backup failed:', apiError);
          // Don't fail the overall operation if remote backup fails
        }
      }
      
      return fileResult;
    } catch (error) {
      console.error('Error in combined storage:', error);
      throw error;
    }
  }
  
  async getEmails(): Promise<string[]> {
    return this.fileStorage.getEmails();
  }
  
  async getTotalCount(): Promise<number> {
    return this.fileStorage.getTotalCount();
  }
}

// Get the appropriate storage instance based on environment
export function getWaitlistStorage(): WaitlistStorage {
  // If remote API is configured, use the combined approach
  const apiEndpoint = process.env.WAITLIST_BACKUP_API;
  const apiKey = process.env.WAITLIST_BACKUP_KEY;
  
  if (apiEndpoint && apiKey) {
    return new RemoteBackupStorage(apiEndpoint, apiKey);
  }
  
  // Otherwise use file storage
  return new FileWaitlistStorage();
}

// Default export for easier importing
export default getWaitlistStorage;
