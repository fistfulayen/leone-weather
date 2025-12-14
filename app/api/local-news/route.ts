import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

interface Article {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  villages: string[];
}

interface NewsDigest {
  articles: Article[];
  lastUpdated: string;
  totalArticles: number;
}

const RSS_FEEDS = [
  { url: 'https://www.ideawebtv.it/feed/', name: 'IdeaWebTV' },
  { url: 'https://www.ansa.it/piemonte/notizie/piemonte_rss.xml', name: 'ANSA Piemonte' },

  // Broken feeds - keeping for reference:
  // { url: 'https://www.cuneodice.it/feed/', name: 'Cuneodice' }, // XML parsing error
  // { url: 'https://gazzettadalba.it/feed/', name: 'Gazzetta d\'Alba' }, // SSL certificate error
  // { url: 'https://www.targatocn.it/feed', name: 'Targatocn' }, // 404
  // { url: 'https://www.lavocedialba.it/feed/', name: 'La Voce di Alba' }, // 404
  // { url: 'https://www.laguida.it/feed/', name: 'La Guida' }, // 500 error
  // { url: 'https://www.cuneochronaca.it/feed/', name: 'Cuneo Cronaca' }, // DNS error
];

const VILLAGES = [
  // Primary villages (base names)
  { name: 'alba', alternates: [] },
  { name: 'albaretto della torre', alternates: ['albaretto'] },
  { name: 'arguello', alternates: [] },
  { name: 'bagnasco', alternates: [] },
  { name: 'barolo', alternates: [] },
  { name: 'bastia mondovì', alternates: ['bastia'] },
  { name: 'battifollo', alternates: [] },
  { name: 'belvedere langhe', alternates: ['belvedere'] },
  { name: 'benevello', alternates: [] },
  { name: 'bergolo', alternates: [] },
  { name: 'bosia', alternates: [] },
  { name: 'bossolasco', alternates: [] },
  { name: 'briaglia', alternates: [] },
  { name: 'briga alta', alternates: ['briga'] },
  { name: 'camerana', alternates: [] },
  { name: 'camo', alternates: [] },
  { name: 'caprauna', alternates: [] },
  { name: 'carrù', alternates: ['carru'] },
  { name: 'castagnito', alternates: [] },
  { name: 'castelbianco', alternates: [] },
  { name: 'casteldelfino', alternates: [] },
  { name: 'castelletto uzzone', alternates: ['castelletto'] },
  { name: 'castellinaldo', alternates: [] },
  { name: 'castellino tanaro', alternates: ['castellino'] },
  { name: 'castiglione falletto', alternates: ['castiglione'] },
  { name: 'castiglione tinella', alternates: [] },
  { name: 'castino', alternates: [] },
  { name: 'ceva', alternates: [] },
  { name: 'cherasco', alternates: [] },
  { name: 'cissone', alternates: [] },
  { name: 'corneliano d\'alba', alternates: ['corneliano'] },
  { name: 'cortemilia', alternates: [] },
  { name: 'cossano belbo', alternates: ['cossano'] },
  { name: 'cravanzana', alternates: [] },
  { name: 'diano d\'alba', alternates: ['diano'] },
  { name: 'dogliani', alternates: [] },
  { name: 'farigliano', alternates: [] },
  { name: 'feisoglio', alternates: [] },
  { name: 'garessio', alternates: [] },
  { name: 'gorzegno', alternates: [] },
  { name: 'gottasecca', alternates: [] },
  { name: 'govone', alternates: [] },
  { name: 'grinzane cavour', alternates: ['grinzane'] },
  { name: 'guarene', alternates: [] },
  { name: 'igliano', alternates: [] },
  { name: 'la morra', alternates: ['morra'] },
  { name: 'lequio berria', alternates: ['lequio'] },
  { name: 'lequio tanaro', alternates: [] },
  { name: 'lesegno', alternates: [] },
  { name: 'levice', alternates: [] },
  { name: 'lisio', alternates: [] },
  { name: 'magliano alfieri', alternates: ['magliano'] },
  { name: 'mango', alternates: [] },
  { name: 'marsaglia', alternates: [] },
  { name: 'mombarcaro', alternates: [] },
  { name: 'monchiero', alternates: [] },
  { name: 'mondovì', alternates: ['mondovi'] },
  { name: 'monesiglio', alternates: [] },
  { name: 'monforte d\'alba', alternates: ['monforte'] },
  { name: 'montelupo albese', alternates: ['montelupo'] },
  { name: 'monteu roero', alternates: ['monteu'] },
  { name: 'monticello d\'alba', alternates: ['monticello'] },
  { name: 'montà', alternates: ['monta'] },
  { name: 'murazzano', alternates: [] },
  { name: 'neive', alternates: [] },
  { name: 'neviglie', alternates: [] },
  { name: 'niella belbo', alternates: ['niella'] },
  { name: 'nucetto', alternates: [] },
  { name: 'ormea', alternates: [] },
  { name: 'perletto', alternates: [] },
  { name: 'perlo', alternates: [] },
  { name: 'pezzolo valle uzzone', alternates: ['pezzolo'] },
  { name: 'piobesi d\'alba', alternates: ['piobesi'] },
  { name: 'priola', alternates: [] },
  { name: 'prunetto', alternates: [] },
  { name: 'roddino', alternates: [] },
  { name: 'rodello', alternates: [] },
  { name: 'saliceto', alternates: [] },
  { name: 'sale delle langhe', alternates: ['sale'] },
  { name: 'san benedetto belbo', alternates: ['san benedetto'] },
  { name: 'santo stefano belbo', alternates: ['santo stefano'] },
  { name: 'serravalle langhe', alternates: ['serravalle'] },
  { name: 'sinio', alternates: [] },
  { name: 'treiso', alternates: [] },
  { name: 'trezzo tinella', alternates: ['trezzo'] },
  { name: 'vicoforte', alternates: [] },
];

