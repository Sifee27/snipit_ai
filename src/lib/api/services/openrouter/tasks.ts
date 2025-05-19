/**
 * OpenRouter API Task Implementations
 * Implements specific NLP tasks using the OpenRouter API client
 */
import { ProcessCallback } from "@/types/api";
import { queryOpenRouter } from "./client";
import { DEFAULT_PROCESSING_OPTIONS } from "@/config/constants";

// Debug flag - read from environment variable
const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_AI === 'true';

// Default model to use for OpenRouter
// You can change this to any model supported by OpenRouter
// See https://openrouter.ai/docs#models for available models
const DEFAULT_MODEL = 'anthropic/claude-3-opus-20240229';

/**
 * Generate a summary using OpenRouter's models
 * @param text - Text to summarize
 * @param maxLength - Maximum summary length
 * @param callback - Optional callback for progress updates
 */
export async function generateSummary(
  text: string, 
  maxLength: number = DEFAULT_PROCESSING_OPTIONS.maxSummaryLength,
  callback?: ProcessCallback
): Promise<string> {
  callback?.({ status: 'processing', step: 'Generating summary via OpenRouter...' });
  
  // Create a system prompt for summarization
  const systemPrompt = `You are an expert summarizer. Your task is to create a concise and informative summary of the provided text. 
The summary should:
- Capture the main points and key information
- Be well-structured and coherent
- Be approximately ${maxLength} tokens in length
- Maintain the original meaning and intent
- Exclude unnecessary details and tangential information`;

  try {
    const result = await queryOpenRouter(
      DEFAULT_MODEL,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please summarize the following text:\n\n${text}` }
      ],
      {
        temperature: 0.3, // Lower temperature for more factual summaries
        max_tokens: maxLength
      },
      callback
    );
    
    // Validate the response before processing
    if (!result) {
      throw new Error('Empty response from OpenRouter API');
    }
    
    if (DEBUG_MODE) {
      console.log('OpenRouter API response:', JSON.stringify(result, null, 2));
    }
    
    // Extract summary from response based on model output format
    if (result.choices && result.choices.length > 0 && result.choices[0].message) {
      return result.choices[0].message.content.trim();
    } else {
      console.warn('Unexpected summary format from OpenRouter API:', result);
      throw new Error('Unexpected response format from OpenRouter API');
    }
  } catch (error) {
    console.error('Error generating summary with OpenRouter:', error);
    throw error;
  }
}

/**
 * Extract key quotes from text using OpenRouter's models
 * @param text - Text to extract quotes from
 * @param maxQuotes - Maximum number of quotes to extract
 * @param callback - Optional callback for progress updates
 */
export async function extractKeyQuotes(
  text: string,
  maxQuotes: number = DEFAULT_PROCESSING_OPTIONS.maxQuotes,
  callback?: ProcessCallback
): Promise<Array<{ text: string; timestamp?: string }>> {
  callback?.({ status: 'processing', step: 'Extracting key quotes via OpenRouter...' });
  
  // Create a system prompt for key quote extraction
  const systemPrompt = `You are an expert at identifying the most important and impactful quotes in a text. 
Your task is to extract up to ${maxQuotes} key quotes from the provided text.
For each quote:
- Select quotes that represent the most important ideas, insights, or memorable statements
- Preserve the exact wording from the original text
- If timestamps or markers are available, include them
- Format your response as a JSON array of objects with 'text' and optional 'timestamp' properties`;

  try {
    const result = await queryOpenRouter(
      DEFAULT_MODEL,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please extract key quotes from the following text:\n\n${text}\n\nRespond with a JSON array of quote objects.` }
      ],
      {
        temperature: 0.3,
        max_tokens: 1000
      },
      callback
    );
    
    // Validate the response
    if (!result || !result.choices || result.choices.length === 0) {
      throw new Error('Invalid response from OpenRouter API');
    }
    
    const content = result.choices[0].message.content.trim();
    
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
      console.warn('Could not parse JSON from OpenRouter response, creating structured response manually');
      
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
      console.error('Error parsing key quotes from OpenRouter response:', error);
      throw new Error('Failed to parse key quotes from OpenRouter response');
    }
  } catch (error) {
    console.error('Error extracting key quotes with OpenRouter:', error);
    throw error;
  }
}

/**
 * Generate a social media post based on content using OpenRouter's models
 * @param text - Original content to base the social post on
 * @param platform - Target social media platform
 * @param callback - Optional callback for progress updates
 */
export async function generateSocialPost(
  text: string,
  platform: string = 'twitter',
  callback?: ProcessCallback
): Promise<string> {
  callback?.({ status: 'processing', step: `Generating ${platform} post via OpenRouter...` });
  
  // Create a system prompt for social post generation
  const systemPrompt = `You are an expert social media content creator. 
Your task is to create an engaging ${platform} post based on the provided content.
The post should:
- Be attention-grabbing and shareable
- Capture the essence of the original content
- Include relevant hashtags if appropriate
- Be optimized for ${platform}'s format and audience
- Be concise and impactful`;

  try {
    const result = await queryOpenRouter(
      DEFAULT_MODEL,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please create a ${platform} post based on the following content:\n\n${text}` }
      ],
      {
        temperature: 0.7, // Higher temperature for more creative posts
        max_tokens: 280 // Twitter-length by default
      },
      callback
    );
    
    // Extract social post from response
    if (result.choices && result.choices.length > 0 && result.choices[0].message) {
      return result.choices[0].message.content.trim();
    } else {
      console.warn('Unexpected social post format from OpenRouter API:', result);
      throw new Error('Unexpected response format from OpenRouter API');
    }
  } catch (error) {
    console.error(`Error generating ${platform} post with OpenRouter:`, error);
    throw error;
  }
}

/**
 * Generate a blog post based on content using OpenRouter's models
 * @param text - Original content to base the blog post on
 * @param callback - Optional callback for progress updates
 */
export async function generateBlogPost(
  text: string,
  callback?: ProcessCallback
): Promise<string> {
  callback?.({ status: 'processing', step: 'Generating blog post via OpenRouter...' });
  
  // Create a system prompt for blog post generation
  const systemPrompt = `You are an expert blog writer. 
Your task is to create an informative and engaging blog post based on the provided content.
The blog post should:
- Have a clear structure with headings and subheadings
- Expand on the key points from the original content
- Include an introduction and conclusion
- Be written in Markdown format
- Be informative, engaging, and well-organized`;

  try {
    const result = await queryOpenRouter(
      DEFAULT_MODEL,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please create a blog post based on the following content:\n\n${text}` }
      ],
      {
        temperature: 0.5,
        max_tokens: 1500
      },
      callback
    );
    
    // Extract blog post from response
    if (result.choices && result.choices.length > 0 && result.choices[0].message) {
      return result.choices[0].message.content.trim();
    } else {
      console.warn('Unexpected blog post format from OpenRouter API:', result);
      throw new Error('Unexpected response format from OpenRouter API');
    }
  } catch (error) {
    console.error('Error generating blog post with OpenRouter:', error);
    throw error;
  }
}
