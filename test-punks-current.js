// Test current CryptoPunks sales detection

async function testCurrentPunks() {
  console.log('\n=== TESTING CURRENT CRYPTOPUNKS SALES ===\n');

  try {
    const response = await fetch('https://www.cryptopunks.app/cryptopunks/recents');
    const html = await response.text();

    // The fixed regex from our code
    const salesPattern = /href="\/cryptopunks\/details\/(\d+)"[^<]*?<img[^>]*?>[^<]*?<\/a>[^<]*?<\/div>[^<]*?<div[^>]*?>[^<]*?<div>Bought for ([\d.]+) ETH \(\$([\d,]+(?:\.\d+)?)[^)]*\)<\/div><div>(\d+) hours? ago<\/div>/gi;

    const salesInLast24Hours = [];
    let match;

    while ((match = salesPattern.exec(html)) !== null) {
      const punkId = match[1];
      const priceEth = parseFloat(match[2]);
      const priceUsd = match[3];
      const hoursAgo = parseInt(match[4]);

      if (hoursAgo <= 24) {
        salesInLast24Hours.push({
          punkId,
          priceEth,
          priceUsd,
          hoursAgo
        });
      }
    }

    console.log(`Found ${salesInLast24Hours.length} sales in last 24 hours:\n`);

    if (salesInLast24Hours.length > 0) {
      salesInLast24Hours.forEach((sale, i) => {
        console.log(`${i + 1}. Punk #${sale.punkId}`);
        console.log(`   Price: ${sale.priceEth} ETH ($${sale.priceUsd})`);
        console.log(`   Time: ${sale.hoursAgo} hours ago\n`);
      });
    } else {
      console.log('❌ No sales found in last 24 hours\n');
    }

    // Also check specifically for #2595
    console.log('=== SEARCHING FOR PUNK #2595 ===\n');
    const regex2595 = /details\/2595[\s\S]{0,300}Bought for[\s\S]{0,100}hours? ago/gi;
    const matches2595 = [...html.matchAll(regex2595)];

    if (matches2595.length > 0) {
      console.log(`✅ Found ${matches2595.length} reference(s) to Punk #2595 with "Bought for":\n`);
      matches2595.forEach((m, i) => {
        console.log(`Match ${i + 1}:`);
        console.log(m[0]);
        console.log('\n---\n');
      });
    } else {
      console.log('❌ No "Bought for" transactions found for Punk #2595\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCurrentPunks();
