/**
 * Simple test script for Ollama API
 */
const fetch = require('node-fetch');

const OLLAMA_API_URL = 'http://localhost:11434/api';
const OLLAMA_MODEL = 'llama2';

async function testOllamaAPI() {
  console.log('Testing Ollama API...');
  console.log(`API URL: ${OLLAMA_API_URL}`);
  console.log(`Model: ${OLLAMA_MODEL}`);
  
  try {
    // First check if the model is available
    console.log('\nChecking available models...');
    const tagsResponse = await fetch(`${OLLAMA_API_URL}/tags`);
    
    if (!tagsResponse.ok) {
      throw new Error(`Failed to get tags: ${tagsResponse.status} ${tagsResponse.statusText}`);
    }
    
    const tagsData = await tagsResponse.json();
    console.log('Available models:', tagsData);
    
    // Now test a simple generation
    console.log('\nTesting text generation...');
    const generateResponse = await fetch(`${OLLAMA_API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: 'Hello, how are you?',
        temperature: 0.7,
        num_predict: 100
      })
    });
    
    if (!generateResponse.ok) {
      throw new Error(`Generation failed: ${generateResponse.status} ${generateResponse.statusText}`);
    }
    
    const text = await generateResponse.text();
    console.log('Raw response text:', text);
    
    try {
      const generateData = JSON.parse(text);
      console.log('Parsed response:', generateData);
      console.log('\nGenerated text:', generateData.response);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.log('Response was not valid JSON');
    }
    
    console.log('\n✅ Test completed');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testOllamaAPI()
  .then(() => console.log('Done'))
  .catch(err => console.error('Error:', err));
