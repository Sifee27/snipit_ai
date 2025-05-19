/**
 * API Debug Utilities
 * Provides debugging tools for API-related issues
 */

// Flag to enable debugging
const DEBUG_API = process.env.NEXT_PUBLIC_DEBUG_API === 'true';

/**
 * Validate API response structure and log detailed information about any problems
 * @param response The API response to validate
 * @returns True if the response is valid, false otherwise
 */
export function validateApiResponse(response: any): boolean {
  // If debugging is disabled, just return true to avoid affecting production
  if (!DEBUG_API) return true;
  
  // Basic validation checks
  if (!response) {
    console.error('Invalid API response format: Response is null or undefined');
    return false;
  }
  
  if (typeof response !== 'object') {
    console.error(`Invalid API response format: ${JSON.stringify(response)}`);
    return false;
  }

  // Check for success flag
  if (response.success === undefined) {
    console.error(`Invalid API response format: Missing 'success' flag in ${JSON.stringify(response)}`);
    return false;
  }
  
  // Check for data property when success is true
  if (response.success === true && response.data === undefined) {
    console.error(`Invalid API response format: Success response missing 'data' property in ${JSON.stringify(response)}`);
    return false;
  }

  // Check for error property when success is false
  if (response.success === false && response.error === undefined) {
    console.error(`Invalid API response format: Error response missing 'error' property in ${JSON.stringify(response)}`);
    return false;
  }

  return true;
}

/**
 * Add ApiDebug to the global window object for inspection in browser console
 */
if (typeof window !== 'undefined') {
  (window as any).ApiDebug = {
    validateApiResponse,
    testResponse: (response: any) => console.log('Response valid:', validateApiResponse(response))
  };
}
