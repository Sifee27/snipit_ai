/**
 * Content Processor
 * Orchestrates content processing using appropriate AI services
 */
import { ProcessRequest, ProcessResponse, ProcessCallback } from "@/types/api";
import { DEFAULT_PROCESSING_OPTIONS } from "@/config/constants";
import { HuggingFaceService, OllamaService, ServicesAvailability } from '../services';
import { mockProcessContent } from '../../mock-processor';
import { extractYoutubeId, getYoutubeTranscript } from '../../utils/youtube-utils';

// Configuration flags from environment
const FORCE_REAL_AI = process.env.FORCE_REAL_AI === 'true';
const EMERGENCY_FALLBACK = process.env.EMERGENCY_FALLBACK === 'true';
const USE_OLLAMA = process.env.USE_OLLAMA === 'true';
const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_AI === 'true';

/**
 * Process content using the appropriate service based on environment configuration
 * @param request - The process request containing content and options
 * @param callback - Optional callback for progress updates
 */
export async function processContent(
  request: ProcessRequest,
  callback?: ProcessCallback
): Promise<ProcessResponse> {
  try {
    // Extract and validate request data
    const content = request?.content || "";
    const url = request?.url || "";
    const contentType = request?.contentType || "text";
    const options = request?.options || {};
    
    // Combine options with defaults
    const fullOptions = {
      ...DEFAULT_PROCESSING_OPTIONS,
      ...options
    };

    // Get content to process
    let processableContent = content;
    let contentToProcess = content || url;
    
    // If content is empty but we have a URL, use the URL as content
    if (!processableContent && url) {
      processableContent = url;
      contentToProcess = url;
    }
    
    // Validate that we have content to process
    if (!processableContent) {
      throw new Error("No content or URL provided");
    }
    
    // Log what we're processing
    console.log(`Using ${contentType} for processing: ${contentToProcess.substring(0, 100)}${contentToProcess.length > 100 ? '...' : ''}`);
    
    // Process YouTube videos by getting transcript
    if (contentType === 'youtube') {
      callback?.({ status: 'processing', step: 'Fetching video transcript...' });
      
      try {
        // Extract video ID
        const videoId = extractYoutubeId(contentToProcess);
        if (!videoId) {
          throw new Error("Invalid YouTube URL");
        }
        
        // Get transcript
        const transcript = await getYoutubeTranscript(videoId);
        processableContent = transcript;
        
        console.log(`YouTube transcript fetched, length: ${processableContent.length} characters`);
      } catch (error) {
        console.error('Error processing YouTube content:', error);
        throw new Error(`Failed to process YouTube content: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Determine which service to use based on configuration
    const useOllama = USE_OLLAMA;
    
    // Check service availability
    const huggingFaceAvailable = HuggingFaceService.isAvailable();
    const ollamaAvailable = await ServicesAvailability.isOllamaAvailable();
    
    // Determine if we should use real AI or mock data
    // If FORCE_REAL_AI is true, always use real AI regardless of service availability
    const useRealAI = FORCE_REAL_AI || huggingFaceAvailable || ollamaAvailable;
    
    // Determine which service to use based on configuration and availability
    let selectedService = 'huggingface';
    if (useOllama && ollamaAvailable) {
      selectedService = 'ollama';
    } else if (!huggingFaceAvailable && ollamaAvailable) {
      selectedService = 'ollama';
    }
    
    // Log the decision for debugging
    if (DEBUG_MODE) {
      console.log(`Using real AI: ${useRealAI} (FORCE_REAL_AI=${FORCE_REAL_AI})`);
      console.log(`Service availability: HF=${huggingFaceAvailable}, Ollama=${ollamaAvailable}`);
      console.log(`Selected service: ${selectedService} (USE_OLLAMA=${USE_OLLAMA})`);
    }
    
    if (useRealAI) {
      try {
        callback?.({ status: 'processing', step: 'Processing with AI...' });
        
        // Choose which service to use based on the selected service
        if (selectedService === 'ollama') {
          if (DEBUG_MODE) {
            console.log('🐋 Using Ollama for AI processing');
          }
          
          // Process content in parallel with Ollama
          const [summary, keyQuotes, socialPost] = await Promise.all([
            OllamaService.generateSummary(processableContent, fullOptions.maxSummaryLength, callback),
            OllamaService.extractKeyQuotes(processableContent, fullOptions.maxQuotes, callback),
            OllamaService.generateSocialPost(processableContent, fullOptions.socialTone, callback)
          ]);
          
          // Extract metadata
          const metadata = await OllamaService.extractMetadata(contentToProcess, contentType, callback);
          
          // Generate blog content if requested
          let blogPost;
          if (fullOptions.generateBlog) {
            callback?.({ status: 'processing', step: 'Generating blog post...' });
            blogPost = await OllamaService.generateBlogPost(processableContent, callback);
          }
          
          // Return processed content with Ollama flag
          return {
            id: `ollama-${Date.now()}`,
            summary,
            keyQuotes,
            socialPost,
            blogPost,
            processedAt: new Date().toISOString(),
            contentMetadata: metadata,
            isRealAiContent: true,
            isMockFallback: false,
            aiProvider: 'ollama'
          };
        } else {
          // Default to Hugging Face
          if (DEBUG_MODE) {
            console.log('🤗 Using Hugging Face for AI processing');
          }
          
          // Process content with Hugging Face
          const [summary, keyQuotes, socialPost] = await Promise.all([
            HuggingFaceService.generateSummary(processableContent, fullOptions.maxSummaryLength, callback),
            HuggingFaceService.extractKeyQuotes(processableContent, fullOptions.maxQuotes, callback),
            HuggingFaceService.generateSocialPost(processableContent, fullOptions.socialTone, callback)
          ]);
          
          // Extract metadata
          const metadata = await HuggingFaceService.extractMetadata(contentToProcess, contentType, callback);
          
          // Generate blog content if requested
          let blogPost;
          if (fullOptions.generateBlog) {
            callback?.({ status: 'processing', step: 'Generating blog post...' });
            blogPost = await HuggingFaceService.generateBlogPost(processableContent, callback);
          }
          
          // Return processed content with Hugging Face flag
          return {
            id: `hf-${Date.now()}`,
            summary,
            keyQuotes,
            socialPost,
            blogPost,
            processedAt: new Date().toISOString(),
            contentMetadata: metadata,
            isRealAiContent: true,
            isMockFallback: false,
            aiProvider: 'huggingface'
          };
        }
      } catch (error) {
        // Log the error properly
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check for API key related errors
        if (errorMessage.includes('API key') || 
            errorMessage.includes('Authentication failed') || 
            errorMessage.includes('401')) {
          console.error('🔑 API KEY ERROR: The Hugging Face API key appears to be invalid or missing');
          console.error('Please update your .env.local file with a valid API key from https://huggingface.co/settings/tokens');
        } else {
          console.error('Real AI processing failed:', error);
        }
        
        // If emergency fallback is enabled, use mock data
        if (EMERGENCY_FALLBACK) {
          console.log('🚨 EMERGENCY FALLBACK MODE: Using mock data as last resort fallback');
          console.warn('⚠️⚠️⚠️ WARNING: USING MOCK DATA INSTEAD OF REAL AI ⚠️⚠️⚠️');
          console.log('Set FORCE_REAL_AI=true in .env.local to disable mock responses');
          
          return await mockProcessContent(request);
        } else {
          // If emergency fallback is disabled, propagate the error
          throw error;
        }
      }
    } else {
      // No real AI services are available, use mock processor
      console.log('No AI services are available. Using mock data.');
      return await mockProcessContent(request);
    }
  } catch (error) {
    console.error('Fatal error in content processing:', error);
    
    // Ensure we return something even in case of unexpected errors
    if (EMERGENCY_FALLBACK) {
      console.log('🚨 EMERGENCY FALLBACK due to fatal error');
      return await mockProcessContent(request);
    }
    
    // If emergency fallback is disabled, propagate the error
    throw error;
  }
}
