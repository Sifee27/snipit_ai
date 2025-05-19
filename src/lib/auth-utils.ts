/**
 * Authentication utilities for communicating with the backend API
 * Connected to our JWT-based authentication backend
 */
import { authApi } from './api-client';

// Auth state tracking
let isLoggedIn = false;
let currentUser: User | null = null;

export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'pro';
}

/**
 * Check if the user is currently authenticated
 */
export const checkAuth = (): boolean => {
  try {
    // First check our local state (fast)
    if (isLoggedIn && currentUser) {
      return true;
    }
    
    // If we're in the browser, check for stored auth
    if (typeof window !== 'undefined') {
      const isAuth = localStorage.getItem('is_authenticated') === 'true';
      return isAuth;
    }
    
    return false;
  } catch (error) {
    return false;
  }
};

/**
 * Authenticate a user with email and password
 */
export const login = async (email: string, password: string): Promise<User> => {
  try {
    // Validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    // Call API to login
    const response = await authApi.login(email, password);
    const { user, token } = response;
    
    // Update auth state
    isLoggedIn = true;
    currentUser = user;
    
    // Store in session storage for persistence through refreshes
    localStorage.setItem('auth_user', JSON.stringify(user));
    localStorage.setItem('is_authenticated', 'true');
    
    return user;
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Failed to login');
  }
};

/**
 * Register a new user with email, password, and name
 */
export const register = async (email: string, password: string, name: string): Promise<User> => {
  try {
    // Validation
    if (!email || !password || !name) {
      throw new Error('All fields are required');
    }
    
    // Call API to register
    const response = await authApi.register(email, password, name);
    const { user, token } = response;
    
    // Update auth state
    isLoggedIn = true;
    currentUser = user;
    
    // Store in session storage for persistence through refreshes
    localStorage.setItem('auth_user', JSON.stringify(user));
    localStorage.setItem('is_authenticated', 'true');
    
    return user;
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(error.message || 'Failed to register');
  }
};

/**
 * Log out the current user
 */
export const logout = async (): Promise<void> => {
  try {
    // Call API to logout (clears cookies)
    await authApi.logout();
    
    // Update local state
    isLoggedIn = false;
    currentUser = null;
    
    // Clear session storage
    localStorage.removeItem('auth_user');
    localStorage.removeItem('is_authenticated');
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear local state even if logout API fails
    isLoggedIn = false;
    currentUser = null;
    localStorage.removeItem('auth_user');
    localStorage.removeItem('is_authenticated');
  }
};

/**
 * Get the current user from the backend or session storage
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // Try to get user from API first
    const user = await authApi.getCurrentUser();
    
    if (user) {
      // Update local state
      isLoggedIn = true;
      currentUser = user;
      
      // Update session storage
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('is_authenticated', 'true');
      
      return user;
    } 
    
    // If API call returns null but we have session data, try session
    if (typeof window !== 'undefined') {
      const isAuth = localStorage.getItem('is_authenticated') === 'true';
      const userData = localStorage.getItem('auth_user');
      
      if (isAuth && userData) {
        try {
          const user = JSON.parse(userData) as User;
          isLoggedIn = true;
          currentUser = user;
          return user;
        } catch {
          // Invalid session data, clear it
          localStorage.removeItem('auth_user');
          localStorage.removeItem('is_authenticated');
        }
      }
    }
    
    // No user found
    isLoggedIn = false;
    currentUser = null;
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};
