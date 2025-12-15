-- Create local_news_articles table
CREATE TABLE IF NOT EXISTS local_news_articles (
  id BIGSERIAL PRIMARY KEY,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  pub_date TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL,
  villages TEXT[] DEFAULT '{}',
  UNIQUE(link)
);

-- Create indexes for faster queries
CREATE INDEX idx_local_news_fetched_at ON local_news_articles(fetched_at DESC);
CREATE INDEX idx_local_news_pub_date ON local_news_articles(pub_date DESC);

-- Enable Row Level Security
ALTER TABLE local_news_articles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON local_news_articles
  FOR SELECT USING (true);
