/**
 * Application-wide constants for the SnipIt backend
 */

export const API_RATE_LIMITS = {
  // Rate limits for unauthenticated requests (IP-based)
  unauthenticated: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window (effectively disabled for testing)
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  
  // Rate limits for authenticated requests based on plan
  authenticated: {
    free: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 1000, // 1000 requests per hour (effectively disabled for testing)
      message: 'Free plan limit reached. Please upgrade to process more content.'
    },
    pro: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5000, // 5000 requests per hour (effectively disabled for testing)
      message: 'Pro plan hourly limit reached. Please try again later.'
    }
  }
};

export const HUGGING_FACE_MODELS = {
  // Model IDs for different tasks
  summarization: 'facebook/bart-large-cnn',
  keyPointsExtraction: 'deepset/roberta-base-squad2',
  socialMediaGeneration: 'EleutherAI/gpt-neo-1.3B',
  blogGeneration: 'EleutherAI/gpt-neo-2.7B'
};

export const API_ENDPOINTS = {
  // Hugging Face inference API endpoint
  huggingFace: 'https://api-inference.huggingface.co/models/'
};

// Maximum content length (characters) we'll accept for processing
export const MAX_CONTENT_LENGTH = 50000;

// Default options for content processing
export const DEFAULT_PROCESSING_OPTIONS = {
  maxSummaryLength: 200,
  maxQuotes: 5,
  includeTimestamps: true,
  socialTone: 'professional' as const,
  generateBlog: true
};
