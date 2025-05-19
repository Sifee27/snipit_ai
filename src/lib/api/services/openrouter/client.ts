/**
 * OpenRouter API Client
 * Service for interacting with OpenRouter.ai API
 */
import { ProcessCallback } from "@/types/api";

// API endpoint for OpenRouter
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

// Debug flag - read from environment variable
const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_AI === 'true';

/**
 * Get the API key from environment variables
 */
export function getApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenRouter API key not found in environment variables');
  }
  
  // Basic validation to ensure the API key looks legitimate
  if (apiKey.length < 10) {
    console.warn(`WARNING: OpenRouter API key may be invalid. Expected length > 10, got: ${apiKey.substring(0, 3)}... (length: ${apiKey.length})`);
  }
  
  return apiKey;
}

/**
 * Log API key status for debugging (masked for security)
 */
export function getApiKeyStatus(): string {
  try {
    const apiKey = getApiKey();
    return apiKey ? 
      `API key configured (${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)})` : 
      'API key not found';
  } catch (error) {
    return 'API key not found or invalid';
  }
}

/**
 * Make a request to the OpenRouter API with enhanced error handling
 * @param model - The model ID to use for inference
 * @param messages - The messages array for the model
 * @param options - Additional options for the request
 * @param callback - Optional callback for progress updates
 */
export async function queryOpenRouter(
  model: string, 
  messages: Array<{role: string, content: string}>,
  options: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  } = {},
  callback?: ProcessCallback
): Promise<any> {
  // Get API key from environment variables
  const apiKey = getApiKey();
  
  // Default options
  const defaultOptions = {
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  };
  
  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Log API status
  if (DEBUG_MODE) {
    console.log('Using OpenRouter API key:', apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}` : 'Not set');
    console.log('------------------------------------------------');
    console.log(`OPENROUTER API DEBUG - REQUEST (${new Date().toISOString()})`);
    console.log(`Model: ${model}`);
    console.log(`API URL: ${OPENROUTER_API_URL}/chat/completions`);
    console.log('Request body:', JSON.stringify({
      model,
      messages,
      ...mergedOptions
    }).substring(0, 500) + (JSON.stringify(messages).length > 500 ? '...' : ''));
    console.log('------------------------------------------------');
  }
  
  try {
    callback?.({ status: 'processing', step: 'Connecting to OpenRouter API...' });
    
    // Validate API key before making request
    if (!apiKey) {
      throw new Error('OpenRouter API key not provided');
    }
    
    // Set up timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    // Make the API request
    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://snipit.app', // Replace with your actual domain
        'X-Title': 'Snipit App'
      },
      body: JSON.stringify({
        model,
        messages,
        ...mergedOptions
      }),
      signal: controller.signal
    });
    
    // Clear timeout since request completed
    clearTimeout(timeoutId);
    
    // Check for authentication errors
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Authentication failed with OpenRouter API: Invalid API key`);
    }
    
    // Log detailed response status for debugging
    if (DEBUG_MODE) {
      console.log('------------------------------------------------');
      console.log(`OPENROUTER API DEBUG - RESPONSE (${new Date().toISOString()})`);
      console.log(`Response status: ${response.status} ${response.statusText}`);
      console.log(`Response headers:`, Object.fromEntries([...response.headers.entries()]));
      console.log('------------------------------------------------');
    }
    
    if (!response.ok) {
      if (DEBUG_MODE) {
        console.log('------------------------------------------------');
        console.log(`OPENROUTER API DEBUG - ERROR RESPONSE`);
        
        // Try to read the error response body if possible
        let errorText = '';
        try {
          errorText = await response.text();
          console.log('Error response body:', errorText);
        } catch (e) {
          console.log('Could not read error response body');
        }
        console.log('------------------------------------------------');
      }
      
      // Handle specific error codes
      if (response.status === 401) {
        console.error('ERROR 401: Invalid API key or authentication failed.');
        throw new Error('Authentication failed with OpenRouter API: Invalid API key');
      } else if (response.status === 429) {
        console.error('ERROR 429: Rate limit exceeded.');
        throw new Error('Rate limit exceeded with OpenRouter API');
      } else if (response.status === 503) {
        console.error('ERROR 503: Service unavailable.');
        throw new Error('OpenRouter API service is currently unavailable');
      } else {
        console.error(`ERROR ${response.status}: API request failed.`);
        throw new Error(`OpenRouter API request failed with status ${response.status}`);
      }
    }

    try {
      // Parse response data
      if (DEBUG_MODE) {
        console.log('Attempting to parse JSON response from OpenRouter API...');
      }
      
      const responseText = await response.text();
      
      // Check for empty response text
      if (!responseText || responseText.trim() === '') {
        console.error('ERROR: Received empty response text from API.');
        throw new Error('Received empty response text from OpenRouter API');
      }
      
      if (DEBUG_MODE) {
        console.log('Raw response:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
      }
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('ERROR: Failed to parse JSON response:', parseError);
        console.error('Raw response that failed to parse:', responseText);
        throw new Error(`Failed to parse OpenRouter API response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
      
      // Log successful response
      if (DEBUG_MODE) {
        console.log('------------------------------------------------');
        console.log(`OPENROUTER API DEBUG - SUCCESS`);
        console.log('Parsed response data:', responseData);
        console.log('------------------------------------------------');
      }
      
      // Validate that we have actual data
      if (!responseData) {
        console.error('ERROR: Response data is null or undefined');
        throw new Error('Received null or undefined response from OpenRouter API');
      }
      
      if (!responseData.choices || responseData.choices.length === 0) {
        console.error('ERROR: No choices in response data');
        throw new Error('No choices returned from OpenRouter API');
      }
      
      if (DEBUG_MODE) {
        console.log('SUCCESS: Using real data from OpenRouter API');
      }
      
      // Return the real API data
      return responseData;
    } catch (error) {
      if (DEBUG_MODE) {
        console.log('------------------------------------------------');
        console.log('OPENROUTER API DEBUG - JSON PARSING ERROR');
        console.error('Failed to parse API response JSON:', error);
        console.log('------------------------------------------------');
      }
      throw new Error(`Failed to parse OpenRouter API response: ${error instanceof Error ? error.message : String(error)}`);
    }
  } catch (error) {
    if (DEBUG_MODE) {
      console.log('------------------------------------------------');
      console.log('OPENROUTER API DEBUG - NETWORK ERROR');
      console.error('Network error when connecting to OpenRouter API:', error);
      console.log('------------------------------------------------');
    }
    throw new Error(`Network error when connecting to OpenRouter API: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if the OpenRouter API is available
 * @returns Promise<boolean> - True if the API is available, false otherwise
 */
export async function isApiAvailable(): Promise<boolean> {
  try {
    // Try to get the API key
    const apiKey = getApiKey();
    
    // If we don't have an API key, the API is not available
    if (!apiKey) {
      return false;
    }
    
    // Make a simple request to check if the API is available
    const response = await fetch(`${OPENROUTER_API_URL}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    // If the response is ok, the API is available
    return response.ok;
  } catch (error) {
    // If there's an error, the API is not available
    return false;
  }
}
