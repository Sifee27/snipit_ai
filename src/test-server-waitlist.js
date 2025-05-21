/**
 * Server-side Waitlist Service Test
 * 
 * This script tests the enhanced server-side waitlist service
 * that uses the service role key for full database access.
 */

// Import the server-side waitlist service
const serverWaitlist = require('./lib/supabase/server-waitlist');

// Test email with timestamp to avoid duplicates
const TEST_EMAIL = `test${Date.now()}@snipit.ai`;

/**
 * Run all server-side waitlist tests
 */
async function runTests() {
  console.log('\n=======================================');
  console.log('🔬 SERVER WAITLIST SERVICE TEST');
  console.log('=======================================');
  
  // Test 1: Connection Check
  console.log('\n📋 TEST 1: CONNECTION CHECK');
  const startTime = Date.now();
  const isConnected = await serverWaitlist.testConnection();
  const connectionTime = Date.now() - startTime;
  
  if (isConnected) {
    console.log(`✅ Connection successful (${connectionTime}ms)`);
  } else {
    console.log('❌ Connection failed - check service role key');
    process.exit(1);
  }
  
  // Test 2: Get Email Count
  console.log('\n📋 TEST 2: EMAIL COUNT');
  try {
    const count = await serverWaitlist.getEmailCount();
    console.log(`✅ Current waitlist count: ${count} emails`);
  } catch (error) {
    console.error('❌ Error getting count:', error);
  }
  
  // Test 3: Add Email
  console.log('\n📋 TEST 3: ADD EMAIL TEST');
  console.log(`Attempting to add email: ${TEST_EMAIL}`);
  
  try {
    const addResult = await serverWaitlist.addEmail(TEST_EMAIL, {
      source: 'server_test',
      metadata: { 
        test: true, 
        timestamp: new Date().toISOString(),
        features: ['summarization', 'ai']
      }
    });
    
    if (addResult.success) {
      console.log(`✅ Email added successfully via ${addResult.source}`);
      console.log('Response data:', JSON.stringify(addResult.data, null, 2));
    } else {
      console.log(`❌ Error adding email: ${addResult.message}`);
    }
  } catch (error) {
    console.error('❌ Exception during add email test:', error);
  }
  
  // Test 4: Get All Emails
  console.log('\n📋 TEST 4: GET EMAILS TEST');
  
  try {
    const emails = await serverWaitlist.getEmails();
    
    if (emails && emails.length > 0) {
      console.log(`✅ Retrieved ${emails.length} email(s):`);
      emails.slice(0, 5).forEach((entry, i) => {
        console.log(`  ${i+1}. ${entry.email} (${entry.source || 'unknown'}) - Created: ${entry.created_at || 'unknown'}`);
      });
      
      if (emails.length > 5) {
        console.log(`  ... and ${emails.length - 5} more`);
      }
      
      // Verify our test email was added
      const found = emails.some(entry => entry.email === TEST_EMAIL);
      if (found) {
        console.log(`✅ Confirmed test email was successfully added`);
      } else {
        console.log(`❌ Could not find test email in results`);
      }
    } else {
      console.log('❓ No emails found in waitlist');
    }
  } catch (error) {
    console.error('❌ Exception during get emails test:', error);
  }
  
  console.log('\n=======================================');
  console.log('🏁 SERVER WAITLIST TESTS COMPLETE');
  console.log('=======================================');
  console.log('\nNext steps:');
  console.log('1. Use server-waitlist.js for API routes and server components');
  console.log('2. Use client-waitlist.js for client components with RLS');
  console.log('3. Add the service role key to your environment variables:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error during tests:', error);
  process.exit(1);
});
