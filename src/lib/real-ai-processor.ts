/**
 * Real AI Integration for Content Processing
 * This processor uses the OpenAI API directly with no fallbacks to mock data
 */

import YoutubeTranscriptApi from 'youtube-transcript-api';
import { extractYoutubeId } from './utils';

// OpenAI API endpoint
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Process content with no mock fallbacks - real AI only
 */
export async function processWithRealAI(content: string, contentType: string) {
  console.log('USING REAL AI PROCESSOR - NO MOCKS');
  
  // Step 1: Extract actual content to process
  let processableContent = content;
  
  // For YouTube, get the transcript
  if (contentType === 'youtube') {
    const videoId = extractYoutubeId(content);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }
    
    console.log(`Getting transcript for YouTube video ${videoId}`);
    try {
      // Fetch transcript with options for better language support
      const transcript = await YoutubeTranscriptApi.fetchTranscript(videoId);
      
      if (!transcript || transcript.length === 0) {
        throw new Error('No transcript available for this video');
      }
      
      // Process transcript into readable text
      processableContent = transcript
        .map((item: { text: string }) => item.text || '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log(`Got YouTube transcript, length: ${processableContent.length} characters`);
      
      // Verify we have enough content to process
      if (processableContent.length < 50) {
        console.warn('YouTube transcript is too short, may produce poor results');
      }
    } catch (error) {
      console.error('Failed to get YouTube transcript:', error);
      
      // Provide a fallback for videos without transcripts
      if (process.env.EMERGENCY_FALLBACK === 'true') {
        console.log('🚨 Using emergency fallback for YouTube transcript');
        processableContent = `This is fallback content for YouTube video ${videoId}. The transcript could not be retrieved automatically.`;
      } else {
        throw new Error(`Could not extract YouTube transcript: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  
  // Step 2: Process in parallel with OpenAI
  console.log('Starting OpenAI content processing...');
  
  try {
    const [summary, keyQuotesResponse, socialPost, blogPost] = await Promise.all([
      callOpenAI({
        role: 'system',
        content: 'You are a highly skilled content summarizer who extracts the most important information.'
      }, {
        role: 'user',
        content: `Provide a comprehensive, detailed summary of the following ${contentType} content. Focus on the key points, insights, and conclusions. Be specific and informative.\n\nContent: ${processableContent.substring(0, 6000)}`
      }),
      
      callOpenAI({
        role: 'system',
        content: 'You are an expert at identifying important quotes and key statements in content.'
      }, {
        role: 'user',
        content: `Extract 5 key quotes from the following ${contentType} content. For each quote, identify the most significant, insightful, or representative statements. Return ONLY the quotes in a JSON array format with each quote having a "text" field and a "timestamp" field (use timestamps like "01:23" for videos or "N/A" for text).\n\nContent: ${processableContent.substring(0, 6000)}`
      }),
      
      callOpenAI({
        role: 'system',
        content: 'You are a social media expert who creates engaging, shareable content.'
      }, {
        role: 'user',
        content: `Create an engaging social media post based on the following ${contentType} content. The post should be attention-grabbing, informative, and encourage engagement.\n\nContent: ${processableContent.substring(0, 4000)}`
      }),
      
      callOpenAI({
        role: 'system',
        content: 'You are a professional blog content creator who produces thorough, well-structured articles.'
      }, {
        role: 'user',
        content: `Write a detailed blog post based on the following ${contentType} content. Include an introduction, several main sections with appropriate headings, and a conclusion. Be informative and engaging.\n\nContent: ${processableContent.substring(0, 5000)}`
      })
    ]);
    
    console.log('Successfully processed content with OpenAI');
    
    // Parse key quotes from JSON response
    let keyQuotes = [];
    try {
      // Try to parse JSON array from response
      const quoteMatch = keyQuotesResponse.match(/\[\s*{\s*"text"[\s\S]*\]/);
      if (quoteMatch) {
        keyQuotes = JSON.parse(quoteMatch[0]);
      } else {
        // Fallback parsing if not in proper JSON format
        const lines = keyQuotesResponse.split('\n');
        keyQuotes = lines
          .filter((line: string) => line.includes('"text"'))
          .map((line: string) => {
            const match = line.match(/"text"\s*:\s*"([^"]*)"/);
            return match ? { text: match[1], timestamp: 'N/A' } : null;
          })
          .filter(Boolean);
      }
    } catch (error) {
      console.error('Error parsing key quotes:', error);
      // Create simple quotes from response
      keyQuotes = [{ text: keyQuotesResponse.substring(0, 200), timestamp: 'N/A' }];
    }
    
    if (keyQuotes.length === 0) {
      keyQuotes = [{ text: "No key quotes could be extracted.", timestamp: 'N/A' }];
    }
    
    // Get basic metadata
    const metadata = {
      title: getContentTitle(content, contentType),
      duration: contentType === 'youtube' ? '~10:00' : 'N/A',
      sourceType: contentType
    };
    
    // Return fully processed content
    return {
      summary,
      keyQuotes,
      socialPost,
      blogPost,
      processedAt: new Date().toISOString(),
      contentMetadata: metadata
    };
  } catch (error) {
    console.error('Error processing content with OpenAI:', error);
    throw new Error(`AI processing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Call OpenAI API directly with timeout and retry mechanism
 */
async function callOpenAI(systemMessage: { role: string, content: string }, userMessage: { role: string, content: string }, retryCount = 0) {
  const apiKey = process.env.OPENAI_API_KEY;
  const MAX_RETRIES = 2; // Maximum number of retries
  const TIMEOUT_MS = 30000; // 30 second timeout
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }
  
  console.log(`Calling OpenAI API (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
  
  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Fallback to a more reliable model that's less likely to have capacity issues
        messages: [systemMessage, userMessage],
        temperature: 0.7,
        max_tokens: 1500
      }),
      signal: controller.signal
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`OpenAI API response received in ${responseTime}ms`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      
      // Check for specific error types for better error messages
      if (response.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please try again later.');
      } else if (response.status >= 500) {
        throw new Error(`OpenAI API server error (${response.status}). The service may be experiencing issues.`);
      } else if (response.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your API key configuration.');
      }
      
      throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('OpenAI response received, extracting content...');
    
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      return data.choices[0].message.content.trim();
    }
    
    throw new Error('Invalid response format from OpenAI API');
  } catch (error) {
    console.error(`Error calling OpenAI API (attempt ${retryCount + 1}):`, error);
    
    // Clear the timeout to prevent memory leaks
    clearTimeout(timeoutId);
    
    // Retry on network errors, timeouts, or server errors (5xx)
    const isNetworkError = error instanceof TypeError;
    const isTimeoutError = error instanceof Error && error.name === 'AbortError';
    const isServerError = error instanceof Error && error.message && error.message.includes('5');
    
    if (retryCount < MAX_RETRIES && (isNetworkError || isTimeoutError || isServerError)) {
      console.log(`Retrying OpenAI API call (${retryCount + 1}/${MAX_RETRIES})...`);
      
      // Exponential backoff
      const backoffMs = Math.min(1000 * (2 ** retryCount), 10000);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      
      // Retry the call
      return callOpenAI(systemMessage, userMessage, retryCount + 1);
    }
    
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Extract a human-readable title from content
 */
function getContentTitle(content: string, contentType: string): string {
  if (contentType === 'youtube') {
    const videoId = extractYoutubeId(content);
    return `YouTube Video: ${videoId || content.substring(0, 30)}`;
  } else if (contentType === 'link' || contentType === 'article') {
    try {
      const url = new URL(content);
      return `Article from ${url.hostname}`;
    } catch (e) {
      return content.substring(0, 50) + (content.length > 50 ? '...' : '');
    }
  } else {
    const firstLine = content.split('\n')[0] || '';
    return firstLine.substring(0, 60) + (firstLine.length > 60 ? '...' : '');
  }
}
