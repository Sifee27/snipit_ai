/**
 * Mock database implementation using file-based storage
 * This is a simplified version for demo purposes
 * In production, use a proper database like MongoDB, PostgreSQL, or SQLite with Prisma
 */
import fs from 'fs/promises';
import path from 'path';
import { User, HistoryItem } from '@/types/api';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

// Base directory for storing data
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// Initialize the data directory and files if they don't exist
async function initializeDataStore() {
  try {
    // Create data directory if it doesn't exist
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Check if users file exists, create if not
    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.writeFile(USERS_FILE, JSON.stringify([]));
    }

    // Check if history file exists, create if not
    try {
      await fs.access(HISTORY_FILE);
    } catch {
      await fs.writeFile(HISTORY_FILE, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error initializing data store:', error);
  }
}

/**
 * User-related database operations
 */
export const userDb = {
  /**
   * Find a user by email
   * @param email - User email to search for
   */
  async findByEmail(email: string): Promise<User | null> {
    await initializeDataStore();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data) as User[];
    return users.find(u => u.email === email) || null;
  },

  /**
   * Find a user by ID
   * @param id - User ID to search for
   */
  async findById(id: string): Promise<User | null> {
    await initializeDataStore();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data) as User[];
    return users.find(u => u.id === id) || null;
  },

  /**
   * Create a new user
   * @param userData - User data to create
   */
  async create(userData: { email: string; name: string; password: string; }): Promise<User> {
    await initializeDataStore();
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Create user object
    const newUser: User = {
      id: randomUUID(),
      email: userData.email,
      name: userData.name,
      plan: 'free',
      usageCount: 0,
      maxUsage: 5, // Free plan gets 5 uses
      createdAt: new Date().toISOString(),
    };
    
    // Read current users
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data) as (User & { password?: string })[];
    
    // Add new user with password
    users.push({ ...newUser, password: hashedPassword });
    
    // Write back to file
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    
    // Return the user object (without password)
    return newUser;
  },

  /**
   * Verify a user's password
   * @param email - User email
   * @param password - Password to verify
   */
  async verifyPassword(email: string, password: string): Promise<User | null> {
    await initializeDataStore();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data) as (User & { password?: string })[];
    const user = users.find(u => u.email === email);
    
    if (!user || !user.password) {
      return null;
    }
    
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return null;
    }
    
    // Return the user without the password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  /**
   * Update a user's usage count
   * @param userId - User ID to update
   */
  async incrementUsage(userId: string): Promise<User | null> {
    await initializeDataStore();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data) as (User & { password?: string })[];
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return null;
    }
    
    users[userIndex].usageCount += 1;
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    
    const { password: _, ...userWithoutPassword } = users[userIndex];
    return userWithoutPassword;
  },
};

/**
 * History-related database operations
 */
export const historyDb = {
  /**
   * Create a new history item
   * @param item - History item to create
   */
  async create(item: Omit<HistoryItem, 'id' | 'createdAt'>): Promise<HistoryItem> {
    await initializeDataStore();
    
    const newItem: HistoryItem = {
      ...item,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    
    const data = await fs.readFile(HISTORY_FILE, 'utf8');
    const history = JSON.parse(data) as HistoryItem[];
    history.push(newItem);
    
    await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
    
    return newItem;
  },

  /**
   * Get history items for a user
   * @param userId - User ID to get history for
   * @param limit - Maximum number of items to return
   * @param offset - Number of items to skip
   */
  async getByUser(userId: string, limit = 10, offset = 0): Promise<{ items: HistoryItem[], totalCount: number }> {
    await initializeDataStore();
    const data = await fs.readFile(HISTORY_FILE, 'utf8');
    const history = JSON.parse(data) as HistoryItem[];
    
    const userItems = history
      .filter(item => item.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return {
      items: userItems.slice(offset, offset + limit),
      totalCount: userItems.length
    };
  },

  /**
   * Get a history item by ID
   * @param id - History item ID to get
   */
  async getById(id: string): Promise<HistoryItem | null> {
    await initializeDataStore();
    const data = await fs.readFile(HISTORY_FILE, 'utf8');
    const history = JSON.parse(data) as HistoryItem[];
    return history.find(item => item.id === id) || null;
  },
};
