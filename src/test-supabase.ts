import waitlistService from './lib/supabase/waitlist-service';
import { supabase, logDatabaseOperation } from './lib/supabase/client';

// Test email
const TEST_EMAIL = 'pleasework@gmail.com';

async function runTests() {
  console.log('---------------------------------------');
  console.log('SUPABASE CONNECTION TEST');
  console.log('---------------------------------------');
  
  // Test 1: Check connection
  console.log('Test 1: Checking Supabase connection...');
  const connectionWorking = await waitlistService.testConnection();
  console.log(`Connection status: ${connectionWorking ? 'SUCCESS ✅' : 'FAILED ❌'}`);
  
  if (!connectionWorking) {
    console.log('Supabase connection failed. Checking URL and key...');
    console.log(`URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || '<not set>'}`);
    // Print only first few chars of key for security
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '<not set>';
    console.log(`Key: ${key.substring(0, 10)}...${key.length > 20 ? key.substring(key.length - 4) : ''}`);
    
    console.log('\nTrying direct Supabase query...');
    const { data, error } = await supabase.from('waitlist').select('count', { count: 'exact', head: true });
    console.log('Direct query result:', error ? `Error: ${error.message}` : 'Success');
  }
  
  // Test 2: Add email
  console.log('\nTest 2: Attempting to add email:', TEST_EMAIL);
  try {
    const result = await waitlistService.addEmail(TEST_EMAIL, {
      source: 'test-script',
      metadata: { 
        timestamp: new Date().toISOString(),
        test: true 
      }
    });
    
    console.log('Add email result:', result);
    console.log(result.success ? 'Email added or already exists ✅' : 'Failed to add email ❌');
    console.log('Storage source:', result.source);
  } catch (error) {
    console.error('Error adding email:', error);
  }
  
  // Test 3: List all emails
  console.log('\nTest 3: Retrieving all emails...');
  try {
    const emails = await waitlistService.getEmails();
    console.log(`Found ${emails.length} emails:`);
    emails.forEach((email, index) => {
      console.log(`${index + 1}. ${email}${email === TEST_EMAIL ? ' ✅' : ''}`);
    });
    
    const hasTestEmail = emails.includes(TEST_EMAIL);
    console.log(`Test email present: ${hasTestEmail ? 'YES ✅' : 'NO ❌'}`);
  } catch (error) {
    console.error('Error retrieving emails:', error);
  }
  
  console.log('---------------------------------------');
  console.log('TESTS COMPLETE');
  console.log('---------------------------------------');
}

// Run the tests
runTests().catch(console.error);
