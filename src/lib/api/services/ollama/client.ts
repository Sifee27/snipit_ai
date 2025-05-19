/**
 * Ollama API Client
 * Service for interacting with local Ollama models
 */
import { ProcessCallback } from "@/types/api";

// Default Ollama API endpoint (typically running locally)
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434/api';

// Debug flag - read from environment variable
const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_AI === 'true';

/**
 * Get the default model from environment variables
 */
export function getDefaultModel(): string {
  return process.env.OLLAMA_DEFAULT_MODEL || 'llama2';
}

/**
 * Log Ollama status for debugging
 */
export function getOllamaStatus(): string {
  const model = getDefaultModel();
  return `Using Ollama with model: ${model}`;
}

/**
 * Make a request to the Ollama API with enhanced error handling
 * @param model - The model ID to use for inference
 * @param prompt - The prompt for the model
 * @param options - Additional options for the request
 * @param callback - Optional callback for progress updates
 */
export async function queryOllama(
  model: string, 
  prompt: string,
  options: {
    system?: string;
    temperature?: number;
    num_predict?: number;
    top_p?: number;
    stop?: string[];
    stream?: boolean;
  } = {},
  callback?: ProcessCallback
): Promise<any> {
  // Default options
  const defaultOptions = {
    temperature: 0.7,
    num_predict: 1000,
    top_p: 0.9,
    stream: false
  };
  
  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Log API status
  if (DEBUG_MODE) {
    console.log(`Using Ollama with model: ${model}`);
    console.log('------------------------------------------------');
    console.log(`OLLAMA API DEBUG - REQUEST (${new Date().toISOString()})`);
    console.log(`Model: ${model}`);
    console.log(`API URL: ${OLLAMA_API_URL}/generate`);
    console.log('Request body:', JSON.stringify({
      model,
      prompt,
      ...mergedOptions
    }).substring(0, 500) + (prompt.length > 500 ? '...' : ''));
    console.log('------------------------------------------------');
  }
  
  try {
    callback?.({ status: 'processing', step: 'Connecting to Ollama...' });
    
    // Set up timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout (local models may be slower)
    
    // Make the API request
    const response = await fetch(`${OLLAMA_API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt,
        ...mergedOptions
      }),
      signal: controller.signal
    });
    
    // Clear timeout since request completed
    clearTimeout(timeoutId);
    
    // Log detailed response status for debugging
    if (DEBUG_MODE) {
      console.log('------------------------------------------------');
      console.log(`OLLAMA API DEBUG - RESPONSE (${new Date().toISOString()})`);
      console.log(`Response status: ${response.status} ${response.statusText}`);
      console.log(`Response headers:`, Object.fromEntries([...response.headers.entries()]));
      console.log('------------------------------------------------');
    }
    
    if (!response.ok) {
      if (DEBUG_MODE) {
        console.log('------------------------------------------------');
        console.log(`OLLAMA API DEBUG - ERROR RESPONSE`);
        
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
      if (response.status === 404) {
        console.error('ERROR 404: Model not found.');
        throw new Error(`Ollama model "${model}" not found. Make sure it's installed with "ollama pull ${model}"`);
      } else if (response.status === 500) {
        console.error('ERROR 500: Server error.');
        throw new Error('Ollama server error. Check if Ollama is running properly');
      } else {
        console.error(`ERROR ${response.status}: API request failed.`);
        throw new Error(`Ollama API request failed with status ${response.status}`);
      }
    }

    try {
      // Parse response data
      if (DEBUG_MODE) {
        console.log('Attempting to parse JSON response from Ollama API...');
      }
      
      const responseText = await response.text();
      
      // Check for empty response text
      if (!responseText || responseText.trim() === '') {
        console.error('ERROR: Received empty response text from API.');
        throw new Error('Received empty response text from Ollama API');
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
        throw new Error(`Failed to parse Ollama API response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
      
      // Log successful response
      if (DEBUG_MODE) {
        console.log('------------------------------------------------');
        console.log(`OLLAMA API DEBUG - SUCCESS`);
        console.log('Parsed response data:', responseData);
        console.log('------------------------------------------------');
      }
      
      // Validate that we have actual data
      if (!responseData) {
        console.error('ERROR: Response data is null or undefined');
        throw new Error('Received null or undefined response from Ollama API');
      }
      
      if (!responseData.response) {
        console.error('ERROR: No response text in response data');
        throw new Error('No response text returned from Ollama API');
      }
      
      if (DEBUG_MODE) {
        console.log('SUCCESS: Using real data from Ollama API');
      }
      
      // Return the real API data
      return responseData;
    } catch (error) {
      if (DEBUG_MODE) {
        console.log('------------------------------------------------');
        console.log('OLLAMA API DEBUG - JSON PARSING ERROR');
        console.error('Failed to parse API response JSON:', error);
        console.log('------------------------------------------------');
      }
      throw new Error(`Failed to parse Ollama API response: ${error instanceof Error ? error.message : String(error)}`);
    }
  } catch (error) {
    if (DEBUG_MODE) {
      console.log('------------------------------------------------');
      console.log('OLLAMA API DEBUG - NETWORK ERROR');
      console.error('Network error when connecting to Ollama API:', error);
      console.log('------------------------------------------------');
    }
    throw new Error(`Network error when connecting to Ollama API: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if the Ollama API is available
 * @returns Promise<boolean> - True if the API is available, false otherwise
 */
export async function isApiAvailable(): Promise<boolean> {
  try {
    // Make a simple request to check if Ollama is running
    const response = await fetch(`${OLLAMA_API_URL}/tags`, {
      method: 'GET',
      headers: {
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

/**
 * Generate a chat completion using Ollama's chat API
 * @param model - The model to use
 * @param messages - The chat messages
 * @param options - Additional options
 * @param callback - Optional callback for progress updates
 * @returns The response from the API
 */
export async function chatCompletion(
  model: string,
  messages: Array<{role: string, content: string}>,
  options: {
    temperature?: number;
    num_predict?: number;
    top_p?: number;
    stop?: string[];
    stream?: boolean;
  } = {},
  callback?: ProcessCallback
): Promise<any> {
  try {
    callback?.({ status: 'processing', step: 'Connecting to Ollama chat API...' });
    
    // Set up timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    // Make the API request
    const response = await fetch(`${OLLAMA_API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        ...options
      }),
      signal: controller.signal
    });
    
    // Clear timeout since request completed
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Ollama chat API request failed with status ${response.status}`);
    }
    
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    throw new Error(`Error in Ollama chat completion: ${error instanceof Error ? error.message : String(error)}`);
  }
}
