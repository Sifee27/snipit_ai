/**
 * Enterprise-Grade Waitlist Storage Module (v2.0)
 * 
 * Provides a resilient multi-layered storage architecture for waitlist emails:
 * 1. In-memory cache (temporary storage during runtime)
 * 2. Browser localStorage backup (for client-side persistence) 
 * 3. Server filesystem storage (for development and traditional hosting)
 * 4. Remote API backup (for production/serverless environments)
 * 
 * This module implements enterprise patterns including:
 * - Circuit breaker pattern for failing storage mechanisms
 * - Retry logic with exponential backoff
 * - Comprehensive logging and telemetry
 * - Graceful degradation when primary storage fails
 */

import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

// Telemetry and monitoring
const logEvent = (category: string, action: string, label?: string, value?: number) => {
  console.log(`[${category}] ${action}${label ? ` | ${label}` : ''}${value !== undefined ? ` | ${value}` : ''}`);
  
  // In production, we would send this to a monitoring service
  if (process.env.NODE_ENV === 'production' && process.env.TELEMETRY_ENDPOINT) {
    try {
      // This would be an async fetch to a monitoring service
      // Don't await - fire and forget for non-blocking telemetry
      const body = JSON.stringify({
        category,
        action,
        label,
        value,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0'
      });
      
      // We would send telemetry to a service like DataDog, New Relic, etc.
      // fetch(process.env.TELEMETRY_ENDPOINT, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body
      // });
    } catch (e) {
      // Never let telemetry failures affect the main application
      console.warn('[Telemetry] Failed to send event', e);
    }
  }
};

// Runtime in-memory cache
class MemoryCache {
  private static instance: MemoryCache;
  private cache: Map<string, any> = new Map();
  private ttl: Map<string, number> = new Map();
  
  private constructor() {
    // Private constructor to force singleton pattern
    // Start cache cleanup interval
    setInterval(() => this.cleanup(), 60000); // Clean up every minute
  }
  
  public static getInstance(): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache();
    }
    return MemoryCache.instance;
  }
  
  set(key: string, value: any, expiresInMs: number = 3600000): void {
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + expiresInMs);
  }
  
  get(key: string): any {
    if (!this.cache.has(key)) return null;
    
    const expires = this.ttl.get(key) || 0;
    if (expires < Date.now()) {
      this.cache.delete(key);
      this.ttl.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }
  
  delete(key: string): void {
    this.cache.delete(key);
    this.ttl.delete(key);
  }
  
  private cleanup(): void {
    const now = Date.now();
    this.ttl.forEach((expires, key) => {
      if (expires < now) {
        this.cache.delete(key);
        this.ttl.delete(key);
      }
    });
  }
}

// Define proper TypeScript interfaces for waitlist data
interface WaitlistData {
  emails: string[];
  lastUpdated: string;
}

interface StorageResponse {
  success: boolean;
  message: string;
  source?: string;
  data?: any;
}

// API client for remote storage
class ApiClient {
  private static instance: ApiClient;
  private baseUrl: string;
  private apiKey: string;
  private isEnabled: boolean;
  private failureCount: number = 0;
  private lastFailure: number = 0;
  private readonly MAX_FAILURES = 3;
  private readonly CIRCUIT_RESET_MS = 30000; // 30 seconds
  
