/**
 * Waitlist Storage Module
 * 
 * Provides multiple storage strategies for waitlist emails:
 * 1. Local file storage (for development and self-hosted)
 * 2. Database integration (when available)
 * 3. Remote API backup (sends to configurable endpoint)
 * 
 * ENHANCED DEBUGGING VERSION
 */

import fs from 'fs';
import path from 'path';

// Define proper TypeScript interface for waitlist data at module scope
interface WaitlistData {
  emails: string[];
  lastUpdated: string;
}

// Directory to store waitlist data
// This is a critical section - we need to ensure these paths work in all environments

// In production, some hosting providers have read-only filesystems except for specific directories like /tmp
// Check for environment-specific storage paths
const getStoragePath = () => {
  // Check for environment variables defining storage locations
  if (process.env.WAITLIST_DATA_DIR) {
    return process.env.WAITLIST_DATA_DIR;
  }
  
  // Check if we're in a Vercel environment (or other serverless environment)
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    // Use /tmp for serverless environments with ephemeral filesystems
    // Note: this data will be lost on deployment, but works for temporary storage
    return path.join('/tmp');
  }
  
  // Default storage location - project root /data directory
  return path.join(process.cwd(), 'data');
};

const DATA_DIR = getStoragePath();
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
    // Create a detailed report of the environment to help with debugging
    const storageDebugInfo = {
      dataDir: DATA_DIR,
      waitlistFile: WAITLIST_FILE,
      processCwd: process.cwd(),
      nodeEnv: process.env.NODE_ENV,
      platform: process.platform,
      isVercel: !!process.env.VERCEL,
      isAws: !!process.env.AWS_LAMBDA_FUNCTION_NAME,
      timestamp: new Date().toISOString()
    };
    
    console.log(`[Storage] STORAGE DEBUG INFO: ${JSON.stringify(storageDebugInfo)}`);
    const timestamp = new Date().toISOString();
    console.log(`[Storage ${timestamp}] Ensuring storage directory and files exist...`);
    console.log(`[Storage ${timestamp}] DATA_DIR: ${DATA_DIR}`);
    console.log(`[Storage ${timestamp}] WAITLIST_FILE: ${WAITLIST_FILE}`);
    console.log(`[Storage ${timestamp}] process.cwd(): ${process.cwd()}`);
    console.log('[Storage] Ensuring storage directory and files exist...');
    try {
      // Create data directory if it doesn't exist
      if (!fs.existsSync(DATA_DIR)) {
        try {
          fs.mkdirSync(DATA_DIR, { recursive: true });
          console.log(`[Storage] Created data directory at ${DATA_DIR}`);
        } catch (dirError: any) {
          console.error(`[Storage] FATAL: Failed to create data directory: ${DATA_DIR}`, dirError.message, dirError.stack);
          return false;
        }
      }
      
      // Create JSON file if it doesn't exist
      if (!fs.existsSync(WAITLIST_FILE)) {
        try {
          const initialData: WaitlistData = {
            emails: [],
            lastUpdated: new Date().toISOString()
          };
          fs.writeFileSync(WAITLIST_FILE, JSON.stringify(initialData, null, 2));
          console.log(`[Storage] Created waitlist JSON file at ${WAITLIST_FILE} with initial data.`);
        } catch (jsonError: any) {
          console.error(`[Storage] FATAL: Failed to create waitlist JSON file: ${WAITLIST_FILE}`, jsonError.message, jsonError.stack);
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
          console.log(`[Storage] Created waitlist TXT file at ${WAITLIST_TXT_FILE}`);
        } catch (txtError: any) {
          console.warn(`[Storage] Non-fatal: Failed to create waitlist TXT file: ${WAITLIST_TXT_FILE}`, txtError.message);
          // Continue even if TXT file creation fails, JSON is primary
        }
      }
      console.log('[Storage] Storage directory and files verified/created.');
      return true;
    } catch (error: any) {
      console.error('[Storage] FATAL: Unexpected error in ensureStorageExists:', error.message, error.stack);
      return false;
    }
  }
  
  async addEmail(email: string): Promise<{ success: boolean; message: string }> {
    const timestamp = new Date().toISOString();
    console.log(`[Storage ${timestamp}] addEmail called for: ${email}`);
    console.log(`[Storage ${timestamp}] Current working directory: ${process.cwd()}`);
    console.log(`[Storage] addEmail called for: ${email}`);
    try {
      // Ensure storage is initialized
      if (!this.ensureStorageExists()) {
        console.error('[Storage] addEmail: Storage initialization failed critically.');
        return { success: false, message: 'Server error: Storage system is unavailable. Please contact support.' };
      }
      
      // Initialize with correctly typed empty data
      let data: WaitlistData = { 
        emails: [], 
        lastUpdated: new Date().toISOString() 
      };
      
      try {
        if (fs.existsSync(WAITLIST_FILE)) {
          console.log(`[Storage] Reading existing waitlist file: ${WAITLIST_FILE}`);
          const rawData = fs.readFileSync(WAITLIST_FILE, 'utf8');
          
          if (rawData && rawData.trim()) {
            const parsedData = JSON.parse(rawData);
            console.log(`[Storage] Parsed waitlist data:`, JSON.stringify(parsedData).substring(0, 200) + '...'); // Log snippet
            
            if (parsedData && typeof parsedData === 'object') {
              if (Array.isArray(parsedData.emails) && parsedData.emails.every((item: any) => typeof item === 'string')) {
                data.emails = parsedData.emails;
              } else {
                console.warn(`[Storage] Invalid or non-string 'emails' array in waitlist file. Resetting 'emails'. Found:`, parsedData.emails);
                data.emails = []; // Reset to empty string array if malformed
              }
              
              if (typeof parsedData.lastUpdated === 'string') {
                data.lastUpdated = parsedData.lastUpdated;
              } else {
                console.warn(`[Storage] Invalid or missing 'lastUpdated' in waitlist file. Using current time.`);
                data.lastUpdated = new Date().toISOString(); 
              }
            } else {
              console.warn(`[Storage] Parsed data is not a valid object. Resetting to default. Parsed:`, parsedData);
            }
          } else {
            console.log(`[Storage] Waitlist file is empty or whitespace. Initializing with default data.`);
          }
        } else {
          console.log(`[Storage] Waitlist file ${WAITLIST_FILE} doesn't exist. Initializing with default data (should have been created by ensureStorageExists).`);
        }
      } catch (readError: any) {
        console.error('[Storage] Error reading or parsing waitlist file:', readError.message, readError.stack);
        console.warn('[Storage] Proceeding with an empty email list due to read/parse error.');
        // data is already initialized to a safe default
      }
      
      // Ensure emails array exists (double-check after parsing)
      if (!Array.isArray(data.emails)) {
        console.warn(`[Storage] data.emails is not an array after parsing. Resetting. Type: ${typeof data.emails}`);
        data.emails = [];
      }
      
      // Check for duplicate email
      if (data.emails.includes(email)) {
        console.log(`[Storage] Email ${email} already registered.`);
        return { success: false, message: 'Email already registered' };
      }
      
      // Add email to JSON storage
      data.emails.push(email);
      data.lastUpdated = new Date().toISOString();
      
      // Write updated data back to JSON file
      try {
        const timestamp = new Date().toISOString();
        console.log(`[Storage ${timestamp}] Attempting to write updated data to ${WAITLIST_FILE}. Email count: ${data.emails.length}`);
        console.log(`[Storage ${timestamp}] Checking file exists before write: ${fs.existsSync(WAITLIST_FILE)}`);
        console.log(`[Storage ${timestamp}] Checking directory exists before write: ${fs.existsSync(DATA_DIR)}`);
        console.log(`[Storage ${timestamp}] Current working directory: ${process.cwd()}`);
        console.log(`[Storage] Attempting to write updated data to ${WAITLIST_FILE}. Email count: ${data.emails.length}`);
        console.log(`[Storage] Data to write (first 200 chars): ${JSON.stringify(data, null, 2).substring(0,200)}...`);
        let writeSuccess = false;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!writeSuccess && retryCount < maxRetries) {
          try {
            // Force synchronous write to ensure completion
            const dataString = JSON.stringify(data, null, 2);
            console.log(`[Storage ${new Date().toISOString()}] Writing data string (first 100 chars): ${dataString.substring(0, 100)}...`);
            console.log(`[Storage ${new Date().toISOString()}] Writing to: ${WAITLIST_FILE}`);
            fs.writeFileSync(WAITLIST_FILE, dataString);
            console.log(`[Storage ${new Date().toISOString()}] Write completed, checking file exists: ${fs.existsSync(WAITLIST_FILE)}`);
            // Verify content was actually written
            const verifyContent = fs.existsSync(WAITLIST_FILE) ? fs.readFileSync(WAITLIST_FILE, 'utf8') : 'FILE_NOT_FOUND';
            console.log(`[Storage ${new Date().toISOString()}] Verification read (first 100 chars): ${verifyContent.substring(0, 100)}...`);
            writeSuccess = true;
            console.log(`[Storage] Email ${email} successfully saved to JSON file (attempt ${retryCount + 1})`);
          } catch (retryError: any) {
            retryCount++;
            console.error(`[Storage] JSON Write attempt ${retryCount} failed:`, retryError.message, retryError.stack);
            
            // Small delay before retry
            if (retryCount < maxRetries) {
              console.log(`[Storage] Retrying JSON write in 100ms...`);
              const startTime = Date.now();
              while (Date.now() - startTime < 100) {
                // Wait
              }
            }
          }
        }
        
        if (!writeSuccess) {
          console.error(`[Storage] FATAL: Failed to write to JSON file ${WAITLIST_FILE} after ${maxRetries} attempts.`);
          throw new Error(`Failed to write to JSON file after ${maxRetries} attempts`);
        }
      } catch (writeJsonError: any) {
        console.error('[Storage] FATAL: Error writing to JSON file:', writeJsonError.message, writeJsonError.stack);
        // If JSON write fails, this is critical. The TXT is just a backup.
        return { success: false, message: 'Server error: Failed to save email to primary storage.' };
      }
      
      // Also append to TXT file for easy access
      try {
        console.log(`[Storage] Attempting to append ${email} to TXT file: ${WAITLIST_TXT_FILE}`);
        // Make sure the text file exists (it should, from ensureStorageExists)
        if (!fs.existsSync(WAITLIST_TXT_FILE)) {
          console.warn(`[Storage] TXT file ${WAITLIST_TXT_FILE} missing, attempting to create.`);
          fs.writeFileSync(WAITLIST_TXT_FILE, "SNIPIT WAITLIST EMAILS\n======================\n\n");
        }
        
        fs.appendFileSync(
          WAITLIST_TXT_FILE,
          `${email} (added: ${new Date().toISOString()})\n`
        );
        console.log(`[Storage] Email ${email} successfully appended to text file.`);
      } catch (writeTxtError: any) {
        console.warn('[Storage] Non-fatal: Error writing to text file backup:', writeTxtError.message, writeTxtError.stack);
        // Continue anyway, JSON is primary
      }
      
      console.log(`[Storage] Email ${email} processing completed. Returning success.`);
      return { success: true, message: 'Email added to waitlist' };
    } catch (error: any) {
      console.error('[Storage] FATAL: Unexpected error in addEmail:', error.message, error.stack);
      return { success: false, message: 'Server error: An unexpected issue occurred. Please try again later.' };
    }
  }
  
  async getEmails(): Promise<string[]> {
    console.log('[Storage] getEmails called.');
    try {
      if (!this.ensureStorageExists()) { // Ensure files are there before reading
         console.error('[Storage] getEmails: Storage initialization failed.');
         return [];
      }
      if (!fs.existsSync(WAITLIST_FILE)) {
        console.log('[Storage] getEmails: Waitlist JSON file does not exist.');
        return [];
      }
      
      console.log(`[Storage] Reading emails from ${WAITLIST_FILE}`);
      const rawData = fs.readFileSync(WAITLIST_FILE, 'utf8');
      if (!rawData || !rawData.trim()) {
          console.log('[Storage] getEmails: Waitlist JSON file is empty.');
          return [];
      }
      const data: WaitlistData = JSON.parse(rawData);
      if (Array.isArray(data.emails) && data.emails.every(e => typeof e === 'string')) {
        console.log(`[Storage] Successfully retrieved ${data.emails.length} emails.`);
        return data.emails;
      } else {
        console.warn('[Storage] getEmails: Data in waitlist file is malformed (emails is not a string array). Returning empty list.');
        return [];
      }
    } catch (error: any) {
      console.error('[Storage] Error reading emails from file storage:', error.message, error.stack);
      return [];
    }
  }
  
  async getTotalCount(): Promise<number> {
    console.log('[Storage] getTotalCount called.');
    const emails = await this.getEmails();
    return emails.length;
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
    console.log(`[RemoteBackupStorage] addEmail called for: ${email}`);
    let fileResult: { success: boolean; message: string } = { success: false, message: 'File storage operation not completed' };
    try {
      // Try to add to file storage first
      fileResult = await this.fileStorage.addEmail(email);
      console.log(`[RemoteBackupStorage] File storage result for ${email}:`, fileResult);
      
      // If file storage itself indicated an issue (e.g. already registered, or critical file write error from primary)
      if (!fileResult.success) {
        return fileResult; // Propagate the specific error message from file storage
      }
      
      // If file storage was successful, then proceed to remote backup
      if (this.apiEndpoint && this.apiKey) {
        console.log(`[RemoteBackupStorage] Attempting to back up ${email} to remote API: ${this.apiEndpoint}`);
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
            console.log(`[RemoteBackupStorage] Email ${email} successfully backed up to remote API.`);
          } else {
            const errorText = await response.text();
            console.warn(`[RemoteBackupStorage] Failed to back up email ${email} to remote API. Status: ${response.status}. Response: ${errorText}`);
          }
        } catch (apiError: any) {
          console.error('[RemoteBackupStorage] Remote API backup failed due to fetch/network error:', apiError.message, apiError.stack);
          // Don't fail the overall operation if remote backup fails, as primary (file) succeeded
        }
      }
      
      return fileResult; // Return the result from primary file storage
    } catch (error: any) {
      console.error('[RemoteBackupStorage] Unexpected error in addEmail:', error.message, error.stack);
      // If an error occurs here, it might be before or after fileResult is set.
      // Prioritize returning fileResult if it's meaningful, otherwise a generic error.
      if (fileResult.message !== 'File storage operation not completed') {
        return fileResult; 
      }
      return { success: false, message: 'Server error: An unexpected issue occurred during backup. Email might be saved locally.' };
    }
  }
  
  async getEmails(): Promise<string[]> {
    console.log('[RemoteBackupStorage] getEmails called, delegating to file storage.');
    return this.fileStorage.getEmails();
  }
  
  async getTotalCount(): Promise<number> {
    console.log('[RemoteBackupStorage] getTotalCount called, delegating to file storage.');
    return this.fileStorage.getTotalCount();
  }
}

// Get the appropriate storage instance based on environment
function getWaitlistStorage(): WaitlistStorage {
  // Special handling for production environments
  if (process.env.NODE_ENV === 'production') {
    console.log('[Storage] Running in production environment');
    
    // Check if we should use remote backup
    const apiEndpoint = process.env.WAITLIST_BACKUP_API;
    const apiKey = process.env.WAITLIST_BACKUP_KEY;
    
    if (apiEndpoint && apiKey) {
      console.log('[Storage] Using remote backup storage with API endpoint');
      return new RemoteBackupStorage(apiEndpoint, apiKey);
    }
    
    // Use database if available (not implemented yet)
    // if (process.env.DATABASE_URL) {
    //   return new DatabaseWaitlistStorage(process.env.DATABASE_URL);
    // }
  }
  
  // Default to file storage for development
  console.log('[Storage] Using local file storage');
  return new FileWaitlistStorage();
}

// Default export for easier importing
export default getWaitlistStorage;
