/**
 * Ollama API Task Implementations
 * Implements specific NLP tasks using the Ollama API client
 */
import { ProcessCallback } from "@/types/api";
import { queryOllama, getDefaultModel, chatCompletion } from "./client";
import { DEFAULT_PROCESSING_OPTIONS } from "@/config/constants";

// Debug flag - read from environment variable
const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_AI === 'true';

/**
 * Generate a summary using Ollama models
 * @param text - Text to summarize
 * @param maxLength - Maximum summary length
 * @param callback - Optional callback for progress updates
 */
export async function generateSummary(
  text: string, 
  maxLength: number = DEFAULT_PROCESSING_OPTIONS.maxSummaryLength,
  callback?: ProcessCallback
): Promise<string> {
  callback?.({ status: 'processing', step: 'Generating summary via Ollama...' });
  
  // Get the default model
  const model = getDefaultModel();
  
  // Create a prompt for summarization
  const prompt = `Please summarize the following text in about ${maxLength} words:

${text}

Summary:`;

  try {
    const result = await queryOllama(model, prompt, {
      temperature: 0.3, // Lower temperature for more factual summaries
      num_predict: maxLength * 5 // Approximate token count
    }, callback);
    
    // Validate the response before processing
    if (!result) {
      throw new Error('Empty response from Ollama API');
    }
    
    if (DEBUG_MODE) {
      console.log('Ollama API response:', JSON.stringify(result, null, 2));
    }
    
    // Extract summary from response
    return result.response.trim();
  } catch (error) {
    console.error('Error generating summary with Ollama:', error);
    throw error;
  }
}

/**
 * Extract key quotes from text using Ollama models
 * @param text - Text to extract quotes from
 * @param maxQuotes - Maximum number of quotes to extract
 * @param callback - Optional callback for progress updates
 */
export async function extractKeyQuotes(
  text: string,
  maxQuotes: number = DEFAULT_PROCESSING_OPTIONS.maxQuotes,
  callback?: ProcessCallback
): Promise<Array<{ text: string; timestamp?: string }>> {
  callback?.({ status: 'processing', step: 'Extracting key quotes via Ollama...' });
  
  // Get the default model
  const model = getDefaultModel();
  
  // Create a prompt for key quote extraction
  const prompt = `Extract the ${maxQuotes} most important quotes from the following text. 
For each quote, provide the exact text from the original content.
Format your response as a JSON array of objects with 'text' property for each quote.
Example format: [{"text": "This is an important quote"}, {"text": "This is another important quote"}]

Here's the text:

${text}

Key quotes (JSON format):`;

  try {
    const result = await queryOllama(model, prompt, {
      temperature: 0.3,
      num_predict: 1000
    }, callback);
    
    // Validate the response
    if (!result || !result.response) {
      throw new Error('Invalid response from Ollama API');
    }
    
    const content = result.response.trim();
    
    // Try to extract JSON from the response
    try {
      // Look for JSON array in the response
      const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/) || content.match(/\[\s*\{[^\}]*\}(?:\s*,\s*\{[^\}]*\})*\s*\]/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If we can't find a JSON array pattern, try to parse the entire response as JSON
      try {
        return JSON.parse(content);
      } catch (e) {
        // If that fails, try to extract JSON with a more lenient approach
        const startBracket = content.indexOf('[');
        const endBracket = content.lastIndexOf(']');
        
        if (startBracket !== -1 && endBracket !== -1 && startBracket < endBracket) {
          const jsonString = content.substring(startBracket, endBracket + 1);
          return JSON.parse(jsonString);
        }
      }
      
      // If all parsing attempts fail, create a structured response from the text
      console.warn('Could not parse JSON from Ollama response, creating structured response manually');
      
      // Split the content by newlines and look for quotes
      const lines = content.split('\n');
      const quotes: Array<{ text: string; timestamp?: string }> = [];
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && (trimmedLine.startsWith('"') || trimmedLine.startsWith('"'))) {
          quotes.push({ text: trimmedLine.replace(/[""]|[""]$/g, '') });
        }
      }
      
      return quotes.slice(0, maxQuotes);
    } catch (error) {
      console.error('Error parsing key quotes from Ollama response:', error);
      throw new Error('Failed to parse key quotes from Ollama response');
    }
  } catch (error) {
    console.error('Error extracting key quotes with Ollama:', error);
    throw error;
  }
}

/**
 * Generate a social media post based on content using Ollama models
 * @param text - Original content to base the social post on
 * @param platform - Target social media platform
 * @param callback - Optional callback for progress updates
 */
