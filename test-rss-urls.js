const Parser = require('rss-parser');

const parser = new Parser({ timeout: 10000 });

const TEST_FEEDS = [
  // Original feeds
  'https://www.cuneodice.it/feed/',
  'https://gazzettadalba.it/feed/',
  'https://www.targatocn.it/feed',

  // Alternative patterns
  'https://www.targatocn.it/rss',
  'https://www.targatocn.it/feed/',
  'https://targatocn.it/feed',

  'https://www.lavocedialba.it/feed/',
  'https://www.lavocedialba.it/rss',
  'https://lavocedialba.it/feed/',

  'https://www.laguida.it/feed/',
  'https://www.laguida.it/rss',
  'https://laguida.it/feed/',

  'https://www.ideawebtv.it/feed/',
  'https://www.ideawebtv.it/rss',

  // ANSA Piemonte
  'https://www.ansa.it/piemonte/notizie/piemonte_rss.xml',
  'https://www.ansa.it/sito/notizie/regioni/piemonte/piemonte_rss.xml',

  // Cuneo Cronaca
  'https://www.cuneochronaca.it/feed/',
  'https://www.cuneochronaca.it/rss',
  'https://cuneochronaca.it/feed/',
];

async function testFeed(url) {
  try {
    const feed = await parser.parseURL(url);
    const itemCount = feed.items?.length || 0;
    console.log(`✅ ${url}`);
    console.log(`   Title: ${feed.title}`);
    console.log(`   Items: ${itemCount}`);
    if (itemCount > 0) {
      console.log(`   Latest: ${feed.items[0].title}`);
      console.log(`   Date: ${feed.items[0].pubDate}`);
    }
    console.log('');
    return { url, success: true, title: feed.title, items: itemCount };
  } catch (error) {
    console.log(`❌ ${url}`);
    console.log(`   Error: ${error.message.substring(0, 100)}`);
    console.log('');
    return { url, success: false, error: error.message };
  }
}

async function testAllFeeds() {
  console.log('Testing RSS feeds...\n');
  console.log('='.repeat(80) + '\n');

  const results = [];

  for (const url of TEST_FEEDS) {
    const result = await testFeed(url);
    results.push(result);
  }

  console.log('='.repeat(80));
  console.log('\nSUMMARY:\n');

  const working = results.filter(r => r.success);
  console.log(`✅ Working feeds: ${working.length}/${results.length}\n`);

  if (working.length > 0) {
    console.log('WORKING FEEDS:');
    working.forEach(r => {
      console.log(`  - ${r.url}`);
      console.log(`    ${r.title} (${r.items} items)`);
    });
  }
}

testAllFeeds().catch(console.error);
