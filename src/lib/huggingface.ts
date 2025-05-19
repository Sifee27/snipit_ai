/**
 * Hugging Face API Client
 * Provides utilities for interacting with the Hugging Face Inference API
 */

import { ProcessRequest, ProcessResponse } from "@/types/api";
import { API_ENDPOINTS, HUGGING_FACE_MODELS, DEFAULT_PROCESSING_OPTIONS } from "@/config/constants";

/**
 * Get the API key from environment variables
 * This should be stored in .env.local as HF_API_KEY
 */
const getApiKey = (): string => {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) {
    throw new Error('Hugging Face API key not found in environment variables');
  }
  return apiKey;
};

/**
 * Make a request to the Hugging Face Inference API
 * @param model - The model ID to use for inference
 * @param inputs - The input data for the model
 * @param options - Additional options for the request
 */
async function queryModel(model: string, inputs: any, options?: any) {
  const apiKey = getApiKey();
  const response = await fetch(`${API_ENDPOINTS.huggingFace}${model}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({ inputs, ...options }),
  });
  
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Hugging Face API error: ${response.status} ${response.statusText} - ${errorBody}`);
  }
  
  return response.json();
}

/**
 * Generate a summary using the summarization model
 * @param text - Text to be summarized
 * @param maxLength - Maximum length of the summary
 */
export async function generateSummary(text: string, maxLength: number = DEFAULT_PROCESSING_OPTIONS.maxSummaryLength): Promise<string> {
  try {
    const result = await queryModel(
      HUGGING_FACE_MODELS.summarization,
      text,
      { parameters: { max_length: maxLength, min_length: Math.floor(maxLength / 2) } }
    );
    
    if (Array.isArray(result) && result.length > 0 && result[0].summary_text) {
      return result[0].summary_text;
    } else {
      return result.generated_text || "";
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
}

/**
 * Extract key quotes from the content
 * @param text - Content to extract quotes from
 * @param maxQuotes - Maximum number of quotes to extract
 */
export async function extractKeyQuotes(text: string, maxQuotes: number = DEFAULT_PROCESSING_OPTIONS.maxQuotes): Promise<{ text: string, timestamp?: string }[]> {
  try {
    // Adapt text for question-answering format to extract key points
    const questions = [
      "What are the main points?",
      "What are the key takeaways?",
      "What are the most important quotes?"
    ];
    
    const results = await Promise.all(
      questions.map(question => 
        queryModel(HUGGING_FACE_MODELS.keyPointsExtraction, { question, context: text })
      )
    );
    
    // Process and clean up results
    const quotes = results
      .map(result => result.answer || "")
      .filter(Boolean)
      .slice(0, maxQuotes)
      .map(quote => ({ text: quote }));
      
    // Add fake timestamps for demo purposes
    // In a real app, this would use actual timestamps from the content
    return quotes.map((quote, index) => ({
      ...quote,
      timestamp: generateFakeTimestamp(index)
    }));
  } catch (error) {
    console.error('Error extracting key quotes:', error);
    throw error;
  }
}

/**
 * Generate a social media post based on the content
 * @param text - Content to generate a social post from
 * @param tone - Tone for the social post
 */
export async function generateSocialPost(text: string, tone: string = DEFAULT_PROCESSING_OPTIONS.socialTone): Promise<string> {
  try {
    const prompt = `Create a short social media post in a ${tone} tone summarizing the following content:\n\n${text.substring(0, 1000)}`;
    
    const result = await queryModel(
      HUGGING_FACE_MODELS.socialMediaGeneration,
      prompt
    );
    
    if (typeof result === 'string') {
      return result;
    } else if (result.generated_text) {
      return result.generated_text;
    }
    
    return "Unable to generate social media post.";
  } catch (error) {
    console.error('Error generating social post:', error);
    throw error;
  }
}

/**
 * Generate a blog post based on the content
 * @param text - Content to use as reference
 */
export async function generateBlogPost(text: string): Promise<string> {
  try {
    const prompt = `Write a detailed blog post based on the following content:\n\n${text.substring(0, 1500)}`;
    
    const result = await queryModel(
      HUGGING_FACE_MODELS.blogGeneration,
      prompt
    );
    
    if (typeof result === 'string') {
      return result;
    } else if (result.generated_text) {
      return result.generated_text;
    }
    
    return "Unable to generate blog post.";
  } catch (error) {
    console.error('Error generating blog post:', error);
    throw error;
  }
}

/**
 * Process content using the appropriate models based on content type and options
 * @param request - The process request containing content and options
 */
export async function processContent(request: ProcessRequest): Promise<ProcessResponse> {
  const { content, contentType, options = {} } = request;
  
  // Merge options with defaults
  const fullOptions = { ...DEFAULT_PROCESSING_OPTIONS, ...options };
  
  // Extract title and duration (in a real app, this would use metadata extraction)
  const contentMetadata = extractMetadata(content, contentType);
  
  // Run processes in parallel for efficiency
  const [summary, keyQuotes, socialPost, blogPost] = await Promise.all([
    generateSummary(content, fullOptions.maxSummaryLength),
    extractKeyQuotes(content, fullOptions.maxQuotes),
    generateSocialPost(content, fullOptions.socialTone),
    fullOptions.generateBlog ? generateBlogPost(content) : Promise.resolve("")
  ]);
  
  return {
    summary,
    keyQuotes,
    socialPost,
    blogPost: fullOptions.generateBlog ? blogPost : undefined,
    processedAt: new Date().toISOString(),
    contentMetadata: {
      ...contentMetadata,
      sourceType: contentType
    }
  };
}

/**
 * Extract basic metadata from content (simplified mock implementation)
 * In a real application, this would use proper media metadata extraction
 */
function extractMetadata(content: string, contentType: string) {
  // Simple mock implementation for demo purposes
  if (contentType === 'youtube') {
    const urlObj = new URL(content);
    const videoId = urlObj.searchParams.get('v') || '';
    return {
      title: `YouTube Video ${videoId.substring(0, 5)}...`,
      duration: '10:30', // Mock duration
      sourceType: contentType
    };
  }
  
  return {
    title: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Content`,
    duration: contentType === 'text' ? undefined : '05:45', // Mock duration for audio/video
    sourceType: contentType
  };
}

/**
 * Generate a fake timestamp for demo purposes
 * In a real app, this would be extracted from the actual media
 */
function generateFakeTimestamp(index: number): string {
  const minutes = Math.floor(index * 3 + 1);
  const seconds = Math.floor(Math.random() * 59);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
