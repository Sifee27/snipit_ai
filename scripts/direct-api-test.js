/**
 * Direct Hugging Face API Test Script
 * This bypasses all application code to test the API directly
 * 
 * Run with: node scripts/direct-api-test.js
 */
require('dotenv').config({ path: '.env.local' });

const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;
const HF_API_URL = 'https://api-inference.huggingface.co/models';

// Test input
const TEST_TEXT = "Everywhere in the world, there is a working class that's often overlooked. The mechanics, the electricians, the plumbers - these are the backbone of society that keep our infrastructure functioning properly. Without their skills and dedication, modern life would quickly grind to a halt. These professionals deserve more recognition and appreciation for the essential work they do every day.";

// Print environment info
console.log('='.repeat(80));
console.log('HUGGING FACE API DIRECT TEST');
console.log('='.repeat(80));
console.log('API Key Status:', HF_API_KEY ? 'CONFIGURED' : 'NOT CONFIGURED');

if (HF_API_KEY) {
  // Don't log any portion of the API key, not even masked
  console.log('API Key format valid:', !HF_API_KEY.includes('your_api_key_here') && HF_API_KEY.length > 10);
}

// Test summarization model
async function testSummarization() {
  console.log('\n' + '='.repeat(80));
  console.log('TESTING SUMMARIZATION MODEL');
  console.log('='.repeat(80));
  
  try {
    const model = 'facebook/bart-large-cnn';
    console.log('Model:', model);
    console.log('API URL:', `${HF_API_URL}/${model}`);
    
    // Create headers manually
    const headers = {
      'Authorization': `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json'
    };
    
    console.log('Sending request to Hugging Face API...');
    const start = Date.now();
    
    const response = await fetch(`${HF_API_URL}/${model}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ inputs: TEST_TEXT })
    });
    
    const time = Date.now() - start;
    console.log(`Response received in ${time}ms`);
    console.log('Response status:', response.status, response.statusText);
    console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (Array.isArray(data) && data.length > 0 && data[0].summary_text) {
      console.log('\nSUCCESS! Received valid summary:');
      console.log('-'.repeat(40));
      console.log(data[0].summary_text);
      console.log('-'.repeat(40));
      return true;
    } else {
      console.log('Received data but not in expected format');
      return false;
    }
  } catch (error) {
    console.error('ERROR testing summarization:');
    console.error(error);
    return false;
  }
}

// Run test
(async () => {
  try {
    if (!HF_API_KEY) {
      console.error('ERROR: Hugging Face API key not found in environment');
      console.error('Please add HUGGING_FACE_API_KEY to your .env.local file');
      process.exit(1);
    }
    
    const success = await testSummarization();
    
    console.log('\n' + '='.repeat(80));
    console.log('TEST RESULTS');
    console.log('='.repeat(80));
    console.log('API Test:', success ? 'SUCCESS' : 'FAILED');
    
    // If the test failed, provide troubleshooting guidance
    if (!success) {
      console.log('\nTROUBLESHOOTING TIPS:');
      console.log('1. Verify your API key is valid and has access to the models');
      console.log('2. Check for network issues or firewalls blocking API access');
      console.log('3. Ensure your Hugging Face account subscription is active');
      console.log('4. Try with different models or smaller inputs');
      console.log('5. Check if the Hugging Face API is currently experiencing issues');
    }
  } catch (error) {
    console.error('Unexpected error running tests:', error);
  }
})();
