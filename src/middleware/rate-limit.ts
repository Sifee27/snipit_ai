/**
 * Rate limiting middleware for API protection
 * Uses a simple in-memory store for demonstration purposes
 * In production, use Redis or another persistent store
 */
import { NextRequest, NextResponse } from 'next/server';
import { API_RATE_LIMITS } from '@/config/constants';
import { getAuthUser } from './auth';

// Simple in-memory store for rate limiting
// In production, use Redis or another distributed store
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Store for IP-based rate limits
const ipLimitStore: RateLimitStore = {};

// Store for user-based rate limits
const userLimitStore: RateLimitStore = {};

/**
 * Get client IP from request
 * Handles common proxy headers as well
 */
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  
  if (forwarded) {
    // Return the first IP if x-forwarded-for has a comma-separated list
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  // Fallback to the IP in request metadata if available
  return req.ip || '127.0.0.1';
}

/**
 * Apply rate limiting based on IP address for unauthenticated requests
 */
export async function applyIpRateLimit(req: NextRequest): Promise<{ limited: boolean, message?: string }> {
  const ip = getClientIp(req);
  const now = Date.now();
  const limits = API_RATE_LIMITS.unauthenticated;
  
  // Initialize or get rate limit data for this IP
  if (!ipLimitStore[ip]) {
    ipLimitStore[ip] = {
      count: 0,
      resetTime: now + limits.windowMs
    };
  }
  
  const limitData = ipLimitStore[ip];
  
  // Reset count if the window has expired
  if (now > limitData.resetTime) {
    limitData.count = 0;
    limitData.resetTime = now + limits.windowMs;
  }
  
  // Check if limit exceeded
  if (limitData.count >= limits.max) {
    return { 
      limited: true, 
      message: limits.message 
    };
  }
  
  // Increment count and return not limited
  limitData.count++;
  return { limited: false };
}

/**
 * Apply rate limiting based on user ID and plan for authenticated requests
 */
export async function applyUserRateLimit(req: NextRequest, user: any): Promise<{ limited: boolean, message?: string }> {
  const userId = user.id;
  const userPlan = user.plan || 'free';
  const now = Date.now();
  const limits = API_RATE_LIMITS.authenticated[userPlan];
  
  if (!limits) {
    // Fallback to free plan limits if plan not found
    return applyUserRateLimit(req, { ...user, plan: 'free' });
  }
  
  // Initialize or get rate limit data for this user
  if (!userLimitStore[userId]) {
    userLimitStore[userId] = {
      count: 0,
      resetTime: now + limits.windowMs
    };
  }
  
  const limitData = userLimitStore[userId];
  
  // Reset count if the window has expired
  if (now > limitData.resetTime) {
    limitData.count = 0;
    limitData.resetTime = now + limits.windowMs;
  }
  
  // Check if limit exceeded
  if (limitData.count >= limits.max) {
    return { 
      limited: true, 
      message: limits.message 
    };
  }
  
  // Increment count and return not limited
  limitData.count++;
  return { limited: false };
}

/**
 * Rate limiting middleware
 * Applies different limits based on authentication status
 */
export async function withRateLimit(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = getAuthUser(req);
  
  // Apply appropriate rate limiting
  const rateLimitResult = user 
    ? await applyUserRateLimit(req, user) 
    : await applyIpRateLimit(req);
    
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { success: false, error: rateLimitResult.message || 'Rate limit exceeded' },
      { status: 429 }
    );
  }
  
  return handler(req);
}

/**
 * Clean up expired rate limit entries (should be called periodically)
 */
export function cleanupRateLimitStores(): void {
  const now = Date.now();
  
  // Clean up IP store
  Object.keys(ipLimitStore).forEach(ip => {
    if (ipLimitStore[ip].resetTime < now) {
      delete ipLimitStore[ip];
    }
  });
  
  // Clean up user store
  Object.keys(userLimitStore).forEach(userId => {
    if (userLimitStore[userId].resetTime < now) {
      delete userLimitStore[userId];
    }
  });
}
