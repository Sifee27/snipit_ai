/**
 * Content processor using Hugging Face's Inference API
 */
import { ProcessRequest, ProcessResponse, ProcessCallback } from "@/types/api";
import { DEFAULT_PROCESSING_OPTIONS } from "@/config/constants";
// Import the correct YouTube transcript library
import { YoutubeTranscript } from 'youtube-transcript';
// Import mock processor for fallback
import { mockProcessContent } from './mock-processor';

// Configuration for Hugging Face API
// Add your API key in .env.local file: HUGGING_FACE_API_KEY=your_key_here

// Don't store the API key in a module-level variable, always access it directly from process.env
// This ensures we always get the latest value from the environment

// Log API key status for debugging (masked for security)
function getApiKeyStatus() {
  // Check for both variable names to aid in debugging
  const apiKey = process.env.HF_API_KEY || process.env.HUGGING_FACE_API_KEY;
  return apiKey ? 
    `API key configured (${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)})` : 
    'API key not found';
}

console.log(`Hugging Face API initialization: ${getApiKeyStatus()}`);

const HF_API_URL = 'https://api-inference.huggingface.co/models';

// Model endpoints configuration
const HF_MODELS = {
  summarization: 'facebook/bart-large-cnn',
  textGeneration: 'EleutherAI/gpt-neo-1.3B',  // More powerful model for text generation
  sentiment: 'distilbert-base-uncased-finetuned-sst-2-english',
  questionAnswering: 'deepset/roberta-base-squad2'
};

