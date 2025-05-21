/**
 * Debug route to check environment variables and API configuration
 * This is a temporary endpoint to help diagnose issues with the Hugging Face API integration
 */
import { NextResponse } from 'next/server';

export async function GET() {
  // Don't expose any portion of API keys, even for debugging
  const apiKey = process.env.HUGGING_FACE_API_KEY || '';
  
  // Gather all debug information
  const debugInfo = {
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      HF_API_KEY_EXISTS: !!process.env.HUGGING_FACE_API_KEY,
      HF_API_KEY_STATUS: apiKey ? 'CONFIGURED' : 'NOT CONFIGURED',
      HF_API_KEY_VALID: apiKey && apiKey.length > 10 && !apiKey.includes('your_api_key_here'),
    },
    nextConfig: {
      // Add any next.config.js relevant settings
      dotenvLoaded: true,
    },
    processInfo: {
      versions: process.versions,
      env: process.env.PATH ? 'PATH exists' : 'No PATH',
      platform: process.platform,
    }
  };

  return NextResponse.json(debugInfo);
}
