/**
 * Test script to verify YouTube transcription functionality
 */

// Import the required modules
const { YoutubeTranscript } = require('youtube-transcript');

// Test video ID (a popular TED talk)
const TEST_VIDEO_ID = 'UF8uR6Z6KLc';

async function testTranscription() {
  console.log('Testing YouTube transcription API...');
  console.log(`Video ID: ${TEST_VIDEO_ID}`);
  console.log(`Full YouTube URL: https://youtube.com/watch?v=${TEST_VIDEO_ID}`);
  
  try {
    console.log('Fetching transcript...');
    const transcriptResponse = await YoutubeTranscript.fetchTranscript(TEST_VIDEO_ID);
    
    if (!transcriptResponse || transcriptResponse.length === 0) {
      console.error('❌ No transcript available for this video');
      return;
    }
    
    console.log('✅ Successfully retrieved transcript!');
    console.log(`Transcript length: ${transcriptResponse.length} segments`);
    console.log('First 3 segments:');
    console.log(transcriptResponse.slice(0, 3));
    
    // Convert transcript to text
    const fullText = transcriptResponse
      .map(item => item.text)
      .join(' ');
      
    console.log(`Full transcript length: ${fullText.length} characters`);
    console.log('First 200 characters of transcript:');
    console.log(fullText.substring(0, 200) + '...');
    
    return fullText;
  } catch (error) {
    console.error('❌ Error fetching transcript:', error);
  }
}

// Run the test
testTranscription()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err));
