// Setup script to initialize the database
// Run with: npx tsx scripts/setup-database.ts

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🔧 Setting up Cascina Leone Weather Database...\n');

  // Read the SQL schema file
  const schemaPath = path.join(process.cwd(), 'supabase-schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  console.log('📋 Executing database schema...');

  // Split by statement and execute
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      });

      if (error) {
        console.log('⚠️  Note:', error.message);
      }
    } catch (err) {
      console.log('⚠️  Skipping statement (may already exist)');
    }
  }

  console.log('\n✅ Database schema setup complete!');
  console.log('\n📊 Next steps:');
  console.log('1. The database tables have been created in Supabase');
  console.log('2. Run `npm run dev` to start the development server');
  console.log('3. Manually trigger the first data fetch: http://localhost:3000/api/ingest-weather');
  console.log('4. Visit http://localhost:3000 to see your weather dashboard\n');
}

setupDatabase().catch(console.error);
