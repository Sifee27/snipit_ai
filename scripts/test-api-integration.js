/**
 * Direct test script for Hugging Face API and YouTube Transcript integration
 * 
 * Run with: node scripts/test-api-integration.js
 */
require('dotenv').config({ path: '.env.local' });
const { YoutubeTranscript } = require('youtube-transcript');

// Test configuration
const TEST_VIDEO_ID = 'w0H1-b044KY'; // Example YouTube video
const HF_API_URL = 'https://api-inference.huggingface.co/models';
const HF_MODEL = 'facebook/bart-large-cnn';
const TEST_INPUT = 'This is a test input for the Hugging Face API. Please summarize this text.';

// Print environment info
console.log('='.repeat(80));
console.log('ENVIRONMENT DIAGNOSTICS');
console.log('='.repeat(80));
console.log('Node.js version:', process.version);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Check API key
const apiKey = process.env.HUGGING_FACE_API_KEY;
console.log('API Key Status:', apiKey ? 'CONFIGURED' : 'NOT CONFIGURED');
if (apiKey) {
  console.log('API Key valid format:', !apiKey.includes('your_api_key_here') && apiKey.length > 10);
} else {
  console.log('ERROR: Hugging Face API key not found in environment');
  console.log('Please set HUGGING_FACE_API_KEY in your .env.local file');
}

// Test YouTube transcript API
async function testYoutubeTranscript() {
  console.log('\n' + '='.repeat(80));
  console.log('YOUTUBE TRANSCRIPT TEST');
  console.log('='.repeat(80));
  console.log('Testing video ID:', TEST_VIDEO_ID);
  
  try {
    console.log('YoutubeTranscript API available:', typeof YoutubeTranscript?.fetchTranscript === 'function');
    console.log('Starting transcript fetch...');
    const transcript = await YoutubeTranscript.fetchTranscript(TEST_VIDEO_ID);
    
    console.log('SUCCESS! Transcript received');
    console.log('Transcript segments:', transcript.length);
    console.log('First 2 segments:', JSON.stringify(transcript.slice(0, 2), null, 2));
    
    return {
      success: true,
      transcriptLength: transcript.length
    };
  } catch (error) {
    console.log('ERROR fetching transcript:');
    console.log('Error type:', error.constructor.name);
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Test Hugging Face API
async function testHuggingFaceAPI() {
  console.log('\n' + '='.repeat(80));
  console.log('HUGGING FACE API TEST');
  console.log('='.repeat(80));
  console.log('Testing model:', HF_MODEL);
  console.log('API URL:', `${HF_API_URL}/${HF_MODEL}`);
  
  try {
    if (!apiKey) {
      throw new Error('API key not available');
    }
    
    // Create headers
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    
    console.log('Request headers:', {
      'Authorization': `Bearer ${apiKey.substring(0, 4)}...`,
      'Content-Type': 'application/json'
    });
    
    console.log('Sending request to Hugging Face API...');
    const response = await fetch(`${HF_API_URL}/${HF_MODEL}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ inputs: TEST_INPUT })
    });
    
    console.log('Response status:', response.status, response.statusText);
    console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
    
    let responseData;
    try {
      responseData = await response.json();
      console.log('Response data:', JSON.stringify(responseData, null, 2));
    } catch (e) {
      responseData = await response.text();
      console.log('Response text:', responseData);
    }
    
    return {
      success: response.ok,
      status: response.status,
      data: responseData
    };
  } catch (error) {
    console.log('ERROR calling Hugging Face API:');
    console.log('Error type:', error.constructor.name);
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Run tests
async function runTests() {
  const ytResult = await testYoutubeTranscript();
  const hfResult = await testHuggingFaceAPI();
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(80));
  console.log('YouTube Transcript Test:', ytResult.success ? 'SUCCESS' : 'FAILED');
  console.log('Hugging Face API Test:', hfResult.success ? 'SUCCESS' : 'FAILED');
  
  if (!ytResult.success) {
    console.log('YouTube Transcript Error:', ytResult.error);
    console.log('TROUBLESHOOTING TIPS:');
    console.log('- Check internet connection');
    console.log('- Verify the video ID is correct and the video exists');
    console.log('- Ensure youtube-transcript package is correctly installed');
  }
  
  if (!hfResult.success) {
    console.log('Hugging Face API Error:', hfResult.error);
    console.log('TROUBLESHOOTING TIPS:');
    console.log('- Verify your API key is valid and correctly formatted');
    console.log('- Check internet connection');
    console.log('- Ensure the model name is correct');
    console.log('- Verify your Hugging Face account has access to the model');
  }
}

// Execute tests
runTests().catch(console.error);