// Headers construction function - ensures API key is read at request time, not module load time
function getHfHeaders() {
  return {
    'Authorization': `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Helper function to make requests to Hugging Face API
 */
async function queryHuggingFace(model: string, inputs: string | object): Promise<any> {
  // Get API key from environment variables - NEVER hardcode in production
  const apiKey = process.env.HF_API_KEY || process.env.HUGGING_FACE_API_KEY;  
  
  // Check if we have a valid API key
  if (!apiKey) {
    console.error('ERROR: No valid API key found');
    throw new Error('No API key available for AI processing');
  }
  
  // Log API status
  console.log('Using Hugging Face API key:', apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}` : 'Not set');


  // Log detailed API request for debugging
  console.log('------------------------------------------------');
  console.log(`HUGGING FACE API DEBUG - REQUEST (${new Date().toISOString()})`);
  console.log(`Model: ${model}`);
  console.log(`API URL: ${HF_API_URL}/${model}`);
  console.log('Headers:', { 
    Authorization: `Bearer ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`, 
    'Content-Type': 'application/json' 
  });
  console.log('Request body:', JSON.stringify(inputs).substring(0, 500) + (JSON.stringify(inputs).length > 500 ? '...' : ''));
  console.log('------------------------------------------------');
  
  try {
    console.log('Sending fetch request to Hugging Face API...');
    // Create headers with our API key
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    
    // Add timeout and retry logic for production reliability
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${HF_API_URL}/${model}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(inputs),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId); // Clear the timeout if request completes
  
    // Log detailed response status for debugging
    console.log('------------------------------------------------');
    console.log(`HUGGING FACE API DEBUG - RESPONSE (${new Date().toISOString()})`);
    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log(`Response headers:`, Object.fromEntries([...response.headers.entries()]));
    console.log('------------------------------------------------');
    
    if (!response.ok) {
      console.log('------------------------------------------------');
      console.log(`HUGGING FACE API DEBUG - ERROR RESPONSE`);
      
      // Try to read the error response body if possible
      let errorText = '';
      try {
        errorText = await response.text();
        console.log('Error response body:', errorText);
      } catch (e) {
        console.log('Could not read error response body');
      }
      
      // Handle specific error codes but don't fall back to mock data
      if (response.status === 401) {
        console.error('ERROR 401: Invalid API key or authentication failed.');
        console.error('Current API Key starts with:', apiKey.substring(0, 4) || 'none');
        throw new Error('Authentication failed with Hugging Face API: Invalid API key');
      } else if (response.status === 429) {
        console.error('ERROR 429: Rate limit exceeded.');
        throw new Error('Rate limit exceeded with Hugging Face API');
      } else if (response.status === 503) {
        console.error('ERROR 503: Model is currently loading.');
        console.error('This is normal for the first request to a model. Waiting for model to load...');
        // Retry once after waiting 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));
        return queryHuggingFace(model, inputs);
      } else {
        console.error(`ERROR ${response.status}: API request failed.`);
        console.error('Error details:', errorText || 'No error details available');
        throw new Error(`Hugging Face API request failed with status ${response.status}: ${errorText || 'No error details'}`);
      }
      console.log('------------------------------------------------');
    }

    try {
      // Parse response data
      console.log('Attempting to parse JSON response from Hugging Face API...');
      const responseText = await response.text();
      console.log('Raw response:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
      
      const responseData = JSON.parse(responseText);
      
      // Log successful response
      console.log('------------------------------------------------');
      console.log(`HUGGING FACE API DEBUG - SUCCESS`);
      console.log('Parsed response data type:', Array.isArray(responseData) ? 'Array' : typeof responseData);
      console.log('Response data structure:', Array.isArray(responseData) 
        ? `Array with ${responseData.length} items` 
        : `Object with keys: ${Object.keys(responseData).join(', ')}`);
      console.log('------------------------------------------------');
      
      // Validate that we have actual data
      if (!responseData || 
          (Array.isArray(responseData) && responseData.length === 0) ||
          (typeof responseData === 'object' && Object.keys(responseData).length === 0)) {
        console.error('ERROR: Received empty response from API.');
        throw new Error('Received empty response from Hugging Face API');
      }
      
      console.log('SUCCESS: Using real data from Hugging Face API');
      // Return the real API data
      return responseData;
    } catch (error) {
      console.log('------------------------------------------------');
      console.log('HUGGING FACE API DEBUG - JSON PARSING ERROR');
      console.error('Failed to parse API response JSON:', error);
      console.log('This indicates the API returned invalid JSON. Check the model and request parameters.');
      console.log('------------------------------------------------');
      throw new Error(`Failed to parse Hugging Face API response: ${error instanceof Error ? error.message : String(error)}`);
    }
  } catch (error) {
    console.log('------------------------------------------------');
    console.log('HUGGING FACE API DEBUG - NETWORK ERROR');
    console.error('Network error when connecting to Hugging Face API:', error);
    console.log('This could be due to:');
    console.log('1. Network connectivity issues');
    console.log('2. Firewall or security settings blocking the request');
    console.log('3. The Hugging Face API endpoint being unavailable');
    console.log('------------------------------------------------');
    throw new Error(`Network error when connecting to Hugging Face API: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate mock responses for when the API fails
 */
function getMockResponseForModel(model: string, inputs: any): any {
  // Extract content from inputs depending on the model type
  const content = typeof inputs === 'string' ? inputs : 
                 inputs.inputs ? inputs.inputs : 
                 inputs.inputs?.context ? inputs.inputs.context : 'Sample content';
  
  const contentSample = typeof content === 'string' ? content.slice(0, 100) : 'Sample content';
  
  // Generate appropriate mock responses based on model type
  switch(model) {
    case HF_MODELS.summarization:
      return [{ summary_text: `This is a mock summary of the content: ${contentSample}...` }];
      
    case HF_MODELS.textGeneration:
      return [{ generated_text: `This is mock generated text about: ${contentSample}...` }];
      
    case HF_MODELS.questionAnswering:
      return { answer: `This is a mock answer to the question about: ${contentSample}...` };
      
    default:
      return { mock_response: `Mock data for unavailable model: ${model}` };
  }
}

/**
 * Generate a summary using Hugging Face's BART model
 */
async function generateAISummary(content: string): Promise<string> {
  try {
    console.log('Generating AI summary with model:', HF_MODELS.summarization);
    console.log('Input content length:', content.length);
    
    // Allow more content for better quality summaries
    const truncatedContent = content.length > 4000 ? content.substring(0, 4000) + '...' : content;
    
    // Improve the summary generation with better prompting to create longer sentences
    const enhancedPrompt = `Summarize the following content into a detailed, insightful summary that captures the main points, key arguments, and conclusions. Use longer, well-structured sentences and ensure comprehensive coverage of the content. Focus on extracting valuable insights using complete, thorough explanations rather than just condensing the text:\n\n${truncatedContent}`;
    
    const summarizer = HF_MODELS.summarization;
    const response = await queryHuggingFace(summarizer, { 
      inputs: enhancedPrompt,
      parameters: {
        min_length: 250,  // Increased for longer, more substantial summaries
        max_length: 600,  // Allow for longer summaries with more detail
        do_sample: false, // More deterministic output
        early_stopping: true,
        length_penalty: 2.0, // Encourages the model to generate longer sequences
        no_repeat_ngram_size: 3 // Reduces repetition while allowing longer sentences
      }
    });
    
    console.log('Summary response received, type:', typeof response);
    console.log('Is array?', Array.isArray(response));
    
    if (Array.isArray(response) && response.length > 0) {
      if (typeof response[0].summary_text === 'string') {
        console.log('Valid summary text received, length:', response[0].summary_text.length);
        // Post-process to remove any "Summary:" prefixes and clean up formatting
        let summary = response[0].summary_text.trim();
        summary = summary.replace(/^(Summary:|SUMMARY:)\s*/i, '');
        return summary;
      }
    }
    
    console.warn('Unexpected summary format from Hugging Face API:', JSON.stringify(response).substring(0, 200));
    throw new Error('Invalid response format from summarization API');
  } catch (error) {
    console.error('Error generating AI summary:', error);
    throw error; // Propagate the error so we can see exactly where processing fails
  }
}

/**
 * Extract relevant quotes using question-answering model
 */
async function extractAIQuotes(content: string): Promise<string[]> {
  try {
    console.log('Extracting AI quotes with model:', HF_MODELS.questionAnswering);
    console.log('Input content length:', content.length);
    
    // Ensure content isn't too long by truncating if needed
    const truncatedContent = content.length > 2000 ? content.substring(0, 2000) + '...' : content;
    
    const questions = [
      'What are the key quotes from this content?',
      'What are the most important statements in this text?',
      'What are the main takeaways from this content?'
    ];

    console.log('Sending quote extraction requests with questions:', questions);
    
    const quotes = await Promise.all(questions.map(async (question, index) => {
      console.log(`Processing question ${index + 1}/${questions.length}: ${question}`);
      
      const response = await queryHuggingFace(HF_MODELS.questionAnswering, {
        inputs: {
          question,
          context: truncatedContent
        }
      });
      
      console.log(`Response for question ${index + 1}:`, response);
      
      if (response && typeof response.answer === 'string') {
        return response.answer.trim();
      } else {
        console.warn(`Unexpected format for question ${index + 1} response:`, response);
        return null;
      }
    }));

    const validQuotes = quotes.filter(quote => quote && quote.length > 10);
    console.log(`Extracted ${validQuotes.length} valid quotes from ${quotes.length} attempts`);
    
    if (validQuotes.length === 0) {
      throw new Error('No valid quotes could be extracted');
    }
    
    return validQuotes;
  } catch (error) {
    console.error('Quote extraction failed:', error);
    throw error; // Propagate error
  }
}

/**
 * Generate social media content using GPT-2
 */
async function generateAISocialContent(content: string): Promise<string> {
  try {
    console.log('Generating social media content with model:', HF_MODELS.textGeneration);
    console.log('Input content length:', content.length);
    
    // Ensure content isn't too long by truncating if needed
    const truncatedContent = content.length > 500 ? content.substring(0, 500) + '...' : content;
    
    const prompt = `Based on the following content, create a social media post:\n\n${truncatedContent}\n\nSocial Post:`;
    
    console.log('Social post prompt (truncated):', prompt.substring(0, 100) + '...');
    
    const response = await queryHuggingFace(HF_MODELS.textGeneration, {
      inputs: prompt,
      parameters: {
        max_length: 200,
        min_length: 100,
        temperature: 0.7,
        top_p: 0.9,
        repetition_penalty: 1.2
      }
    });
    
    console.log('Social post response received:', response);
    
    if (Array.isArray(response) && response.length > 0 && typeof response[0].generated_text === 'string') {
      const generatedText = response[0].generated_text;
      console.log('Generated text from API:', generatedText);
      
      // Try to extract just the social post part after our prompt
      const socialPost = generatedText.split('Social Post:')[1]?.trim() || generatedText;
      console.log('Extracted social post:', socialPost);
      
      return socialPost;
    }
    
    console.warn('Unexpected format from text generation API:', JSON.stringify(response).substring(0, 200));
    throw new Error('Invalid response format from text generation API');
  } catch (error) {
    console.error('Social content generation failed:', error);
    throw error; // Propagate the error
  }
}

/**
 * Generate blog content using GPT-2
 */
async function generateAIBlogContent(content: string): Promise<string> {
  try {
    console.log('Generating blog content with model:', HF_MODELS.textGeneration);
    console.log('Input content length:', content.length);
    
    // Allow more content to be used for better blog generation
    const truncatedContent = content.length > 2000 ? content.substring(0, 2000) + '...' : content;
    
    const prompt = `Write a comprehensive, well-structured blog post based on the following content. Include a clear introduction, several detailed sections with proper headings, and a conclusion. Use specific details and examples from the source material. The blog should be informative, engaging, and contain actual insights rather than generic filler content:\n\n${truncatedContent}`;
    
    console.log('Blog prompt (truncated):', prompt.substring(0, 100) + '...');
    
    const response = await queryHuggingFace(HF_MODELS.textGeneration, {
      inputs: prompt,
      parameters: {
        max_length: 1200,         // Increased for more detailed content
        min_length: 800,          // Ensure substantial blog posts
        temperature: 0.7,         // Slightly reduced for more focused output
        top_p: 0.9,
        repetition_penalty: 1.2,
        num_return_sequences: 1,  // Ensure we get a complete blog post
        do_sample: true,          // Enable sampling for more creative content
        top_k: 50                 // Consider more token options for varied text
      }
    });
    
    console.log('Blog response received type:', typeof response);
    console.log('Blog response structure:', Array.isArray(response) ? 'array' : 'not array');
    
    if (Array.isArray(response) && response.length > 0 && typeof response[0].generated_text === 'string') {
      const blogContent = response[0].generated_text;
      console.log('Generated blog text length:', blogContent.length);
      return blogContent;
    }
    
    console.warn('Unexpected format from blog generation API:', JSON.stringify(response).substring(0, 200));
    throw new Error('Invalid response format from blog generation API');
  } catch (error) {
    console.error('Blog content generation failed:', error);
    throw error; // Propagate error for better debugging
  }
}

/**
 * Helper function to extract YouTube video ID
 */
function extractYoutubeId(url: string): string | null {
  // Handle multiple formats of YouTube URLs
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/, // Standard youtube.com/watch?v=ID
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/, // Short youtu.be/ID
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/, // Embed youtube.com/embed/ID
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/ // Legacy youtube.com/v/ID
  ];
  
  // Try each pattern
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      console.log(`Successfully extracted YouTube ID: ${match[1]} using pattern: ${pattern}`);
      return match[1];
    }
  }
  
  // If no pattern matched, try last resort extraction
  const lastResort = url.match(/([a-zA-Z0-9_-]{11})/);
  if (lastResort && lastResort[1]) {
    console.log(`Extracted YouTube ID using last resort: ${lastResort[1]}`);
    return lastResort[1];
  }
  
  console.warn(`Could not extract YouTube ID from URL: ${url}`);
  return null;
}

/**
 * Extract metadata from content
 */
function extractMetadata(content: string, contentType: string): { title: string; sourceType: string; duration?: string } {
  const metadata = {
    title: '',
    sourceType: contentType,
    duration: undefined
  };

  if (contentType === 'youtube') {
    const videoId = extractYoutubeId(content);
    metadata.title = `YouTube Video: ${videoId}`;
  } else {
    metadata.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
  }

  return metadata;
}

/**
 * Process content using Hugging Face AI models with progress callbacks
 * @param request The content processing request containing content, type, and options
 * @param callback Optional callback for progress updates
 * @returns Processed content with summary, quotes, social posts and metadata
 */
export async function processContent(
  request: ProcessRequest,
  callback?: ProcessCallback
): Promise<ProcessResponse> {
  // First check if emergency fallback is enabled
  const EMERGENCY_FALLBACK = process.env.EMERGENCY_FALLBACK === 'true';
  
  // Handle direct fallback requests immediately without trying API
  const forceEmergencyFallback = EMERGENCY_FALLBACK;
  
  // Immediately use mock data if fallback is forced
  if (forceEmergencyFallback) {
    console.log('\ud83d\udea8 IMMEDIATE FALLBACK: Using hardcoded content to bypass all APIs');
    
    // Generate basic mock response right away without any API calls
    return {
      summary: "This is mock generated content created as a fallback because the AI APIs are currently unavailable. The system is using locally generated data instead of making external API calls.",
      keyQuotes: [
        { text: "This is a mock key quote generated as a fallback.", timestamp: "N/A" },
        { text: "No real AI was used to create this content.", timestamp: "N/A" },
        { text: "Once the APIs are available again, real AI processing will resume.", timestamp: "N/A" }
      ],
      socialPost: "[AI API OFFLINE] This is a mock social post created as an emergency fallback. The content processing APIs are currently unavailable.",
      blogPost: "# Emergency Fallback Content\n\nThis is mock content created because the AI processing APIs are currently unavailable. This placeholder content is being shown instead of attempting to call external AI services.",
      processedAt: new Date().toISOString(),
      contentMetadata: {
        title: (request?.content || request?.url || 'Unknown content')?.slice(0, 50) + 
               ((request?.content || request?.url || '').length > 50 ? '...' : ''),
        sourceType: request?.contentType || 'text',
        duration: 'N/A'
      }
    };
  }
  
  try {
    // Extract data from the request with fallbacks
    let contentToProcess = "";
    
    // Check for either content or URL field
    if (request?.content && typeof request.content === 'string' && request.content.trim()) {
      contentToProcess = request.content;
    } else if (request?.url && typeof request.url === 'string' && request.url.trim()) {
      contentToProcess = request.url;
    } else {
      callback?.({ status: 'error', step: 'Content validation failed' });
      throw new Error("Neither content nor URL was provided");
    }
    
    let contentType = request?.contentType || "text";
    const options = request?.options || {};
    
    // Log that we found valid content
    console.log(`Using ${contentToProcess.startsWith('http') ? 'URL' : 'content'} for processing: ${contentToProcess.substring(0, 50)}${contentToProcess.length > 50 ? '...' : ''}`);
    callback?.({ status: 'processing', step: 'Content validation successful' });
    
    // Log processing request
    console.log(`Processing ${contentType} content, length: ${contentToProcess.length} characters`);
    callback?.({ status: 'processing', step: 'Validating content...' });

    // Validate YouTube URLs and get transcript if needed
    let processableContent = contentToProcess;
    if (contentType === 'youtube') {
      const videoId = extractYoutubeId(contentToProcess);
      if (!videoId) {
        throw new Error("Invalid YouTube URL provided");
      }
      
      // Ensure content is a valid YouTube URL - Use a much more permissive regex
      // This will check for either youtube.com or youtu.be in the URL
      if (!contentToProcess.includes('youtube.com') && !contentToProcess.includes('youtu.be')) {
        console.error('Invalid YouTube URL format:', contentToProcess);
        throw new Error("Invalid YouTube URL format");
      }
      
      // Log that we're accepting this URL format
      console.log('YouTube URL format accepted:', contentToProcess);
      
      // Get video transcript
      callback?.({ status: 'processing', step: 'Fetching video transcript...' });
      try {
        // Try different approaches to get the transcript
        let transcript: Array<{text?: string; duration?: number; offset?: number}> = [];
        
        console.log('------------------------------------------------');
        console.log(`YOUTUBE TRANSCRIPT DEBUG - REQUEST (${new Date().toISOString()})`);
        console.log(`Video ID: ${videoId}`);
        console.log('Full YouTube URL:', contentToProcess);
        console.log('YoutubeTranscript API available:', !!YoutubeTranscript.fetchTranscript);
        console.log('------------------------------------------------');
        
        try {
          // First attempt: Use YoutubeTranscript library
          console.log('Attempting to fetch transcript with YoutubeTranscript...');
          transcript = await YoutubeTranscript.fetchTranscript(videoId);
          console.log('Successfully fetched transcript with YoutubeTranscript API');
        } catch (transcriptError) {
          console.warn('YouTube transcript fetch failed:', transcriptError);
          console.warn('Error type:', transcriptError instanceof Error ? transcriptError.constructor.name : typeof transcriptError);
          console.warn('Error message:', transcriptError instanceof Error ? transcriptError.message : String(transcriptError));
          
          // For debugging - log the full video URL
          console.log('Full YouTube URL that failed:', contentToProcess);
          transcript = [];
        }
        
        if (transcript && transcript.length > 0) {
          processableContent = transcript.map((item: any) => item.text || '').filter(Boolean).join(' ');
          console.log(`Successfully extracted transcript with ${transcript.length} segments`);
        } else {
          // Try graceful degradation - use the video title/description instead
          console.error('\u26a0\ufe0f WARNING: Transcript unavailable - using minimal content');
          // Generate a fallback text that at least describes what we're processing
          processableContent = `YouTube video ID: ${videoId}. This is a text summary for a YouTube video where transcript extraction failed. Please analyze this video based on the video ID.`;
          callback?.({ status: 'processing', step: 'Using fallback content for YouTube video (transcript unavailable)' });
        }
      } catch (err) {
        console.error('All transcript fetch methods failed:', err instanceof Error ? err.message : err);
        // Use minimal fallback to allow at least some processing
        console.error('\ud83d\udd34 Unable to process transcript - using minimal fallback');
        processableContent = `YouTube video with ID ${videoId}. No transcript available.`;
        callback?.({ status: 'error', step: 'Using minimal content due to transcript extraction failure' });
      }
    }
    
    // Merge options with defaults
    const fullOptions = { ...DEFAULT_PROCESSING_OPTIONS, ...options };
    
    // Process content in parallel using AI services
    callback?.({ status: 'processing', step: 'Analyzing content...' });
    console.log('------------------------------------------------');
    console.log(`CONTENT PROCESSING DEBUG - ${new Date().toISOString()}`);
    console.log(`Content type: ${contentType}`);
    console.log(`Content length: ${contentToProcess.length} characters`);
    console.log(`First 100 chars: ${contentToProcess.substring(0, 100)}...`);
    console.log('------------------------------------------------');
    
    try {
      const [summary, quotes, socialPost, metadata] = await Promise.all([
        generateAISummary(processableContent),
        extractAIQuotes(processableContent),
        generateAISocialContent(processableContent),
        extractMetadata(contentToProcess, contentType)
      ]);
    
      // Generate blog content if requested
      let blogContent;
      if (fullOptions.generateBlog) {
        callback?.({ status: 'processing', step: 'Generating blog post...' });
        blogContent = await generateAIBlogContent(processableContent);
      }
      
      callback?.({ status: 'complete', step: 'Processing complete' });
      console.log('Successfully processed content with AI models');
    
      // Return final processed content
      return {
        summary: summary,
        keyQuotes: quotes.map((q: string) => ({ text: q })),
        socialPost: socialPost,
        blogPost: blogContent,
        processedAt: new Date().toISOString(),
        contentMetadata: metadata
      };
    } catch (processingError) {
      console.error('Error during parallel content processing:', processingError);
      console.error('Error type:', processingError instanceof Error ? processingError.constructor.name : typeof processingError);
      console.error('Error message:', processingError instanceof Error ? processingError.message : String(processingError));
      throw processingError; // Re-throw to be caught by the main try/catch
    }
  } catch (error) {
    console.error('----------------------------------------------------------');
    console.error('ERROR IN CONTENT PROCESSING - FULL DETAILS:');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('----------------------------------------------------------');
    
    callback?.({ status: 'error', step: error instanceof Error ? error.message : 'Unknown error' });
    
    // Return the error to the caller instead of using mock data
    throw error; // This will propagate to the caller, requiring proper error handling there
  }
}
