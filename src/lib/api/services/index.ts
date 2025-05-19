/**
 * API Services Index
 * Central export point for all API services
 */
import HuggingFaceService from './huggingface';
import * as OpenRouterService from './openrouter';
import * as OllamaService from './ollama';

export { HuggingFaceService, OpenRouterService, OllamaService };

// Service availability detection
export const ServicesAvailability = {
  isHuggingFaceAvailable: HuggingFaceService.isAvailable,
  
  isOpenRouterAvailable: async () => {
    try {
      return await OpenRouterService.isApiAvailable();
    } catch {
      return false;
    }
  },
  
  isOllamaAvailable: async () => {
    try {
      return await OllamaService.isApiAvailable();
    } catch {
      return false;
    }
  },
  
  isOpenAIAvailable: () => {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      return !!apiKey && process.env.DISABLE_OPENAI !== 'true';
    } catch {
      return false;
    }
  },
  
  // Check if any AI service is available
  isAnyAIServiceAvailable: async () => {
    const huggingFaceAvailable = HuggingFaceService.isAvailable();
    const openRouterAvailable = await OpenRouterService.isApiAvailable().catch(() => false);
    const ollamaAvailable = await OllamaService.isApiAvailable().catch(() => false);
    const openAIAvailable = !!process.env.OPENAI_API_KEY && process.env.DISABLE_OPENAI !== 'true';
    
    return huggingFaceAvailable || openRouterAvailable || ollamaAvailable || openAIAvailable;
  }
};
