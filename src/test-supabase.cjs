// CommonJS version of Supabase test script for easier execution
const { supabase, logDatabaseOperation, supabaseUrl, supabaseAnonKey } = require('./lib/supabase/client');

// Test email
const TEST_EMAIL = 'testuser@example.com';

async function testConnection() {
  console.log('Testing basic Supabase connection...');
  
  try {
    console.log('\nSUPABASE CONNECTION DETAILS:');
    console.log(`URL: ${supabaseUrl}`);
    // Print partial key for security
    console.log(`Key (first 8 chars): ${supabaseAnonKey.substring(0, 8)}...`);
    
    // Simple query to test connection
    console.log('\nAttempting simple query...');
    const { data, error } = await supabase.from('waitlist').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return false;
    }
    
    console.log('✅ Connection successful!');
    return true;
  } catch (err) {
    console.error('❌ Exception during connection test:', err);
    return false;
  }
}

async function addEmail(email) {
  console.log(`\nAttempting to add email: ${email}`);
  
  try {
    // Check if email already exists
    const { data: existingData, error: checkError } = await supabase
      .from('waitlist')
      .select('id, email')
      .eq('email', email)
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error checking for existing email:', checkError.message);
      return { success: false, error: checkError };
    }
    
    if (existingData && existingData.length > 0) {
      console.log('✅ Email already exists in database');
      return { success: true, existing: true, data: existingData[0] };
    }
    
    // Insert new email
    const { data, error } = await supabase
      .from('waitlist')
      .insert([{
        email: email,
        source: 'test-script',
        metadata: { timestamp: new Date().toISOString(), test: true }
      }])
      .select();
    
    if (error) {
      console.error('❌ Error inserting email:', error.message);
      return { success: false, error };
    }
    
    console.log('✅ Email added successfully:', data);
    return { success: true, data };
  } catch (err) {
    console.error('❌ Exception during add email:', err);
    return { success: false, error: err };
  }
}

async function getEmails() {
  console.log('\nAttempting to retrieve all emails...');
  
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .select('email')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error retrieving emails:', error.message);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log('No emails found in database');
      return [];
    }
    
    const emails = data.map(entry => entry.email);
    console.log(`✅ Retrieved ${emails.length} emails successfully`);
    return emails;
  } catch (err) {
    console.error('❌ Exception during get emails:', err);
    return [];
  }
}

async function runTests() {
  console.log('===========================================');
  console.log('🔍 SUPABASE CONNECTION DIAGNOSTIC TESTS');
  console.log('===========================================');
  
  // Test 1: Connection Test
  console.log('\n📋 TEST 1: CONNECTION TEST');
  const connectionResult = await testConnection();
  
  if (!connectionResult) {
    console.log('\n⚠️ Connection test failed. Checking fallback functionality...');
  }
  
  // Test 2: Add Email Test
  console.log('\n📋 TEST 2: ADD EMAIL TEST');
  const addResult = await addEmail(TEST_EMAIL);
  console.log('Add result:', addResult.success ? 'SUCCESS ✅' : 'FAILED ❌');
  
  // Test 3: Get Emails Test
  console.log('\n📋 TEST 3: GET EMAILS TEST');
  const emails = await getEmails();
  
  if (emails.length > 0) {
    console.log('First 5 emails:');
    emails.slice(0, 5).forEach((email, index) => {
      console.log(`  ${index + 1}. ${email}${email === TEST_EMAIL ? ' ✅' : ''}`);
    });
    
    if (emails.length > 5) {
      console.log(`  ... and ${emails.length - 5} more`);
    }
    
    const hasTestEmail = emails.includes(TEST_EMAIL);
    console.log(`Test email present: ${hasTestEmail ? 'YES ✅' : 'NO ❌'}`);
  }
  
  console.log('\n===========================================');
  console.log('🏁 TESTS COMPLETE');
  console.log('===========================================');
}

// Run the tests and handle any uncaught errors
runTests()
  .then(() => console.log('\nAll tests completed.'))
  .catch(err => console.error('\n❌ Uncaught error:', err));
