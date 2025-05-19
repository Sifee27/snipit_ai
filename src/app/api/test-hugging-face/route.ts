/**
 * Test endpoint to directly diagnose Hugging Face API connection
 */
import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

// Testing direct API access
async function testHuggingFaceAPI() {
  const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;
  const HF_API_URL = 'https://api-inference.huggingface.co/models';
  const model = 'facebook/bart-large-cnn'; // Simple test model
  
  try {
    console.log('Testing Hugging Face API connection with key:', 
      HF_API_KEY ? `${HF_API_KEY.substring(0, 4)}...${HF_API_KEY.substring(HF_API_KEY.length - 4)}` : 'NOT FOUND');
    
    const headers = {
      'Authorization': `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json'
    };
    
    console.log('Request headers:', JSON.stringify({
      'Authorization': `Bearer ${HF_API_KEY?.substring(0, 4)}...`,
      'Content-Type': 'application/json'
    }));
    
    const response = await fetch(`${HF_API_URL}/${model}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ inputs: 'This is a test of the Hugging Face API connection.' })
    });
    
    const status = response.status;
    const headers_received = Object.fromEntries([...response.headers.entries()]);
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = await response.text();
    }
    
    return {
      success: response.ok,
      status,
      headers: headers_received,
      data: responseData
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      errorType: error?.constructor?.name
    };
  }
}

// Testing YouTube transcript functionality
async function testYoutubeTranscript() {
  const TEST_VIDEO_ID = 'w0H1-b044KY'; // Example YouTube video
  
  try {
    console.log('Testing YouTube transcript API with video ID:', TEST_VIDEO_ID);
    
    // Check if the API is available
    const apiAvailable = typeof YoutubeTranscript?.fetchTranscript === 'function';
    console.log('YoutubeTranscript API available:', apiAvailable);
    
    if (!apiAvailable) {
      return {
        success: false,
        error: 'YoutubeTranscript API not available',
        apiStructure: JSON.stringify(YoutubeTranscript)
      };
    }
    
    // Try to fetch transcript
    const transcript = await YoutubeTranscript.fetchTranscript(TEST_VIDEO_ID);
    
    return {
      success: true,
      transcriptLength: transcript.length,
      sampleContent: transcript.slice(0, 3) // First 3 entries
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      errorType: error?.constructor?.name
    };
  }
}

// Main handler
export async function GET() {
  // Test both systems
  const [hfResult, ytResult] = await Promise.all([
    testHuggingFaceAPI(),
    testYoutubeTranscript()
  ]);
  
  // Include environment variables status (masked for security)
  const envStatus = {
    NODE_ENV: process.env.NODE_ENV,
    HF_API_KEY_EXISTS: !!process.env.HUGGING_FACE_API_KEY,
    HF_API_KEY_LENGTH: process.env.HUGGING_FACE_API_KEY?.length || 0,
    HF_API_KEY_MASKED: process.env.HUGGING_FACE_API_KEY ? 
      `${process.env.HUGGING_FACE_API_KEY.substring(0, 4)}...${process.env.HUGGING_FACE_API_KEY.substring(process.env.HUGGING_FACE_API_KEY.length - 4)}` : 
      'NOT FOUND'
  };
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: envStatus,
    huggingFaceTest: hfResult,
    youtubeTranscriptTest: ytResult
  });
}
