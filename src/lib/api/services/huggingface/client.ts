/**
 * Hugging Face API Client
 * Service for interacting with Hugging Face Inference API
 */
import { ProcessCallback } from "@/types/api";

// API endpoint for Hugging Face
const HF_API_URL = 'https://api-inference.huggingface.co/models';

/**
 * Get the API key from environment variables
 * Checks multiple environment variable names for backward compatibility
 */
export function getApiKey(): string {
  // Check for both variable names to aid in debugging
  const apiKey = process.env.HF_API_KEY || process.env.HUGGING_FACE_API_KEY;
  
  if (!apiKey) {
    throw new Error('Hugging Face API key not found in environment variables');
  }
  
  // Basic validation to ensure the API key looks legitimate
  if (apiKey.length < 10 || !apiKey.startsWith('hf_')) {
    console.warn(`WARNING: Hugging Face API key may be invalid. Expected format: 'hf_...' with length > 10, got: ${apiKey.substring(0, 3)}... (length: ${apiKey.length})`);
  }
  
  return apiKey;
}

/**
 * Log API key status for debugging (masked for security)
 */
export function getApiKeyStatus(): string {
  const apiKey = getApiKey();
  return apiKey ? 
    `API key configured (${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)})` : 
    'API key not found';
}

/**
 * Make a request to the Hugging Face Inference API with enhanced error handling
 * @param model - The model ID to use for inference
 * @param inputs - The input data for the model
 * @param callback - Optional callback for progress updates
 */
export async function queryHuggingFace(
  model: string, 
  inputs: string | object,
  callback?: ProcessCallback
): Promise<any> {
  // Get API key from environment variables
  const apiKey = getApiKey();
  
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
    callback?.({ status: 'processing', step: 'Connecting to Hugging Face API...' });
    
    // Validate API key before making request
    if (!apiKey) {
      throw new Error('Hugging Face API key not provided');
    }
    
    // Check if this is a demo key
    if (apiKey.includes('demo') || apiKey.includes('replace_with_your_real')) {
      throw new Error('Demo API key detected. Please replace with a real Hugging Face API key');
    }
    
    // Validate key format
    if (apiKey.length < 10 || !apiKey.startsWith('hf_')) {
      throw new Error(`Invalid Hugging Face API key format: ${apiKey ? apiKey.substring(0, 3) + '...' : 'not provided'}. API keys should start with 'hf_' and be at least 10 characters long.`);
    }
    
    // Prepare headers
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    
    // Set up timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    // Make the API request
    const response = await fetch(`${HF_API_URL}/${model}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(inputs),
      signal: controller.signal
    });
    
    // Clear timeout since request completed
    clearTimeout(timeoutId);
    
    // Check for authentication errors
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Authentication failed with Hugging Face API: Invalid API key`);
    }
    
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
        return queryHuggingFace(model, inputs, callback);
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
      
      // Check for empty response text
      if (!responseText || responseText.trim() === '') {
        console.error('ERROR: Received empty response text from API.');
        throw new Error('Received empty response text from Hugging Face API');
      }
      
      console.log('Raw response:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('ERROR: Failed to parse JSON response:', parseError);
        console.error('Raw response that failed to parse:', responseText);
        throw new Error(`Failed to parse Hugging Face API response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
      
      // Log successful response
      console.log('------------------------------------------------');
      console.log(`HUGGING FACE API DEBUG - SUCCESS`);
      console.log('Parsed response data type:', Array.isArray(responseData) ? 'Array' : typeof responseData);
      console.log('Response data structure:', Array.isArray(responseData) 
        ? `Array with ${responseData.length} items` 
        : `Object with keys: ${Object.keys(responseData).join(', ')}`);
      console.log('------------------------------------------------');
      
      // Validate that we have actual data
      if (!responseData) {
        console.error('ERROR: Response data is null or undefined');
        throw new Error('Received null or undefined response from Hugging Face API');
      }
      
      if (Array.isArray(responseData) && responseData.length === 0) {
        console.error('ERROR: Received empty array from API.');
        throw new Error('Received empty array from Hugging Face API');
      }
      
      if (typeof responseData === 'object' && Object.keys(responseData).length === 0) {
        console.error('ERROR: Received empty object from API.');
        throw new Error('Received empty object from Hugging Face API');
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
