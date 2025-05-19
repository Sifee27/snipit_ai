/**
 * Reset usage count utility for SnipIt
 * This script resets the usage count for a specific user or all users
 */
const fs = require('fs');
const path = require('path');

// Configuration
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

/**
 * Reset usage counts for one or all users
 * @param {string|null} email - User email to reset, or null for all users
 */
async function resetUsage(email = null) {
  try {
    // Read users file
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    
    let resetCount = 0;
    
    // Update usage counts
    const updatedUsers = users.map(user => {
      if (email === null || user.email === email) {
        resetCount++;
        return { ...user, usageCount: 0 };
      }
      return user;
    });
    
    // Write back to file
    fs.writeFileSync(USERS_FILE, JSON.stringify(updatedUsers, null, 2));
    
    console.log(`✅ Successfully reset usage count for ${resetCount} user(s)`);
    
    // Display updated user info
    console.log('\nCurrent user status:');
    console.log('--------------------');
    updatedUsers.forEach(user => {
      console.log(`${user.email} (${user.plan}): ${user.usageCount}/${user.maxUsage} usage`);
    });
  } catch (error) {
    console.error('Error resetting usage counts:', error);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const email = args[0] || null;

// Run the reset function
resetUsage(email);

// Display usage information if no arguments
if (args.length === 0) {
  console.log('\nUsage:');
  console.log('  node scripts/reset-usage.js [email]');
  console.log('\nExamples:');
  console.log('  node scripts/reset-usage.js                 - Reset all users');
  console.log('  node scripts/reset-usage.js test@example.com - Reset specific user');
}
