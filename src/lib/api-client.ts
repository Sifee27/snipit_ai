/**
 * Enhanced API client with robust error handling and fallback support
 */
import { validateApiResponse } from './api-debug';
import { ApiResponse } from '@/types/api';

// Base API configuration
const API_BASE_URL = '/api';
const DEFAULT_TIMEOUT_MS = 15000; // 15 seconds default timeout
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

// Enhanced error class for API errors
export class ApiError extends Error {
  statusCode: number;
  details?: string;
  retryable: boolean;
  
  constructor(message: string, statusCode: number, details?: string, retryable = false) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.retryable = retryable;
  }
}

// Define headers interface to fix TypeScript errors
type RequestHeadersType = Record<string, string | undefined>;

interface RequestHeaders extends RequestHeadersType {
  'Content-Type': string;
  'X-Request-ID': string;
  Authorization?: string;
}

/**
 * Robust fetch implementation with:
 * - Timeout support
 * - Automatic retries with exponential backoff
 * - Comprehensive error handling
 * - Fallback support
 * - Detailed logging
 */
async function fetchWithTimeout(
  resource: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT_MS } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    // Merge the AbortController's signal with the options
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    
    return response;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Enhanced API fetch with robust error handling and retries
 */
async function fetchAPI<T = any>(
  endpoint: string,
  options: RequestInit & { 
    timeout?: number;
    enableFallback?: boolean;
    fallbackData?: T;
    requestId?: string;
    query?: Record<string, string>;
  } = {},
): Promise<T> {
  const { 
    timeout,
    enableFallback = true,
    fallbackData,
    requestId = `req_${Math.random().toString(36).substring(2, 9)}`,
    query = {},
    ...fetchOptions 
  } = options;
  
  // Create full URL with query parameters if provided
  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  // Add query parameters if provided
  if (Object.keys(query).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    url = `${url}?${searchParams.toString()}`;
  }

  // Validate endpoint
  if (!endpoint.startsWith('/')) {
    throw new ApiError('Invalid endpoint format. Must start with /', 400);
  }

  // Create headers object with common headers
  const headers: RequestHeaders = {
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
    ...(fetchOptions.headers as Record<string, string> || {})
  };

  // Validate and stringify request body if needed
  let body = fetchOptions.body;
  if (body && typeof body === 'object') {
    try {
      body = JSON.stringify(body);
    } catch (e) {
      throw new ApiError('Invalid request body that cannot be stringified', 400);
    }
  }

  // Log request (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log(`🚀 API Request [${requestId}]: ${fetchOptions.method || 'GET'} ${url}`);
    if (body && typeof body === 'string' && body !== '{}') {
      console.log(`Request Body: ${body.substring(0, 100)}${body.length > 100 ? '...' : ''}`);
    }
  }

  let lastError: Error | null = null;
  let attemptCount = 0;
  
  // Implement retry logic with exponential backoff
  while (attemptCount < MAX_RETRIES) {
    try {
      attemptCount++;
      
      // Convert our RequestHeaders to a standard Headers object that fetch can use
      const standardHeaders = new Headers();
      Object.entries(headers).forEach(([key, value]) => {
        if (value !== undefined) {
          standardHeaders.append(key, value);
        }
      });
      
      // Attempt request with timeout
      const response = await fetchWithTimeout(url, {
        ...fetchOptions,
        headers: standardHeaders,
        body: body as BodyInit,
        timeout
      });

      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
        console.warn(`Rate limited, retrying after ${retryAfter}s (attempt ${attemptCount}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      // Try to parse JSON even if status is error, as error responses often include details
      let jsonData: any;
      let jsonError: Error | null = null;
      
      try {
        jsonData = await response.json();
      } catch (e) {
        jsonError = e as Error;
      }

      // Handle successful responses
      if (response.ok) {
        if (jsonError) {
          console.error(`Received OK status but JSON parsing failed: ${jsonError.message}`);
          throw new ApiError('Invalid JSON in response', 500);
        }
        
        // Add response validation for debugging only
        validateApiResponse(jsonData);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ API Response [${requestId}]: Success`);
        }
        
        return jsonData as T;
      }

      // Handle API error responses with proper status codes
      const errorMessage = jsonData?.error || `API request failed: ${response.status} ${response.statusText}`;
      const details = jsonData?.details || undefined;
      
      // Log detailed error information for debugging
      console.error('API ERROR DETAILS:', {
        status: response.status,
        statusText: response.statusText,
        error: jsonData?.error,
        details: jsonData?.details,
        url,
        method: fetchOptions.method || 'GET'
      });

      // Determine if error is retryable (5xx are server errors, usually temporary)
      const isRetryable = response.status >= 500 && response.status < 600;
      
      // Log the error
      console.error(`❌ API Error [${requestId}]: ${response.status} - ${errorMessage}${details ? ` (${details})` : ''}`);
      
      // For retryable errors, continue the retry loop
      if (isRetryable && attemptCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attemptCount - 1);
        console.warn(`Retrying in ${delay}ms (attempt ${attemptCount}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For non-retryable errors or exhausted retries with enableFallback, use fallback data if available
      if (enableFallback && fallbackData !== undefined) {
        console.warn(`🔄 Using fallback data for [${endpoint}]`);
        return fallbackData;
      }
      
      // Otherwise, throw the API error
      throw new ApiError(errorMessage, response.status, details, isRetryable);
      
    } catch (error) {
      // Store the error for potential fallback use
      if (error instanceof Error) {
        lastError = error;
        
        // Don't retry client errors or errors that were thrown manually
        if (error instanceof ApiError) {
          if (!error.retryable || attemptCount >= MAX_RETRIES) {
            // Use fallback if available
            if (enableFallback && fallbackData !== undefined) {
              console.warn(`🔄 Using fallback data due to API error: ${error.message}`);
              return fallbackData;
            }
            
            // Otherwise, propagate the error
            throw error;
          }
        }
      }
      
      // For other fetch errors like network errors (retryable)
      if (!(error instanceof ApiError) && attemptCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attemptCount - 1);
        console.warn(`Network/connection error, retrying in ${delay}ms (attempt ${attemptCount}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      } else if (enableFallback && fallbackData !== undefined) {
        // If we've exhausted retries or the error is not retryable, use fallback if available
        console.warn(`🔄 Using fallback data due to error: ${error instanceof Error ? error.message : String(error)}`);
        return fallbackData;
      }
      
      // Propagate the error
      throw error;
    }
  }
  
  // If we exhaust retries and have fallback data
  if (enableFallback && fallbackData !== undefined) {
    console.warn(`🔄 Using fallback data after exhausting retries for [${endpoint}]`);
    return fallbackData;
  }
  
  // If we exhaust retries and no fallback, throw the last error or a generic one
  throw lastError || new ApiError(`Failed after ${MAX_RETRIES} retries`, 503);
}

