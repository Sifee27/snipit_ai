/**
 * OpenAI API integration for content processing
 * This replaces the mock processor with real AI-generated content
 */
import { ProcessRequest, ProcessResponse, ProcessCallback } from "@/types/api";
import { DEFAULT_PROCESSING_OPTIONS } from "@/config/constants";
import YoutubeTranscriptApi from 'youtube-transcript-api';
import { extractYoutubeId } from './utils';

// API endpoint for OpenAI
const OPENAI_API_URL = 'https://api.openai.com/v1';

/**
 * Process content using OpenAI's GPT models
 */
export async function processWithOpenAI(
  request: ProcessRequest,
  callback?: ProcessCallback
): Promise<ProcessResponse> {
  try {
    // Extract and validate request data
    const content = request?.content || "";
    const contentType = request?.contentType || "text";
    const options = request?.options || {};
    
    // Validate content
    if (!content || content.trim().length === 0) {
      throw new Error("Content must be a non-empty string");
    }
    
    // Update progress
    callback?.({ status: 'processing', step: 'Processing content with OpenAI...' });
    
    // Prepare content for processing
    let processableContent = content;
    
    // Handle YouTube videos by getting transcript
    if (contentType === 'youtube') {
      const videoId = extractYoutubeId(content);
      if (!videoId) {
        throw new Error("Invalid YouTube URL");
      }
      
      callback?.({ status: 'processing', step: 'Fetching YouTube transcript...' });
      const transcript = await getYoutubeTranscript(videoId);
      processableContent = transcript;
      
      // Log transcript details
      console.log(`YouTube transcript fetched, length: ${processableContent.length} characters`);
    }
    
    // Process content in parallel for each requested operation
    callback?.({ status: 'processing', step: 'Generating AI results...' });
    
    const [summary, keyQuotes, socialPost, blogPost] = await Promise.all([
      generateSummary(processableContent, contentType),
      extractKeyQuotes(processableContent, contentType),
      generateSocialPost(processableContent, contentType),
      options.generateBlog ? generateBlogPost(processableContent, contentType) : Promise.resolve("")
    ]);
    
    // Extract basic metadata
    const metadata = getContentMetadata(content, contentType);
    
    // Return processed content
    return {
      summary,
      keyQuotes: keyQuotes.map(quote => ({ text: quote })),
      socialPost,
      blogPost: options.generateBlog ? blogPost : undefined,
      processedAt: new Date().toISOString(),
      contentMetadata: metadata
    };
  } catch (error) {
    console.error("OpenAI processing error:", error);
    throw error;
  }
}

/**
 * Make API request to OpenAI
 */
async function callOpenAI(
  messages: Array<{ role: string; content: string }>,
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  } = {}
): Promise<string> {
  // Get API key from environment
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error("ERROR: OpenAI API key not found in environment variables");
    throw new Error("OpenAI API key not configured");
  }
  
  const model = options.model || "gpt-4";
  
  try {
    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
        n: 1,
        stream: false
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Extract content from response
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      return data.choices[0].message.content.trim();
    }
    
    throw new Error("Invalid response format from OpenAI API");
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}

/**
 * Generate a comprehensive summary of content
 */
async function generateSummary(content: string, contentType: string): Promise<string> {
  const prompt = `
    Please provide a comprehensive, insightful summary of the following ${contentType} content. 
    Focus on the main ideas, key points, and any conclusions or recommendations.
    The summary should be detailed, well-structured, and capture the essence of the content.
    
    Content:
    ${content.substring(0, 7000)}  // Limit content length for API
  `;
  
  const messages = [
    { role: "system", content: "You are an expert content analyst and summarizer. You extract the most important information and present it clearly and concisely." },
    { role: "user", content: prompt }
  ];
  
  return callOpenAI(messages, {
    model: "gpt-4",
    temperature: 0.5,
    max_tokens: 1000
  });
}

/**
 * Extract key quotes from content
 */
