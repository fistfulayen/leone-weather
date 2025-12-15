// Search specifically for Punk #2266 purchases

async function findPunk2266() {
  console.log('\n=== SEARCHING FOR PUNK #2266 PURCHASES ===\n');

  try {
    const response = await fetch('https://www.cryptopunks.app/cryptopunks/recents');
    const html = await response.text();

    // Find all mentions of 2266
    const regex2266 = /details\/2266[\s\S]{0,500}/g;
    const matches = [...html.matchAll(regex2266)];

    console.log(`Found ${matches.length} references to Punk #2266:\n`);

    matches.forEach((match, i) => {
      console.log(`Reference ${i + 1}:`);
      console.log('-'.repeat(80));
      console.log(match[0]);
      console.log('-'.repeat(80) + '\n');
    });

    // Also search for "Bought" near 2266
    const boughtPattern = /2266[\s\S]{0,200}Bought|Bought[\s\S]{0,200}2266/gi;
    const boughtMatches = [...html.matchAll(boughtPattern)];

    console.log('\n=== SEARCHING FOR "BOUGHT" NEAR 2266 ===\n');
    if (boughtMatches.length > 0) {
      console.log(`✅ Found ${boughtMatches.length} matches:\n`);
      boughtMatches.forEach((match, i) => {
        console.log(`Match ${i + 1}:`);
        console.log('-'.repeat(80));
        console.log(match[0]);
        console.log('-'.repeat(80) + '\n');
      });
    } else {
      console.log('❌ No "Bought" transactions found for Punk #2266\n');
    }

    // Check the actual cryptopunks.app detail page for #2266
    console.log('=== CHECKING DETAIL PAGE FOR #2266 ===\n');
    const detailResponse = await fetch('https://www.cryptopunks.app/cryptopunks/details/2266');
    const detailHtml = await detailResponse.text();

    // Look for recent sales on the detail page
    const salePattern = /Bought for[\s\S]{0,100}/gi;
    const salesOnDetailPage = [...detailHtml.matchAll(salePattern)];

    if (salesOnDetailPage.length > 0) {
      console.log(`Found ${salesOnDetailPage.length} "Bought for" entries on detail page:\n`);
      salesOnDetailPage.slice(0, 3).forEach((match, i) => {
        console.log(`${i + 1}. ${match[0]}\n`);
      });
    } else {
      console.log('No recent purchases found on detail page\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

findPunk2266();
