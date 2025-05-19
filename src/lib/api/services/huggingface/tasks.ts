/**
 * Hugging Face API Task Implementations
 * Implements specific NLP tasks using the HF API client
 */
import { ProcessCallback } from "@/types/api";
import { queryHuggingFace } from "./client";
import { getModelForTask, getModelParams } from "./models";
import { DEFAULT_PROCESSING_OPTIONS } from "@/config/constants";

// Debug flag - read from environment variable
const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_AI === 'true';

/**
 * Generate a summary using Hugging Face's summarization models
 * @param text - Text to summarize
 * @param maxLength - Maximum summary length
 * @param callback - Optional callback for progress updates
 */
export async function generateSummary(
  text: string, 
  maxLength: number = DEFAULT_PROCESSING_OPTIONS.maxSummaryLength,
  callback?: ProcessCallback
): Promise<string> {
  callback?.({ status: 'processing', step: 'Generating summary...' });
  
  const model = getModelForTask('summarization');
  const params = getModelParams('summarization', 'summarization', { max_length: maxLength });
  
  try {
    const result = await queryHuggingFace(model, {
      inputs: text,
      parameters: params
    }, callback);
    
    // Validate the response before processing
    if (!result) {
      throw new Error('Empty response from Hugging Face API');
    }
    
    if (DEBUG_MODE) {
      console.log('Hugging Face API response:', JSON.stringify(result, null, 2));
    }
    
    // Extract summary from response based on model output format
    if (Array.isArray(result) && result.length > 0 && result[0]?.summary_text) {
      return result[0].summary_text;
    } else if (typeof result === 'object' && result.summary_text) { 
      return result.summary_text;
    } else if (Array.isArray(result) && result.length > 0 && typeof result[0] === 'string') {
      return result[0];
    } else {
      console.warn('Unexpected summary format from API:', result);
      return typeof result === 'string' ? result : JSON.stringify(result);
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract key quotes from text using question-answering models
 * @param text - Source text to extract quotes from
 * @param maxQuotes - Maximum number of quotes to extract
 * @param callback - Optional callback for progress updates
 */
export async function extractKeyQuotes(
  text: string, 
  maxQuotes: number = DEFAULT_PROCESSING_OPTIONS.maxQuotes,
  callback?: ProcessCallback
): Promise<string[]> {
  callback?.({ status: 'processing', step: 'Extracting key quotes...' });
  
  const model = getModelForTask('question-answering');
  
  // Formulate standard questions to extract key points
  const questions = [
    "What is the main point?",
    "What is the most important insight?",
    "What is the most surprising statement?",
    "What is the most controversial claim?",
    "What is the key takeaway?"
  ];
  
  // Use only as many questions as maxQuotes
  const quotesToGenerate = Math.min(maxQuotes, questions.length);
  
  try {
    // Execute queries in parallel for efficiency
    const quotesPromises = questions.slice(0, quotesToGenerate).map(async (question) => {
      const result = await queryHuggingFace(model, {
        inputs: {
          question,
          context: text
        }
      });
      
      return result.answer || '';
    });
    
    const quotes = await Promise.all(quotesPromises);
    
    // Filter out empty quotes and duplicates
    return quotes
      .filter(quote => quote && quote.trim().length > 0)
      .filter((quote, index, self) => 
        self.indexOf(quote) === index
      );
  } catch (error) {
    console.error('Error extracting key quotes:', error);
    throw new Error(`Failed to extract key quotes: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate social media post using text generation models
 * @param text - Source text to base the social post on
 * @param tone - Tone for the social post (professional, casual, etc.)
 * @param callback - Optional callback for progress updates
 */
export async function generateSocialPost(
  text: string, 
  tone: string = DEFAULT_PROCESSING_OPTIONS.socialTone,
  callback?: ProcessCallback
): Promise<string> {
  callback?.({ status: 'processing', step: 'Generating social media post...' });
  
  const model = getModelForTask('text-generation');
  
  try {
    // Craft a prompt that instructs the model to generate a social post
    const prompt = `Write a concise, engaging ${tone} social media post based on this content:\n"${text.substring(0, 1000)}"\n\nSocial Post:`;
    
    const result = await queryHuggingFace(model, {
      inputs: prompt,
      parameters: {
        max_length: 280, // Twitter-like length
        temperature: 0.7,
        top_p: 0.9,
        do_sample: true
      }
    }, callback);
    
    // Extract the generated social post from the response
    let socialPost = '';
    
    if (Array.isArray(result) && result[0]?.generated_text) {
      socialPost = result[0].generated_text;
    } else if (typeof result === 'object' && result.generated_text) {
      socialPost = result.generated_text;
    } else if (typeof result === 'string') {
      socialPost = result;
    } else {
      console.warn('Unexpected social post format from API:', result);
      socialPost = JSON.stringify(result);
    }
    
    // Clean up the response - extract just the social post part
    if (socialPost.includes('Social Post:')) {
      socialPost = socialPost.split('Social Post:')[1].trim();
    }
    
    return socialPost;
  } catch (error) {
    console.error('Error generating social post:', error);
    throw new Error(`Failed to generate social post: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a blog post using text generation models
 * @param text - Source text to base the blog on
 * @param callback - Optional callback for progress updates
 */
export async function generateBlogPost(
  text: string,
  callback?: ProcessCallback
): Promise<string> {
  callback?.({ status: 'processing', step: 'Generating blog post...' });
  
  const model = getModelForTask('text-generation');
  
  try {
    // Create a detailed prompt for blog generation
    const prompt = `Write a well-structured, informative blog post based on the following content:\n"${text.substring(0, 1500)}"\n\nBlog Post:`;
    
    const result = await queryHuggingFace(model, {
      inputs: prompt,
      parameters: {
        max_length: 1000,
        temperature: 0.8,
        top_p: 0.9,
        do_sample: true
      }
    }, callback);
    
    // Extract the generated blog post from the response
    let blogPost = '';
    
    if (Array.isArray(result) && result[0]?.generated_text) {
      blogPost = result[0].generated_text;
    } else if (typeof result === 'object' && result.generated_text) {
      blogPost = result.generated_text;
    } else if (typeof result === 'string') {
      blogPost = result;
    } else {
      console.warn('Unexpected blog post format from API:', result);
      blogPost = JSON.stringify(result);
    }
    
    // Clean up the response - extract just the blog post part
    if (blogPost.includes('Blog Post:')) {
      blogPost = blogPost.split('Blog Post:')[1].trim();
    }
    
    return blogPost;
  } catch (error) {
    console.error('Error generating blog post:', error);
    throw new Error(`Failed to generate blog post: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract basic metadata from content
 * @param content - Source content
 * @param contentType - Type of content (text, youtube, etc.)
 */
export function extractMetadata(content: string, contentType: string): Record<string, any> {
  // Basic metadata extraction based on content type
  switch (contentType) {
    case 'youtube':
      return {
        title: `YouTube Video Analysis`,
        sourceType: 'youtube',
        duration: 'N/A' // In a real implementation, this would extract video duration
      };
      
    case 'audio':
      return {
        title: `Audio Content Analysis`,
        sourceType: 'audio',
        duration: 'N/A'
      };
      
    case 'link':
      return {
        title: `Web Content Analysis`,
        sourceType: 'link',
        duration: 'N/A'
      };
      
    default:
      return {
        title: `Text Content Analysis`,
        sourceType: contentType || 'text',
        duration: 'N/A'
      };
  }
}
