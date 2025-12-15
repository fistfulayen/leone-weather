import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const allSales: Array<{
      tokenName: string;
      collectionName: string;
      collectionArtist: string;
      priceEth: number;
      priceUsd: string;
      imageUrl: string;
      platform: string;
      timestamp: string;
      punkId: string;
      hoursAgo: number;
    }> = [];

    // 1. Fetch CryptoPunks sales from HTML scraping (last 24 hours)
    try {
      const punksResponse = await fetch('https://www.cryptopunks.app/cryptopunks/recents');
      if (punksResponse.ok) {
        const html = await punksResponse.text();

        // Parse HTML to extract sales data
        const salesPattern = /href="\/cryptopunks\/details\/(\d+)"[^<]*?<img[^>]*?>[^<]*?<\/a>[^<]*?<\/div>[^<]*?<div[^>]*?>[^<]*?<div>Bought for ([\d.]+) ETH \(\$([\d,]+(?:\.\d+)?)[^)]*\)<\/div><div>(\d+) hours? ago<\/div>/gi;

        let match;
        while ((match = salesPattern.exec(html)) !== null) {
          const hoursAgo = parseInt(match[4]);
          if (hoursAgo <= 24) {
            const punkId = match[1];
            allSales.push({
              tokenName: `CryptoPunk #${punkId}`,
              collectionName: 'CryptoPunks',
              collectionArtist: 'Larva Labs',
              priceEth: parseFloat(match[2]),
              priceUsd: match[3],
              imageUrl: `https://www.cryptopunks.app/images/cryptopunks/punk${punkId.padStart(4, '0')}.png`,
              platform: 'CryptoPunks',
              timestamp: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString(),
              punkId: punkId,
              hoursAgo: hoursAgo,
            });
          }
        }

        console.log('CryptoPunks sales found:', allSales.length);
      }
    } catch (error) {
      console.error('Error fetching CryptoPunks sales:', error);
    }

    // 2. Fetch NFT sales data from Artacle API (last 24 hours, > 0.5 ETH)
    try {
      const artacleResponse = await fetch('https://artacle.io/api/agragate/index?period=1', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Referer': 'https://artacle.io/'
        },
        cache: 'no-store' // Don't cache - response is > 5MB
      });

      if (artacleResponse.ok) {
        const data = await artacleResponse.json();

        // Filter for sales > 0.5 ETH and add to our sales array
        const artacleSales = data.transactions
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
            punkId: tx.token || tx.tokenName.match(/\d+/)?.[0] || '0',
            hoursAgo: Math.floor((Date.now() - tx.ts) / (1000 * 60 * 60))
          }));

        allSales.push(...artacleSales);
        console.log('Artacle sales found:', artacleSales.length);
      }
    } catch (error) {
      console.error('Error fetching Artacle sales:', error);
    }

    // Sort by price (highest first)
    allSales.sort((a, b) => b.priceEth - a.priceEth);

    console.log('Total NFT sales (CryptoPunks + Artacle):', allSales.length);

    if (allSales.length === 0) {
      return NextResponse.json({ sales: null });
    }

    return NextResponse.json({ sales: allSales });
  } catch (error) {
    console.error('Error fetching NFT sales:', error);
    return NextResponse.json({ error: 'Failed to fetch NFT sales' }, { status: 500 });
  }
}
