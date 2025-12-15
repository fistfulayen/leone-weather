const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function testPresenceCheck() {
  console.log('\n=== TESTING PRESENCE DETECTION ===\n');

  // Get today's date in Italy timezone (same as the email route does)
  const todayDate = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Europe/Rome',
  });

  console.log('Today\'s date (Italy time):', todayDate);
  console.log('Expected: false (they are NOT there on Dec 13)');
  console.log('Expected: true on Dec 19-Jan 4\n');

  // Test 1: Check if function exists
  console.log('Test 1: Checking if presence_dates table exists...');
  const { data: tableData, error: tableError } = await supabase
    .from('presence_dates')
    .select('*');

  if (tableError) {
    console.log('❌ ERROR - presence_dates table does not exist or cannot be accessed:');
    console.log(tableError);
    return;
  }

  console.log('✅ Table exists. Found', tableData?.length || 0, 'presence date ranges:');
  if (tableData) {
    tableData.forEach(row => {
      console.log(`   ${row.start_date} to ${row.end_date}: ${row.notes}`);
    });
  }
  console.log('');

  // Test 2: Check RPC function with today's date
  console.log('Test 2: Calling is_present_on_date() RPC function for TODAY...');
  const { data: presenceToday, error: errorToday } = await supabase
    .rpc('is_present_on_date', { check_date: todayDate });

  console.log('RPC result:', presenceToday);
  console.log('RPC error:', errorToday);

  if (errorToday) {
    console.log('❌ ERROR - RPC function failed:');
    console.log(errorToday);
    return;
  }

  console.log('Is present today?', presenceToday);
  console.log('Should be: false\n');

  // Test 3: Check a date when they ARE present (Dec 25)
  console.log('Test 3: Checking Dec 25, 2025 (should be TRUE)...');
  const { data: presenceDec25, error: errorDec25 } = await supabase
    .rpc('is_present_on_date', { check_date: '2025-12-25' });

  console.log('RPC result for Dec 25:', presenceDec25);
  console.log('RPC error:', errorDec25);
  console.log('Should be: true\n');

  // Test 4: Check a date when they are NOT present (Dec 15)
  console.log('Test 4: Checking Dec 15, 2025 (should be FALSE)...');
  const { data: presenceDec15, error: errorDec15 } = await supabase
    .rpc('is_present_on_date', { check_date: '2025-12-15' });

  console.log('RPC result for Dec 15:', presenceDec15);
  console.log('RPC error:', errorDec15);
  console.log('Should be: false\n');

  console.log('=== TEST COMPLETE ===\n');
}

testPresenceCheck().catch(console.error);
