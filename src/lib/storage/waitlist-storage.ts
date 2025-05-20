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
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      
      // Create JSON file if it doesn't exist
      if (!fs.existsSync(WAITLIST_FILE)) {
        fs.writeFileSync(WAITLIST_FILE, JSON.stringify({
          emails: [],
          lastUpdated: new Date().toISOString()
        }, null, 2));
      }
      
      // Create TXT file if it doesn't exist
      if (!fs.existsSync(WAITLIST_TXT_FILE)) {
        fs.writeFileSync(
          WAITLIST_TXT_FILE, 
          "SNIPIT WAITLIST EMAILS\n======================\n\n"
        );
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
        throw new Error('Storage initialization failed');
      }
      
      // Read current waitlist data
      const rawData = fs.readFileSync(WAITLIST_FILE, 'utf8');
      const data = JSON.parse(rawData || '{"emails":[],"lastUpdated":""}');
      
      // Check for duplicate email
      if (data.emails.includes(email)) {
        return { success: false, message: 'Email already registered' };
      }
      
      // Add email to JSON storage
      data.emails.push(email);
      data.lastUpdated = new Date().toISOString();
      
      // Write updated data back to JSON file
      fs.writeFileSync(WAITLIST_FILE, JSON.stringify(data, null, 2));
      
      // Also append to TXT file for easy access
      fs.appendFileSync(
        WAITLIST_TXT_FILE,
        `${email} (added: ${new Date().toISOString()})\n`
      );
      
      console.log(`Email ${email} successfully saved to waitlist`);
      return { success: true, message: 'Email added to waitlist' };
    } catch (error) {
      console.error('Error saving email to file storage:', error);
      throw error; // Propagate error for handling by caller
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