async function extractKeyQuotes(content: string, contentType: string): Promise<string[]> {
  const prompt = `
    Please extract 3-5 key quotes or statements from the following ${contentType} content.
    Focus on the most insightful, important, or representative statements.
    Each quote should be directly extracted from the content and should capture an essential point.
    
    Content:
    ${content.substring(0, 7000)}  // Limit content length for API
    
    Return ONLY the quotes as a numbered list, with each quote on a new line.
  `;
  
  const messages = [
    { role: "system", content: "You are an expert at identifying the most significant quotes and key statements in content." },
    { role: "user", content: prompt }
  ];
  
  const response = await callOpenAI(messages, {
    model: "gpt-4",
    temperature: 0.4,
    max_tokens: 800
  });
  
  // Parse the response to extract quotes
  const quotes = response
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    // Remove numbering (e.g., "1.", "2.", etc.)
    .map(line => line.replace(/^\d+[\.\)]\s*/, ""))
    // Remove surrounding quotes if present
    .map(line => line.replace(/^["'](.+)["']$/, "$1"));
  
  return quotes;
}

/**
 * Generate a social media post based on content
 */
async function generateSocialPost(content: string, contentType: string): Promise<string> {
  const prompt = `
    Create an engaging social media post based on the following ${contentType} content.
    The post should be attention-grabbing, informative, and encourage engagement.
    Include key points and insights from the content but keep it concise and social-media friendly.
    
    Content:
    ${content.substring(0, 5000)}  // Limit content length for API
    
    Return ONLY the social media post, ready to be shared.
  `;
  
  const messages = [
    { role: "system", content: "You are a social media expert who creates engaging, shareable content that captures key information effectively." },
    { role: "user", content: prompt }
  ];
  
  return callOpenAI(messages, {
    model: "gpt-4",
    temperature: 0.7,
    max_tokens: 400
  });
}

/**
 * Generate a blog post based on content
 */
async function generateBlogPost(content: string, contentType: string): Promise<string> {
  const prompt = `
    Write a comprehensive blog post based on the following ${contentType} content.
    The blog post should be well-structured with an introduction, main sections, and a conclusion.
    Include specific details and insights from the content, expand on important points, and add valuable context.
    The tone should be professional but engaging, suitable for a business or educational blog.
    
    Content:
    ${content.substring(0, 6000)}  // Limit content length for API
    
    Return a complete, ready-to-publish blog post with appropriate headings and paragraphs.
  `;
  
  const messages = [
    { role: "system", content: "You are an expert content writer who creates thorough, engaging, and insightful blog posts that expand on and contextualize information." },
    { role: "user", content: prompt }
  ];
  
  return callOpenAI(messages, {
    model: "gpt-4",
    temperature: 0.6,
    max_tokens: 1500
  });
}

/**
 * Get YouTube transcript
 */
async function getYoutubeTranscript(videoId: string): Promise<string> {
  try {
    // Fetch transcript with the YouTube Transcript API
    const transcript = await YoutubeTranscriptApi.fetchTranscript(videoId);
    
    if (!transcript || transcript.length === 0) {
      throw new Error('No transcript available for this video');
    }
    
    // Format transcript into readable text
    const processedText = transcript
      .map((item: { text: string }) => item.text || "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    
    // Verify we have enough content to process
    if (processedText.length < 50) {
      console.warn('YouTube transcript is too short, may produce poor results');
    }
    
    return processedText;
  } catch (error) {
    console.error("Error fetching YouTube transcript:", error);
    
    // Provide a fallback for videos without transcripts
    if (process.env.EMERGENCY_FALLBACK === 'true') {
      console.log('🚨 Using emergency fallback for YouTube transcript');
      return `This is fallback content for YouTube video ${videoId}. The transcript could not be retrieved automatically.`;
    }
    
    throw new Error(`Failed to fetch YouTube transcript: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get basic metadata from content
 */
function getContentMetadata(content: string, contentType: string): any {
  const metadata: any = {
    sourceType: contentType
  };
  
  if (contentType === 'youtube') {
    const videoId = extractYoutubeId(content);
    metadata.title = `YouTube Video${videoId ? ': ' + videoId : ''}`;
    metadata.videoId = videoId;
  } else if (contentType === 'link' || contentType === 'article') {
    try {
      const url = new URL(content);
      metadata.title = `Article from ${url.hostname}`;
      metadata.url = content;
    } catch (e) {
      metadata.title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
    }
  } else {
    // For text content, use first line or beginning as title
    const firstLine = content.split('\n')[0] || '';
    metadata.title = firstLine.substring(0, 60) + (firstLine.length > 60 ? '...' : '');
  }
  
  return metadata;
}
