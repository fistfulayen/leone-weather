import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch NFT sales data from Artacle API (last 24 hours)
    const response = await fetch('https://artacle.io/api/agragate/index?period=1', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://artacle.io/'
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch NFT sales data' }, { status: 500 });
    }

    const data = await response.json();

    // Filter for sales > 0.5 ETH and map to our format
    const sales = data.transactions
      .filter((tx: any) => tx.valueETH > 0.5)
      .map((tx: any) => ({
        tokenName: tx.tokenName,
        collectionName: tx.collectionName,
        collectionArtist: tx.collectionArtist || 'Unknown Artist',
        priceEth: tx.valueETH,
        priceUsd: tx.valueUSD.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).replace('$', ''),
        imageUrl: tx.imageUrl || tx.imageUrlCDN,
        platform: tx.platform,
        timestamp: new Date(tx.ts).toISOString(),
        // Keep punkId for backwards compatibility (use token ID)
        punkId: tx.token || tx.tokenName.match(/\d+/)?.[0] || '0',
        // Calculate hours ago
        hoursAgo: Math.floor((Date.now() - tx.ts) / (1000 * 60 * 60))
      }))
      .slice(0, 10); // Limit to top 10

    if (sales.length === 0) {
      return NextResponse.json({ sales: null });
    }

    return NextResponse.json({ sales });
  } catch (error) {
    console.error('Error fetching NFT sales:', error);
    return NextResponse.json({ error: 'Failed to fetch NFT sales' }, { status: 500 });
  }
}