// API interfaces
interface AuthApi {
  login(email: string, password: string): Promise<any>;
  register(email: string, password: string, name: string): Promise<any>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<any>;
}

interface ContentApi {
  process(content: string, contentType: string, options: any): Promise<ApiResponse<any>>;
  getHistory(): Promise<any>;
  getItemById(id: string): Promise<any>;
}

interface MetricsApi {
  getMetrics(): Promise<any>;
}

// Authentication API implementation
const auth: AuthApi = {
  async login(email, password) {
    return await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },
  
  async register(email, password, name) {
    return await fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    });
  },
  
  async logout() {
    // Clear local auth state
    await fetchAPI('/auth/logout', {
      method: 'POST'
    });
  },
  
  async getCurrentUser() {
    try {
      // Disable fallback data to prevent auto-login with demo user
      return await fetchAPI('/auth/me', {
        enableFallback: false
      });
    } catch (error) {
      console.error('Failed to get current user:', error);
      // Explicitly return null to ensure user is not logged in when API fails
      return null;
    }
  }
};

// Content processing API implementation
const content: ContentApi = {
  async process(content: string, contentType: string, options = {}) {
    try {
      // Create request body based on content type
      const isUrl = (
        contentType === 'youtube' || contentType === 'link' ||
        (typeof content === 'string' && (
          content.startsWith('http://') || 
          content.startsWith('https://') || 
          content.startsWith('www.') ||
          content.includes('youtube.com') || 
          content.includes('youtu.be')
        ))
      );
      
      // Create the request body based on content type
      const requestBody = isUrl
        ? { contentType, url: content, options }
        : { contentType, content, options };
      
      // Log for debugging
      console.log(isUrl ? 'Using URL format for request' : 'Using content format for request');
      
      // Make API request
      const response = await fetchAPI<ApiResponse<any>>('/process', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        timeout: 60000, // 60 seconds
        enableFallback: true,
        fallbackData: {
          success: true,
          data: {
            id: `fallback-${Date.now()}`,
            summary: "This is fallback content because the API is currently unavailable.",
            keyQuotes: [
              { text: "Fallback content - API unavailable", timestamp: "N/A" }
            ],
            socialPost: "Fallback social post - API unavailable",
            blogPost: "# Fallback Content\n\nAPI service is currently unavailable.",
            isRealAiContent: false,
            isMockFallback: true,
            processedAt: new Date().toISOString(),
            contentMetadata: {
              title: "Fallback Content",
              sourceType: contentType,
              duration: "N/A"
            }
          }
        }
      });
      
      // Extra validation to debug API response format issues
      if (!response || typeof response !== 'object') {
        console.error('Invalid API response format:', response);
        throw new Error('API returned an invalid response format');
      }
      
      if (response.success === undefined) {
        console.error('Invalid API response format: Missing success flag', response);
        throw new Error('API response missing required success flag');
      }
      
      if (response.success && response.data === undefined) {
        console.error('Invalid API response format: Success response missing data property', response);
        throw new Error('API success response missing data property');
      }
      
      return response;
    } catch (error) {
      console.error('Content processing failed:', error);
      throw error;
    }
  },
  
  async getHistory() {
    try {
      // Add forceUserId for demo purposes
      const userId = 'user_123';
      console.log('Getting history for user:', userId, '(forced)');
      
      const response = await fetchAPI('/history', {
        enableFallback: true,
        fallbackData: {
          success: true,
          data: {
            items: [{
              id: 'history-1',
              title: 'Sample History Item',
              sourceType: 'text',
              date: new Date().toISOString(),
              status: 'completed',
              contentType: 'text'
            }],
            totalCount: 1,
            page: 1,
            limit: 10,
            totalPages: 1
          }
        },
        // Additional query params to simulate real user in demo mode  
        query: { forceUserId: userId }
      });
      
      // Handle the new response structure
      if (response && response.success && response.data && Array.isArray(response.data.items)) {
        console.log('Received structured history response with items array');
        return response.data.items;
      } else if (response && response.success && Array.isArray(response.data)) {
        // Legacy format support
        console.log('Received legacy history response format');
        return response.data;
      } else if (Array.isArray(response)) {
        // Direct array format
        console.log('Received direct array history response');
        return response;
      } else {
        console.warn('Unexpected history response format:', response);
        return [];
      }
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  },
  
  async getItemById(id) {
    try {
      return await fetchAPI(`/content/${id}`);
    } catch (error) {
      console.error(`Failed to get content item ${id}:`, error);
      throw error;
    }
  }
};

// Usage metrics API implementation
const metrics: MetricsApi = {
  async getMetrics() {
    try {
      return await fetchAPI('/metrics', {
        enableFallback: true,
        fallbackData: {
          processingCount: 10,
          averageProcessingTime: 2500,
          popularContentTypes: ['youtube', 'text', 'audio']
        }
      });
    } catch (error) {
      console.error('Failed to get metrics:', error);
      return null;
    }
  }
};

// Export individual APIs
export const authApi = auth;
export const contentApi = content;
export const metricsApi = metrics;

// Export default API object combining all APIs
export default {
  auth,
  content,
  metrics
};
