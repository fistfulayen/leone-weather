import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const punksResponse = await fetch('https://www.cryptopunks.app/cryptopunks/recents', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!punksResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch CryptoPunks data' }, { status: 500 });
    }

    const html = await punksResponse.text();

    // Parse HTML to extract sales data with more details
    // More restrictive regex that doesn't cross punk boundaries
    const salesPattern = /href="\/cryptopunks\/details\/(\d+)"[^<]*?<img[^>]*?>[^<]*?<\/a>[^<]*?<\/div>[^<]*?<div[^>]*?>[^<]*?<div>Bought for ([\d.]+) ETH \(\$([\d,]+(?:\.\d+)?)[^)]*\)<\/div><div>(\d+) hours? ago<\/div>/gi;

    const sales: Array<{
      punkId: string;
      priceEth: number;
      priceUsd: string;
      hoursAgo: number;
      imageUrl: string;
    }> = [];
    let match;

    while ((match = salesPattern.exec(html)) !== null) {
      const hoursAgo = parseInt(match[4]);
      if (hoursAgo <= 24) {
        const punkId = match[1];
        sales.push({
          punkId: punkId,
          priceEth: parseFloat(match[2]),
          priceUsd: match[3],
          hoursAgo: hoursAgo,
          imageUrl: `https://www.cryptopunks.app/images/cryptopunks/punk${punkId.padStart(4, '0')}.png`,
        });
      }
    }

    if (sales.length === 0) {
      return NextResponse.json({ sales: null });
    }

    return NextResponse.json({ sales });
  } catch (error) {
    console.error('Error fetching CryptoPunks sales:', error);
    return NextResponse.json({ error: 'Failed to fetch CryptoPunks sales' }, { status: 500 });
  }
}
