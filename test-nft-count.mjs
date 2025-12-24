import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function checkNFTSales() {
  const { data, error, count } = await supabase
    .from('nft_sales')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total NFT sales: ${count}`);

  // Group by collection
  const collections = {};
  data.forEach(sale => {
    if (!collections[sale.collection_name]) {
      collections[sale.collection_name] = 0;
    }
    collections[sale.collection_name]++;
  });

  console.log('\nSales by collection:');
  Object.entries(collections)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      console.log(`  ${name}: ${count}`);
    });

  // Show first few sales
  console.log('\nFirst 5 sales:');
  data.slice(0, 5).forEach(sale => {
    console.log(`  ${sale.token_name} - ${sale.price_usd} USD (${sale.hours_ago}h ago)`);
  });
}

checkNFTSales();
