// Enhanced Supabase test and debugging script
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wzsxufhmloprzmgcvyor.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6c3h1ZmhtbG9wcnptZ2N2eW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MjkxOTUsImV4cCI6MjA2MzEwNTE5NX0.jCNhhi5EOHSkEHCX06cMTE66BdLALqrQ0zY5cIrHXAY';

const DEBUG = true;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const testEmail = 'test@snipit.ai';
const tableName = 'waitlist';

// Logger function
function log(message, details) {
  if (details) {
    console.log(message, typeof details === 'object' ? JSON.stringify(details, null, 2) : details);
  } else {
    console.log(message);
  }
}

// Debug log function - only logs if DEBUG is true
function debug(message, details) {
  if (DEBUG) {
    const prefix = '🔍 [DEBUG]';
    if (details) {
      console.log(prefix, message, typeof details === 'object' ? JSON.stringify(details, null, 2) : details);
    } else {
      console.log(prefix, message);
    }
  }
}

// Test Supabase connection and schema validation
async function checkTableSchema() {
  log('\n🔄 Checking table schema...');
  
  try {
    // First attempt to query the table to see if it exists
    const { error: queryError } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    // Check if table exists
    if (queryError && queryError.code === '42P01') { // Table doesn't exist
      log('❌ Table does not exist. Attempting to create it...');
      
      // Try to create the table with all required columns
      try {
        const createSql = `
          CREATE TABLE IF NOT EXISTS ${tableName} (
            id SERIAL PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            source TEXT DEFAULT 'website',
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `;
        
        const { error: createError } = await supabase.rpc('execute_sql', { sql: createSql });
        
        if (createError) {
          log('❌ Failed to create table:', createError.message);
          debug('Create table error details', createError);
          return false;
        } else {
          log('✅ Table created successfully with all required columns');
          return true;
        }
      } catch (err) {
        log('❌ Error creating table:', err.message);
        debug('Create table exception', err);
        return false;
      }
    } else {
      // Table exists, need to check if all required columns are present
      log('✅ Table exists, checking for required columns...');
      
      // Define required columns with their types
      const requiredColumns = [
        { name: 'metadata', type: 'JSONB', default: "'{}'::jsonb" },
        { name: 'source', type: 'TEXT', default: "'website'" },
      ];
      
      let tableIsValid = true;
      
      // Check each required column
      for (const column of requiredColumns) {
        try {
          const { error: columnError } = await supabase
            .from(tableName)
            .select(column.name)
            .limit(1);
          
          if (columnError && columnError.message.includes(column.name)) {
            log(`⚠️ Missing column: ${column.name}. Adding it now...`);
            debug(`Column check error for ${column.name}`, columnError);
            
            const alterSql = `
              ALTER TABLE ${tableName} 
              ADD COLUMN IF NOT EXISTS ${column.name} ${column.type} DEFAULT ${column.default};
            `;
            
            const { error: alterError } = await supabase.rpc('execute_sql', { sql: alterSql });
            
            if (alterError) {
              log(`❌ Failed to add ${column.name} column:`, alterError.message);
              debug(`Alter table error for ${column.name}`, alterError);
              tableIsValid = false;
            } else {
              log(`✅ Added ${column.name} column successfully`);
            }
          } else {
            log(`✅ Column ${column.name} exists`);
          }
        } catch (err) {
          log(`❌ Error checking ${column.name} column:`, err.message);
          debug(`Column check exception for ${column.name}`, err);
          tableIsValid = false;
        }
      }
      
      // Perform a final check to verify all columns were added properly
      try {
        const { error: finalCheckError } = await supabase
          .from(tableName)
          .select('id, email, source, metadata, created_at')
          .limit(1);
        
        if (finalCheckError) {
          log('❌ Final schema check failed:', finalCheckError.message);
          debug('Final schema check error', finalCheckError);
          tableIsValid = false;
        } else {
          log('✅ Final schema check successful, all columns verified');
        }
      } catch (err) {
        log('❌ Exception during final schema check:', err.message);
        debug('Final schema check exception', err);
        tableIsValid = false;
      }
      
      return tableIsValid;
    }
  } catch (err) {
    log('❌ Exception checking table schema:', err.message);
    debug('Schema check exception', err);
    return false;
  }
}

