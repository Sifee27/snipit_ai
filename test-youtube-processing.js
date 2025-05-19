/**
 * Test script to verify the complete YouTube content processing workflow with Ollama
 */

// Import required modules
const { YoutubeTranscript } = require('youtube-transcript');
const fetch = require('node-fetch');

// Test video ID (Steve Jobs' Stanford commencement speech)
const TEST_VIDEO_ID = 'UF8uR6Z6KLc';
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434/api';
const OLLAMA_MODEL = process.env.OLLAMA_DEFAULT_MODEL || 'llama2';

/**
 * Extract YouTube video transcript
 */
async function getTranscript(videoId) {
  console.log(`Fetching transcript for video ID: ${videoId}`);
  try {
    const transcriptResponse = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcriptResponse || transcriptResponse.length === 0) {
      throw new Error('No transcript available for this video');
    }
    
    // Convert transcript to text
    const fullText = transcriptResponse
      .map(item => item.text)
      .join(' ');
      
    console.log(`✅ Successfully retrieved transcript (${fullText.length} characters)`);
    return fullText;
  } catch (error) {
    console.error('❌ Error fetching transcript:', error);
    throw error;
  }
}

/**
 * Process content with Ollama
 */
async function processWithOllama(text, task = 'summary') {
  console.log(`Processing with Ollama (${OLLAMA_MODEL}) for task: ${task}`);
  console.log(`Using Ollama API URL: ${OLLAMA_API_URL}`);
  
  // Create appropriate prompt based on task
  let prompt;
  if (task === 'summary') {
    prompt = `Please summarize the following text in about 150 words:

${text}

Summary:`;
  } else if (task === 'key_quotes') {
    prompt = `Extract the 3 most important quotes from the following text. 
For each quote, provide the exact text from the original content.
Format your response as a JSON array of objects with 'text' property for each quote.
Example format: [{"text": "This is an important quote"}, {"text": "This is another important quote"}]

Here's the text:

${text}

Key quotes (JSON format):`;
  }
  
  try {
    console.log('Sending request to Ollama...');
    const response = await fetch(`${OLLAMA_API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        temperature: 0.3,
        num_predict: 500
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API request failed with status ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Successfully received response from Ollama');
    return result.response;
  } catch (error) {
    console.error('❌ Error processing with Ollama:', error);
    throw error;
  }
}

/**
 * Run the complete workflow test
 */
async function testCompleteWorkflow() {
  console.log('='.repeat(50));
  console.log('TESTING COMPLETE YOUTUBE PROCESSING WORKFLOW WITH OLLAMA');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Get YouTube transcript
    console.log('\n📝 STEP 1: FETCHING YOUTUBE TRANSCRIPT');
    const transcript = await getTranscript(TEST_VIDEO_ID);
    console.log('Transcript preview:', transcript.substring(0, 200) + '...');
    
    // Step 2: Generate summary with Ollama
    console.log('\n📝 STEP 2: GENERATING SUMMARY WITH OLLAMA');
    const summary = await processWithOllama(transcript, 'summary');
    console.log('Summary:', summary);
    
    // Step 3: Extract key quotes with Ollama
    console.log('\n📝 STEP 3: EXTRACTING KEY QUOTES WITH OLLAMA');
    const keyQuotesResponse = await processWithOllama(transcript, 'key_quotes');
    console.log('Key quotes response:', keyQuotesResponse);
    
    // Try to parse key quotes as JSON
    try {
      const keyQuotes = JSON.parse(keyQuotesResponse);
      console.log('Parsed key quotes:', keyQuotes);
    } catch (parseError) {
      console.warn('Could not parse key quotes as JSON:', parseError);
    }
    
    console.log('\n✅ COMPLETE WORKFLOW TEST SUCCESSFUL');
    return {
      transcript,
      summary,
      keyQuotesResponse
    };
  } catch (error) {
    console.error('\n❌ WORKFLOW TEST FAILED:', error);
    throw error;
  }
}

// Run the test
testCompleteWorkflow()
  .then(() => console.log('Test completed successfully'))
  .catch(err => console.error('Test failed:', err));
