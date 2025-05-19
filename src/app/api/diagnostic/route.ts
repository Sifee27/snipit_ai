import { NextRequest, NextResponse } from 'next/server';

/**
 * API diagnostic endpoint
 * Helps diagnose client-server communication issues
 */
export async function GET(req: NextRequest) {
  // Return a simple test response with the same structure as the process endpoint
  return NextResponse.json({
    success: true,
    data: {
      id: `diagnostic-${Date.now()}`,
      summary: "This is a diagnostic response to check API format compatibility.",
      keyQuotes: [{ text: "Diagnostic key quote", timestamp: "N/A" }],
      socialPost: "Diagnostic social post content",
      blogPost: "# Diagnostic Blog Post\n\nThis is test content.",
      isRealAiContent: false,
      isMockFallback: true,
      processedAt: new Date().toISOString(),
      contentMetadata: {
        title: "Diagnostic Content",
        sourceType: "text",
        duration: "N/A"
      }
    }
  });
}
