import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('Fetching crypto prices...');

    // Fetch crypto prices from CoinGecko
    const cryptoResponse = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true',
      { cache: 'no-store' }
    );

    if (!cryptoResponse.ok) {
      throw new Error(`CoinGecko API error: ${cryptoResponse.status}`);
    }

    const data = await cryptoResponse.json();

    // Store in database
    const { error } = await supabaseAdmin
      .from('crypto_prices')
      .insert({
        bitcoin_price: data.bitcoin?.usd,
        bitcoin_change_24h: data.bitcoin?.usd_24h_change,
        ethereum_price: data.ethereum?.usd,
        ethereum_change_24h: data.ethereum?.usd_24h_change,
        solana_price: data.solana?.usd,
        solana_change_24h: data.solana?.usd_24h_change,
      });

    if (error) {
      console.error('Error storing crypto prices:', error);
      throw error;
    }

    console.log('Crypto prices stored successfully');

    return NextResponse.json({
      success: true,
      message: 'Crypto prices fetched and stored',
      data: {
        bitcoin: data.bitcoin?.usd,
        ethereum: data.ethereum?.usd,
        solana: data.solana?.usd,
      },
    });
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch crypto prices',
      },
      { status: 500 }
    );
  }
}
