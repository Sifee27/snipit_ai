/**
 * Clear rate limits for SnipIt application
 * This script modifies the constants to disable rate limiting for development
 */
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG_FILE = path.join(process.cwd(), 'src', 'config', 'constants.ts');

// Update rate limits to be very high
function disableRateLimits() {
  try {
    // Read constants file
    const data = fs.readFileSync(CONFIG_FILE, 'utf8');
    
    // Find the rate limits section and modify it to be very generous
    const updatedData = data.replace(
      /export const API_RATE_LIMITS = {[\s\S]*?};/m,
      `export const API_RATE_LIMITS = {
  // Rate limits for unauthenticated requests (IP-based)
  unauthenticated: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window (effectively disabled for testing)
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  
  // Rate limits for authenticated requests based on plan
  authenticated: {
    free: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 1000, // 1000 requests per hour (effectively disabled for testing)
      message: 'Free plan limit reached. Please upgrade to process more content.'
    },
    pro: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5000, // 5000 requests per hour (effectively disabled for testing)
      message: 'Pro plan hourly limit reached. Please try again later.'
    }
  }
};`
    );
    
    // Write the modified constants back
    fs.writeFileSync(CONFIG_FILE, updatedData);
    
    console.log('✅ Successfully disabled rate limits for testing');
    console.log('⚠️ Restart the server to apply these changes');
    
  } catch (error) {
    console.error('Error updating rate limits:', error);
  }
}

// Run the function
disableRateLimits();
