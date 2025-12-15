// Test to see exactly what the regex is matching

async function testRegexMatching() {
  console.log('\n=== TESTING REGEX MATCHING ===\n');

  try {
    const response = await fetch('https://www.cryptopunks.app/cryptopunks/recents');
    const html = await response.text();

    // Current regex from the code
    const salesPattern = /href="\/cryptopunks\/details\/(\d+)"[\s\S]*?Bought for ([\d.]+) ETH \(\$([\d,]+(?:\.\d+)?)[^)]*\)[\s\S]*?<div>(\d+) hours? ago<\/div>/gi;

    let match;
    while ((match = salesPattern.exec(html)) !== null) {
      const punkId = match[1];
      const priceEth = parseFloat(match[2]);
      const priceUsd = match[3];
      const hoursAgo = parseInt(match[4]);

      console.log(`MATCH FOUND:`);
      console.log(`  Punk ID from href: #${punkId}`);
      console.log(`  Price: ${priceEth} ETH ($${priceUsd})`);
      console.log(`  Time: ${hoursAgo} hours ago`);
      console.log(`\nFull matched text (first 500 chars):`);
      console.log('-'.repeat(80));
      console.log(match[0].substring(0, 500));
      console.log('-'.repeat(80));
      console.log('');

      // Check if the matched text contains DIFFERENT punk IDs
      const punkIdMatches = [...match[0].matchAll(/details\/(\d+)/g)];
      const uniquePunkIds = [...new Set(punkIdMatches.map(m => m[1]))];

      if (uniquePunkIds.length > 1) {
        console.log('⚠️  WARNING: Match spans multiple punk IDs:', uniquePunkIds.join(', '));
      } else {
        console.log('✅ Match is for single punk ID:', uniquePunkIds[0]);
      }
      console.log('\n' + '='.repeat(80) + '\n');

      // Only show first match for now
      if (salesPattern.lastIndex) break;
    }

    // Alternative: more restrictive regex that doesn't cross punk boundaries
    console.log('\n=== TESTING ALTERNATIVE REGEX (Non-greedy) ===\n');

    // Reset the string search
    const altPattern = /href="\/cryptopunks\/details\/(\d+)"[^<]*?<img[^>]*?>[^<]*?<\/a>[^<]*?<\/div>[^<]*?<div[^>]*?>[^<]*?<div>Bought for ([\d.]+) ETH \(\$([\d,]+(?:\.\d+)?)[^)]*\)<\/div><div>(\d+) hours? ago<\/div>/gi;

    let altMatch;
    let altCount = 0;
    while ((altMatch = altPattern.exec(html)) !== null) {
      altCount++;
      const punkId = altMatch[1];
      const priceEth = parseFloat(altMatch[2]);
      const priceUsd = altMatch[3];
      const hoursAgo = parseInt(altMatch[4]);

      console.log(`ALT Match ${altCount}:`);
      console.log(`  Punk ID: #${punkId}`);
      console.log(`  Price: ${priceEth} ETH ($${priceUsd})`);
      console.log(`  Time: ${hoursAgo} hours ago`);

      if (hoursAgo <= 24) {
        console.log(`  ✅ Within 24 hours\n`);
      } else {
        console.log(`  ❌ Outside 24 hours\n`);
      }
    }

    if (altCount === 0) {
      console.log('❌ Alternative regex found no matches\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRegexMatching();
