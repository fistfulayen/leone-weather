const Parser = require('rss-parser');

const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: ['description', 'content:encoded']
  }
});

const WORKING_FEEDS = [
  { url: 'https://www.ideawebtv.it/feed/', name: 'IdeaWebTV' },
  { url: 'https://www.ansa.it/piemonte/notizie/piemonte_rss.xml', name: 'ANSA Piemonte' },
];

const VILLAGES = [
  'alba', 'niella belbo', 'niella', 'ceva', 'dogliani', 'barolo', 'neive',
  'treiso', 'barbaresco', 'monforte', 'la morra', 'cherasco', 'bra',
  'mondovì', 'saluzzo', 'cuneo', 'cortemilia', 'bossolasco', 'murazzano'
];

function createVillagePatterns() {
  const patterns = new Map();
  for (const village of VILLAGES) {
    const regex = new RegExp(`\\b${village.replace(/'/g, "['']?")}\\b`, 'gi');
    patterns.set(village, regex);
  }
  return patterns;
}

function findMatchingVillages(text) {
  const patterns = createVillagePatterns();
  const matches = new Set();

  for (const [villageName, regex] of patterns.entries()) {
    if (regex.test(text)) {
      matches.add(villageName);
    }
  }

  return Array.from(matches);
}

async function testFeed(feed) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${feed.name} - ${feed.url}`);
  console.log('='.repeat(80));

  try {
    const feedData = await parser.parseURL(feed.url);
    console.log(`\nTotal articles: ${feedData.items?.length || 0}`);

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let recentCount = 0;
    let matchedCount = 0;

    if (feedData.items) {
      for (const item of feedData.items) {
        const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
        const isRecent = pubDate >= oneDayAgo;
        if (isRecent) recentCount++;

        const searchText = `${item.title || ''} ${item.contentSnippet || ''} ${item.content || ''}`.toLowerCase();
        const matchedVillages = findMatchingVillages(searchText);

        if (matchedVillages.length > 0) {
          matchedCount++;
          const recent = isRecent ? '🆕' : '  ';
          console.log(`\n${recent} ${matchedVillages.join(', ').toUpperCase()}`);
          console.log(`   ${item.title}`);
          console.log(`   ${pubDate.toLocaleString('en-GB', { timeZone: 'Europe/Rome' })}`);
          console.log(`   ${item.link}`);
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Recent (24h): ${recentCount}`);
    console.log(`   With village mentions: ${matchedCount}`);

  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

async function testAll() {
  console.log('Testing working RSS feeds for village mentions...\n');

  for (const feed of WORKING_FEEDS) {
    await testFeed(feed);
  }

  console.log('\n' + '='.repeat(80));
  console.log('DONE');
  console.log('='.repeat(80));
}

testAll().catch(console.error);