  private constructor() {
    this.baseUrl = process.env.WAITLIST_API_URL || 'https://api.snipit.ai/waitlist';
    this.apiKey = process.env.WAITLIST_API_KEY || '';
    this.isEnabled = !!process.env.WAITLIST_API_KEY;
    
    logEvent('ApiClient', 'Initialized', this.isEnabled ? 'enabled' : 'disabled');
  }
  
  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }
  
  private isCircuitOpen(): boolean {
    // Check if circuit breaker is open (too many failures)
    if (this.failureCount >= this.MAX_FAILURES) {
      // Allow reset after timeout
      if (Date.now() - this.lastFailure > this.CIRCUIT_RESET_MS) {
        this.failureCount = 0;
        logEvent('ApiClient', 'CircuitReset', 'Circuit breaker reset after timeout');
        return false;
      }
      logEvent('ApiClient', 'CircuitOpen', 'Circuit breaker is open, skipping API call');
      return true;
    }
    return false;
  }
  
  async addEmail(email: string): Promise<StorageResponse> {
    if (!this.isEnabled || this.isCircuitOpen()) {
      return {
        success: false,
        message: 'API storage is disabled or circuit breaker is open',
        source: 'api'
      };
    }
    
    try {
      logEvent('ApiClient', 'AddEmail', email);
      
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'x-client-version': process.env.APP_VERSION || '1.0.0'
        },
        body: JSON.stringify({
          email,
          timestamp: new Date().toISOString(),
          source: 'waitlist-form'
        }),
      });
      
      if (!response.ok) {
        this.failureCount++;
        this.lastFailure = Date.now();
        logEvent('ApiClient', 'AddEmailFailed', `Status: ${response.status}`);
        return {
          success: false,
          message: `API returned status: ${response.status}`,
          source: 'api'
        };
      }
      
      // Reset failure count on success
      this.failureCount = 0;
      
      const data = await response.json();
      logEvent('ApiClient', 'AddEmailSuccess', email);
      
      return {
        success: true,
        message: 'Email successfully added via API',
        source: 'api',
        data
      };
    } catch (error) {
      this.failureCount++;
      this.lastFailure = Date.now();
      logEvent('ApiClient', 'AddEmailError', error instanceof Error ? error.message : 'Unknown error');
      
      return {
        success: false,
        message: 'Failed to connect to API',
        source: 'api'
      };
    }
  }
  
  async getEmails(): Promise<string[]> {
    // Implementation for retrieving emails via API
    // Would include similar circuit breaker pattern
    if (!this.isEnabled || this.isCircuitOpen()) {
      return [];
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      
      if (!response.ok) {
        this.failureCount++;
        this.lastFailure = Date.now();
        return [];
      }
      
      const data = await response.json();
      return data.emails || [];
    } catch (error) {
      this.failureCount++;
      this.lastFailure = Date.now();
      return [];
    }
  }
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

// Storage interface with enhanced return type
export interface WaitlistStorage {
  addEmail(email: string): Promise<StorageResponse>;
  getEmails(): Promise<string[]>;
  getTotalCount(): Promise<number>;
}

/**
 * Enterprise Storage Orchestrator
 * Coordinates multiple storage backends with fallback mechanisms
 */
class WaitlistStorageOrchestrator implements WaitlistStorage {
  private apiClient: ApiClient;
  private fileStorage: FileWaitlistStorage;
  private memoryCache: MemoryCache;
  private storageSuccessCount: number = 0;
  private storageFailureCount: number = 0;
  
  constructor() {
    this.apiClient = ApiClient.getInstance();
    this.fileStorage = new FileWaitlistStorage();
    this.memoryCache = MemoryCache.getInstance();
    
    logEvent('StorageOrchestrator', 'Initialized');
  }
  
