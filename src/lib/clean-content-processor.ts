/**
 * Content processor using Hugging Face's Inference API
 */
import { ProcessRequest, ProcessResponse, ProcessCallback } from "@/types/api";
import { DEFAULT_PROCESSING_OPTIONS } from "@/config/constants";
import * as YouTubeTranscript from 'youtube-transcript';

// Configuration for Hugging Face API
// Add your API key in .env file: HUGGING_FACE_API_KEY=your_key_here
const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;
const HF_API_URL = 'https://api-inference.huggingface.co/models';

// Model endpoints configuration
const HF_MODELS = {
  summarization: 'facebook/bart-large-cnn',
  textGeneration: 'gpt2',
  sentiment: 'distilbert-base-uncased-finetuned-sst-2-english',
  questionAnswering: 'deepset/roberta-base-squad2'
};

// Headers for API requests
const HF_HEADERS = {
  'Authorization': `Bearer ${HF_API_KEY}`,
  'Content-Type': 'application/json'
};

/**
 * Helper function to make requests to Hugging Face API
 */
async function queryHuggingFace(model: string, inputs: string | object): Promise<any> {
  const response = await fetch(`${HF_API_URL}/${model}`, {
    method: 'POST',
    headers: HF_HEADERS,
    body: JSON.stringify(inputs)
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Generate a summary using Hugging Face's BART model
 */
async function generateAISummary(content: string): Promise<string> {
  try {
    const response = await queryHuggingFace(HF_MODELS.summarization, {
      inputs: content,
      parameters: {
        max_length: 150,
        min_length: 40,
        do_sample: false
      }
    });
    
    return response[0]?.summary_text || 'Unable to generate summary';
  } catch (error) {
    console.error('Summary generation failed:', error);
    return 'Error generating summary';
  }
}

/**
 * Extract relevant quotes using question-answering model
 */
async function extractAIQuotes(content: string): Promise<string[]> {
  try {
    const questions = [
      'What are the key quotes from this content?',
      'What are the most important statements in this text?',
      'What are the main takeaways from this content?'
    ];

    const quotes = await Promise.all(questions.map(async question => {
      const response = await queryHuggingFace(HF_MODELS.questionAnswering, {
        inputs: {
          question,
          context: content
        }
      });
      return response.answer;
    }));

    return quotes.filter(quote => quote && quote.length > 10);
  } catch (error) {
    console.error('Quote extraction failed:', error);
    return [];
  }
}

/**
 * Generate social media content using GPT-2
 */
async function generateAISocialContent(content: string): Promise<string> {
  try {
    const prompt = `Create a social media post about: ${content.slice(0, 200)}...`;
    
    const response = await queryHuggingFace(HF_MODELS.textGeneration, {
      inputs: prompt,
      parameters: {
        max_length: 100,
        num_return_sequences: 1,
        do_sample: true,
        top_p: 0.95
      }
    });

    return response[0]?.generated_text || 'Unable to generate social content';
  } catch (error) {
    console.error('Social content generation failed:', error);
    return 'Error generating social content';
  }
}

/**
 * Generate blog content using GPT-2
 */
async function generateAIBlogContent(content: string): Promise<string> {
  try {
    const prompt = `Write a blog post expanding on: ${content.slice(0, 300)}...`;
    
    const response = await queryHuggingFace(HF_MODELS.textGeneration, {
      inputs: prompt,
      parameters: {
        max_length: 500,
        num_return_sequences: 1,
        do_sample: true,
        top_p: 0.95,
        temperature: 0.7
      }
    });

    return response[0]?.generated_text || 'Unable to generate blog content';
  } catch (error) {
    console.error('Blog content generation failed:', error);
    return 'Error generating blog content';
  }
}

/**
 * Helper function to extract YouTube video ID
 */
function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
}

/**
 * Extract metadata from content
 */
function extractMetadata(content: string, contentType: string): { title: string; sourceType: string; duration?: string } {
  const metadata = {
    title: '',
    sourceType: contentType,
    duration: undefined
  };

  if (contentType === 'youtube') {
    const videoId = extractYoutubeId(content);
    metadata.title = `YouTube Video: ${videoId}`;
  } else {
    metadata.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
  }

  return metadata;
}

/**
 * Main content processing function
 */
export async function processContent(
  request: ProcessRequest,
  callback?: ProcessCallback
): Promise<ProcessResponse> {
  try {
    // Extract data from the request with fallbacks
    const content = request?.content || "";
    let contentType = request?.contentType || "text";
    const options = request?.options || {};
    
    // Validate content
    if (!content.trim()) {
      throw new Error("Content cannot be empty");
    }

    // Validate YouTube URLs and get transcript if needed
    let processableContent = content;
    if (contentType === 'youtube') {
      const videoId = extractYoutubeId(content);
      if (!videoId) {
        throw new Error("Invalid YouTube URL provided");
      }
      
      // Ensure content is a valid YouTube URL
      if (!content.match(/^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)) {
        throw new Error("Invalid YouTube URL format");
      }
      
      // Get video transcript
      callback?.({ status: 'processing', step: 'Fetching video transcript...' });
      try {
        // Using the proper method from the YouTube Transcript API
        const transcript = await YouTubeTranscript.getTranscript(videoId);
        if (transcript && transcript.length > 0) {
          processableContent = transcript.map((item: { text: string }) => item.text).join(' ');
        }
      } catch (err) {
        console.error('Failed to fetch YouTube transcript:', err);
        // Continue with original content if transcript fails
      }
    }
    
    // Merge options with defaults
    const fullOptions = { ...DEFAULT_PROCESSING_OPTIONS, ...options };
    
    // Process content in parallel using AI services
    callback?.({ status: 'processing', step: 'Analyzing content...' });
    
    const [summary, quotes, socialPost, metadata] = await Promise.all([
      generateAISummary(processableContent),
      extractAIQuotes(processableContent),
      generateAISocialContent(processableContent),
      extractMetadata(content, contentType)
    ]);
    
    // Generate blog content if requested
    let blogContent;
    if (fullOptions.generateBlog) {
      callback?.({ status: 'processing', step: 'Generating blog post...' });
      blogContent = await generateAIBlogContent(processableContent);
    }
    
    callback?.({ status: 'complete', step: 'Processing complete' });
    
    // Return processed content
    return {
      summary,
      keyQuotes: quotes.map((q: string) => ({ text: q })),
      socialPost,
      blogPost: blogContent,
      processedAt: new Date().toISOString(),
      contentMetadata: metadata
    };
  } catch (e) {
    console.error("Error in content processor:", e);
    callback?.({ status: 'error', step: e instanceof Error ? e.message : 'Unknown error' });
    throw new Error(`Content processing failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}
