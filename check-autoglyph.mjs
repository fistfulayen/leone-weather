import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const { data } = await supabase
  .from('nft_sales')
  .select('*')
  .ilike('token_name', '%Autoglyph%')
  .order('price_eth', { ascending: false })
  .limit(1);

console.log(JSON.stringify(data, null, 2));
