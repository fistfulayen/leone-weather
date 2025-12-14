'use client';

import { useEffect, useState } from 'react';

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

export default function NewsCard() {
  const [newsData, setNewsData] = useState<NewsDigest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const res = await fetch('/api/local-news');
      if (res.ok) {
        const data = await res.json();
        setNewsData(data);
      }
    } catch (error) {
      console.error('Error fetching local news:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!newsData || newsData.totalArticles === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Rome',
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        📰 Alta Langa Local News ({newsData.totalArticles} {newsData.totalArticles === 1 ? 'Article' : 'Articles'})
      </h2>
      <div className="space-y-4">
        {newsData.articles.map((article, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
                {article.title}
              </h3>
              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="font-medium">{article.source}</span>
                <span>•</span>
                <span>{formatDate(article.pubDate)}</span>
                {article.villages.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-blue-700 font-medium">
                      {article.villages.map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ')}
                    </span>
                  </>
                )}
              </div>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
