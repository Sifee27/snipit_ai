// Simple Supabase test script
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wzsxufhmloprzmgcvyor.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6c3h1ZmhtbG9wcnptZ2N2eW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MjkxOTUsImV4cCI6MjA2MzEwNTE5NX0.jCNhhi5EOHSkEHCX06cMTE66BdLALqrQ0zY5cIrHXAY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const testEmail = 'pleasework@gmail.com';
const tableName = 'waitlist';

// Test Supabase connection and operations
async function runTests() {
  console.log('---------------------------------------');
  console.log('SUPABASE CONNECTION TEST');
  console.log('---------------------------------------');
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Key (first 10 chars): ${supabaseAnonKey.substring(0, 10)}...`);
  
  // Test 1: Check connection
  console.log('\nTest 1: Checking connection...');
  try {
    const { data, error } = await supabase.from(tableName).select('count', { count: 'exact', head: true });
    if (error) {
      console.log('❌ Connection failed:', error.message);
      
      // If table doesn't exist, try to create it
      if (error.code === '42P01') {
        console.log('\nTable does not exist. Attempting to create it...');
        
        try {
          const createSql = `
            CREATE TABLE IF NOT EXISTS ${tableName} (
              id SERIAL PRIMARY KEY,
              email TEXT NOT NULL UNIQUE,
              source TEXT,
              metadata JSONB,
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
          `;
          
          const { error: createError } = await supabase.rpc('execute_sql', { sql: createSql });
          
          if (createError) {
            console.log('❌ Failed to create table:', createError.message);
          } else {
            console.log('✅ Table created successfully');
          }
        } catch (err) {
          console.log('❌ Error creating table:', err.message);
        }
      }
    } else {
      console.log('✅ Connection successful');
    }
  } catch (err) {
    console.log('❌ Connection error:', err.message);
  }
  
  // Test 2: Add email
  console.log('\nTest 2: Adding email:', testEmail);
  try {
    // Check if email already exists
    const { data: existingData, error: checkError } = await supabase
      .from(tableName)
      .select('id, email')
      .eq('email', testEmail)
      .limit(1);
      
    if (checkError) {
      console.log('❌ Error checking for existing email:', checkError.message);
    } else if (existingData && existingData.length > 0) {
      console.log('✅ Email already exists in database with ID:', existingData[0].id);
    } else {
      // Insert new email
      const { data, error } = await supabase
        .from(tableName)
        .insert([{
          email: testEmail,
          source: 'test-script',
          metadata: { test: true, timestamp: new Date().toISOString() }
        }])
        .select();
        
      if (error) {
        console.log('❌ Error adding email:', error.message);
      } else {
        console.log('✅ Email added successfully with ID:', data[0].id);
      }
    }
  } catch (err) {
    console.log('❌ Error during email operation:', err.message);
  }
  
  // Test 3: List all emails
  console.log('\nTest 3: Retrieving all emails...');
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id, email, created_at');
      
    if (error) {
      console.log('❌ Error retrieving emails:', error.message);
    } else {
      console.log(`✅ Found ${data.length} emails:`);
      data.forEach((item, index) => {
        const isTestEmail = item.email === testEmail ? ' ← TEST EMAIL' : '';
        console.log(`${index + 1}. ${item.email} (ID: ${item.id})${isTestEmail}`);
      });
    }
  } catch (err) {
    console.log('❌ Error during retrieval:', err.message);
  }
  
  console.log('---------------------------------------');
  console.log('TESTS COMPLETE');
  console.log('---------------------------------------');
}

// Run the tests
runTests().catch(err => console.error('Unhandled error:', err));
