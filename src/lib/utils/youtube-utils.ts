/**
 * YouTube Utilities
 * Helper functions for working with YouTube content
 */
import { YoutubeTranscript } from 'youtube-transcript';

/**
 * Extract YouTube video ID from URL
 * @param url - YouTube URL
 */
export function extractYoutubeId(url: string): string | null {
  // Match YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      console.log(`Successfully extracted YouTube ID: ${match[1]} using pattern: ${pattern}`);
      return match[1];
    }
  }
  
  console.error('Failed to extract YouTube ID from URL:', url);
  return null;
}

/**
 * Get YouTube video transcript
 * @param videoId - YouTube video ID
 */
export async function getYoutubeTranscript(videoId: string): Promise<string> {
  // Log debug information
  console.log('------------------------------------------------');
  console.log(`YOUTUBE TRANSCRIPT DEBUG - REQUEST (${new Date().toISOString()})`);
  console.log(`Video ID: ${videoId}`);
  console.log(`Full YouTube URL: https://youtube.com/watch?v=${videoId}`);
  console.log(`YoutubeTranscript API available: ${typeof YoutubeTranscript !== 'undefined'}`);
  console.log('------------------------------------------------');
  
  try {
    // Get transcript from YouTube
    const transcriptResponse = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcriptResponse || transcriptResponse.length === 0) {
      throw new Error('No transcript available for this video');
    }
    
    // Convert transcript to text
    const fullText = transcriptResponse
      .map(item => item.text)
      .join(' ')
      .replace(/\s+/g, ' ');
    
    if (!fullText || fullText.trim().length === 0) {
      throw new Error('Transcript was empty');
    }
    
    return fullText;
  } catch (error) {
    console.error('Error fetching YouTube transcript:', error);
    throw new Error(`Failed to fetch YouTube transcript: ${error instanceof Error ? error.message : String(error)}`);
  }
}
