import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import Parser from 'rss-parser';

interface Article {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  villages: string[];
}

const RSS_FEEDS = [
  { url: 'https://www.ideawebtv.it/feed/', name: 'IdeaWebTV' },
  { url: 'https://www.ansa.it/piemonte/notizie/piemonte_rss.xml', name: 'ANSA Piemonte' },
];

const VILLAGES = [
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
    item: ['description', 'content:encoded'],
  },
});

// Sports-related keywords to filter out (Italian)
const SPORTS_KEYWORDS = [
  'calcio', 'calciatori', 'calciatore', 'serie a', 'serie b', 'serie c', 'serie d',
  'partita', 'gol', 'goal', 'pallone', 'pallavolo', 'volley', 'basket', 'pallacanestro',
  'campionato', 'classifica', 'allenatore', 'mister', 'squadra di calcio',
  'playoff', 'play-off', 'derby', 'tifosi', 'ultras', 'curva',
  'scudetto', 'coppa italia', 'champions league', 'europa league',
  'federazione', 'figc', 'lega calcio', 'arbitro', 'rigore', 'penalty',
  'pareggio', 'vittoria sportiva', 'sconfitta sportiva',
  'under 21', 'under 19', 'under 17', 'primavera', 'juniores',
  'promozione', 'eccellenza', 'prima categoria', 'seconda categoria', 'terza categoria',
  'dilettanti', 'giovanili', 'torneo di calcio',
  'hockey', 'rugby', 'tennis', 'ciclismo', 'giro d\'italia', 'tour de france',
  'sci alpino', 'slalom', 'discesa libera', 'super-g',
  'atletica', 'maratona', 'podismo',
];

function isSportsArticle(text: string): boolean {
  const lowerText = text.toLowerCase();
  return SPORTS_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

function createVillagePatterns(): Map<string, RegExp[]> {
  const patterns = new Map<string, RegExp[]>();

  for (const village of VILLAGES) {
    const allNames = [village.name, ...village.alternates];
    const regexes = allNames.map(
      (name) => new RegExp(`\\b${name.replace(/'/g, "['']?")}\\b`, 'gi')
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
    console.log('Fetching local news...');

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
        const searchText = `${item.title || ''} ${item.contentSnippet || ''} ${
          item.content || ''
        }`.toLowerCase();

        // Skip sports articles
        if (isSportsArticle(searchText)) {
          continue;
        }

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

    console.log('Total articles found:', allArticles.length);

    if (allArticles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No local news found in last 24 hours',
        count: 0,
      });
    }

    // Delete old articles (older than 24 hours) before inserting new ones
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin.from('local_news_articles').delete().lt('pub_date', twentyFourHoursAgo);

    // Insert new articles into database (using upsert to handle duplicates)
    const articlesData = allArticles.map((article) => ({
      title: article.title,
      link: article.link,
      pub_date: article.pubDate,
      source: article.source,
      villages: article.villages,
    }));

    const { error } = await supabaseAdmin.from('local_news_articles').upsert(articlesData, {
      onConflict: 'link',
      ignoreDuplicates: true,
    });

    if (error) {
      console.error('Error storing local news:', error);
      throw error;
    }

    console.log('Local news stored successfully');

    return NextResponse.json({
      success: true,
      message: 'Local news fetched and stored',
      count: allArticles.length,
    });
  } catch (error) {
    console.error('Error fetching local news:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch local news',
      },
      { status: 500 }
    );
  }
}
