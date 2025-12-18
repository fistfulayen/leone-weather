import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('Fetching NFT sales...');

    const allSales: Array<{
      tokenName: string;
      collectionName: string;
      collectionArtist: string;
      priceEth: number;
      priceUsd: string;
      imageUrl: string;
      platform: string;
      timestamp: string;
      tokenId: string;
      hoursAgo: number;
    }> = [];

    // 1. Fetch CryptoPunks sales from HTML scraping (last 24 hours)
    try {
      const punksResponse = await fetch('https://www.cryptopunks.app/cryptopunks/recents', {
        cache: 'no-store',
      });

      if (punksResponse.ok) {
        const html = await punksResponse.text();
        const salesPattern =
          /href="\/cryptopunks\/details\/(\d+)"[^<]*?<img[^>]*?>[^<]*?<\/a>[^<]*?<\/div>[^<]*?<div[^>]*?>[^<]*?<div>Bought for ([\d.]+) ETH \(\$([\d,]+(?:\.\d+)?)[^)]*\)<\/div><div>(\d+) hours? ago<\/div>/gi;

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
              tokenId: punkId,
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
          Referer: 'https://artacle.io/',
        },
        cache: 'no-store',
      });

      if (artacleResponse.ok) {
        const data = await artacleResponse.json();
        const artacleSales = data.transactions
          .filter((tx: any) => tx.valueETH > 0.5)
          .map((tx: any) => ({
            tokenName: tx.tokenName,
            collectionName: tx.collectionName,
            collectionArtist: tx.collectionArtist || 'Unknown Artist',
            priceEth: tx.valueETH,
            priceUsd: tx.valueUSD
              .toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })
              .replace('$', ''),
            imageUrl: tx.imageUrl || tx.imageUrlCDN,
            platform: tx.platform,
            timestamp: new Date(tx.ts).toISOString(),
            tokenId: tx.token || tx.tokenName.match(/\d+/)?.[0] || '0',
            hoursAgo: Math.floor((Date.now() - tx.ts) / (1000 * 60 * 60)),
          }));

        allSales.push(...artacleSales);
        console.log('Artacle sales found:', artacleSales.length);
      }
    } catch (error) {
      console.error('Error fetching Artacle sales:', error);
    }

    console.log('Total NFT sales:', allSales.length);

    if (allSales.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No NFT sales found in last 24 hours',
        count: 0,
      });
    }

    // Download and re-host images in Supabase Storage
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    for (const sale of allSales) {
      try {
        // Download image
        const imageResponse = await fetch(sale.imageUrl);
        if (imageResponse.ok) {
          const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

          // Upload to Supabase
          const fileName = `nft-${sale.tokenId}-${Date.now()}.png`;
          const { error: uploadError } = await supabase.storage
            .from('daily-paintings')
            .upload(`nft-sales/${fileName}`, imageBuffer, {
              contentType: 'image/png',
              upsert: true,
            });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('daily-paintings')
              .getPublicUrl(`nft-sales/${fileName}`);
            sale.imageUrl = publicUrl;
          }
        }
      } catch (error) {
        console.error(`Failed to re-host image for ${sale.tokenName}:`, error);
        // Keep original URL if download fails
      }
    }

    // Delete all existing sales before inserting fresh data
    // (This prevents duplicates from timestamp drift on re-scraping)
    await supabaseAdmin.from('nft_sales').delete().neq('id', 0);

    // Insert new sales into database (using upsert to handle duplicates)
    const salesData = allSales.map((sale) => ({
      token_name: sale.tokenName,
      collection_name: sale.collectionName,
      collection_artist: sale.collectionArtist,
      price_eth: sale.priceEth,
      price_usd: sale.priceUsd,
      image_url: sale.imageUrl,
      platform: sale.platform,
      sale_timestamp: sale.timestamp,
      token_id: sale.tokenId,
      hours_ago: sale.hoursAgo,
    }));

    const { error } = await supabaseAdmin.from('nft_sales').upsert(salesData, {
      onConflict: 'token_name,sale_timestamp,platform',
      ignoreDuplicates: true,
    });

    if (error) {
      console.error('Error storing NFT sales:', error);
      throw error;
    }

    console.log('NFT sales stored successfully');

    return NextResponse.json({
      success: true,
      message: 'NFT sales fetched and stored',
      count: allSales.length,
    });
  } catch (error) {
    console.error('Error fetching NFT sales:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch NFT sales',
      },
      { status: 500 }
    );
  }
}
