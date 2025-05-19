/**
 * Shared API Types for SnipIt
 * Contains type definitions for API requests and responses
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ProcessCallback {
  (update: { status: 'processing' | 'complete' | 'error'; step: string }): void;
}

export interface ProcessRequest {
  // Must provide either content or url
  content?: string;
  url?: string;
  
  // Type of content being processed
  contentType: 'youtube' | 'audio' | 'video' | 'text';
  
  // Optional processing options
  options?: {
    // Content generation options
    includeSummary?: boolean;
    includeKeyQuotes?: boolean;
    includeSocialPost?: boolean;
    includeBlogPost?: boolean;
    
    // Maximum length of the generated summary
    maxSummaryLength?: number;
    
    // Maximum number of key quotes to extract
    maxQuotes?: number;
    
    // Whether to include timestamps in the output (for audio/video)
    includeTimestamps?: boolean;
    
    // The tone for social media content
    socialTone?: 'professional' | 'casual' | 'friendly';
    
    // Whether to generate a blog post
    generateBlog?: boolean;
    
    // Source URL if different from the content URL
    sourceUrl?: string;
  };
}

export interface ProcessResponse {
  summary: string;
  keyQuotes: {
    text: string;
    timestamp?: string;
  }[];
  socialPost: string;
  blogPost?: string;
  processedAt: string;
  contentMetadata: {
    title?: string;
    duration?: string;
    sourceType: string;
  };
  // Flag indicating if this was processed with real AI or mock data
  isRealAiContent?: boolean;
  // The AI provider used for processing (huggingface, openrouter, etc.)
  aiProvider?: string;
  // Flag indicating if this is mock fallback data
  isMockFallback?: boolean;
}

export interface HistoryItem extends ProcessResponse {
  id: string;
  userId: string;
  
  // Make originalContent optional since we might have content or url
  originalContent?: string;
  sourceUrl?: string;
  
  contentType: string;
  createdAt: string;
}

export interface HistoryResponse {
  items: HistoryItem[];
  totalCount: number;
}

// User-related types
export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro';
  usageCount: number;
  maxUsage: number;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token?: string; // If using JWT
}
