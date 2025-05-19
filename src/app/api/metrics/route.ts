/**
 * API Route: /api/metrics
 * Returns usage statistics for the application
 * Admin-only endpoint that requires authentication
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { promises as fs } from 'fs';
import path from 'path';

// File-based cache implementation for metrics
interface MetricsCache {
  data: any;
  timestamp: number;
  ttl: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const CACHE_FILE = path.join(DATA_DIR, 'metrics-cache.json');

// Ensure the data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Error creating data directory:', e);
    // Continue even if directory already exists
  }
}

/**
 * Compute usage metrics from the stored data
 */
async function computeMetrics() {
  try {
    const now = Date.now();
    
    // Try to read from cache file
    try {
      const cacheData = await fs.readFile(CACHE_FILE, 'utf8');
      const cache: MetricsCache = JSON.parse(cacheData);
      
      if (now - cache.timestamp < cache.ttl) {
        return cache.data;
      }
    } catch (e) {
      // Cache miss or invalid cache, proceed to compute metrics
    }
    
    // Path to data files
    const DATA_DIR = path.join(process.cwd(), 'data');
    const USERS_FILE = path.join(DATA_DIR, 'users.json');
    const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
    
    // Ensure data directory exists
    await ensureDataDir();
    
    // Read data files with error handling
    let usersData, historyData;
    try {
      usersData = await fs.readFile(USERS_FILE, 'utf8');
    } catch (e) {
      console.error('Error reading users file:', e);
      usersData = '[]';
    }
    
    try {
      historyData = await fs.readFile(HISTORY_FILE, 'utf8');
    } catch (e) {
      console.error('Error reading history file:', e);
      historyData = '[]';
    }
    
    // Parse JSON data with error handling
    let users = [], history = [];
    try {
      users = JSON.parse(usersData);
    } catch (e) {
      console.error('Error parsing users data:', e);
      users = [];
    }
    
    try {
      history = JSON.parse(historyData);
    } catch (e) {
      console.error('Error parsing history data:', e);
      history = [];
    }
    
    // Compute metrics
    const totalUsers = users.length;
    const freeUsers = users.filter((user: any) => user.plan === 'free').length;
    const proUsers = users.filter((user: any) => user.plan === 'pro').length;
    
    const totalProcessed = history.length;
    
    // Group by content type
    const contentTypeStats = history.reduce((acc: any, item: any) => {
      const contentType = item.contentType;
      if (!acc[contentType]) {
        acc[contentType] = 0;
      }
      acc[contentType]++;
      return acc;
    }, {});
    
    // Group by day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyActivity = history.reduce((acc: any, item: any) => {
      const date = new Date(item.processedAt);
      if (date >= thirtyDaysAgo) {
        const dateKey = date.toISOString().split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = 0;
        }
        acc[dateKey]++;
      }
      return acc;
    }, {});
    
    // Calculate average usage per user
    const averageUsage = totalUsers > 0 ? totalProcessed / totalUsers : 0;
    
    // Build metrics object
    const metrics = {
      totalUsers,
      usersByPlan: {
        free: freeUsers,
        pro: proUsers
      },
      contentProcessed: {
        total: totalProcessed,
        byType: contentTypeStats
      },
      dailyActivity,
      averageUsage: Math.round(averageUsage * 100) / 100
    };
    
    // Cache the results to file
    const cacheData: MetricsCache = {
      data: metrics,
      timestamp: now,
      ttl: 5 * 60 * 1000 // 5 minutes
    };
    
    try {
      // Ensure the directory exists before writing the file
      await ensureDataDir();
      await fs.writeFile(CACHE_FILE, JSON.stringify(cacheData, null, 2));
    } catch (e) {
      console.error('Error writing metrics cache:', e);
      // Continue even if cache writing fails
    }
    
    return metrics;
  } catch (error) {
    console.error('Error computing metrics:', error);
    throw error;
  }
}

/**
 * Handle GET requests to /api/metrics
 * Admin-only endpoint
 */
export async function GET(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    try {
      // Check if user is an admin (in a real app, you'd have an isAdmin flag)
      // For this demo, we'll consider users with 'pro' plan as admins
      if (user.plan !== 'pro') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        );
      }
      
      // Compute metrics
      const metrics = await computeMetrics();
      
      return NextResponse.json({
        success: true,
        data: metrics
      });
    } catch (error: any) {
      console.error('[/api/metrics] Error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Error retrieving metrics',
          details: error.message || 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}
