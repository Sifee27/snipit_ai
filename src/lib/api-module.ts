/**
 * API Module
 * Central entry point for all API functionality
 */
import { processContent } from './api/processors';
import { HuggingFaceService } from './api/services';
import type { ProcessRequest, ProcessResponse, ProcessCallback } from '@/types/api';

/**
 * API Module
 * Provides a clean interface to all API functionality
 */
export const API = {
  /**
   * Process content using the appropriate service
   * @param request - The process request containing content and options
   * @param callback - Optional callback for progress updates
   */
  processContent: async (
    request: ProcessRequest,
    callback?: ProcessCallback
  ): Promise<ProcessResponse> => {
    return processContent(request, callback);
  },

  /**
   * Check if real AI processing is available
   */
  isRealAIAvailable: (): boolean => {
    return (
      process.env.FORCE_REAL_AI === 'true' || 
      HuggingFaceService.isAvailable()
    );
  },

  /**
   * Check if emergency fallback is enabled
   */
  isEmergencyFallbackEnabled: (): boolean => {
    return process.env.EMERGENCY_FALLBACK === 'true';
  },

  /**
   * Services
   * Direct access to individual services
   */
  services: {
    huggingface: HuggingFaceService
  }
};

export default API;