export async function generateSocialPost(
  text: string,
  platform: string = 'twitter',
  callback?: ProcessCallback
): Promise<string> {
  callback?.({ status: 'processing', step: `Generating ${platform} post via Ollama...` });
  
  // Get the default model
  const model = getDefaultModel();
  
  // Create a prompt for social post generation
  const prompt = `Create an engaging ${platform} post based on the following content.
The post should be attention-grabbing, concise, and include relevant hashtags.
Make it optimized for ${platform}'s format and audience.

Here's the content:

${text}

${platform} post:`;

  try {
    const result = await queryOllama(model, prompt, {
      temperature: 0.7, // Higher temperature for more creative posts
      num_predict: 280 // Twitter-length by default
    }, callback);
    
    // Extract social post from response
    if (result && result.response) {
      return result.response.trim();
    } else {
      console.warn('Unexpected social post format from Ollama API:', result);
      throw new Error('Unexpected response format from Ollama API');
    }
  } catch (error) {
    console.error(`Error generating ${platform} post with Ollama:`, error);
    throw error;
  }
}

/**
 * Generate a blog post based on content using Ollama models
 * @param text - Original content to base the blog post on
 * @param callback - Optional callback for progress updates
 */
export async function generateBlogPost(
  text: string,
  callback?: ProcessCallback
): Promise<string> {
  callback?.({ status: 'processing', step: 'Generating blog post via Ollama...' });
  
  // Get the default model
  const model = getDefaultModel();
  
  // Create a prompt for blog post generation
  const prompt = `Create an informative and engaging blog post based on the following content.
The blog post should:
- Have a clear structure with headings and subheadings
- Expand on the key points from the original content
- Include an introduction and conclusion
- Be written in Markdown format
- Be informative, engaging, and well-organized

Here's the content:

${text}

Blog post (in Markdown format):`;

  try {
    const result = await queryOllama(model, prompt, {
      temperature: 0.5,
      num_predict: 1500
    }, callback);
    
    // Extract blog post from response
    if (result && result.response) {
      return result.response.trim();
    } else {
      console.warn('Unexpected blog post format from Ollama API:', result);
      throw new Error('Unexpected response format from Ollama API');
    }
  } catch (error) {
    console.error('Error generating blog post with Ollama:', error);
    throw error;
  }
}

/**
 * Extract metadata from content using Ollama models
 * @param content - Content to extract metadata from
 * @param contentType - Type of content
 * @param callback - Optional callback for progress updates
 */
export async function extractMetadata(
  content: string,
  contentType: string,
  callback?: ProcessCallback
): Promise<{ title: string; duration?: string; sourceType: string }> {
  callback?.({ status: 'processing', step: 'Extracting metadata via Ollama...' });
  
  // Get the default model
  const model = getDefaultModel();
  
  // Create a prompt for metadata extraction
  const prompt = `Extract the following metadata from this ${contentType} content:
1. Title: A concise, descriptive title
2. Duration: Approximate reading/viewing time (if applicable)

Format your response as a JSON object with 'title' and 'duration' properties.
Example: {"title": "The Main Topic", "duration": "5 minutes"}

Here's the content:

${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}

Metadata (JSON format):`;

  try {
    const result = await queryOllama(model, prompt, {
      temperature: 0.3,
      num_predict: 200
    }, callback);
    
    // Validate the response
    if (!result || !result.response) {
      throw new Error('Invalid response from Ollama API');
    }
    
    const responseText = result.response.trim();
    
    // Try to extract JSON from the response
    try {
      // Look for JSON object in the response
      const jsonMatch = responseText.match(/\{.*\}/);
      
      if (jsonMatch) {
        const metadata = JSON.parse(jsonMatch[0]);
        return {
          title: metadata.title || 'Untitled Content',
          duration: metadata.duration || 'Unknown',
          sourceType: contentType
        };
      }
      
      // If we can't parse JSON, extract title using regex
      const titleMatch = responseText.match(/title["\s:]+([^"]+)/i);
      const durationMatch = responseText.match(/duration["\s:]+([^"]+)/i);
      
      return {
        title: titleMatch ? titleMatch[1].trim() : 'Untitled Content',
        duration: durationMatch ? durationMatch[1].trim() : 'Unknown',
        sourceType: contentType
      };
    } catch (error) {
      console.error('Error parsing metadata from Ollama response:', error);
      // Return default metadata
      return {
        title: 'Untitled Content',
        duration: 'Unknown',
        sourceType: contentType
      };
    }
  } catch (error) {
    console.error('Error extracting metadata with Ollama:', error);
    // Return default metadata on error
    return {
      title: 'Untitled Content',
      duration: 'Unknown',
      sourceType: contentType
    };
  }
}