const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: ['description', 'content:encoded']
  }
});

function createVillagePatterns(): Map<string, RegExp[]> {
  const patterns = new Map<string, RegExp[]>();

  for (const village of VILLAGES) {
    const allNames = [village.name, ...village.alternates];
    const regexes = allNames.map(name =>
      new RegExp(`\\b${name.replace(/'/g, "['']?")}\\b`, 'gi')
    );
    patterns.set(village.name, regexes);
  }

  return patterns;
}

function findMatchingVillages(text: string): string[] {
  const patterns = createVillagePatterns();
  const matches = new Set<string>();

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

export async function GET() {
  try {
    const allArticles: Article[] = [];
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Fetch all RSS feeds
    const feedPromises = RSS_FEEDS.map(async (feed) => {
      try {
        const feedData = await parser.parseURL(feed.url);
        return { source: feed.name, items: feedData.items || [] };
      } catch (error) {
        console.error(`Error fetching ${feed.name}:`, error);
        return { source: feed.name, items: [] };
      }
    });

    const feeds = await Promise.all(feedPromises);

    // Process each feed's articles
    for (const feed of feeds) {
      for (const item of feed.items) {
        // Check if article is from the last 24 hours
        const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
        if (pubDate < oneDayAgo) continue;

        // Search for village mentions in title and content
        const searchText = `${item.title || ''} ${item.contentSnippet || ''} ${item.content || ''}`.toLowerCase();
        const matchedVillages = findMatchingVillages(searchText);

        if (matchedVillages.length > 0) {
          allArticles.push({
            title: item.title || 'Untitled',
            link: item.link || '',
            pubDate: pubDate.toISOString(),
            source: feed.source,
            villages: matchedVillages,
          });
        }
      }
    }

    // Sort by date (newest first) and limit to top 15
    allArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    const topArticles = allArticles.slice(0, 15);

    const digest: NewsDigest = {
      articles: topArticles,
      lastUpdated: new Date().toISOString(),
      totalArticles: topArticles.length,
    };

    return NextResponse.json(digest);
  } catch (error) {
    console.error('Error fetching local news:', error);
    return NextResponse.json({
      articles: [],
      lastUpdated: new Date().toISOString(),
      totalArticles: 0
    }, { status: 500 });
  }
}
