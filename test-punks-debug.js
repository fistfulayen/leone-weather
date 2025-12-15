// Debug script to check CryptoPunks scraping

async function testPunksScraping() {
  console.log('\n=== TESTING CRYPTOPUNKS SCRAPING ===\n');

  try {
    const response = await fetch('https://www.cryptopunks.app/cryptopunks/recents');

    if (!response.ok) {
      console.log('❌ Failed to fetch:', response.statusText);
      return;
    }

    const html = await response.text();
    console.log('✅ Fetched HTML, length:', html.length, 'characters\n');

    // Current regex pattern from the code
    const salesPattern = /href="\/cryptopunks\/details\/(\d+)"[\s\S]*?Bought for ([\d.]+) ETH \(\$([\d,]+(?:\.\d+)?)[^)]*\)[\s\S]*?<div>(\d+) hours? ago<\/div>/gi;

    const sales = [];
    let match;
    let matchCount = 0;

    console.log('Searching for sales with current regex pattern...\n');

    while ((match = salesPattern.exec(html)) !== null) {
      matchCount++;
      const hoursAgo = parseInt(match[4]);
      const punkId = match[1];
      const priceEth = parseFloat(match[2]);
      const priceUsd = match[3];

      console.log(`Match ${matchCount}:`);
      console.log(`  Punk #${punkId}`);
      console.log(`  Price: ${priceEth} ETH ($${priceUsd})`);
      console.log(`  Time: ${hoursAgo} hours ago`);
      console.log(`  Within 24h? ${hoursAgo <= 24 ? 'YES ✅' : 'NO ❌'}\n`);

      if (hoursAgo <= 24) {
        sales.push({
          punkId,
          priceEth,
          priceUsd,
          hoursAgo,
        });
      }
    }

    console.log('='.repeat(60));
    console.log(`Total matches found: ${matchCount}`);
    console.log(`Sales within 24 hours: ${sales.length}`);
    console.log('='.repeat(60));

    if (sales.length > 0) {
      console.log('\nSales that would appear in email:');
      sales.forEach((sale, i) => {
        console.log(`${i + 1}. Punk #${sale.punkId} - ${sale.priceEth} ETH ($${sale.priceUsd}) - ${sale.hoursAgo}h ago`);
      });
    } else {
      console.log('\n❌ No sales found within 24 hours');
    }

    // Also try to find #2266 specifically in the HTML
    console.log('\n' + '='.repeat(60));
    console.log('Searching for Punk #2266 specifically...');
    console.log('='.repeat(60));

    if (html.includes('2266')) {
      console.log('✅ Found "2266" in the HTML');

      // Find context around 2266
      const index = html.indexOf('/details/2266');
      if (index !== -1) {
        const context = html.substring(Math.max(0, index - 200), Math.min(html.length, index + 400));
        console.log('\nContext around "/details/2266":');
        console.log('-'.repeat(60));
        console.log(context);
        console.log('-'.repeat(60));
      }
    } else {
      console.log('❌ "2266" not found in HTML');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPunksScraping();
