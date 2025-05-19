import { NextRequest, NextResponse } from 'next/server';
import { processContent } from '@/lib/api/processors/content-processor';
import { mockProcessContent } from '@/lib/mock-processor';
import { ProcessRequest, ProcessResponse } from '@/types/api';

// Configuration flags from environment
const FORCE_REAL_AI = process.env.FORCE_REAL_AI === 'true';
const EMERGENCY_FALLBACK = process.env.EMERGENCY_FALLBACK === 'true';
const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_AI === 'true';

/**
 * Handle POST requests to /api/process
 * Uses real AI processing with fallback to mock data
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json() as ProcessRequest;
    
    // Log request for debugging
    console.log('Processing request:', {
      url: body.url,
      contentType: body.contentType,
      contentLength: body.content?.length || 0
    });
    
    let result: ProcessResponse;
    
    try {
      // First attempt real AI processing using the content processor
      if (DEBUG_MODE) {
        console.log('Attempting real AI processing (FORCE_REAL_AI=' + FORCE_REAL_AI + ')');
      }
      
      result = await processContent(body, (update) => {
        if (DEBUG_MODE) {
          console.log(`Processing update: ${update.status} - ${update.step || ''}`);
        }
      });
      
      if (DEBUG_MODE) {
        console.log('AI processing completed successfully');
      }
      
    } catch (aiError) {
      // Log the error
      console.error('Error in AI processing:', aiError);
      
      // If emergency fallback is enabled, use mock processor
      if (EMERGENCY_FALLBACK) {
        console.log('🚨 EMERGENCY FALLBACK MODE: Using mock data as last resort fallback');
        console.warn('⚠️⚠️⚠️ WARNING: USING MOCK DATA INSTEAD OF REAL AI ⚠️⚠️⚠️');
        console.log('Set FORCE_REAL_AI=true in .env.local to disable mock responses');
        
        // Generate mock content
        result = await mockProcessContent(body);
        console.log('Generated mock content successfully');
      } else {
        // If no fallback is enabled, throw the error
        throw aiError;
      }
    }
    
    // Return response with the correct structure
    return NextResponse.json({
      success: true,
      data: {
        id: result.id || `generated-${Date.now()}`,
        summary: result.summary,
        keyQuotes: result.keyQuotes,
        socialPost: result.socialPost,
        blogPost: result.blogPost,
        isRealAiContent: result.isRealAiContent,
        isMockFallback: result.isMockFallback,
        processedAt: result.processedAt || new Date().toISOString(),
        contentMetadata: result.contentMetadata || {
          title: result.title || "Processed Content",
          sourceType: body.contentType,
          duration: "N/A"
        }
      }
    });
  } catch (error) {
    console.error('Error in API route:', error);
    
    // Return a generic error response
    return NextResponse.json({
      success: false,
      error: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: null
    }, { status: 500 });
  }
}
