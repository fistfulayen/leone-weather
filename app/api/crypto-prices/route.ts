import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cryptoResponse = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true',
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );

    if (!cryptoResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch crypto prices' }, { status: 500 });
    }

    const data = await cryptoResponse.json();

    const cryptoPrices = {
      bitcoin: {
        price: data.bitcoin?.usd,
        change: data.bitcoin?.usd_24h_change,
      },
      ethereum: {
        price: data.ethereum?.usd,
        change: data.ethereum?.usd_24h_change,
      },
      solana: {
        price: data.solana?.usd,
        change: data.solana?.usd_24h_change,
      },
    };

    return NextResponse.json(cryptoPrices);
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    return NextResponse.json({ error: 'Failed to fetch crypto prices' }, { status: 500 });
  }
}
