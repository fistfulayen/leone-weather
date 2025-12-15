const Parser = require('rss-parser');

const RSS_FEEDS = [
  { url: 'https://www.cuneodice.it/feed/', name: 'Cuneodice' },
  { url: 'https://gazzettadalba.it/feed/', name: 'Gazzetta d\'Alba' },
  { url: 'https://www.targatocn.it/feed', name: 'Targatocn' },
];

const TEST_VILLAGES = [
  { name: 'alba', alternates: [] },
  { name: 'niella belbo', alternates: ['niella'] },
  { name: 'ceva', alternates: [] },
];

const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: ['description', 'content:encoded']
  }
});

function createVillagePatterns() {
  const patterns = new Map();

  for (const village of TEST_VILLAGES) {
    const allNames = [village.name, ...village.alternates];
    const regexes = allNames.map(name =>
      new RegExp(`\\b${name.replace(/'/g, "['']?")}\\b`, 'gi')
    );
    patterns.set(village.name, regexes);
  }

  return patterns;
}

function findMatchingVillages(text) {
  const patterns = createVillagePatterns();
  const matches = new Set();

  for (const [villageName, regexes] of patterns.entries()) {
    for (const regex of regexes) {
      if (regex.test(text)) {
        matches.add(villageName);
        break;
      }
    }
  }

  return Array.from(matches);
}

async function testRSS() {
  console.log('Testing RSS feeds...\n');

  for (const feed of RSS_FEEDS) {
    console.log(`\n=== ${feed.name} ===`);
    try {
      const feedData = await parser.parseURL(feed.url);
      console.log(`Found ${feedData.items?.length || 0} articles`);

      if (feedData.items && feedData.items.length > 0) {
        const recentArticles = feedData.items.slice(0, 5);
        for (const item of recentArticles) {
          const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
          const searchText = `${item.title || ''} ${item.contentSnippet || ''} ${item.content || ''}`.toLowerCase();
          const matchedVillages = findMatchingVillages(searchText);

          console.log(`\nTitle: ${item.title}`);
          console.log(`Date: ${pubDate.toISOString()}`);
          console.log(`Matched villages: ${matchedVillages.length > 0 ? matchedVillages.join(', ') : 'none'}`);

          if (matchedVillages.length > 0) {
            console.log(`Preview: ${searchText.substring(0, 200)}...`);
          }
        }
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
}

testRSS().catch(console.error);
