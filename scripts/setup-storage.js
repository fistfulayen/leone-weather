// Script to create the daily-paintings storage bucket in Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function setupStorage() {
  console.log('Setting up daily-paintings storage bucket...');

  // Create the bucket
  const { data, error } = await supabase.storage.createBucket('daily-paintings', {
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('✓ Bucket already exists');
    } else {
      console.error('Error creating bucket:', error);
      process.exit(1);
    }
  } else {
    console.log('✓ Bucket created successfully:', data);
  }

  console.log('\nStorage bucket is ready!');
  console.log('You can view it at: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets/daily-paintings');
}

setupStorage().catch(console.error);
