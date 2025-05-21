/**
 * Simplified Waitlist Test Script
 * 
 * This script tests the waitlist functionality with a resilient implementation
 * that handles schema compatibility issues and provides fallback mechanisms.
 */

// Load environment variables
require('dotenv').config();

// Import the simplified waitlist service
const waitlist = require('./lib/supabase/waitlist');

// Test email
const TEST_EMAIL = 'test@snipit.ai';

/**
 * Run all tests sequentially
 */
async function runTests() {
  console.log('\n=======================================');
  console.log('🔬 WAITLIST SERVICE TEST');
  console.log('=======================================');
  
  // Test 1: Connection Check
  console.log('\n📋 TEST 1: CONNECTION CHECK');
  const startTime = Date.now();
  const isConnected = await waitlist.testConnection();
  const connectionTime = Date.now() - startTime;
  
  if (isConnected) {
    console.log(`✅ Connection successful (${connectionTime}ms)`);
  } else {
    console.log('❌ Connection failed - using fallback mechanisms');
  }
  
  // Test 2: Add Email
  console.log('\n📋 TEST 2: ADD EMAIL TEST');
  console.log(`Attempting to add email: ${TEST_EMAIL}`);
  
  try {
    const addResult = await waitlist.addEmail(TEST_EMAIL, {
      source: 'test_script'
    });
    
    if (addResult.success) {
      console.log(`✅ Email added successfully via ${addResult.source}`);
      if (addResult.data) {
        console.log('Response data:', JSON.stringify(addResult.data, null, 2));
      }
    } else {
      console.log(`❌ Error adding email: ${addResult.message}`);
    }
  } catch (error) {
    console.error('❌ Exception during add email test:', error);
  }
  
  // Test 3: Get All Emails
  console.log('\n📋 TEST 3: GET EMAILS TEST');
  
  try {
    const emails = await waitlist.getEmails();
    
    if (emails && emails.length > 0) {
      console.log(`✅ Retrieved ${emails.length} email(s):`);
      emails.slice(0, 5).forEach(email => console.log(`  - ${email}`));
      
      if (emails.length > 5) {
        console.log(`  ... and ${emails.length - 5} more`);
      }
    } else {
      console.log('❓ No emails found in waitlist');
    }
  } catch (error) {
    console.error('❌ Exception during get emails test:', error);
  }
  
  console.log('\n=======================================');
  console.log('🏁 WAITLIST TESTS COMPLETE');
  console.log('=======================================');
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error during tests:', error);
  process.exit(1);
});