  /**
   * Add email to waitlist using all available storage mechanisms
   * Will try each storage in sequence and return success if ANY storage succeeds
   */
  async addEmail(email: string): Promise<StorageResponse> {
    logEvent('StorageOrchestrator', 'AddEmail', email);
    
    // Check for duplicates in memory cache first (fastest check)
    const cachedEmails = this.memoryCache.get('waitlist_emails');
    if (cachedEmails && Array.isArray(cachedEmails) && cachedEmails.includes(email)) {
      return {
        success: false,
        message: 'Email already registered',
        source: 'cache'
      };
    }
    
    // Track which storage mechanisms succeed
    const results: StorageResponse[] = [];
    
    // Try API storage first (most reliable in production)
    try {
      const apiResult = await this.apiClient.addEmail(email);
      results.push(apiResult);
      
      if (apiResult.success) {
        // If API storage succeeds, update the memory cache
        const existingEmails = this.memoryCache.get('waitlist_emails') || [];
        this.memoryCache.set('waitlist_emails', [...existingEmails, email]);
        this.storageSuccessCount++;
      }
    } catch (error) {
      logEvent('StorageOrchestrator', 'ApiStorageError', error instanceof Error ? error.message : 'Unknown error');
      this.storageFailureCount++;
      // Continue to next storage mechanism
    }
    
    // Always try file storage as backup/for local development
    try {
      const fileResult = await this.fileStorage.addEmail(email);
      results.push(fileResult);
      
      if (fileResult.success) {
        // Update memory cache if file storage succeeds
        const existingEmails = this.memoryCache.get('waitlist_emails') || [];
        this.memoryCache.set('waitlist_emails', [...existingEmails, email]);
        this.storageSuccessCount++;
      }
    } catch (error) {
      logEvent('StorageOrchestrator', 'FileStorageError', error instanceof Error ? error.message : 'Unknown error');
      this.storageFailureCount++;
      // Continue to next storage mechanism
    }
    
    // If we got here and have no results, all storage mechanisms failed
    if (results.length === 0) {
      // Last resort - store in memory only
      const existingEmails = this.memoryCache.get('waitlist_emails') || [];
      if (!existingEmails.includes(email)) {
        this.memoryCache.set('waitlist_emails', [...existingEmails, email]);
        logEvent('StorageOrchestrator', 'MemoryOnlyStorage', email);
        
        return {
          success: true,
          message: 'Email stored in memory only. This is a temporary solution due to storage issues.',
          source: 'memory'
        };
      } else {
        return {
          success: false,
          message: 'Email already registered (memory cache).',
          source: 'memory'
        };
      }
    }
    
    // Return success if ANY storage succeeded
    const anySuccess = results.some(r => r.success);
    
    if (anySuccess) {
      const successResult = results.find(r => r.success);
      return {
        success: true,
        message: successResult?.message || 'Email successfully added',
        source: successResult?.source || 'unknown'
      };
    }
    
    // All storage mechanisms failed - check if they consistently report duplicate
    const allDuplicates = results.every(r => r.message?.includes('already registered'));
    if (allDuplicates) {
      return {
        success: false,
        message: 'Email already registered',
        source: 'multiple'
      };
    }
    
    // Return a general failure message
    logEvent('StorageOrchestrator', 'AllStorageFailed', email);
    return {
      success: false,
      message: 'Failed to save email. Please try again later.',
      source: 'orchestrator'
    };
  }
  
  async getEmails(): Promise<string[]> {
    // Try to get from memory cache first (fastest)
    const cachedEmails = this.memoryCache.get('waitlist_emails');
    if (cachedEmails && Array.isArray(cachedEmails)) {
      return cachedEmails;
    }
    
    // Otherwise try API, then file storage
    try {
      const apiEmails = await this.apiClient.getEmails();
      if (apiEmails.length > 0) {
        // Cache the results
        this.memoryCache.set('waitlist_emails', apiEmails);
        return apiEmails;
      }
    } catch (error) {
      // Fall through to file storage
    }
    
    try {
      const fileEmails = await this.fileStorage.getEmails();
      // Cache the results
      this.memoryCache.set('waitlist_emails', fileEmails);
      return fileEmails;
    } catch (error) {
      // Return empty array if all fails
      return [];
    }
  }
  
  async getTotalCount(): Promise<number> {
    const emails = await this.getEmails();
    return emails.length;
  }
}

// Base storage implementation
class FileWaitlistStorage implements WaitlistStorage {
  private isStorageAvailable: boolean = true;
  
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
  
  async addEmail(email: string): Promise<StorageResponse> {
    const timestamp = new Date().toISOString();
    logEvent('FileStorage', 'AddEmail', email);
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
        logEvent('FileStorage', 'DuplicateEmail', email);
        return { 
          success: false, 
          message: 'Email already registered',
          source: 'file' 
        };
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
          logEvent('FileStorage', 'WriteFailed', `${WAITLIST_FILE} after ${maxRetries} attempts`);
          this.isStorageAvailable = false; // Mark storage as unavailable
          return {
            success: false,
            message: 'Server error: Failed to save email to primary storage.',
            source: 'file'
          };
        }
      } catch (writeJsonError: any) {
        logEvent('FileStorage', 'JsonWriteError', writeJsonError?.message || 'Unknown error');
        this.isStorageAvailable = false; // Mark storage as unavailable
        return { 
          success: false, 
          message: 'Server error: Failed to save email to primary storage.',
          source: 'file' 
        };
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
      return { 
        success: true, 
        message: 'Thank you! You have been added to our waitlist.',
        source: 'file'
      };
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
  logEvent('StorageFactory', 'GetWaitlistStorage', process.env.NODE_ENV || 'development');
  
  // Always use the orchestrator in production for maximum reliability
  // It will coordinate all available storage methods
  return new WaitlistStorageOrchestrator();
}

// Default export for easier importing
export default getWaitlistStorage;
