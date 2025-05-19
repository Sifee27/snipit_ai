/**
 * Simple ping endpoint for API health checks and connectivity monitoring
 */
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'x-api-version': '1.0.0',
      'x-api-status': 'healthy',
      'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'pragma': 'no-cache',
      'expires': '0',
    },
  });
}
