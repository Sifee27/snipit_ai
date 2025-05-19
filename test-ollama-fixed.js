/**
 * Fixed test script for Ollama API with proper stream handling
 */
const fetch = require('node-fetch');

const OLLAMA_API_URL = 'http://localhost:11434/api';
const OLLAMA_MODEL = 'llama2';

async function testOllamaAPI() {
  console.log('Testing Ollama API with proper stream handling...');
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
    console.log('Available models:', JSON.stringify(tagsData, null, 2));
    
    // Now test a simple generation with stream: false explicitly set
    console.log('\nTesting text generation with stream: false...');
    const generateResponse = await fetch(`${OLLAMA_API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: 'Hello, how are you?',
        temperature: 0.7,
        num_predict: 100,
        stream: false // Explicitly disable streaming
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
      
      console.log('\n✅ Test completed successfully');
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.log('Response was not valid JSON');
      
      // If we can't parse the JSON, let's try to handle it as a stream
      console.log('\nAttempting to handle as stream data...');
      
      // Split by newlines and try to parse each line as JSON
      const lines = text.split('\n').filter(line => line.trim() !== '');
      console.log(`Found ${lines.length} potential JSON objects in stream`);
      
      let fullResponse = '';
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.response) {
            fullResponse += data.response;
          }
        } catch (e) {
          console.log(`Could not parse line as JSON: ${line}`);
        }
      }
      
      if (fullResponse) {
        console.log('\nCombined response from stream:', fullResponse);
        console.log('\n✅ Test completed with stream handling');
      } else {
        console.error('\n❌ Could not extract response from stream data');
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testOllamaAPI()
  .then(() => console.log('Done'))
  .catch(err => console.error('Error:', err));
