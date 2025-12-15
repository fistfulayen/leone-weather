// Debug the exact HTML structure to understand the mismatch

async function debugPunkHtml() {
  console.log('\n=== DEBUGGING PUNK HTML STRUCTURE ===\n');

  try {
    const response = await fetch('https://www.cryptopunks.app/cryptopunks/recents');
    const html = await response.text();

    // Find both #4172 and #2595 in the HTML
    console.log('=== PUNK #4172 HTML ===\n');
    const regex4172 = /details\/4172"[\s\S]{0,500}/;
    const match4172 = html.match(regex4172);
    if (match4172) {
      console.log(match4172[0]);
      console.log('\n' + '='.repeat(80) + '\n');
    }

    console.log('=== PUNK #2595 HTML ===\n');
    const regex2595 = /details\/2595"[\s\S]{0,500}/;
    const match2595 = html.match(regex2595);
    if (match2595) {
      console.log(match2595[0]);
      console.log('\n' + '='.repeat(80) + '\n');
    }

    // Check the distance between them
    const idx4172 = html.indexOf('details/4172');
    const idx2595 = html.indexOf('details/2595');

    console.log(`\nPosition of #4172: ${idx4172}`);
    console.log(`Position of #2595: ${idx2595}`);
    console.log(`Distance: ${Math.abs(idx2595 - idx4172)} characters`);
    console.log(`#4172 comes ${idx4172 < idx2595 ? 'BEFORE' : 'AFTER'} #2595\n`);

    // Test current regex
    const salesPattern = /href="\/cryptopunks\/details\/(\d+)"[^<]*?<img[^>]*?>[^<]*?<\/a>[^<]*?<\/div>[^<]*?<div[^>]*?>[^<]*?<div>Bought for ([\d.]+) ETH \(\$([\d,]+(?:\.\d+)?)[^)]*\)<\/div><div>(\d+) hours? ago<\/div>/gi;

    console.log('=== CURRENT REGEX MATCHES ===\n');
    let match;
    let count = 0;
    while ((match = salesPattern.exec(html)) !== null && count < 5) {
      count++;
      console.log(`Match ${count}:`);
      console.log(`  Punk ID: #${match[1]}`);
      console.log(`  Price: ${match[2]} ETH ($${match[3]})`);
      console.log(`  Time: ${match[4]} hours ago`);
      console.log(`  Match length: ${match[0].length} characters`);
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugPunkHtml();
