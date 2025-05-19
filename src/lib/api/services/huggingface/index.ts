/**
 * Hugging Face API Service
 * Central export point for all HuggingFace API functionality
 */
export * from './client';
export * from './models';
export * from './tasks';

// Re-export key functions with clear names
import { 
  generateSummary, 
  extractKeyQuotes, 
  generateSocialPost, 
  generateBlogPost, 
  extractMetadata 
} from './tasks';

/**
 * Process content with HuggingFace API
 * Main API for other modules to use
 */
export const HuggingFaceService = {
  // Client operations
  isAvailable: () => {
    try {
      const apiKey = process.env.HF_API_KEY || process.env.HUGGING_FACE_API_KEY;
      const isAvailable = !!apiKey && apiKey.length > 10; // Basic validation that it's a real key
      console.log(`HuggingFace API availability check: ${isAvailable} (key length: ${apiKey?.length || 0})`);
      return isAvailable;
    } catch (error) {
      console.error('Error checking HuggingFace API availability:', error);
      return false;
    }
  },
  
  // Core NLP tasks
  generateSummary,
  extractKeyQuotes,
  generateSocialPost,
  generateBlogPost,
  extractMetadata
};

export default HuggingFaceService;