// Test Supabase connection and operations
async function runTests() {
  console.log('=======================================');
  console.log('🔬 SUPABASE CONNECTION DIAGNOSTICS');
  console.log('=======================================');
  log(`URL: ${supabaseUrl}`);
  log(`Key (first 10 chars): ${supabaseAnonKey.substring(0, 10)}...`);
  
  // Test 1: Check connection
  log('\n📋 TEST 1: CONNECTION CHECK');
  try {
    const startTime = Date.now();
    const { data, error } = await supabase.from('_not_a_real_table_just_checking_connection_')
      .select('count', { count: 'exact', head: true });
    const elapsed = Date.now() - startTime;
    
    // Note: We expect an error since the table doesn't exist, but it should be a table-not-found error
    // not a connection error
    if (error && error.code === '42P01') {
      log(`✅ Connection successful (${elapsed}ms)`);
    } else if (error) {
      log('⚠️ Unexpected error type:', error.message);
      debug('Connection error details', error);
    } else {
      log(`✅ Connection successful (${elapsed}ms)`);
    }
  } catch (err) {
    log('❌ Connection error:', err.message);
    debug('Connection exception', err);
    return; // Exit if we can't connect at all
  }
  
  // Test 2: Check table schema
  log('\n📋 TEST 2: TABLE SCHEMA VALIDATION');
  const schemaValid = await checkTableSchema();
  
  if (!schemaValid) {
    log('⚠️ Schema issues detected. Some tests may fail.');
  }
  
  // Test 3: Add email to waitlist
  log('\n📋 TEST 3: EMAIL OPERATIONS');
  log(`Attempting to add email: ${testEmail}`);
  
  try {
    // Check if email already exists
    const { data: existingData, error: checkError } = await supabase
      .from(tableName)
      .select('id, email')
      .eq('email', testEmail)
      .limit(1);
      
    if (checkError) {
      log('❌ Error checking for existing email:', checkError.message);
      debug('Email check error details', checkError);
    } else if (existingData && existingData.length > 0) {
      log('✅ Email already exists in database with ID:', existingData[0].id);
      debug('Existing email details', existingData[0]);
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
        log('❌ Error adding email:', error.message);
        debug('Email insert error details', error);
      } else {
        log('✅ Email added successfully with ID:', data[0].id);
        debug('Added email details', data[0]);
      }
    }
  } catch (err) {
    log('❌ Exception during email operation:', err.message);
    debug('Email operation exception', err);
  }
  
  // Test 4: Retrieve and verify waitlist data
  log('\n📋 TEST 4: DATA RETRIEVAL');
  
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id, email, source, metadata, created_at')
      .order('created_at', { ascending: false });
      
    if (error) {
      log('❌ Error retrieving emails:', error.message);
      debug('Data retrieval error details', error);
    } else {
      if (data.length === 0) {
        log('⚠️ No emails found in the waitlist table');
      } else {
        log(`✅ Found ${data.length} emails in the waitlist table`);
        
        // Show the latest 5 entries
        log('\nLatest entries:');
        data.slice(0, 5).forEach((item, index) => {
          const isTestEmail = item.email === testEmail ? ' ← TEST EMAIL' : '';
          log(`${index + 1}. ${item.email} (ID: ${item.id})${isTestEmail}`);
          
          // Show detailed info for test email
          if (item.email === testEmail) {
            debug('Test email full details', {
              id: item.id,
              email: item.email,
              source: item.source,
              metadata: item.metadata,
              created_at: item.created_at
            });
          }
        });
        
        // Show number of remaining entries if any
        if (data.length > 5) {
          log(`... and ${data.length - 5} more entries`);
        }
        
        // Check if test email exists
        const testEmailExists = data.some(item => item.email === testEmail);
        log(`Test email in database: ${testEmailExists ? 'YES ✅' : 'NO ❌'}`);
      }
    }
  } catch (err) {
    log('❌ Exception during data retrieval:', err.message);
    debug('Data retrieval exception', err);
  }
  
  // Summary
  log('\n=======================================');
  log('🏁 DIAGNOSTIC TESTS COMPLETE');
  log('=======================================');
  log('\nIf you experienced any issues:');
  log(' 1. Check that the Supabase URL and API key are correct');
  log(' 2. Verify the waitlist table has all required columns');
  log(' 3. Ensure your Supabase instance is online and available');
  log('\nSupabase project: https://wzsxufhmloprzmgcvyor.supabase.co');
  log('=======================================');
}

// Run the tests
runTests().catch(err => console.error('Unhandled error:', err));
